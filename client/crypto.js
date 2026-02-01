// ---- IDENTITY KEY ----
export async function createIdentity() {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "X25519" },
    true,
    ["deriveKey"]
  );
}

// ---- DERIVE SHARED SECRET (X3DH SIMPLIFIED) ----
export async function deriveSecret(privateKey, publicKey) {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ---- DOUBLE RATCHET (PER MESSAGE KEY) ----
export async function ratchet(chainKey) {
  const raw = await crypto.subtle.exportKey("raw", chainKey);
  const hash = await crypto.subtle.digest("SHA-256", raw);

  const msgKey = await crypto.subtle.importKey(
    "raw",
    hash.slice(0, 32),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );

  const nextChainKey = await crypto.subtle.importKey(
    "raw",
    hash.slice(16),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );

  return { msgKey, nextChainKey };
}

// ---- ENCRYPT / DECRYPT ----
export async function encrypt(key, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(text);

  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc
  );

  return { iv: [...iv], data: [...new Uint8Array(data)] };
}

export async function decrypt(key, payload) {
  const dec = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(payload.iv) },
    key,
    new Uint8Array(payload.data)
  );

  return new TextDecoder().decode(dec);
}
