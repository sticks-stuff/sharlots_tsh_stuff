const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 9876 });

wss.on('connection', ws => {
    ws.on('message', message => {
		console.log(message.toString());
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });
});

console.log('WebSocket server is running on ws://localhost:9876');