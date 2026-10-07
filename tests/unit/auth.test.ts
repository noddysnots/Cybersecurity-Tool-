import { beforeEach, describe, expect, it } from "vitest";

import {
  DEMO_PASSWORD,
  DEMO_USERNAME,
  hasSeenSplash,
  markSplashSeen,
  useAuthStore,
} from "@/lib/auth";

function installMemorySessionStorage() {
  const map = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => {
      map.delete(key);
    },
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
  Object.defineProperty(globalThis, "sessionStorage", {
    value: storage,
    configurable: true,
  });
}

describe("auth", () => {
  beforeEach(() => {
    installMemorySessionStorage();
    useAuthStore.setState({ session: null, hydrated: false });
  });

  it("accepts only demo credentials", () => {
    const { signIn, signOut } = useAuthStore.getState();
    expect(signIn("nope", "nope")).toBe(false);
    expect(useAuthStore.getState().session).toBeNull();

    expect(signIn(DEMO_USERNAME, DEMO_PASSWORD)).toBe(true);
    expect(useAuthStore.getState().session?.username).toBe("admin");

    signOut();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("persists session and splash flag in sessionStorage", () => {
    useAuthStore.getState().signIn(DEMO_USERNAME, DEMO_PASSWORD);
    useAuthStore.setState({ session: null, hydrated: false });
    useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().session?.username).toBe("admin");

    expect(hasSeenSplash()).toBe(false);
    markSplashSeen();
    expect(hasSeenSplash()).toBe(true);
  });
});
