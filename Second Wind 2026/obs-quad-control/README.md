# obs-quad-control

Extremely simple Node.js web app to remotely control a 4-quadrant OBS stream.

## What it does

- Buttons to switch the program scene to any of: `quad`, `focus_q1`, `focus_q2`, `focus_q3`,
  `focus_q4`, `focus_q1q2`, `focus_q3q4`, `focus_q1q3`, `focus_q2q4`, `focus_q1q4`, `focus_q2q3`.
- Shows small, low-framerate (default 1 fps) preview thumbnails of `overlay_1`..`overlay_4`,
  the same idea as [obs-web](https://github.com/Niek/obs-web) — polling `GetSourceScreenshot`
  instead of streaming video.
- Buttons `1 2 3 4` to pick which quadrant currently "has the floor". Pressing one:
  - Enables the `speaker_icon` source inside that quadrant's overlay scene.
  - Disables `speaker_icon` in the other three overlay scenes.
  - Unmutes that quadrant's audio input.
  - Mutes the other three audio inputs.
- A "scoreboard broke" panic button that force-refreshes (cache-busted reload) every
  browser source currently in your OBS scene collection — useful when a browser-source
  overlay (scoreboard, graphics, etc.) freezes or gets into a bad state.

## Requirements

- OBS Studio 28+ with obs-websocket 5.x (built in, enable it under
  Tools → obs-websocket Settings).
- Each overlay scene (`overlay_1`..`overlay_4`) must contain a source named the same thing
  (default `speaker_icon`) that you want toggled on/off — e.g. a small speaker/mic image.
- Node.js 18+.

## Setup

```bash
npm install
cp config.example.json config.json
```

Edit `config.json`:

- `obs.address` / `obs.password` — match your OBS websocket server settings.
- `audio` — map quadrant number to the exact OBS input/source name for that quadrant's audio
  (e.g. a mic or an audio input capturing that guest's feed).
- `speakerIconSourceName` — the source name inside each `overlay_N` scene to show/hide.
- `screenshot.width` / `height` — thumbnail size (kept small on purpose).
- `screenshot.intervalMs` — how often the frontend polls for a new thumbnail (1000 = 1 fps).

Run it:

```bash
npm start
```

Then open `http://localhost:3000` (or whatever port you set) in a browser — on the same
machine or anywhere on your network.

## Notes / things you may want to tweak

- Scene names, overlay names, and quadrant count are somewhat hardcoded to the "4 quadrant"
  layout described, since that's what was asked for — the scene list itself comes from
  `config.json` so you can rename things without touching code.
- There's no auth. If you expose this beyond localhost/LAN, put it behind a reverse proxy
  with basic auth or a VPN.
- Screenshots are fetched from OBS on a single shared background timer (one poll per
  overlay per interval, done by the server) and cached in memory. Every open browser tab
  reads from that cache instead of triggering its own OBS calls, so CPU load on the
  streaming PC stays constant (4 `GetSourceScreenshot` calls/sec by default) no matter how
  many people have the control page open — 1 viewer or 5, it's the same load on OBS.
