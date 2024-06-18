import { checkSimConnect } from './checkSimConnect';
import { checkUDP } from './checkUDP';

export const detectSimulator = async (): Promise<string> => {
  const simConnectActive = await checkSimConnect();
  if (simConnectActive) {
    return 'SimConnect (MSFS2020 or P3D)';
  }

  const udpActive = await checkUDP();
  if (udpActive) {
    return 'X-Plane';
  }

  return 'No simulator detected';
};