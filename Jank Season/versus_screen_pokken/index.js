LoadEverything().then(() => {
  let startingAnimation = gsap
    .timeline({ paused: true })
    .to([".logo"], { duration: 0.8, top: 160 }, 0)
    .to([".logo"], { duration: 0.8, scale: 0.4 }, 0)
    .from(
      [".tournament"],
      { duration: 0.6, opacity: "0", ease: "power2.inOut" },
      0.2
    )
    .from(
      [".match"],
      { duration: 0.6, opacity: "0", ease: "power2.inOut" },
      0.4
    )
    .from(
      [".phase_best_of"],
      { duration: 0.6, opacity: "0", ease: "power2.inOut" },
      0.6
    )
    .from(
      [".score_container"],
      { duration: 0.8, opacity: "0", ease: "power2.inOut" },
      0
    )
    .from(
      [".best_of.container"],
      { duration: 0.8, opacity: "0", ease: "power2.inOut" },
      0
    )
    .from([".vs1"], { duration: 0.1, opacity: "0", scale: 10, ease: "in" }, 1.2)
    .from([".vs2"], { duration: 0.01, opacity: "0" }, 1.3)
    .to([".vs2"], { opacity: 0, scale: 2, ease: "power2.out" }, 1.31)
    .from([".p1.container"], { duration: 1, x: "-200px", ease: "out" }, 0)
    .from([".p2.container"], { duration: 1, x: "200px", ease: "out" }, 0);

  Start = async (event) => {
    startingAnimation.restart();
  };

  const myObserver = new ResizeObserver(entries => {
    entries.forEach(entry => {
      console.log((entry.contentRect.width / 2) + 1270);
      // console.log(entry.target)
      entry.target.animate(
        [
          { transform: `translateX(${(entry.contentRect.width / 2) + 1270}px)` },
          { transform: `translateX(-${(entry.contentRect.width / 2) + 1270}px)` }
        ],
        { duration: (entry.contentRect.width + (1270 * 2)) * 3.5, iterations: Infinity }
      );
    });
  });

  Update = async (event) => {
    let data = event.data;
    let oldData = event.oldData;

    let isTeams = Object.keys(data.score[window.scoreboardNumber].team["1"].player).length > 1;

    if (
      !oldData.score ||
      JSON.stringify(oldData.score[scoreboardNumber].recent_sets) !=
        JSON.stringify(data.score[scoreboardNumber].recent_sets)
    ) {
      playersRecentSets = data.score[scoreboardNumber].recent_sets;
      console.log(playersRecentSets);

      players = [];
      recentSetsHtml = "";

      if (
        playersRecentSets == null ||
        (playersRecentSets.state == "done" &&
          playersRecentSets.sets.length == 0)
      ) {
        recentSetsHtml += `No sets found`;
        players = [];
        $(`.recent_sets_content`).html(recentSetsHtml);
      } else if (playersRecentSets.state != "done") {
        recentSetsHtml += `<div class="lds-ring"><div></div><div></div><div></div><div></div></div>`;
        players = [];
        $(`.recent_sets_content`).html(recentSetsHtml);
      } else {
        if (
          !oldData.score ||
          JSON.stringify(oldData.score[scoreboardNumber].recent_sets) !=
            JSON.stringify(data.score[scoreboardNumber].recent_sets)
        ) {
          playersRecentSets = data.score[scoreboardNumber].recent_sets;

          console.log(playersRecentSets);

          recentSetsHtml += '<div class="recent_sets_inner">';
          playersRecentSets.sets.forEach((_set, i) => {
            recentSetsHtml += `
                <div class="set_container set_${i}">
                <div class="set_info">
                  <div class="set_col col_1">
                      <div class="set_text"></div>
                      <div class="set_subtext"></div>
                  </div>
                </div>
                  <div class="set_winner">
                    ${_set.score[_set.winner == 1 ? 1 : 0]}
                  </div>
                  <div class="set_loser">
                    ${_set.score[_set.winner != 1 ? 1 : 0]}
                  </div>
                </div>
              `;
          });
          recentSetsHtml += "</div>";
        }

        $(`.recent_sets_content`).html(recentSetsHtml);

        const player1 = data.score[scoreboardNumber].team["1"].player["1"].name;
        const player2 = data.score[scoreboardNumber].team["2"].player["1"].name;

        playersRecentSets.sets.forEach((_set, i) => {
          SetInnerHtml(
            $(`.set_${i} .col_1 .set_text`),
            (_set.online ? `<div class="wifi_icon"></div>` : "") +
              _set.winner == 1 ? player2 : player1
          );
          SetInnerHtml(
            $(`.set_${i} .col_1 .set_subtext`),
            new Date(_set.timestamp * 1000).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })
          );
          SetInnerHtml(
            $(`.set_${i} .col_2 .set_text`),
            _set.event + " - " + _set.phase_id + _set.phase_name
          );
          SetInnerHtml($(`.set_${i} .col_2 .set_subtext`), _set.round);
        });

        // var ticker = $(`.recent_sets_inner`)[0].animate(
        //   [
        //     { transform: `translateX(${((document.getElementsByClassName("recent_sets_inner")[0].offsetWidth) / 2) + 1270}px)` },
        //     { transform: `translateX(-${((document.getElementsByClassName("recent_sets_inner")[0].offsetWidth) / 2) + 1270}px)` }
        //   ],
        //   { duration: 3000, iterations: Infinity }
        // );

        // console.log({ticker})
        // console.log(((document.getElementsByClassName("recent_sets_inner")[0].offsetWidth) / 2) + 1270)
        myObserver.observe(document.querySelector('.recent_sets_inner'));  
      }
    }


    if (!isTeams) {
      const teams = Object.values(data.score[window.scoreboardNumber].team);
      for (const [t, team] of teams.entries()) {
        const players = Object.values(team.player);
        for (const [p, player] of players.entries()) {
          SetInnerHtml(
            $(`.p${t + 1} .name`),
            `
              <span>
                  <div>
                    <span class='sponsor'>
                        ${player.team ? player.team : ""}
                    </span>
                    ${await Transcript(player.name)}
                  </div>
              </span>
            `
          );

          gsap.to($(`.p${t + 1} .losers_badge`), {
            autoAlpha: team.losers ? 1 : 0,
            overwrite: true,
            duration: 0.8,
          });

          SetInnerHtml($(`.p${t + 1} .pronoun`), player.pronoun);

          SetInnerHtml(
            $(`.p${t + 1} > .sponsor_logo`),
            player.sponsor_logo
              ? `
                <div class='sponsor_logo' style='background-image: url(../../${player.sponsor_logo})'></div>
                `
              : ""
          );

          SetInnerHtml($(`.p${t + 1} .real_name`), player.real_name);

          SetInnerHtml($(`.p${t + 1} .seed`), player.seed ? `Seed ${player.seed}` : "");

          let characterNames = [];

          if(!window.ONLINE_AVATAR && !window.PLAYER_AVATAR){
            for (const [p, player] of Object.values(team.player).entries()) {
              let characters = _.get(player, "character");
              for (const c of Object.values(characters)) {
                if (c.name) characterNames.push(c.name);
              }
            }
          }

          SetInnerHtml(
            $(`.p${t + 1} .character_name`),
            `
                ${characterNames.join(" / ")}
            `
          );

          SetInnerHtml(
            $(`.p${t + 1} .twitter`),
            `
              ${
                player.twitter
                  ? `
                  <div class="twitter_logo"></div>
                  ${player.twitter}
                  `
                  : ""
              }
          `
          );

          SetInnerHtml(
            $(`.p${t + 1} .flagcountry`),
            player.country.asset
              ? `
              <div>
                  <div class='flag' style='background-image: url(../../${player.country.asset});'>
                      <div class="flagname">${player.country.code}</div>
                  </div>
              </div>`
              : ""
          );

          SetInnerHtml(
            $(`.p${t + 1} .flagstate`),
            player.state.asset
              ? `
              <div>
                  <div class='flag' style='background-image: url(../../${player.state.asset});'>
                      <div class="flagname">${player.state.code}</div>
                  </div>
              </div>`
              : ""
          );

          let zIndexMultiplyier = 1;
          if (t == 1) zIndexMultiplyier = -1;

          if (!window.ONLINE_AVATAR && !window.PLAYER_AVATAR) {
            await CharacterDisplay(
              $(`.p${t + 1}.character`),
              {
                source: `score.${window.scoreboardNumber}.team.${t + 1}`,
                scale_based_on_parent: true,
                anim_out: {
                  x: -zIndexMultiplyier * 100 + "%",
                  stagger: 0.1,
                },
                anim_in: {
                  x: 0,
                  duration: 1,
                  ease: "expo.out",
                  autoAlpha: 1,
                  stagger: 0.2,
                },
              },
              event
            );
          } else if (window.ONLINE_AVATAR) {
            SetInnerHtml(
              $(`.p${t + 1}.character`),
              `
                <div class="player_avatar">
                  <div style="background-image: url('${
                    player.online_avatar ? player.online_avatar : "./person.svg"
                  }');">
                  </div>
                </div>
              `,
              {
                anim_out: {
                  x: -zIndexMultiplyier * 100 + "%",
                  stagger: 0.1,
                },
                anim_in: {
                  x: 0,
                  duration: 1,
                  ease: "expo.out",
                  autoAlpha: 1,
                  stagger: 0.2,
                },
              }
            );
          } else {
            SetInnerHtml(
              $(`.p${t + 1}.character`),
              `
                <div class="player_avatar">
                  <div style="background-image: url('${
                    player.avatar ? '../../'+player.avatar : "./person.svg"
                  }');">
                  </div>
                </div>
              `,
              {
                anim_out: {
                  x: -zIndexMultiplyier * 100 + "%",
                  stagger: 0.1,
                },
                anim_in: {
                  x: 0,
                  duration: 1,
                  ease: "expo.out",
                  autoAlpha: 1,
                  stagger: 0.2,
                },
              }
            );
          }
        }
      }
    } else {
      const teams = Object.values(data.score[window.scoreboardNumber].team);
      for (const [t, team] of teams.entries()) {
        let hasTeamName = team.teamName != null && team.teamName != ""

        let playerNames = "";

        let names = [];
        for (const [p, player] of Object.values(team.player).entries()) {
          if (player && player.name) {
            names.push(await Transcript(player.name));
          }
        }
        playerNames = names.join(" / ");

        if(hasTeamName){
          SetInnerHtml(
            $(`.p${t + 1} .name`),
            `
              <span>
                  <div>
                    ${team.teamName}
                  </div>
              </span>
            `
          );
          SetInnerHtml($(`.p${t + 1} .real_name`), playerNames);
        } else {
          SetInnerHtml(
            $(`.p${t + 1} .name`),
            `
              <span>
                  <div>
                    ${playerNames}
                  </div>
              </span>
            `
          );
          SetInnerHtml($(`.p${t + 1} .real_name`), ``);
        }

        gsap.to($(`.p${t + 1} .losers_badge`), {
          autoAlpha: team.losers ? 1 : 0,
          overwrite: true,
          duration: 0.8,
        });

        SetInnerHtml($(`.p${t + 1} > .sponsor_logo`), "");

        SetInnerHtml($(`.p${t + 1} .twitter`), ``);

        SetInnerHtml($(`.p${t + 1} .flagcountry`), "");

        SetInnerHtml($(`.p${t + 1} .flagstate`), "");

        SetInnerHtml($(`.p${t + 1} .pronoun`), "");

        SetInnerHtml($(`.p${t + 1} .seed`), team.seed ? `Seed ${team.seed}` : "");

        let characterNames = [];

        if(!window.ONLINE_AVATAR && !window.PLAYER_AVATAR){
          for (const [p, player] of Object.values(team.player).entries()) {
            let characters = _.get(player, "character");
            for (const c of Object.values(characters)) {
              if (c.name) characterNames.push(c.name);
            }
          }
        }

        SetInnerHtml(
          $(`.p${t + 1} .character_name`),
          `
              ${characterNames.join(" / ")}
          `
        );

        let zIndexMultiplyier = 1;
        if (t == 1) zIndexMultiplyier = -1;

        if (!window.ONLINE_AVATAR && !window.PLAYER_AVATAR) {
          await CharacterDisplay(
            $(`.p${t + 1}.character`),
            {
              source: `score.${window.scoreboardNumber}.team.${t + 1}`,
              scale_based_on_parent: true,
              anim_out: {
                x: -zIndexMultiplyier * 100 + "%",
                stagger: 0.1,
              },
              anim_in: {
                x: 0,
                duration: 1,
                ease: "expo.out",
                autoAlpha: 1,
                stagger: 0.2,
              },
            },
            event
          );
        } else if (window.ONLINE_AVATAR) {
          let avatars_html = "";
          for (const [p, player] of Object.values(team.player).entries()) {
            if (player)
              avatars_html += `<div style="background-image: url('${
                player.online_avatar ? player.online_avatar : "./person.svg"
              }');"></div>`;
          }
          SetInnerHtml(
            $(`.p${t + 1}.character`),
            `
              <div class="player_avatar">
                ${avatars_html}
              </div>
            `,
            {
              anim_out: {
                x: -zIndexMultiplyier * 100 + "%",
                stagger: 0.1,
              },
              anim_in: {
                x: 0,
                duration: 1,
                ease: "expo.out",
                autoAlpha: 1,
                stagger: 0.2,
              },
            }
          );
        } else {
          let avatars_html = "";
          for (const [p, player] of Object.values(team.player).entries()) {
            if (player)
              avatars_html += `<div style="background-image: url('${
                player.avatar ? '../../'+player.avatar : "./person.svg"
              }');"></div>`;
          }
          SetInnerHtml(
            $(`.p${t + 1}.character`),
            `
              <div class="player_avatar">
                ${avatars_html}
              </div>
            `,
            {
              anim_out: {
                x: -zIndexMultiplyier * 100 + "%",
                stagger: 0.1,
              },
              anim_in: {
                x: 0,
                duration: 1,
                ease: "expo.out",
                autoAlpha: 1,
                stagger: 0.2,
              },
            }
          );
        }
      }
    }

    SetInnerHtml($(`.p1 .score`), String(data.score[window.scoreboardNumber].team["1"].score));
    SetInnerHtml($(`.p2 .score`), String(data.score[window.scoreboardNumber].team["2"].score));

    SetInnerHtml($(".tournament"), data.tournamentInfo.tournamentName);
    SetInnerHtml($(".match"), data.score[window.scoreboardNumber].match);

    let stage = null;

    // for (const [t, team] of [
    //   data.score[scoreboardNumber].team["1"],
    //   data.score[scoreboardNumber].team["2"],
    // ].entries()) {
    //   for (const [p, player] of [team.player["1"]].entries()) {
    //     if (player) {
    //       SetInnerHtml(
    //         $(`.recent_sets_players .player_${t + 1} .sponsor`),
    //         player.team
    //       );
    //       SetInnerHtml(
    //         $(`.recent_sets_players .player_${t + 1} .name`),
    //         await Transcript(player.name)
    //       );
    //     }
    //   }
    // }

    if (_.get(data, `score.${scoreboardNumber}.stage_strike.selectedStage`)) {
      let stageId = _.get(data, `score.${scoreboardNumber}.stage_strike.selectedStage`);

      let allStages = _.get(data, "score.ruleset.neutralStages", []).concat(
        _.get(data, "score.ruleset.counterpickStages", [])
      );

      stage = allStages.find((s) => s.codename == stageId);
    }

    if (
      stage &&
      _.get(data, `score.${window.scoreboardNumber}.stage_strike.selectedStage`) !=
        _.get(oldData, `score.${window.scoreboardNumber}.stage_strike.selectedStage`)
    ) {
      gsap.fromTo(
        $(`.stage`),
        { scale: 2 },
        { scale: 1.2, duration: 0.8, ease: "power2.out" }
      );
    }

    SetInnerHtml(
      $(`.stage`),
      stage
        ? `
        <div>
            <div class='' style='background-image: url(../../${stage.path});'>
            </div>
        </div>`
        : ""
    );

    SetInnerHtml(
      $(".phase_best_of"),
      // data.score[window.scoreboardNumber].phase +
        (data.score[window.scoreboardNumber].best_of_text ? `${data.score[window.scoreboardNumber].best_of_text}` : "")
    );
  };
});
