const fs = require('fs');
const path = require('path');
const express = require('express');
const OBSWebSocket = require('obs-websocket-js').default;

// ---- Load config ----
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('Missing config.json. Copy config.example.json to config.json and edit it.');
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// ---- OBS connection ----
const obs = new OBSWebSocket();
let obsConnected = false;

async function connectOBS() {
  try {
    await obs.connect(config.obs.address, config.obs.password || undefined);
    obsConnected = true;
    console.log('[obs] connected to', config.obs.address);
    startScreenshotLoop();
  } catch (err) {
    obsConnected = false;
    console.error('[obs] connect failed:', err.message, '- retrying in 5s');
    setTimeout(connectOBS, 5000);
  }
}
obs.on('ConnectionClosed', () => {
  obsConnected = false;
  console.warn('[obs] connection closed, reconnecting in 5s');
  setTimeout(connectOBS, 5000);
});
connectOBS();

// Cache scene item ids for speaker_icon per overlay so we don't look it up every request
const speakerItemIdCache = {};
async function getSpeakerItemId(overlaySceneName) {
  if (speakerItemIdCache[overlaySceneName]) return speakerItemIdCache[overlaySceneName];
  const { sceneItemId } = await obs.call('GetSceneItemId', {
    sceneName: overlaySceneName,
    sourceName: config.speakerIconSourceName
  });
  speakerItemIdCache[overlaySceneName] = sceneItemId;
  return sceneItemId;
}

// ---- Screenshot cache ----
// Instead of every open browser tab independently asking OBS for a screenshot
// every second (load scales with number of viewers), the server polls OBS once
// per overlay on a fixed interval and caches the result. Clients just read the
// cache, so OBS load stays constant regardless of how many tabs are open.
const screenshotCache = {}; // overlayName -> { image, updatedAt }
let screenshotLoopStarted = false;

async function fetchScreenshot(overlay) {
  try {
    const result = await obs.call('GetSourceScreenshot', {
      sourceName: overlay,
      imageFormat: 'jpg',
      imageWidth: config.screenshot.width || 160,
      imageHeight: config.screenshot.height || 90,
      imageCompressionQuality: 60
    });
    screenshotCache[overlay] = { image: result.imageData, updatedAt: Date.now() };
  } catch (err) {
    // Leave any previous cached frame in place; just log it.
    console.warn(`[screenshot] failed for ${overlay}:`, err.message);
  }
}

function startScreenshotLoop() {
  if (screenshotLoopStarted) return;
  screenshotLoopStarted = true;
  const interval = config.screenshot.intervalMs || 1000;
  setInterval(() => {
    if (!obsConnected) return;
    for (const overlay of config.overlays) {
      fetchScreenshot(overlay);
    }
  }, interval);
}

// ---- Express app ----
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function requireOBS(res) {
  if (!obsConnected) {
    res.status(503).json({ error: 'Not connected to OBS' });
    return false;
  }
  return true;
}

// Frontend reads this to know what buttons/overlays to render
app.get('/api/config', (req, res) => {
  res.json({
    scenes: config.scenes,
    sceneLabels: config.sceneLabels || {},
    overlays: config.overlays,
    quadrants: Object.keys(config.audio),
    screenshotIntervalMs: config.screenshot.intervalMs || 1000,
    connected: obsConnected
  });
});

// Switches active audio quadrant: track 1 + Audio Monitor filter on the matching
// source, speaker icon on the matching overlay, and the inverse on the other three.
// Returns an array of error strings (empty if everything succeeded).
async function setActiveAudioQuadrant(num) {
  const errors = [];
  const filterName = config.audioMonitorFilterName || 'Audio Monitor';

  for (const [quadNum, sourceName] of Object.entries(config.audio)) {
    const active = quadNum === num;
    try {
      const { inputAudioTracks } = await obs.call('GetInputAudioTracks', { inputName: sourceName });
      inputAudioTracks['1'] = active;
      await obs.call('SetInputAudioTracks', { inputName: sourceName, inputAudioTracks });
    } catch (err) {
      errors.push(`track 1 for ${sourceName}: ${err.message}`);
    }
    try {
      await obs.call('SetSourceFilterEnabled', {
        sourceName,
        filterName,
        filterEnabled: active
      });
    } catch (err) {
      errors.push(`${filterName} filter on ${sourceName}: ${err.message}`);
    }
  }

  for (const overlay of config.overlays) {
    const overlayNum = overlay.split('_')[1]; // overlay_1 -> "1"
    try {
      const sceneItemId = await getSpeakerItemId(overlay);
      await obs.call('SetSceneItemEnabled', {
        sceneName: overlay,
        sceneItemId,
        sceneItemEnabled: overlayNum === num
      });
    } catch (err) {
      errors.push(`speaker icon on ${overlay}: ${err.message}`);
    }
  }

  return errors;
}

// Scenes named e.g. "focus_q3" (single quadrant only, not "focus_q1q2" combos)
// map directly to the quadrant number whose audio should follow automatically.
function singleFocusQuadrant(sceneName) {
  const m = sceneName.match(/^focus_q(\d)$/);
  return m ? m[1] : null;
}

// Switch program scene
app.post('/api/scene/:name', async (req, res) => {
  if (!requireOBS(res)) return;
  const name = req.params.name;
  if (!config.scenes.includes(name)) {
    return res.status(400).json({ error: 'Unknown scene: ' + name });
  }
  try {
    await obs.call('SetCurrentProgramScene', { sceneName: name });

    // If this is a single-quadrant focus scene, bring audio along with it.
    const quadNum = singleFocusQuadrant(name);
    if (quadNum && config.audio[quadNum]) {
      const errors = await setActiveAudioQuadrant(quadNum);
      if (errors.length) {
        return res.status(207).json({ ok: false, errors });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Switch which quadrant has live audio + speaker icon
app.post('/api/audio/:num', async (req, res) => {
  if (!requireOBS(res)) return;
  const num = req.params.num;
  if (!config.audio[num]) {
    return res.status(400).json({ error: 'Unknown quadrant: ' + num });
  }

  const errors = await setActiveAudioQuadrant(num);
  if (errors.length) {
    return res.status(207).json({ ok: false, errors });
  }
  res.json({ ok: true });
});

// Low-res screenshot of a given overlay scene. Served from cache (see
// startScreenshotLoop above) so N browser tabs polling don't multiply OBS load.
app.get('/api/screenshot/:overlay', (req, res) => {
  const overlay = req.params.overlay;
  if (!config.overlays.includes(overlay)) {
    return res.status(400).json({ error: 'Unknown overlay: ' + overlay });
  }
  const cached = screenshotCache[overlay];
  if (!cached) {
    // Not captured yet (e.g. just started, or OBS not connected)
    return res.status(202).json({ image: null });
  }
  res.json({ image: cached.image, updatedAt: cached.updatedAt });
});

// Panic button: force-refresh every browser source in OBS (cache-busting reload,
// same as clicking "Refresh cache of current page" in the Properties dialog)
app.post('/api/panic-refresh-browsers', async (req, res) => {
  if (!requireOBS(res)) return;
  try {
    const { inputs } = await obs.call('GetInputList');
    const browserSources = inputs.filter(i => i.inputKind === 'browser_source');

    const errors = [];
    for (const source of browserSources) {
      try {
        await obs.call('PressInputPropertiesButton', {
          inputName: source.inputName,
          propertyName: 'refreshnocache'
        });
      } catch (err) {
        errors.push(`${source.inputName}: ${err.message}`);
      }
    }

    if (errors.length) {
      return res.status(207).json({ ok: false, refreshed: browserSources.length - errors.length, total: browserSources.length, errors });
    }
    res.json({ ok: true, refreshed: browserSources.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = (config.server && config.server.port) || 3000;
app.listen(port, () => console.log(`obs-quad-control listening on http://localhost:${port}`));