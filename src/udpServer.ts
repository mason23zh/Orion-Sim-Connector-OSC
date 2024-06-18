import dgram from 'dgram';

const PORT = 49000;
const HOST = '127.0.0.1';
const FREQ = 2;

const client = dgram.createSocket('udp4');

interface FlightData {
  latitude?: number;
  longitude?: number;
  heading?: number;
  airspeed?: number;
  altitude?:number;
}

let latestFlightData: FlightData = {};

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
  createMessage('sim/flightmodel/position/longitude', 2, FREQ),
  createMessage('sim/flightmodel/position/mag_psi', 3, FREQ),
  createMessage('sim/flightmodel/position/true_airspeed', 4, FREQ),
  createMessage("sim/flightmodel/position/y_agl",5,FREQ)
];

client.on('listening', () => {
  const address = client.address();
  console.log(`UDP client listening on ${address.address}:${address.port}`);
});

client.on('message', (message) => {
  const label = message.toString('utf8', 0, 4);
  if (label !== 'RREF') {
    console.log('Unknown package. Ignoring');
    return;
  }

  let offset = 9;
  const values = [];
  while (offset < message.length) {
    const value = message.readFloatLE(offset);
    values.push(value);
    offset += 8;
  }

  // Update the latest flight data based on the index
  latestFlightData = {
    latitude: values[0],
    longitude: values[1],
    heading: values[2],
    airspeed:values[3],
    altitude:values[4],
  };

  console.log('Decoded message:', latestFlightData);
});

for (const message of messages) {
  client.send(message, 0, message.length, PORT, HOST, (err) => {
    if (err) {
      console.error('Error sending UDP message:', err);
    } else {
      console.log(`UDP message sent to ${HOST}:${PORT}`);
    }
  });
}

export const getLatestFlightData = (): FlightData => latestFlightData;

// Function to check UDP connection and receive data from X-Plane
export const checkUDP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const tempClient = dgram.createSocket('udp4');
    let timeout: NodeJS.Timeout;

    tempClient.on('message', (message) => {
      const label = message.toString('utf8', 0, 4);
      if (label === 'RREF') {
        console.log('Received data from X-Plane via UDP');
        clearTimeout(timeout);
        tempClient.close();
        resolve(true);
      }
    });

    tempClient.on('error', (err) => {
      console.error('UDP client error:', err);
      clearTimeout(timeout);
      tempClient.close();
      resolve(false);
    });

    tempClient.bind(() => {
      messages.forEach((message) => {
        tempClient.send(message, 0, message.length, PORT, HOST, (err) => {
          if (err) {
            console.error('Error sending UDP message:', err);
          }
        });
      });

      timeout = setTimeout(() => {
        console.log('UDP check timed out');
        tempClient.close();
        resolve(false);
      }, 5000); // Timeout after 5 seconds
    });
  });
};