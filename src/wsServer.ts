import WebSocket from "ws";
import {addClient as addSimConnectClient, removeClient as removeSimConnectClient} from "./simConnectServer";
import {addClient as addUDPClient, removeClient as removeUDPClient} from "./udpServer";

const wsServer = {
    start: () => {
        const wss = new WebSocket.Server({port: 49153});
        wss.on("connection", (ws) => {
            console.log("Client connected");
            addSimConnectClient(ws);
            addUDPClient(ws);

            ws.on("close", () => {
                removeSimConnectClient(ws);
                removeUDPClient(ws);
                console.log("Client disconnected");
            });

            ws.on("message", (message) => {
                console.log("received:", message);
            });
        });
    }
};

export {wsServer};
