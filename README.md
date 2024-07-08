# Orion Sim Connector (OSC) Version 0.3

The purpose of OSC is to act like a bridge to fetch data from the sim and send the data
into [Airport Weather](https:airportweather.org) website to display the location of the traffic from your sim.

OSC will use UDP port (X-Plane 12) and Simconnect (MSFS2020) to read sim data.

Flowing data will be read:

- Aircraft latitude
- Aircraft longitude
- Aircraft MSL
- Aircraft AGL
- Aircraft mag heading
- Aircraft true heading
- Aircraft indicated airspeed
- Aircraft true airspeed
- Aircraft groundspeed
- Aircraft pitch
- Aircraft roll
- Aircraft vertical speed

If you are using X-plane 12, data will be read from default X-plane 12 data output UDP port.

Port List:

- 49000

If you are using MSFS2020, data will be read using [node-simconnect](https://github.com/EvenAR/node-simconnect) plugin.

OSC will open port `49153` on localhost to send those data out.

## Supported platforms:

- X-Plane 12
- Microsoft Flight Simulator 2020
