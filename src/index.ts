import {detectSimulator, handleSimulatorSwitch} from "./detectSimulator";
import {startSimConnect, stopSimConnect} from "./simConnectServer";
import {startUDPServer, stopUDPServer} from "./udpServer";
import {wsServer} from "./wsServer";
import {Simulator} from "./simulatorState";

let simulatorSwitchInterval: NodeJS.Timeout | null = null;

const RETRY_DELAY = 2000; // 2 seconds


async function monitorSimulator() {
    let currentSimulator = null;

    while (true) {
        try {
            const simulator = await detectSimulator();

            if (simulator !== currentSimulator) {
                if (simulator === Simulator.NONE) {
                    console.log("No simulator detected. Waiting for simulator to connect...");
                    currentSimulator = null;
                    await stopSimConnect();
                    await stopUDPServer();
                } else if (simulator === Simulator.MSFS) {
                    console.log("START MFS2020");
                    currentSimulator = Simulator.MSFS;
                    await stopUDPServer();
                    await startSimConnect();
                } else if (simulator === Simulator.XPLANE) {
                    currentSimulator = Simulator.XPLANE;
                    console.log("START X-PLANE");
                    await stopSimConnect();
                    await startUDPServer();
                }
            }
        } catch (error) {
            console.error("Error while detecting simulator:", error);
        }

        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
}

async function initialize() {
    console.log("OSC Version 0.3");
    wsServer.start();

    if (simulatorSwitchInterval) {
        clearInterval(simulatorSwitchInterval);
    }
    simulatorSwitchInterval = setInterval(handleSimulatorSwitch, 5000);

    monitorSimulator();
}

initialize().catch((error) => {
    console.error("Failed to initialize:", error);
});
