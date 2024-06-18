import WebSocket from 'ws';
import { getLatestFlightData } from './udpServer';

const wss = new WebSocket.Server({ port: 6789 });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  setInterval(() => {
    const data = getLatestFlightData();
    ws.send(JSON.stringify(data));
  }, 1000); // Send data every second
});

console.log('WebSocket Server listening on ws://localhost:6789');