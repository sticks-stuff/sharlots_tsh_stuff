LoadEverything().then(() => {
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
  );
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
			".logo"
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

	let hidingAnimation = gsap.timeline({ paused: true });

	hidingAnimation

	// Logo exits LAST (keeps branding stable until end)
	.to(".logo", {
		duration: 0.5,
		scale: 0.1,
		rotation: 15,
		autoAlpha: 0,
		ease: "back.in(1.7)"
	}, 0)

	// Right container exits
	.to(".main_container2", {
		duration: 0.6,
		x: 150,
		autoAlpha: 0,
		ease: "power3.in"
	}, 0.05)

	// Left container exits
	.to(".main_container1", {
		duration: 0.6,
		x: -150,
		autoAlpha: 0,
		ease: "power3.in"
	}, 0.05)

	// Player + local UI exits together
	.to(
		[
			".local-time",
			".player-left.profile-picture",
			".player-left-name",
			".player-right.profile-picture",
			".player-right-name",
			".score",
			".round",
			".now",
			".vertical-line"
		],
		{
			duration: 0.45,
			x: (i, el) => el.classList.contains("player-right") ? 80 : -80,
			autoAlpha: 0,
			stagger: 0.03,
			ease: "power2.in"
		},
		0.1
	);

	window.addEventListener("obs-prehide", (e) => {
		const data = e.detail; // no JSON parse needed

		document.body.classList.add("hiding");

		hidingAnimation.pause(0);
		hidingAnimation.progress(0);

		hidingAnimation.play();
	});
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