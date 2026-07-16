/* ============================================================================
   CONFIG — edit everything here
   ============================================================================ */
const CONFIG = {

  // If true, the page fades from transparent to solid black as the credits
  // begin. If false, the background stays fully transparent throughout.
  FADE_TO_BLACK: true,

  // Path/URL to a logo image. Set to null to use the text logo below instead.
  LOGO: "./sw26_logo.png",
  TEXT_LOGO: { main: "RIVALS", accent: "2" }, // shown if LOGO is null

  // Timing (all in milliseconds)
  FADE_START_DELAY: 0,     // wait before the transparent->black fade starts
  FADE_DURATION: 3000,       // how long the fade to black takes
  HOLD_BEFORE_SCROLL: 0,   // pause after the fade before the crawl starts

  // Scroll speed in pixels per second. Lower = slower.
  SCROLL_SPEED: 55,

  // If true, the credits loop back and restart after finishing.
  LOOP: false,

  AUDIO: {
    ENABLED: true,
    SRC: "Rest Area.mp3",
    VOLUME: 0.8,        // target volume once fully faded in (0–1)
    FADE_IN_MS: 0,   // how long the fade-in takes
    FADE_OUT_MS: 2500,  // how long the fade-out takes, timed to finish
                         // right as the crawl finishes
    START_WITH: "blackout" // "blackout" = fade in alongside the screen fade
                            // "crawl"    = fade in once the crawl starts
  },


  // ---------------------------------------------------------------------
  // SECTIONS — order matters, rendered top to bottom. The logo is always
  // the first thing in the crawl, added automatically — don't add it here.
  // ---------------------------------------------------------------------
  sections: [

    {
      type: "roles",
      title: "TOURNAMENT STAFF",
      entries: [
		    { role: "Event Lead",          name: "Jackson Bradley" },
        { role: "Production Lead",     name: "Charlotte \"miss GayManWatch\" MacKenzie" },
        { role: "Head T.O",            name: "Taurii" },
      ]
    },

    {
      type: "allroles",
      title: "PRODUCTION",
      names: [
        "Olivia Geenty",
        "Izzy Irvine",
        "settings camel",
        "ss23",
        "foxx",
        "LooseGoose",
      ]
    },
    {
      type: "allroles",
      title: "TOURNAMENT ORGANIZERS",
      names: [
        "LunaFrost",
        "Logan Barnett",
        "Unladen",
        "Beatrix Crab",
        "Cipherus",
      ]
    },
    {
      type: "allroles",
      title: "COMMUNITY TOURNAMENT ORGANIZERS",
      names: [
        "IcyK",
        "Smashworth",
        "Ben \"Fishbones\" Blake",
        "Yami86",
        "Tawhs",
        "Pacey Winiata-Martin",
        "Jacob \"ozai\" Pilgrim",
        "Logan Barnett",
        "Oskar \"L\'Winner\"",
        "Beatrix Crab",
        "Mackarp",
        "Zak \"Akira\" Anderson",
      ]
    },
    {
      type: "allroles",
      title: "SETUP HELP",
      names: [
        "Carl",
        "Cipherus",
        "RhinBo",
        "dingdongkid",
        "Egg Time",
        "Logan Barnett",
        "Ben \"Fishbones\" Blake",
        "mojobones",
      ]
    },
    {
      type: "allroles",
      title: "ADDITIONAL MELEE HELP",
      names: [
        "Jacob \"ozai\" Pilgrim",
        "dragonlei1",
        "Will \"wait... i\'m vroated\" \"Vro\" Hadfield",
      ]
    },
    {
      type: "allroles",
      title: "PHOTOGRAPHERS",
      names: [
        "biscuit-tan",
        "zoe"
      ]
    },
    {
      type: "allroles",
      title: "CRT Donators",
      names: [
        "Hydrocephalus",
        "Will \"wait... i\'m vroated\" \"Vro\" Hadfield",
        "Unladen",
        "Carl",
        "Simon Ward",
      ]
    },
    {
      type: "allroles",
      title: "COMMENTATORS",
      names: [
        "David \"Arrowskee\" Scott",
        "Ballsack \"Scott Harrow\" Tim",
        "Pacey Winiata-Martin",
        "Murphy \"Big Red\" Cater",
        "Butterjaw",
        "Cipherus",
        "James \"darrrrrby\" Darby",
        "DaWests",
        "dog",
        "Eccentric_Thistle",
        "Eggus",
        "jay eterna",
        "Dylan \"Fishgame\" Jones",
        "Fraser",
        "GhostMeat",
        "Gullgum",
        "Ian \"Gulu\" Saad",
        "HadoukingNZ",
        "Thomas \"hejeh\" Wells",
        "PUNK.V / HNMA",
        "hughgazi",
        "iDeeKay",
        "Jamie \"Jarcino\" Corstorphine",
        "Oskar \"L\'Winner\"",
        "Lainey Catrett",
        "Lilypad",
        "Lime",
        "LooseGoose",
        "Luggnuts",
        "mojobones",
        "monkeycivilwarprofiteer",
        "nagai",
        "PetalPower",
        "Tony \"PoeFire\" DiCarlo",
        "Alyx QueenAlyx",
        "Redchainz",
        "REMUvs",
        "RhinBo",
        "Sayshi",
        "Shnurgle",
        "skyyyyyyyyyyyyyyyyyyyyyy",
        "SuperDot",
        "Teal",
        "Unladen",
        "valium \"qudans switch back to devil jin please\" demon",
        "Will \"wait... i\'m vroated\" \"Vro\" Hadfield",
        "Joshua Packman",
        "Nick \"Widdershin\" Johnstone",
        "YaMum",
        "Toto \"Zingar\" Karrara",
      ]
    },

	{
      type: "allroles",
      title: "Additional Seeding Help",
      names: ["IcyK",
			"Mook",
			"Petal Power",
			"RoyinoZ",
			"Beatrix Crab",
			"Logan Barnett",
			"Kauliflower",
			"Raygo"
		],
  },
	{
      type: "roles",
      title: "OTHER",
      entries: [
        { role: "Lanyard Design",  name: "Nick \"Widdershin\" Johnstone" },
        { role: "Project+ Build", name: "Jetfantastic" },
        { role: "Project+ Build Music",         name: "IcyK" },
        { role: "Australian State Icons",         name: "Kaiza" },
        { role: "Commentary Schedule Help",         name: "Beatrix Crab" },
      ]
    },


    {
        type: "allroles",
        title: "Special Thanks",
        names: [
        "Nicolet",
        "SZNSEVEN",
        "joaorb64",
        "Mathias Wolfbrok",
        "ZombieHDGaming",
        "jay eterna",
        "Jetfantastic",
        "Alyx QueenAlyx",
        "mojobones",
        "Everyone I forgot to credit (sorry!!)",
      ],
    },

    {
      type: "sponsors",
      title: "SPONSORS",
      logos: [
        // { src: "sponsors/carapace-logo-rect.png", alt: "Carapace" },
        { src: "sponsors/respawnlogo.png", alt: "Respawn Esports Centre" },
        { src: "sponsors/RM_LogoFULL_White.png", alt: "Rubber Monkey" },
        { src: "sponsors/secretlablogo_square.png", alt: "Secret Lab" },
        { src: "sponsors/vuwgames.png", alt: "VUW Games Club" }
      ]
    },

    {
      type: "text",
      text: "THANK YOU FOR WATCHING!"
    }
  ]
};

/* ============================================================================
   RENDERING — you shouldn't need to touch anything below this line
   ============================================================================ */

function renderLogoBlock() {
  const wrap = document.createElement('div');
  wrap.className = 'logo-block';
  if (CONFIG.LOGO) {
    const img = document.createElement('img');
    img.src = CONFIG.LOGO;
    img.alt = 'Logo';
    wrap.appendChild(img);
  } else {
    const inner = document.createElement('div');
    const text = document.createElement('div');
    text.className = 'text-logo';
    text.innerHTML = `${CONFIG.TEXT_LOGO.main}<span class="accent">${CONFIG.TEXT_LOGO.accent}</span>`;
    inner.appendChild(text);
    const underline = document.createElement('div');
    underline.className = 'logo-underline';
    inner.appendChild(underline);
    wrap.appendChild(inner);
  }
  return wrap;
}

function renderRoles(section) {
  const wrap = document.createElement('div');
  wrap.className = 'section';
  if (section.title) {
    const h = document.createElement('h2');
    h.className = 'section-title';
    h.textContent = section.title;
    wrap.appendChild(h);
  }
  section.entries.forEach(({ role, name }) => {
    const row = document.createElement('div');
    row.className = 'credit-row';
    row.innerHTML = `
      <span class="role">${role}</span>
      <span class="leader"></span>
      <span class="name">${name}</span>
    `;
    wrap.appendChild(row);
  });
  return wrap;
}

function renderAllRoles(section) {
  const wrap = document.createElement('div');
  wrap.className = 'section';
  const h = document.createElement('h2');
  h.className = 'section-title big';
  h.textContent = section.title;
  wrap.appendChild(h);
  section.names.forEach(name => {
    const line = document.createElement('div');
    line.className = 'name-only';
    line.textContent = name;
    wrap.appendChild(line);
  });
  return wrap;
}

function renderSponsors(section) {
  const wrap = document.createElement('div');
  wrap.className = 'section';
  if (section.title) {
    const h = document.createElement('h2');
    h.className = 'section-title';
    h.textContent = section.title;
    wrap.appendChild(h);
  }
  const grid = document.createElement('div');
  grid.className = 'sponsor-grid';
  section.logos.forEach(({ src, alt }) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    img.onerror = function () {
      const fb = document.createElement('div');
      fb.className = 'sponsor-fallback';
      fb.textContent = alt || 'Sponsor';
      grid.replaceChild(fb, img);
    };
    grid.appendChild(img);
  });
  wrap.appendChild(grid);
  return wrap;
}

function renderText(section) {
  const wrap = document.createElement('div');
  wrap.className = 'section';
  const div = document.createElement('div');
  div.className = 'divider';
  wrap.appendChild(div);
  const t = document.createElement('div');
  t.className = 'final-text';
  t.textContent = section.text;
  wrap.appendChild(t);
  return wrap;
}

function renderTrack() {
  const track = document.getElementById('credits-track');
  track.appendChild(renderLogoBlock());
  CONFIG.sections.forEach(section => {
    let el;
    switch (section.type) {
      case 'roles':    el = renderRoles(section); break;
      case 'allroles': el = renderAllRoles(section); break;
      case 'sponsors': el = renderSponsors(section); break;
      case 'text':     el = renderText(section); break;
      default: return;
    }
    track.appendChild(el);
  });
}

/* ---------------------------------------------------------------------
   Animation sequence:
   1. Track is pinned below the bottom edge from the very first frame
      (no flash / no jump — position is set synchronously before paint).
   2. Background fades from transparent to black.
   3. Track crawls upward, off the top of the screen, in one continuous
      motion (logo included, as the first element in the crawl).
   --------------------------------------------------------------------- */

function waitForImages(container) {
  const imgs = Array.from(container.querySelectorAll('img'));
  if (imgs.length === 0) return Promise.resolve();
  return Promise.all(imgs.map(img => new Promise(resolve => {
    if (img.complete) return resolve();
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  })));
}

function startCrawl(track, viewportHeight) {
  const trackHeight = track.scrollHeight;

  const distance = viewportHeight + trackHeight;
  const duration = (distance / CONFIG.SCROLL_SPEED) * 1000; // ms

  const anim = track.animate(
    [
      { transform: `translateY(${viewportHeight}px)` },
      { transform: `translateY(${-trackHeight}px)` }
    ],
    {
      duration: duration,
      easing: 'linear',
      fill: 'forwards'
    }
  );

  // Schedule the audio fade-out so it finishes right as the crawl ends.
  if (CONFIG.AUDIO && CONFIG.AUDIO.ENABLED && CONFIG.AUDIO.FADE_OUT_MS) {
    const audio = document.getElementById('credits-audio');
    const fadeOutStart = Math.max(duration - CONFIG.AUDIO.FADE_OUT_MS, 0);
    setTimeout(() => {
      fadeAudio(audio, audio.volume, 0, CONFIG.AUDIO.FADE_OUT_MS);
    }, fadeOutStart);
  }


  anim.onfinish = () => {
    if (CONFIG.LOOP) {
      track.style.transform = `translateY(${viewportHeight}px)`;
      startCrawl(track, viewportHeight);
    }
  };
}

/* ---------------------------------------------------------------------
   Audio fade in/out
   --------------------------------------------------------------------- */
 
function fadeAudio(audio, fromVol, toVol, duration, onComplete) {
  const startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    audio.volume = 0.8;
    if (t < 1) {
      requestAnimationFrame(step);
    } else if (onComplete) {
      onComplete();
    }
  }
  requestAnimationFrame(step);
}
 
function startAudio() {
  const cfg = CONFIG.AUDIO;
  if (!cfg || !cfg.ENABLED) return;
 
  const audio = document.getElementById('credits-audio');
  audio.src = cfg.SRC;
  audio.volume = 0;
 
  const playPromise = audio.play();
  if (playPromise && playPromise.catch) {
    playPromise.catch(() => {
      // Autoplay-with-sound was blocked — fall back to starting muted
      // then unmuting, which browsers generally allow.
      audio.muted = true;
      audio.play().then(() => { audio.muted = false; });
    });
  }
 
  fadeAudio(audio, 0, cfg.VOLUME, cfg.FADE_IN_MS);
}

function init() {
  const viewport = document.getElementById('credits-viewport');
  const track = document.getElementById('credits-track');
  const blackout = document.getElementById('blackout');

  renderTrack();

  // Pin the track below the fold immediately, synchronously, before the
  // browser gets a chance to paint it at its natural (top) position.
  const viewportHeight = viewport.clientHeight;
  track.style.transform = `translateY(${viewportHeight}px)`;

  waitForImages(track).then(() => {
    if (CONFIG.FADE_TO_BLACK) {
      setTimeout(() => {
        blackout.style.opacity = '1';
      }, CONFIG.FADE_START_DELAY);
    }

    // const startAt = CONFIG.FADE_TO_BLACK
    //   ? CONFIG.FADE_START_DELAY + CONFIG.FADE_DURATION + CONFIG.HOLD_BEFORE_SCROLL
    //   : CONFIG.HOLD_BEFORE_SCROLL;

    const startAt = 0;

    if (CONFIG.AUDIO && CONFIG.AUDIO.ENABLED) {
      const audioStartAt = CONFIG.AUDIO.START_WITH === 'crawl'
        ? startAt
        : (CONFIG.FADE_TO_BLACK ? CONFIG.FADE_START_DELAY : 0);
      setTimeout(startAudio, audioStartAt);
    }

    setTimeout(() => startCrawl(track, viewportHeight), startAt);
  });
}

window.addEventListener('DOMContentLoaded', init);