LoadEverything().then(() => {
  
  gsap.config({ nullTargetWarn: false, trialWarn: false });

  let startingAnimation = gsap
    .timeline({ paused: true })
    .from(
      [".fade"],
      {
        duration: 0.2,
        autoAlpha: 0,
        ease: "power2.out",
      },
      0
    )
    .from(
      [".fade_down_left_stagger:not(.text_empty)"],
      {
        autoAlpha: 0,
        stagger: {
          each: 0.05,
          from: 'end',
          opacity: 0,
          y: "-20px",
        },
        duration: 0.2,
      },
      0
    )
    .from(
      [".fade_down_right_stagger:not(.text_empty)"],
      {
        autoAlpha: 0,
        stagger: {
          each: 0.05,
          from: 'end',
          opacity: 0,
          y: "-20px",
        },
        duration: 0.2,
      },
      0
    )
    .from(
      [".p1 .fade_stagger:not(.text_empty)"],
      {
        autoAlpha: 0,
        stagger: {
          each: 0.05,
          from: 'end',
          opacity: 0,
        },
        duration: 0.2,
      },
      0
    )
    .from(
      [".p2 .fade_stagger:not(.text_empty)"],
      {
        autoAlpha: 0,
        stagger: {
          each: 0.05,
          from: 'end',
          opacity: 0,
        },
        duration: 0.2,
      },
      0
    )
    .from(
      [".p1 .fade_stagger_reverse:not(.text_empty)"],
      {
        autoAlpha: 0,
        stagger: {
          each: 0.05,
          from: 'start',
          opacity: 0,
        },
        duration: 0.2,
      },
      0
    )
    .from(
      [".p2 .fade_stagger_reverse:not(.text_empty)"],
      {
        autoAlpha: 0,
        stagger: {
          each: 0.05,
          from: 'start',
          opacity: 0,
        },
        duration: 0.2,
      },
      0
    )
    .from(
      [".fade_right_stagger:not(.text_empty)"],
      {
        autoAlpha: 0,
        stagger: {
          each: 0.05,
          from: 'end',
          opacity: 0,
        },
        duration: 0.2,
      },
      0
    )
    .from(
      [".fade_down"],
      {
        duration: 0.2,
        y: "-20px",
        ease: "power2.out",
        autoAlpha: 0,
      },
      0
    )
    .from(
      [".fade_right"],
      {
        duration: 0.2,
        x: "-20px",
        ease: "power2.out",
        autoAlpha: 0,
      },
      0
    )
    .from(
      [".fade_left"],
      {
        duration: 0.2,
        x: "+20px",
        ease: "power2.out",
        autoAlpha: 0,
      },
      0
    )
    .from(
      [".fade_up"],
      {
        duration: 0.2,
        y: "+20px",
        ease: "power2.out",
        autoAlpha: 0,
      },
      0
    )

  Start = async () => {
    startingAnimation.restart();
  };

  Update = async (event) => {
    let data = event.data;
    let oldData = event.oldData;

    let isTeams = Object.keys(data.score[window.scoreboardNumber].team["1"].player).length > 1;
    for (const [t, team] of [
      data.score[window.scoreboardNumber].team["1"],
      data.score[window.scoreboardNumber].team["2"],
    ].entries()) {
      let teamContainer = $(`.team_info.t${t + 1} .players_container.p${t + 1}`);
      teamContainer.empty();

      for (const [p, player] of Object.entries(team.player)) {
        if (player) {
          let playerContainer = $(`
            <div class="player container">
              <div class="icon avatar"></div>
              <div class="icon online_avatar"></div>
              <div class="sponsor_icon"></div>
              <div class="name_twitter">
                <div class="name"></div>
                <div class="extra">
                  <div class="pronoun"></div>
                  <div class="twitter"></div>
                </div>
              </div>
            </div>
          `);

          SetInnerHtml(
            playerContainer.find('.name'),
            `
              <span class="sponsor">
                ${player.team ? player.team : ""}
              </span>
              ${await Transcript(player.name)}
              ${team.losers ? "<span class='losers'>L</span>" : ""}
            `
          );

          SetInnerHtml(
            playerContainer.find('.flagcountry'),
            player.country.asset
              ? `
                <div class='flag' style='background-image: url(../../${player.country.asset.toLowerCase()})'></div>
                <div>${player.country.code}</div>
              `
              : ""
          );

          SetInnerHtml(
            playerContainer.find('.flagstate'),
            player.state.asset
              ? `
                <div class='flag' style='background-image: url(../../${player.state.asset})'></div>
                <div>${player.state.code}</div>
              `
              : ""
          );

          await CharacterDisplay(
            playerContainer.find('.character_container'),
            {
              asset_key: "base_files/icon",
              source: `score.${window.scoreboardNumber}.team.${t + 1}`,
            },
            event
          );

          SetInnerHtml(
            playerContainer.find('.sponsor_icon'),
            player.sponsor_logo
              ? `<div style='background-image: url(../../${player.sponsor_logo})'></div>`
              : ""
          );

          SetInnerHtml(
            playerContainer.find('.avatar'),
            player.avatar
              ? `<div style="background-image: url('../../${player.avatar}')"></div>`
              : ""
          );

          SetInnerHtml(
            playerContainer.find('.online_avatar'),
            player.online_avatar
              ? `<div style="background-image: url('${player.online_avatar}')"></div>`
              : ""
          );

          SetInnerHtml(
            playerContainer.find('.twitter'),
            player.twitter
              ? `<span class="twitter_logo"></span>${String(player.twitter)}`
              : ""
          );

          SetInnerHtml(
            playerContainer.find('.pronoun'),
            player.pronoun ? player.pronoun : ""
          );

          SetInnerHtml(
            playerContainer.find('.seed'),
            player.seed ? `Seed ${player.seed}` : ""
          );

          SetInnerHtml(playerContainer.find('.score'), String(team.score));

          SetInnerHtml(
            playerContainer.find('.sponsor-container'),
            `<div class='sponsor-logo' style='background-image: url(../../${player.sponsor_logo})'></div>`
          );

          teamContainer.append(playerContainer);

          if ($(".sf6.online").length > 0) {
            if (!player.twitter && !player.pronoun) {
              gsap.to(playerContainer.find('.chips'), { autoAlpha: 0 });
            } else {
              gsap.to(playerContainer.find('.chips'), { autoAlpha: 1 });
            }
          }
        }
      }

      if(team.color && !tsh_settings["forceDefaultScoreColors"]) {
        document.querySelector(':root').style.setProperty(`--p${t + 1}-score-bg-color`, team.color);
      }
      let teamName = team.teamName;

      document.querySelector(`.team_info.t${t + 1} .team_name`).innerHTML = teamName;
    }

    SetInnerHtml($(".tournament_name"), data.tournamentInfo.tournamentName);

    SetInnerHtml($(".match"), data.score[window.scoreboardNumber].match);

    let phaseTexts = [];
    if (data.score[window.scoreboardNumber].phase) phaseTexts.push(data.score[window.scoreboardNumber].phase);
    if (data.score[window.scoreboardNumber].best_of_text) phaseTexts.push(data.score[window.scoreboardNumber].best_of_text);

    SetInnerHtml($(".phase"), phaseTexts.join(" - "));
  };
});