import { create } from "zustand";

export const DEMO_USERNAME = "admin";
export const DEMO_PASSWORD = "12345";

const SESSION_KEY = "triage.auth";
const SPLASH_KEY = "triage.splashSeen";

export type AuthSession = {
  username: string;
  signedInAt: string;
};

function readSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed.username !== DEMO_USERNAME) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(session: AuthSession | null): void {
  try {
    if (session) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // sessionStorage may be unavailable; demo continues in memory
  }
}

type AuthState = {
  session: AuthSession | null;
  hydrated: boolean;
  hydrate: () => void;
  signIn: (username: string, password: string) => boolean;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  hydrated: false,
  hydrate: () => {
    set({ session: readSession(), hydrated: true });
  },
  signIn: (username, password) => {
    const trimmedUser = username.trim();
    if (trimmedUser === DEMO_USERNAME && password === DEMO_PASSWORD) {
      const session: AuthSession = {
        username: trimmedUser,
        signedInAt: "demo",
      };
      writeSession(session);
      set({ session, hydrated: true });
      return true;
    }
    return false;
  },
  signOut: () => {
    writeSession(null);
    set({ session: null });
  },
}));

export function hasSeenSplash(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSplashSeen(): void {
  try {
    sessionStorage.setItem(SPLASH_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearSplashSeen(): void {
  try {
    sessionStorage.removeItem(SPLASH_KEY);
  } catch {
    // ignore
  }
}
