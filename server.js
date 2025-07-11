import { WebSocketServer } from 'ws';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

const history = [];

wss.on('connection', (ws) => {
  console.log('New client connected');

  for (const action of history) {
    ws.send(JSON.stringify(action));
  }

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error(e);
      return;
    }

    if (data.type === 'clear') {
      history.length = 0;
    } else {
      history.push(data);
    }

    for (const client of wss.clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);
