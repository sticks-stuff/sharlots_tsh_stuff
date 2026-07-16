LoadEverything().then(() => {
	Start = async () => {
		startingAnimation.restart();
	};
	Update = async (event) => {
		let data = event.data;
		let oldData = event.oldData;

		console.log(data)

		SetInnerHtml(
			$(".phaseandgame"),
			data.score[window.scoreboardNumber].phase + " - " + data.tournamentInfo.eventName
		);
	};
});