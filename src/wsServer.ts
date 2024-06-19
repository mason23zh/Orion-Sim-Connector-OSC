import WebSocket from 'ws';

let getLatestFlightData: () => any;

// use for dynamic import
export const setGetLatestFlightData = (dataFunc: () => any) => {
  getLatestFlightData = dataFunc;
}

const wss = new WebSocket.Server({ port: 6789 });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  setInterval(() => {
    if(getLatestFlightData) {
      const data = getLatestFlightData();
      ws.send(JSON.stringify(data));
    }
  }, 500);
});

console.log('WebSocket Server listening on ws://localhost:6789');