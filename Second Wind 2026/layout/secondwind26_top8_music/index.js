LoadEverything().then(() => {

  async function loadSong(data) {
    const songKey = getSongKey(data);
    if (songKey === currentSongKey && currentAudio) return;

    currentSongKey = songKey;

    const path = `songs/${songKey}.mp3`;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    const audio = new Audio(path);
    audio.preload = "auto";
    audio.volume = 0;

    currentAudio = audio;

    try {
      await audio.load();
    } catch {}

    // metadata (unchanged)
    try {
      const response = await fetch(path);
      const buffer = await response.arrayBuffer();
      const blob = new Blob([buffer], { type: "audio/mpeg" });

      jsmediatags.read(blob, {
        onSuccess(tag) {
          const artist = tag.tags.artist || "";
          const title = tag.tags.title || "Unknown";

          SetInnerHtml(
            $(".music-title"),
            artist ? `${artist} - ${title}` : title
          );
        },
        onError(error) {
          console.error(error);
        }
      });
    } catch (e) {
      SetInnerHtml($(".music-title"), "No music");
    }
  }

  function playMusic() {
    if (!currentAudio) return;

    gsap.killTweensOf(currentAudio);

    currentAudio.currentTime = 0;
    currentAudio.volume = 0.6;

    currentAudio.play().catch(err => {
      console.warn("Autoplay blocked:", err);
    });
  }

  function fadeOutMusic() {
    if (!currentAudio) return;

    gsap.killTweensOf(currentAudio);

    gsap.to(currentAudio, {
      volume: 0,
      duration: 0.5,
      ease: "power2.out",
      onComplete() {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.volume = 0;
      }
    });
  }

  function restartMusic(duration = 0.5) {
    if (!currentAudio) return;

    gsap.killTweensOf(currentAudio);

    currentAudio.currentTime = 0;
    currentAudio.volume = 0;

    currentAudio.play().catch(err => {
      console.warn("Autoplay blocked:", err);
    });

    gsap.to(currentAudio, {
      volume: 0.6,
      duration,
      ease: "power2.out"
    });
  }

	gsap.config({ nullTargetWarn: false, trialWarn: false });

	let startingAnimation = gsap.timeline({ paused: true })

  // Whole lower-third rises in
  .from(".main_container1", {
    duration: 0.8,
    x: -150,
    autoAlpha: 0,
    ease: "power3.out"
  }, 0.15)

    
  .from(".main_container2", {
    duration: 0.8,
    x: 150,
    autoAlpha: 0,
    ease: "power3.out"
  }, 0.15)



  // Left section
  .from(
    [".local-time", ".player-left.profile-picture", ".player-left-name"],
    {
      duration: 0.8,
      x: -80,
      autoAlpha: 0,
      stagger: 0.08,
      ease: "power2.out"
    },
    0.30
  )

  // Logo
  .from(
    ".logo",
    {
      duration: 0.7,
      scale: 0.1,
      rotation: -15,
      autoAlpha: 0,
      ease: "back.out(1.7)"
    },
    0.30
  )
  .from(
  ".main_container3",
  {
    duration: 0.8,
    x: 150,
    autoAlpha: 0,
    ease: "power3.out"
  },
  0.45
)
.from(
  ".music-player",
  {
    duration: 0.7,
    x: 50,
    autoAlpha: 0,
    ease: "power2.out"
  },
  0.55
);
  Start = async () => {
    document.documentElement.style.visibility = "visible";

    if (latestData) {
      await loadSong(latestData);
    }

		startingAnimation.pause(0);
		startingAnimation.progress(0);

		gsap.set(
			[
			".main_container",
			".local-time",
			".player-left.profile-picture",
			".player-left-name",
			".score",
			".player-right.profile-picture",
			".player-right-name",
			".now",
			".round",
			".vertical-line",
			".music-player",
			".logo"
			],
			{
			autoAlpha: 0
			}
		);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        gsap.delayedCall(0.5, () => {
          playMusic(); // ONLY plays here now
          startingAnimation.restart(true);
        });
      });
    });
	};
	let hidingAnimation = gsap.timeline({
    paused: true,
    onStart() {
      fadeOutMusic(0.5);
    }
  });

hidingAnimation

  // Music player exits first (it arrives last → leaves first)
  .to(".music-player", {
    duration: 0.5,
    x: 50,
    autoAlpha: 0,
    ease: "power2.in"
  }, 0)

  // Main extra container exits early
  .to(".main_container3", {
    duration: 0.55,
    x: 150,
    autoAlpha: 0,
    ease: "power3.in"
  }, 0.05)

  // Logo exits near end (keeps branding moment longer)
  .to(".logo", {
    duration: 0.5,
    scale: 0.1,
    rotation: 15,
    autoAlpha: 0,
    ease: "back.in(1.7)"
  }, 0.05)

  // Right side container
  .to(".main_container2", {
    duration: 0.6,
    x: 150,
    autoAlpha: 0,
    ease: "power3.in"
  }, 0.1)

  // Left side container
  .to(".main_container1", {
    duration: 0.6,
    x: -150,
    autoAlpha: 0,
    ease: "power3.in"
  }, 0.1)

  // Left UI elements collapse
  .to(
    [
      ".local-time",
      ".player-left.profile-picture",
      ".player-left-name"
    ],
    {
      duration: 0.45,
      x: -80,
      autoAlpha: 0,
      stagger: 0.06,
      ease: "power2.in"
    },
    0.15
  )

  // Optional shared UI (score / center elements if they exist)
  .to(
    [
      ".score",
      ".round",
      ".now",
      ".vertical-line",
      ".player-right.profile-picture",
      ".player-right-name"
    ],
    {
      duration: 0.45,
      x: (i, el) => (el.classList.contains("player-right") ? 80 : -80),
      autoAlpha: 0,
      stagger: 0.03,
      ease: "power2.in"
    },
    0.15
  );
  window.addEventListener("obs-prehide", () => {
    document.body.classList.add("hiding");

    fadeOutMusic();

    hidingAnimation.pause(0);
    hidingAnimation.progress(0);
    hidingAnimation.play();
  });
  let latestData = null;

  Update = async (event) => {
    const data = event.data;
    latestData = data;

    await loadSong(data);
  };

	let currentSongKey = null;
	let currentAudio = null;

	function getSongKey(data) {
		const codename = safePathPart(data.game.codename);
		const playerName = safePathPart(
			data.score[window.scoreboardNumber].team[window.config.player].player[1].name
		);

		return `${codename}/${playerName}`;
	}

	async function updateSong(data) {
		const songKey = getSongKey(data);

		if (songKey === currentSongKey) return;

		currentSongKey = songKey;

		const path = `songs/${songKey}.mp3`;

		// stop previous song
		if (currentAudio) {
			currentAudio.pause();
			currentAudio = null;
		}

		const audio = new Audio(path);
    currentAudio = audio;
    currentAudio.volume = 0;

		try {
			const response = await fetch(path);
			const buffer = await response.arrayBuffer();
			const blob = new Blob([buffer], { type: "audio/mpeg" });

			jsmediatags.read(blob, {
				onSuccess(tag) {
					const artist = tag.tags.artist || "";
					const title = tag.tags.title || playerName;

					SetInnerHtml($(".music-title"),
						artist ? `${artist} - ${title}` : title)
				},
				onError() {
					console.error(error);
				}
			});
		} catch (e) {
			console.error(e);
			SetInnerHtml($(".music-title"), "No music")
		}
	}
	function safePathPart(str) {
		return String(str)
			.normalize("NFKD")               // remove weird unicode forms
			.replace(/[\u0300-\u036f]/g, "") // remove accents
			.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
			.replace(/\s+/g, " ")
			.trim()
			.replace(/[ .]+$/, "")           // no trailing spaces or periods
			.replace(/\.+/g, ".");           // collapse repeated periods
	}
});