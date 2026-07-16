LoadEverything().then(() => {
  if (!window.config) {
    window.config = {
      size: "normal",
    };
  }

  gsap.config({ nullTargetWarn: false, trialWarn: false });

  let startingAnimation = gsap
    .timeline({ paused: true })
    .from(
      [".fade"],
      {
        duration: 0.8,
        autoAlpha: 0,
        ease: "power2.out",
      },
      0,
    )
    .from(
      [".fade_right"],
      {
        duration: 0.8,
        x: "-304px",
        ease: "power2.out",
        autoAlpha: 0,
      },
      0,
    )
    .from(
      [".fade_left"],
      {
        duration: 0.8,
        x: "+304px",
        ease: "power2.out",
        autoAlpha: 0,
      },
      0,
    )
    .from(
      [".commentator2.commentator_container"],
      {
        duration: 0.8,
        y: 150,
        autoAlpha: 0,
        ease: "power2.out",
      },
      0,
    )
    .from(
      [".commentator1.commentator_container"],
      {
        duration: 0.8,
        x: 150,
        autoAlpha: 0,
        ease: "power2.out",
      },
      0,
    )
    .from(
      [".commentator2 .bottom-bar"],
      {
        duration: 1,
        y: (i) => (i === 0 ? -100 : 100),
        autoAlpha: 0,
        delay: 0.1,
        ease: "power2.out",
      },
      0.05,
    )
    .from(
      [".commentator2 .name"],
      {
        delay: 0.3,
        duration: 0.8,
        y: (i) => (i === 0 ? -200 : 200),
        autoAlpha: 0,
        ease: "power2.out",
      },
      0.05,
    )

    .from(
      [".info_container"],
      {
        duration: 0.8,
        x: -50,
        autoAlpha: 0,
        ease: "power2.out",
      },
      0,
    )

    .from(
      [".fade_down"],
      {
        duration: 0.8,
        y: -50,
        autoAlpha: 0,
        ease: "power2.out",
      },
      0,
    )
    .from(
      [".parrygg_logo"],
      {
        duration: 0.6,
        scale: 0,
        rotation: -90,
        autoAlpha: 0,
        ease: "back.out(1.5)",
      },
      0.3,
    )
    .from(
      [".info > div"],
      {
        duration: 0.6,
        x: -20,
        autoAlpha: 0,
        stagger: 0.1,
        ease: "power2.out",
      },
      0.4,
    );

  let hidingAnimation = gsap.timeline({ paused: true });

hidingAnimation

  // Info rows (last in → first out)
  .to(".info > div", {
    duration: 0.4,
    x: -20,
    autoAlpha: 0,
    stagger: 0.05,
    ease: "power2.in"
  }, 0)

  // Logo
  .to(".parrygg_logo", {
    duration: 0.45,
    scale: 0,
    rotation: 90,
    autoAlpha: 0,
    ease: "back.in(1.5)"
  }, 0.05)

  // Main info container
  .to(".info_container", {
    duration: 0.5,
    x: -50,
    autoAlpha: 0,
    ease: "power2.in"
  }, 0.05)

  // Fade-down elements
  .to(".fade_down", {
    duration: 0.5,
    y: -50,
    autoAlpha: 0,
    ease: "power2.in"
  }, 0.05)

  // Commentator name
  .to(".commentator2 .name", {
    duration: 0.45,
    y: -200,
    autoAlpha: 0,
    ease: "power2.in"
  }, 0.1)

  // Bottom bar
  .to(".commentator2 .bottom-bar", {
    duration: 0.45,
    y: -100,
    autoAlpha: 0,
    ease: "power2.in"
  }, 0.15)

  // Whole commentator panel
  .to(".commentator2.commentator_container", {
    duration: 0.55,
    y: 150,
    autoAlpha: 0,
    ease: "power2.in"
  }, 0.2)

  // Generic fades
  .to(".fade", {
    duration: 0.5,
    autoAlpha: 0,
    ease: "power2.in"
  }, 0.2)

  .to(".fade_left", {
    duration: 0.5,
    x: "304px",
    autoAlpha: 0,
    ease: "power2.in"
  }, 0.2)

  .to(".fade_right", {
    duration: 0.5,
    x: "-304px",
    autoAlpha: 0,
    ease: "power2.in"
  }, 0.2)

  // This panel also animates in from the right
  .to(".commentator1.commentator_container", {
    duration: 0.55,
    x: 150,
    autoAlpha: 0,
    ease: "power2.in"
  }, 0.2);

    window.addEventListener("obs-prehide", (e) => {
  const data = e.detail;

  document.body.classList.add("hiding");

  hidingAnimation.pause(0);
  hidingAnimation.progress(0);
  hidingAnimation.play();
});


  Start = async (event) => {
    startingAnimation.pause(0);
    startingAnimation.progress(0);

    gsap.set([
      ".fade",
      ".fade_right",
      ".fade_left",
      ".commentator2.commentator_container",
      ".commentator2.commentator_container",
      ".p1 .character_container",
      ".p2 .character_container",
      ".commentator2 .top-row",
      ".commentator2 .top-row",
      ".commentator2 .name",
      ".commentator2 .name",
      ".info_container",
      ".line",
      ".parrygg_logo",
      ".info > div"
    ], {
      autoAlpha: 0
    });

    gsap.delayedCall(0, () => {
      startingAnimation.restart(true);
    });
  };
  Update = async (event) => {
    let data = event.data;
    let oldData = event.oldData;

    // if (
    //   Object.keys(oldData).length == 0 ||
    //   Object.keys(oldData.commentary).length 
    // ) {
    //   let html = "";
    //   Object.values(data.commentary).forEach((commentator, index) => {
    //     html += `
    //           <div class="commentator_container commentator${index}">
    //               <div class="name"></div>
    //               <div class="bottom-bar">
    //                 <div class="pronoun"></div>
    //                 ${
    //                   window.config.size == "normal"
    //                     ? `<div class="real_name"></div>`
    //                     : ""
    //                 }
    //                 ${
    //                   window.config.size == "normal" ||
    //                   window.config.size == "mini"
    //                     ? `<div class="twitter"></div>`
    //                     : ""
    //                 }
    //               </div>
    //           </div>
    //       `;
    //   });
    //   $(".container").html(html);
    // }

    const index = 2

    if (data.commentary["3"]) {
      const commentator = data.commentary["3"]
      if (commentator.name) {
        $(`.commentator${index}`).css("display", "");
        SetInnerHtml(
          $(`.commentator${index} .name`),
          `
            <span class="team">
              ${commentator.team ? commentator.team + "&nbsp;" : ""}
            </span>
            ${await Transcript(commentator.name)}
          `
        );
        SetInnerHtml($(`.commentator${index} .pronoun`), commentator.pronoun);
        SetInnerHtml(
          $(`.commentator${index} .real_name`),
          commentator.real_name
        );
        SetInnerHtml(
          $(`.commentator${index} .twitter`),
            commentator.twitter
              ? `<img class="twitter_logo" src="./twitter.svg"></img>${String(commentator.twitter)}`
              : ""
          );
          if (!commentator.twitter && !commentator.pronoun) {
            $(`.bottom-bar`).css("display", "none");
          } else {
            $(`.bottom-bar`).css("display", "");
          }
      } else {
        $(`.commentator${index}`).css("display", "none");
      }
    } else {
      $(`.commentator${index}`).css("display", "none");
    }
  };
});
