export enum Simulator {
    NONE = "None",
    XPLANE = "X-Plane",
    MSFS = "MSFS",
}

let currentSimulator: Simulator = Simulator.NONE;

export const setCurrentSimulator = (simulator: Simulator) => {
    currentSimulator = simulator;
    console.log(`Current simulator set to: ${simulator}`);
};

export const getCurrentSimulator = (): Simulator => {
    return currentSimulator;
};
