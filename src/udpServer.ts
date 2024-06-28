import dgram from "dgram";
import { setCurrentSimulator, Simulator } from "./simulatorState";
import { detectSimulator } from "./detectSimulator";
import { FlightData, UdpError } from "./types";

const HOST = '127.0.0.1';
const FREQ = 3; // Frequency of updates (times per second)
const RECEIVING_PORTS = [7172, 49001]; // X-Plane data receiving port list
const XPLANE_PORTS = [49000, 49010]; // X-Plane data request port list
const VALID_DATA_TIMEOUT = 5000; // 5 seconds timeout to switch port
const MeterToFeet = 3.28084;

let latestFlightData: FlightData = {};
let udpClient: dgram.Socket | null = null;
let wsClients: any[] = [];
let retryTimeout: NodeJS.Timeout | null = null;
let lastValidDataTimestamp: number = Date.now();
let currentReceivingPortIndex = 0;
let currentXPlanePortIndex = 0;
let checkInterval: NodeJS.Timeout | null = null;
let sendInterval: NodeJS.Timeout | null = null;

const createMessage = (dref: string, idx: number, freq: number): Buffer => {
  const message = Buffer.alloc(413);
  message.write('RREF\0');
  message.writeInt32LE(freq, 5);
  message.writeInt32LE(idx, 9);
  message.write(dref, 13);
  return message;
};

const messages = [
  createMessage('sim/flightmodel/position/latitude', 1, FREQ),
  createMessage('sim/flightmodel/position/longitude', 2, FREQ),
  createMessage('sim/flightmodel/position/elevation', 3, FREQ), // meter
  createMessage('sim/flightmodel/position/y_agl', 4, FREQ), // meter
  createMessage('sim/flightmodel/position/mag_psi', 5, FREQ),
  createMessage('sim/flightmodel/position/true_psi', 6, FREQ),
  createMessage('sim/flightmodel/position/indicated_airspeed', 7, FREQ),
  createMessage('sim/flightmodel/position/true_airspeed', 8, FREQ),
  createMessage('sim/flightmodel/position/groundspeed', 9, FREQ),
  createMessage('sim/flightmodel/position/true_theta', 10, FREQ),
  createMessage('sim/flightmodel/position/true_phi', 11, FREQ),
  createMessage('sim/flightmodel/position/vh_ind_fpm', 12, FREQ),
];

const parseUDPData = (message: Buffer): FlightData => {
  const label = message.toString('utf8', 0, 4);
  if (label !== 'RREF') {
    //console.log('Unknown package. Ignoring:', label);
    return {};
  }

  let offset = 5;
  const flightData: FlightData = {};

  while (offset < message.length) {
    const index = message.readInt32LE(offset);
    const value = message.readFloatLE(offset + 4);
    switch (index) {
      case 1:
        flightData.latitude = value;
        break;
      case 2:
        flightData.longitude = value;
        break;
      case 3:
        flightData.MSL = value * MeterToFeet;
        break;
      case 4:
        flightData.AGL = value * MeterToFeet;
        break;
      case 5:
        flightData.heading = value;
        break;
      case 6:
        flightData.true_heading = value;
        break;
      case 7:
        flightData.indicated_airspeed = value;
        break;
      case 8:
        flightData.true_airspeed = value;
        break;
      case 9:
        flightData.groundspeed = value;
        break;
      case 10:
        flightData.pitch = value;
        break;
      case 11:
        flightData.roll = value;
        break;
      case 12:
        flightData.vertical_speed = value;
        break;
      default:
        console.log(`Unknown index: ${index}`);
    }
    offset += 8;
  }

  lastValidDataTimestamp = Date.now(); // Update the timestamp of the last valid data
  return flightData;
};

const broadcastToClients = (data: FlightData) => {
  wsClients.forEach((client) => {
    client.send(JSON.stringify(data));
  });
};

const waitForXPlane = async () => {
  console.log('Waiting for X-Plane to start...');
  while(await detectSimulator() !== Simulator.XPLANE){
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  console.log('X-Plane started.');
};

const switchPorts = () => {
  currentReceivingPortIndex = (currentReceivingPortIndex + 1) % RECEIVING_PORTS.length;
  currentXPlanePortIndex = (currentXPlanePortIndex + 1) % XPLANE_PORTS.length;
  console.log(`Switching ports: Receiving on ${RECEIVING_PORTS[currentReceivingPortIndex]}, sending to ${XPLANE_PORTS[currentXPlanePortIndex]}`);
  stopUDPServer();
  startUDPServer();
};

const checkForValidData = () => {
  if (Date.now() - lastValidDataTimestamp > VALID_DATA_TIMEOUT) {
    switchPorts();
  }
};

export const getLatestFlightData = (): FlightData => latestFlightData;

export const startUDPServer = async (): Promise<void> => {
  console.log('UDP SERVER START.');
  await waitForXPlane();

  if (udpClient) {
    return;
  }

  udpClient = dgram.createSocket('udp4');

  udpClient.on('listening', () => {
    const address = udpClient!.address();
    console.log(`UDP client listening on ${address.address}:${address.port}`);
  });

  udpClient.on('message', (message) => {
    const flightData = parseUDPData(message);
    if (Object.keys(flightData).length > 0) {
      latestFlightData = flightData;
      console.log('Decoded message:', latestFlightData);
      setCurrentSimulator(Simulator.XPLANE); // Ensure simulator state is set
      broadcastToClients(latestFlightData);
    }
  });

  udpClient.on('error', (err:UdpError) => {
    console.error('UDP client error:', err);
    if (err.code === 'EACCES' || err.code === 'EADDRINUSE') {
      console.log('Retrying to bind the UDP client...');
      switchPorts(); // Switch ports if binding fails
    }
  });

  udpClient.bind(RECEIVING_PORTS[currentReceivingPortIndex], () => {
    // Send messages at the specified frequency
    sendInterval = setInterval(() => {
      messages.forEach((message) => {
        udpClient!.send(message, 0, message.length, XPLANE_PORTS[currentXPlanePortIndex], HOST, (err) => {
          if (err) {
            console.error('Error sending UDP message:', err);
          } else {
            console.log(`UDP message sent to ${HOST}:${XPLANE_PORTS[currentXPlanePortIndex]}`);
          }
        });
      });
    }, 1000 / FREQ);

    // Check for valid data periodically
    checkInterval = setInterval(checkForValidData, VALID_DATA_TIMEOUT / 2);
  });
};

export const stopUDPServer = (): void => {
  if (sendInterval) {
    clearInterval(sendInterval);
    sendInterval = null;
  }

  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }

  if (udpClient) {
    udpClient.close(() => {
      console.log('UDP client closed.');
      udpClient = null;
    });
  }
};

export const addClient = (ws: any) => {
  wsClients.push(ws);
};

export const removeClient = (ws: any) => {
  wsClients = wsClients.filter(client => client !== ws);
};
