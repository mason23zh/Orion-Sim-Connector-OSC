import { detectSimulator, handleSimulatorSwitch } from './detectSimulator';
import { startSimConnect, stopSimConnect } from './simConnectServer';
import { startUDPServer, stopUDPServer } from './udpServer';
import { wsServer } from './wsServer';
import { Simulator } from './simulatorState';

const RETRY_DELAY = 2000; // 2 seconds

async function initialize() {
  wsServer.start();

  while (true) {
    try {
      const simulator = await detectSimulator();
      if (simulator !== Simulator.NONE) {
        console.log(`Simulator detected: ${simulator}`);

        if (simulator === Simulator.MSFS) {
          await stopUDPServer();
          await startSimConnect();
        } else if (simulator === Simulator.XPLANE) {
          await stopSimConnect();
          await startUDPServer();
        }

        setInterval(handleSimulatorSwitch, 5000); // Check for simulator switch every 5 seconds
        break;
      } else {
        console.log('Waiting for simulator to connect...');
      }
    } catch (error) {
      console.error('Error while detecting simulator:', error);
    }
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
}

initialize().catch((error) => {
  console.error('Failed to initialize:', error);
});