import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const PIN_SALT_KEY = "clarita_pin_salt";
const PIN_HASH_KEY = "clarita_pin_hash";
const PIN_ENCRYPTED_KEY = "clarita_pin_encrypted";

const PREFS_LOCALSTORAGE_PREFIX = "clarita_pin_prefs_";

function isUnimplementedError(e: unknown): boolean {
  return (e as { code?: string })?.code === "UNIMPLEMENTED";
}

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

/** True when running as native iOS app (Capacitor). */
export function isIOSNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  } catch {
    return false;
  }
}

async function getPref(key: string): Promise<string | null> {
  if (!isIOSNativeApp()) return null;
  try {
    const { value } = await Preferences.get({ key });
    return value;
  } catch (e) {
    if (isUnimplementedError(e)) {
      try {
        return localStorage.getItem(PREFS_LOCALSTORAGE_PREFIX + key);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function setPref(key: string, value: string): Promise<void> {
  if (!isIOSNativeApp()) return;
  try {
    await Preferences.set({ key, value });
  } catch (e) {
    if (isUnimplementedError(e)) {
      localStorage.setItem(PREFS_LOCALSTORAGE_PREFIX + key, value);
      return;
    }
    throw e;
  }
}

async function removePref(key: string): Promise<void> {
  if (!isIOSNativeApp()) return;
  try {
    await Preferences.remove({ key });
  } catch (e) {
    if (isUnimplementedError(e)) {
      localStorage.removeItem(PREFS_LOCALSTORAGE_PREFIX + key);
      return;
    }
    throw e;
  }
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function hashPin(salt: Uint8Array, pin: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = new Uint8Array(salt.length + encoder.encode(pin).length);
  data.set(salt, 0);
  data.set(encoder.encode(pin), salt.length);
  return await crypto.subtle.digest("SHA-256", data);
}

async function deriveKey(salt: Uint8Array, pin: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Whether PIN and salt are stored (PIN is configured on this device). */
export async function hasPinConfigured(): Promise<boolean> {
  const salt = await getPref(PIN_SALT_KEY);
  const hash = await getPref(PIN_HASH_KEY);
  return !!salt && !!hash;
}

/** Set PIN: generate salt, hash PIN, store hash and salt. Does not store session. */
export async function setPin(pin: string): Promise<void> {
  if (!isIOSNativeApp()) return;
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const hashBuf = await hashPin(salt, pin);
  await setPref(PIN_SALT_KEY, bufferToBase64(salt));
  await setPref(PIN_HASH_KEY, bufferToBase64(hashBuf));
}

/** Verify PIN against stored hash. */
export async function verifyPin(pin: string): Promise<boolean> {
  const saltB64 = await getPref(PIN_SALT_KEY);
  const hashB64 = await getPref(PIN_HASH_KEY);
  if (!saltB64 || !hashB64) return false;
  const salt = new Uint8Array(base64ToBuffer(saltB64));
  const expectedHash = base64ToBuffer(hashB64);
  const actualHash = await hashPin(salt, pin);
  if (expectedHash.byteLength !== actualHash.byteLength) return false;
  const a = new Uint8Array(actualHash);
  const e = new Uint8Array(expectedHash);
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== e[i]) return false;
  }
  return true;
}

/** Encrypt and store refresh token using PIN-derived key. Call after setPin or with same PIN. */
export async function saveEncryptedSession(pin: string, refreshToken: string): Promise<void> {
  if (!isIOSNativeApp()) return;
  const saltB64 = await getPref(PIN_SALT_KEY);
  if (!saltB64) throw new Error("PIN not configured");
  const salt = new Uint8Array(base64ToBuffer(saltB64));
  const key = await deriveKey(salt, pin);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(refreshToken)
  );
  const payload = JSON.stringify({
    iv: bufferToBase64(iv),
    data: bufferToBase64(ciphertext),
  });
  await setPref(PIN_ENCRYPTED_KEY, payload);
}

/** Verify PIN, decrypt and return refresh_token. */
export async function getSessionWithPin(pin: string): Promise<{ refresh_token: string } | null> {
  if (!isIOSNativeApp()) return null;
  const ok = await verifyPin(pin);
  if (!ok) return null;
  const payloadStr = await getPref(PIN_ENCRYPTED_KEY);
  if (!payloadStr) return null;
  try {
    const parsed = JSON.parse(payloadStr) as { iv: string; data: string };
    const saltB64 = await getPref(PIN_SALT_KEY);
    if (!saltB64) return null;
    const salt = new Uint8Array(base64ToBuffer(saltB64));
    const key = await deriveKey(salt, pin);
    const iv = base64ToBuffer(parsed.iv);
    const data = base64ToBuffer(parsed.data);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    const refresh_token = new TextDecoder().decode(decrypted);
    return refresh_token ? { refresh_token } : null;
  } catch {
    return null;
  }
}

/** Remove only the encrypted session (refresh token). Keeps PIN so user does not have to create it again after re-login. Call on logout. */
export async function clearEncryptedSessionOnly(): Promise<void> {
  await removePref(PIN_ENCRYPTED_KEY);
}

/** Remove PIN hash, salt and encrypted session. Call on "Olvidé mi PIN". */
export async function clearPinData(): Promise<void> {
  await removePref(PIN_SALT_KEY);
  await removePref(PIN_HASH_KEY);
  await removePref(PIN_ENCRYPTED_KEY);
}
