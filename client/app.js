import { startCall, handleSignal } from "./webrtc.js";

const ws = new WebSocket("ws://localhost:3000");

ws.onmessage = async e => {
  const data = JSON.parse(e.data);
  await handleSignal(data, ws);
};

window.call = async () => {
  await startCall(ws);
};
