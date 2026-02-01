import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", ws => {
  ws.on("message", msg => {
    // Signaling relay only
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === 1) {
        client.send(msg.toString());
      }
    });
  });
});

server.listen(3000, () =>
  console.log("WebRTC signaling server running on :3000")
);
