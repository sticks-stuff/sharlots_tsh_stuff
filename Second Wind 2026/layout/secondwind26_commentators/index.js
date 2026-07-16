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
      [".commentator0.commentator_container"],
      {
        duration: 0.8,
        x: -150,
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
      [".p1 .character_container", ".p2 .character_container"],
      {
        duration: 0.8,
        x: (i) => (i === 0 ? -200 : 200),
        autoAlpha: 0,
        ease: "power2.out",
      },
      0.2,
    )
    .from(
      [".commentator0 .bottom-bar", ".commentator1 .bottom-bar"],
      {
        duration: 1,
        x: (i) => (i === 0 ? -100 : 100),
        autoAlpha: 0,
        delay: 0.1,
        ease: "power2.out",
      },
      0.2,
    )
    .from(
      [".commentator0 .name", ".commentator1 .name"],
      {
        delay: 0.3,
        duration: 0.8,
        x: (i) => (i === 0 ? -200 : 200),
        autoAlpha: 0,
        ease: "power2.out",
      },
      0.2,
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
  .to(
    [
      ".info > div",
      ".info_container",
      ".parrygg_logo",
      ".fade_down",
      ".fade",
      ".fade_left",
      ".fade_right",
    ],
    {
      duration: 0.4,
      autoAlpha: 0,
      ease: "power2.in",
      stagger: 0.03,
    },
    0
  )
  .to(
    [".commentator0 .name", ".commentator1 .name"],
    {
      duration: 0.4,
      x: (i) => (i === 0 ? -200 : 200),
      autoAlpha: 0,
      ease: "power2.in",
    },
    0
  )
  .to(
    [".commentator0 .bottom-bar", ".commentator1 .bottom-bar"],
    {
      duration: 0.4,
      x: (i) => (i === 0 ? -100 : 100),
      autoAlpha: 0,
      ease: "power2.in",
    },
    0
  )
  .to(
    [".p1 .character_container", ".p2 .character_container"],
    {
      duration: 0.4,
      x: (i) => (i === 0 ? -200 : 200),
      autoAlpha: 0,
      ease: "power2.in",
    },
    0
  )
  .to(
    [".commentator0.commentator_container", ".commentator1.commentator_container"],
    {
      duration: 0.4,
      x: (i) => (i === 0 ? -150 : 150),
      autoAlpha: 0,
      ease: "power2.in",
    },
    0
  );

  window.addEventListener("obs-prehide", (e) => {
    console.log(e)
    const data = e.detail

    document.body.classList.add("hiding");

    hidingAnimation.pause(0).progress(0);

    // optional: ensure everything is visible before animating out
    gsap.set([
      ".commentator0",
      ".commentator1",
      ".info_container",
      ".parrygg_logo",
    ], {
      autoAlpha: 1,
    });

    hidingAnimation.play();

    // If OBS allows time buffering, you can try to sync duration:
    // data.duration_ms tells you how long until cut
  });


  Start = async (event) => {
    startingAnimation.pause(0);
    startingAnimation.progress(0);

    gsap.set([
      ".fade",
      ".fade_right",
      ".fade_left",
      ".commentator0.commentator_container",
      ".commentator1.commentator_container",
      ".p1 .character_container",
      ".p2 .character_container",
      ".commentator0 .top-row",
      ".commentator1 .top-row",
      ".commentator0 .name",
      ".commentator1 .name",
      ".info_container",
      ".line",
      ".parrygg_logo",
      ".info > div"
    ], {
      autoAlpha: 0
    });

    gsap.delayedCall(0.5, () => {
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

    for (const [index, commentator] of Object.values(
      data.commentary
    ).entries()) {
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
      } else {
        $(`.commentator${index}`).css("display", "none");
      }
    }
  };
});
