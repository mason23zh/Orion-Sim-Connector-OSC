import {
  open,
  Protocol,
  SimConnectConstants,
  SimConnectDataType,
  SimConnectPeriod,
} from 'node-simconnect';
import { setCurrentSimulator, Simulator } from './simulatorState';

interface FlightData {
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  groundspeed: number;
}

let latestFlightData: FlightData = {
  latitude: 0,
  longitude: 0,
  altitude: 0,
  heading: 0,
  groundspeed: 0,
};

let simConnectHandle: any = null;
let wsClients: any[] = [];

const AIRCRAFT_DATA_REQUEST = 0;
const AIRCRAFT_DATA_DEFINITION = 0;

export const getLatestFlightData = (): FlightData => latestFlightData;

const connectToSim = () => {
  open('My app', Protocol.FSX_SP2)
    .then(({ recvOpen, handle }) => {
      simConnectHandle = handle;
      console.log('Connected to', recvOpen.applicationName);

      handle.addToDataDefinition(
        AIRCRAFT_DATA_DEFINITION,
        'Plane Latitude',
        'degrees',
        SimConnectDataType.FLOAT64
      );

      handle.addToDataDefinition(
        AIRCRAFT_DATA_DEFINITION,
        'Plane Longitude',
        'degrees',
        SimConnectDataType.FLOAT64
      );

      handle.addToDataDefinition(
        AIRCRAFT_DATA_DEFINITION,
        'PLANE ALT ABOVE GROUND',
        'feet',
        SimConnectDataType.FLOAT64
      );

      handle.addToDataDefinition(
        AIRCRAFT_DATA_DEFINITION,
        'PLANE HEADING DEGREES MAGNETIC',
        'degrees',
        SimConnectDataType.FLOAT64
      );

      handle.addToDataDefinition(
        AIRCRAFT_DATA_DEFINITION,
        'GROUND VELOCITY',
        'knots',
        SimConnectDataType.FLOAT64
      );

      handle.requestDataOnSimObject(
        AIRCRAFT_DATA_REQUEST,
        AIRCRAFT_DATA_DEFINITION,
        SimConnectConstants.OBJECT_ID_USER,
        SimConnectPeriod.SIM_FRAME
      );

      handle.on('simObjectData', (recvSimObjectData) => {
        if (recvSimObjectData.requestID === AIRCRAFT_DATA_REQUEST) {
          latestFlightData = {
            latitude: recvSimObjectData.data.readFloat64(),
            longitude: recvSimObjectData.data.readFloat64(),
            altitude: recvSimObjectData.data.readFloat64(),
            heading: recvSimObjectData.data.readFloat64(),
            groundspeed: recvSimObjectData.data.readFloat64(),
          };
          console.log('Latest Flight Data:', latestFlightData);
          setCurrentSimulator(Simulator.MSFS); // Ensure simulator state is set
          broadcastToClients(latestFlightData);
        }
      });

      handle.on('quit', () => {
        console.log('The simulator quit. Will try to reconnect.');
        handle.close();
        connectToSim();
      });

      handle.on('close', () => {
        console.log('Connection closed unexpectedly. Will try to reconnect.');
        handle.close();
        connectToSim();
      });
    })
    .catch((error) => {
      console.log('Failed to connect. Will try again in 5 seconds. Details:', error.message);
      setTimeout(connectToSim, 5000);
    });
};

const broadcastToClients = (data: FlightData) => {
  wsClients.forEach((client) => {
    client.send(JSON.stringify(data));
  });
};

export const startSimConnect = () => {
  connectToSim();
};

export const stopSimConnect = () => {
  if (simConnectHandle) {
    simConnectHandle.close();
    simConnectHandle = null;
    console.log('SimConnect connection closed.');
  }
};

export const addClient = (ws: any) => {
  wsClients.push(ws);
};

export const removeClient = (ws: any) => {
  wsClients = wsClients.filter(client => client !== ws);
};