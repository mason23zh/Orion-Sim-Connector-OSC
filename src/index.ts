import { detectSimulator } from './detectSimulator';

const start = async () => {
  const simulator = await detectSimulator();
  console.log(`Detected Simulator: ${simulator}`);

  if (simulator === 'SimConnect (MSFS2020 or P3D)') {
    // Initialize SimConnect-related logic
    import('./udpServer'); // Ensure udpClient is set up for SimConnect
  } else if (simulator === 'X-Plane') {
    // Initialize UDP-related logic
    import('./udpServer');
    import('./wsServer'); // Ensure wsServer is set up for UDP
  } else {
    console.error('No supported simulator running.');
  }
};

start();