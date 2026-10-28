const ITERATIONS = 100_000;

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(buf as ArrayBuffer), (b) => b.toString(16).padStart(2, "0")).join("");

async function derive(pin: string, saltHex: string): Promise<string> {
  const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;
  if (!subtle) {
    // Insecure context (plain http on a LAN): weak fallback so the app still works in dev.
    let h = 5381;
    for (const c of saltHex + pin) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
    return `f${h}`;
  }
  const key = await subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const salt = Uint8Array.from(saltHex.match(/../g) ?? [], (h) => parseInt(h, 16));
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    key,
    256,
  );
  return toHex(bits);
}

export const isValidPin = (pin: string) => /^\d{4,6}$/.test(pin);

export async function hashPin(pin: string): Promise<string> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return `${salt}:${await derive(pin, salt)}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  return (await derive(pin, salt)) === hash;
}
