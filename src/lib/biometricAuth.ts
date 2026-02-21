import { Capacitor } from "@capacitor/core";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isIOSNativeApp, clearPinData } from "@/lib/iosAppPin";

const BIOMETRIC_ENABLED_KEY = "clarita_biometric_enabled";
const BIOMETRIC_PROMPT_SHOWN_KEY = "clarita_biometric_prompt_shown";
/** Session-scoped: cleared on logout so Face ID is required again. */
export const BIOMETRIC_SESSION_UNLOCKED_KEY = "clarita_biometric_session_unlocked";
const KEYCHAIN_USERNAME = "session";

function getServer(): string {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return url ?? "https://supabase.co";
}

/** True when running as native iOS app (Capacitor). */
export function isBiometricSupported(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  } catch {
    return false;
  }
}

export function isBiometricEnabled(): boolean {
  try {
    return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setBiometricEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
    } else {
      localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    }
  } catch {
    // ignore
  }
}

/** Whether we've already asked the user about Face ID (one-time prompt). */
export function hasBiometricPromptBeenShown(): boolean {
  try {
    return localStorage.getItem(BIOMETRIC_PROMPT_SHOWN_KEY) === "true";
  } catch {
    return false;
  }
}

export function setBiometricPromptShown(): void {
  try {
    localStorage.setItem(BIOMETRIC_PROMPT_SHOWN_KEY, "true");
  } catch {
    // ignore
  }
}

/** Check if Face ID / Touch ID / passcode is available. */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  try {
    const r = await NativeBiometric.isAvailable({ useFallback: true });
    return r.isAvailable;
  } catch {
    return false;
  }
}

/** Check if we have stored credentials in Keychain. */
export async function hasStoredCredentials(): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  try {
    const r = await NativeBiometric.isCredentialsSaved({ server: getServer() });
    return r.isSaved;
  } catch {
    return false;
  }
}

/**
 * Store session in Keychain (Face ID / passcode protected).
 * Call only after successful sign-in, when user opts in.
 */
export async function storeSession(session: Session): Promise<void> {
  if (!isBiometricSupported()) return;
  try {
    const payload = JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
    });
    await NativeBiometric.setCredentials({
      username: KEYCHAIN_USERNAME,
      password: payload,
      server: getServer(),
    });
  } catch (e) {
    console.error("[Biometric] storeSession:", e);
    throw e;
  }
}

/**
 * Retrieve stored session. Does NOT force Face ID - Keychain may return
 * without prompt if device was recently unlocked.
 */
async function getCredentialsFromKeychain(): Promise<Session | null> {
  if (!isBiometricSupported()) return null;
  try {
    const creds = await NativeBiometric.getCredentials({ server: getServer() });
    const data = JSON.parse(creds.password) as Partial<Session>;
    if (!data.access_token || !data.refresh_token) return null;
    return data as Session;
  } catch {
    return null;
  }
}

/**
 * Retrieve stored session AFTER forcing Face ID / passcode prompt.
 * Call verifyIdentity() first so the user must authenticate every time.
 */
export async function getStoredSession(): Promise<Session | null> {
  if (!isBiometricSupported()) return null;
  try {
    await NativeBiometric.verifyIdentity({
      reason: "Desbloquear la app",
      title: "Desbloquear",
      subtitle: "Usá Face ID o el código del teléfono",
      useFallback: true,
    });
    return await getCredentialsFromKeychain();
  } catch {
    return null;
  }
}

/** Remove stored credentials from Keychain. Call on logout. */
export async function clearStoredSession(): Promise<void> {
  if (!isBiometricSupported()) return;
  try {
    await NativeBiometric.deleteCredentials({ server: getServer() });
  } catch (e) {
    console.warn("[Biometric] clearStoredSession:", e);
  }
}

/** Sign out and clear any stored biometric credentials. Use for logout. */
export async function performLogout(): Promise<void> {
  await clearStoredSession();
  if (isIOSNativeApp()) {
    await clearPinData();
  }
  try {
    sessionStorage.removeItem(BIOMETRIC_SESSION_UNLOCKED_KEY);
  } catch {
    /* ignore */
  }
  await supabase.auth.signOut();
}
