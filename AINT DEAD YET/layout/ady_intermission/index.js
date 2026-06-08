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

LoadEverything().then(() => {
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

					SetInnerHtml(
						$(`.player-${team_id}-name .name`),
						`
						<span class="sponsor">${
							player.team ? player.team + "&nbsp;" : ""
						}</span>${await Transcript(player.name)}
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
});