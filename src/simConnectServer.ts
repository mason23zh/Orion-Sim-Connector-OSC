import {
  open,
  Protocol,
  SimConnectConstants,
  SimConnectDataType,
  SimConnectPeriod,
} from 'node-simconnect';

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

// const enum EventID {
//   PAUSE,
// }
//
// const enum DefinitionID {
//   LIVE_DATA,
// }
//
// const enum RequestID {
//   LIVE_DATA,
// }

export const getLatestFlightData = (): FlightData => latestFlightData;

const AIRCRAFT_DATA_REQUEST = 0;
const AIRCRAFT_DATA_DEFINITION = 0;

open('My app', Protocol.FSX_SP2)
  .then(({ recvOpen, handle }) => {
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

    // AGL
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
      }
    });


  })
  .catch((error) => {
    console.log('Failed to connect', error);
  });
