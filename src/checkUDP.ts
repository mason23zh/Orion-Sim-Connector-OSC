import dgram from 'dgram';

const PORT = 49000;
const HOST = '127.0.0.1';
const FREQ = 2;

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
];

export const checkUDP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const client = dgram.createSocket('udp4');
    let timeout: NodeJS.Timeout;

    client.on('message', (message) => {
      const label = message.toString('utf8', 0, 4);
      if (label === 'RREF') {
        console.log('Received data from X-Plane via UDP');
        clearTimeout(timeout);
        client.close();
        resolve(true);
      }
    });

    client.on('error', (err) => {
      console.error('UDP client error:', err);
      clearTimeout(timeout);
      client.close();
      resolve(false);
    });

    client.bind(() => {
      messages.forEach((message) => {
        client.send(message, 0, message.length, PORT, HOST, (err) => {
          if (err) {
            console.error('Error sending UDP message:', err);
          }
        });
      });

      timeout = setTimeout(() => {
        console.log('UDP check timed out');
        client.close();
        resolve(false);
      }, 5000); // Timeout after 5 seconds
    });
  });
};