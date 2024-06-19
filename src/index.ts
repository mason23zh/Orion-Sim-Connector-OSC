import { detectSimulator } from './detectSimulator';
import {setGetLatestFlightData} from "./wsServer";

const start = async () => {
  const simulator = await detectSimulator();
  console.log(`Detected Simulator: ${simulator}`);

  if (simulator === 'SimConnect (MSFS2020 or P3D)') {
    // Initialize SimConnect-related logic
    import("./simConnectServer").then((module) => {
      setGetLatestFlightData(module.getLatestFlightData)
    })
    import("./wsServer")
  } else if (simulator === 'X-Plane') {
    // Initialize UDP-related logic
    import("./udpServer").then((module) => {
      setGetLatestFlightData(module.getLatestFlightData)
    })
    import('./wsServer');
  } else {
    console.error('No supported simulator running.');
  }
};

start();