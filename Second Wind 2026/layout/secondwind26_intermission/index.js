LoadEverything().then(() => {
	gsap.config({ nullTargetWarn: false, trialWarn: false });

	let startingAnimation = gsap.timeline({ paused: true })

  // Whole lower-third rises in
  .from(".main_container", {
    duration: 0.8,
    y: 150,
    autoAlpha: 0,
    ease: "power3.out"
  })

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
    0.15
  )

  // Score
  .from(
    ".score",
    {
      duration: 0.7,
      scale: 0.5,
      autoAlpha: 0,
      ease: "back.out(1.5)"
    },
    0.35
  )

  // Right side
  .from(
    [".player-right.profile-picture", ".player-right-name"],
    {
      duration: 0.8,
      x: 80,
      autoAlpha: 0,
      stagger: 0.08,
      ease: "power2.out"
    },
    0.15
  )

  // Center info
  .from(
    [".now", ".round"],
    {
      duration: 0.7,
      y: 40,
      autoAlpha: 0,
      stagger: 0.08,
      ease: "power2.out"
    },
    0.4
  )

  // Vertical lines
  .from(
    ".vertical-line",
    {
      duration: 0.5,
      scaleY: 0.1,
	  autoAlpha: 0,
      transformOrigin: "center center",
      ease: "power2.out"
    },
    0.3
  )

  // Sponsor slideshow
  .from(
    ".sponsor-slideshow",
    {
      duration: 0.45,
      x: 40,
      autoAlpha: 0,
      ease: "power2.out",
    },
    0.5
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
    0.7
  );

    window.addEventListener("obs-prehide", (e) => {
	const data = e.detail;

	document.documentElement.style.visibility = "hidden";
	});
  Start = async () => {
		document.documentElement.style.visibility = "visible";
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
			".logo",
			".sponsor-slideshow"
			],
			{
			autoAlpha: 0
			}
		);

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
			gsap.delayedCall(0.0, () => {
				startingAnimation.restart(true);
			});
			});
		});
	};
	Update = async (event) => {
		let data = event.data;
		let oldData = event.oldData;

		for (const [t, team] of [
			data.score[window.scoreboardNumber].team["1"],
			data.score[window.scoreboardNumber].team["2"],
		].entries()) {
			console.log(team);

			let team_id = ["left", "right"][t];
			
			for (const [p, player] of Object.values(team.player).entries()) {
				if (player) {
					// SetInnerHtml(
					// 	$(`.player-${team_id}-name .sponsor`),
					// 	player.team ? player.team + "&nbsp;" : ""
					// );
					// SetInnerHtml(
					// 	$(`.player-${team_id}-name .name`),
					// 	await Transcript(player.name)
					// );

					// SetInnerHtml(
					// 	$(`.player-${team_id}-name .name`),
					// 	`
					// 	<span class="sponsor">${
					// 		player.team ? player.team + "&nbsp;" : ""
					// 	}</span>${await Transcript(player.name)}
					// 	`
					// );
					SetInnerHtml(
						$(`.player-${team_id}-name .name`),
						`
						<span class="sponsor">
							${player.team ? player.team : ""}
						</span>
						${await Transcript(player.name)}
						${team.losers ? "<span class='losers'>L</span>" : ""}
						`
					);
					
					SetInnerHtml(
						$(`.player-${team_id}.profile-picture`),
						`
							<div class="inner-picture" style="background-image: url('${
								player.online_avatar ? player.online_avatar : "./person.svg"
							}');"></div>
						`
					);


					console.log(team_id);
					console.log(player);
					if (team.color && !tsh_settings["forceDefaultScoreColors"]) {
						document.querySelector(':root').style.setProperty(`--p${t + 1}-score-bg-color`, team.color);
					}
				}
			}
		}

		SetInnerHtml(
			$(".round"),
			data.score[window.scoreboardNumber].match
		);

		SetInnerHtml(
			$(".score"),
			String(data.score[window.scoreboardNumber].team["1"].score) + "-" + String(data.score[window.scoreboardNumber].team["2"].score)
		)
	};

	updateClock(); // Initial run
	setInterval(updateClock, 1000); // Update every second

	function updateClock() {
		const clock = document.querySelector(".time-display");
		const timezone = document.querySelector(".time-zone");

		const now = new Date();
		const hour = now.getHours();
		const minute = now.getMinutes();
		const timeOnly = `${hour.toString()}:${minute.toString().padStart(2, '0')}`;
		clock.textContent = timeOnly;
	}
	const slides = document.querySelectorAll(".sponsor-slide");

	let currentSlide = 0;

	setInterval(() => {
		slides[currentSlide].classList.remove("active");

		currentSlide = (currentSlide + 1) % slides.length;

		slides[currentSlide].classList.add("active");
	}, 5000);
});