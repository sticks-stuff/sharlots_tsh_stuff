const fs = require("fs");
const { tap, map, filter } = require("rxjs/operators");
const { Ports } = require('@slippi/slippi-js')
const { GameEndMethod } = require('@slippi/slippi-js')
const axios = require("axios");
const TSH_IP = "127.0.0.1";
const TSH_PORT = "5000";


// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ConnectionStatus, SlpLiveStream, SlpRealTime, ComboFilter, generateDolphinQueuePayload } = require("@vinceau/slp-realtime");

// TODO: Make sure you set these values!
const ADDRESS = "127.0.0.1";  // leave as is for Dolphin or change to "localhost" for a relay on the same computer
const PORT = Ports.DEFAULT;   // options are DEFAULT, RELAY_START, and LEGACY

const CHARACTER_ID_MAP = {
    0x00: 'Captain Falcon',
    0x01: 'Donkey Kong',
    0x02: 'Fox',
    0x03: 'Mr. Game & Watch',
    0x04: 'Kirby',
    0x05: 'Bowser',
    0x06: 'Link',
    0x07: 'Luigi',
    0x08: 'Mario',
    0x09: 'Marth',
    0x0A: 'Mewtwo',
    0x0B: 'Ness',
    0x0C: 'Peach',
    0x0D: 'Pikachu',
    0x0E: 'Ice Climbers',
    0x0F: 'Jigglypuff',
    0x10: 'Samus',
    0x11: 'Yoshi',
    0x12: 'Zelda',
    0x13: 'Sheik',
    0x14: 'Falco',
    0x15: 'Young Link',
    0x16: 'Dr. Mario',
    0x17: 'Roy',
    0x18: 'Pichu',
    0x19: 'Ganondorf',
    0x1A: 'Master Hand',
    0x1B: 'Wireframe Male',
    0x1C: 'Wireframe Female',
    0x1D: 'Giga Bowser',
    0x1E: 'Crazy Hand',
    0x1F: 'Sandbag',
    0x20: 'Popo',
    0x21: 'None'
}

const PORT_COLORS = [
    {
      "name": "Player 1",
      "value": "f15959",
      "locale": {
        "fr": "Joueur 1"
      }
    },
    {
      "name": "Player 2",
      "value": "6565ff",
      "locale": {
        "fr": "Joueur 2"
      }
    },
    {
      "name": "Player 3",
      "value": "febe3f",
      "locale": {
        "fr": "Joueur 3"
      }
    },
    {
      "name": "Player 4",
      "value": "4ce44c",
      "locale": {
        "fr": "Joueur 4"
      }
    },
    {
      "name": "Computer Player",
      "value": "7f7f7f",
      "locale": {
        "fr": "Ordinateur"
      }
    }
];


const connectionType = "dolphin"; // Change this to "console" if connecting to a relay or Nintendont
const livestream = new SlpLiveStream(connectionType, {
  outputFiles: false,
});

// connect to the livestream
livestream.start(ADDRESS, PORT)
  .then(() => {
    console.log("Connected to Slippi");
  })
  .catch(console.error);

const realtime = new SlpRealTime();

realtime.setStream(livestream);

let currentPlayers = { p1: null, p2: null };
let gameUpdateInterval = null;

realtime.game.start$.subscribe((start) => {
  console.log("game started");
  const players = (start.players ?? [])
    .filter((p) => p && typeof p.port === "number")
    .slice()
    .sort((a, b) => a.port - b.port);

  const p1 = players[0];
  const p2 = players[players.length - 1];

  currentPlayers = { p1, p2 };

  if (!p1) {
    console.log("no players found at game start");
    return;
  }

  const toTshPayload = (player) => ({
    mains: {
      ssbm: [[CHARACTER_ID_MAP[player.characterId], player.characterColor]],
    },
  });

  console.log(
    `P1 is port ${p1.port} (${CHARACTER_ID_MAP[p1.characterId]} costume ${p1.characterColor})`
  );
  if (p2 && p2 !== p1) {
    console.log(
      `P2 is port ${p2.port} (${CHARACTER_ID_MAP[p2.characterId]} costume ${p2.characterColor})`
    );
  }

  const updateTSH = async () => {
    try {
      const p1ColorIndex = p1.port - 1;
      const p1Color = PORT_COLORS[p1ColorIndex].value;
      
      await axios.post(
        "http://" + TSH_IP + ":" + TSH_PORT + "/scoreboard0-update-team-1-0",
        toTshPayload(p1)
      );
      await axios.get(
        "http://" + TSH_IP + ":" + TSH_PORT + "/scoreboard0-team1-color-" + p1Color
      );
      console.log(
        `updated team 0 with P1: ${CHARACTER_ID_MAP[p1.characterId]} (${p1.characterColor}) color: ${p1Color}`
      );

      if (p2 && p2 !== p1) {
        const p2ColorIndex = p2.port - 1;
        const p2Color = PORT_COLORS[p2ColorIndex].value;
        
        await axios.post(
          "http://" + TSH_IP + ":" + TSH_PORT + "/scoreboard0-update-team-0-0",
          toTshPayload(p2)
        );
        await axios.get(
          "http://" + TSH_IP + ":" + TSH_PORT + "/scoreboard0-team0-color-" + p2Color
        );
        console.log(
          `updated team 1 with P2: ${CHARACTER_ID_MAP[p2.characterId]} (${p2.characterColor}) color: ${p2Color}`
        );
      }
    } catch (error) {
      console.log("could not update TSH!! maybe not running?");
    }
  };

  updateTSH();

  if (gameUpdateInterval) {
    clearInterval(gameUpdateInterval);
  }

  gameUpdateInterval = setInterval(updateTSH, 3000);
});

realtime.game.end$.subscribe((end) => {
	if (gameUpdateInterval) {
		clearInterval(gameUpdateInterval);
		gameUpdateInterval = null;
		console.log("stopped periodic TSH updates");
	}

	if(end.gameEndMethod == GameEndMethod.GAME) {
		console.log(`game end, player ${end.winnerPlayerIndex} won`);
		
		(async () => {
			try {
				const { p1, p2 } = currentPlayers;
				
				if (!p1) {
					console.log("no player data available");
					return;
				}
				
				if (end.winnerPlayerIndex === p1.playerIndex) {
					console.log(`${CHARACTER_ID_MAP[p1.characterId]} (team 0) won`);
					await axios.get(
						"http://" + TSH_IP + ":" + TSH_PORT + "/scoreboard0-team1-scoreup"
					);
				} else if (p2 && end.winnerPlayerIndex === p2.playerIndex) {
					console.log(`${CHARACTER_ID_MAP[p2.characterId]} (team 1) won`);
					await axios.get(
						"http://" + TSH_IP + ":" + TSH_PORT + "/scoreboard0-team0-scoreup"
					);
				}
			} catch (error) {
				console.log("could not update score in TSH!!", error.message);
			}
		})();
	}
});

// realtime.stock.playerSpawn$.subscribe((stock) => {
//   const { playerIndex, count } = stock;
//   console.log(`player ${playerIndex + 1} spawned with ${count} stocks remaining`);
// });