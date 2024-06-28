interface FlightData {
  latitude?: number;
  longitude?: number;
  MSL?: number;
  AGL?: number;
  heading?: number;
  true_heading?: number;
  indicated_airspeed?: number;
  true_airspeed?: number;
  groundspeed?: number;
  pitch?: number;
  roll?: number;
  vertical_speed?: number;
}

interface UdpError extends Error {
  code: string;
}

export type {
  FlightData,
  UdpError
}