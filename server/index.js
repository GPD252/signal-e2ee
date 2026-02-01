import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const preKeys = {}; // public prekeys only

wss.on("connection", ws => {
  ws.on("message", msg => {
    const data = JSON.parse(msg);

    // Store public prekeys
    if (data.type === "prekey") {
      preKeys[data.user] = data.prekey;
      return;
    }

    // Fetch recipient prekey
    if (data.type === "getPrekey") {
      ws.send(JSON.stringify({
        type: "prekey",
        prekey: preKeys[data.to]
      }));
      return;
    }

    // Relay encrypted messages (server cannot read)
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === 1) {
        client.send(msg.toString());
      }
    });
  });
});

server.listen(3000, () =>
  console.log("Signal-style server running on http://localhost:3000")
);
