import {
  createIdentity,
  deriveSecret,
  ratchet,
  encrypt,
  decrypt
} from "./crypto.js";

const ws = new WebSocket("ws://localhost:3000");
let identity, chainKey, username;

ws.onmessage = async e => {
  const data = JSON.parse(e.data);
  if (data.payload && chainKey) {
    const r = await ratchet(chainKey);
    chainKey = r.nextChainKey;
    const text = await decrypt(r.msgKey, data.payload);
    log(text);
  }
};

window.init = async () => {
  username = document.getElementById("user").value;
  identity = await createIdentity();

  const pub = await crypto.subtle.exportKey(
    "raw",
    identity.publicKey
  );

  ws.send(JSON.stringify({
    type: "prekey",
    user: username,
    prekey: [...new Uint8Array(pub)]
  }));

  log("Identity created");
};

window.send = async () => {
  const msg = document.getElementById("msg").value;

  ws.send(JSON.stringify({
    type: "getPrekey",
    to: username
  }));

  ws.onmessage = async e => {
    const data = JSON.parse(e.data);
    if (data.prekey) {
      const pubKey = await crypto.subtle.importKey(
        "raw",
        new Uint8Array(data.prekey),
        { name: "ECDH", namedCurve: "X25519" },
        false,
        []
      );

      chainKey = await deriveSecret(identity.privateKey, pubKey);
      const r = await ratchet(chainKey);
      chainKey = r.nextChainKey;

      const payload = await encrypt(r.msgKey, username + ": " + msg);
      ws.send(JSON.stringify({ payload }));
    }
  };
};

function log(t) {
  document.getElementById("log").textContent += t + "\n";
}
