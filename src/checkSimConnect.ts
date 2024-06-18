import { open, Protocol } from 'node-simconnect';

export const checkSimConnect = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    open('My SimConnect client', Protocol.FSX_SP2)
      .then(({ recvOpen, handle }) => {
        console.log('Connected to', recvOpen.applicationName);

        handle.close();
        resolve(true);
      })
      .catch((error) => {
        console.log('SimConnect connection failed:', error);
        resolve(false);
      });
  });
};