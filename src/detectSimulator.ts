import { exec } from 'child_process';
import { Simulator, setCurrentSimulator, getCurrentSimulator } from './simulatorState';
import { startSimConnect, stopSimConnect } from './simConnectServer';
import { startUDPServer, stopUDPServer } from './udpServer';

interface Process {
  pid: number;
  name: string;
  cmd: string;
}

const getProcesses = (): Promise<Process[]> => {
  return new Promise((resolve, reject) => {
    exec('tasklist', (err, stdout) => {
      if (err) {
        return reject(err);
      }

      const lines = stdout.split('\n');
      const processes: Process[] = lines.slice(3).map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          pid: parseInt(parts[1], 10),
          name: parts[0],
          cmd: parts.slice(0, -4).join(' ')
        };
      });

      resolve(processes);
    });
  });
};

export const detectSimulator = async (): Promise<Simulator> => {
  const processes = await getProcesses();
  const processNames = processes.map(p => p.name.toLowerCase());

  const isXPlaneRunning = processNames.includes('x-plane.exe') ||
    processNames.includes('x-plane') ||
    processNames.includes('x-system.exe') ||
    processNames.includes('x-system');
  const isMSFSRunning = processNames.includes('flightsimulator.exe') ||
    processNames.includes('flightsimulator');

  if (isXPlaneRunning) {
    console.log('X-Plane is running');
    setCurrentSimulator(Simulator.XPLANE);
    return Simulator.XPLANE;
  } else if (isMSFSRunning) {
    console.log('Microsoft Flight Simulator is running');
    setCurrentSimulator(Simulator.MSFS);
    return Simulator.MSFS;
  } else {
    console.log('No supported simulator running');
    setCurrentSimulator(Simulator.NONE);
    return Simulator.NONE;
  }
};

export const handleSimulatorSwitch = async () => {
  const newSimulator = await detectSimulator();

  if (newSimulator === Simulator.MSFS) {
    stopUDPServer();
    stopSimConnect();
    startSimConnect();
  } else if (newSimulator === Simulator.XPLANE) {
    stopSimConnect();
    stopUDPServer();
    startUDPServer();
  }
};

