const LAST_USER_KEY = "clarita_last_user";

export interface LastUser {
  email: string;
  full_name: string;
}

export function getLastUser(): LastUser | null {
  try {
    const raw = localStorage.getItem(LAST_USER_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as LastUser;
    if (!data?.email) return null;
    return data;
  } catch {
    return null;
  }
}

export function setLastUser(user: LastUser): void {
  try {
    localStorage.setItem(LAST_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearLastUser(): void {
  try {
    localStorage.removeItem(LAST_USER_KEY);
  } catch {
    // ignore
  }
}
