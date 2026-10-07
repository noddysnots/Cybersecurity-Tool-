import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { NetworkMesh, type MeshLabel } from "@/components/network/NetworkMesh";
import { Button } from "@/components/ui";
import { Tooltip } from "@/components/ui/tooltip";
import { loginCopy } from "@/content/auth";
import {
  DEMO_PASSWORD,
  DEMO_USERNAME,
  useAuthStore,
} from "@/lib/auth";
import { cn } from "@/lib/utils";

const LOGIN_LABELS: MeshLabel[] = [
  {
    id: "india-west",
    label: loginCopy.networkRegion,
    x: 0.42,
    y: 0.38,
    tone: "accent",
  },
  {
    id: "pune",
    label: loginCopy.networkBranchDown,
    x: 0.28,
    y: 0.58,
    tone: "warn",
    pulse: true,
  },
  {
    id: "mumbai",
    label: loginCopy.networkBranchUp,
    x: 0.58,
    y: 0.62,
    tone: "signal",
  },
  {
    id: "gp",
    label: loginCopy.networkGateway,
    x: 0.7,
    y: 0.32,
    tone: "muted",
  },
];

type LocationState = {
  from?: { pathname?: string };
  fromSplash?: boolean;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;
  const returnTo =
    state?.from?.pathname && state.from.pathname !== "/login"
      ? state.from.pathname
      : "/home";

  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const signIn = useAuthStore((s) => s.signIn);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [entered, setEntered] = useState(!(state?.fromSplash));
  const [reduced] = useState(prefersReducedMotion);

  const passwordRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!state?.fromSplash || reduced) {
      setEntered(true);
      return;
    }
    const id = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(id);
  }, [state?.fromSplash, reduced]);

  if (!hydrated) {
    return <main className="min-h-screen bg-bg" data-testid="login" aria-busy="true" />;
  }

  // Keep the panel mounted while "Signing in" is shown; skip only when already authed.
  if (session && !signingIn) {
    return <Navigate to={returnTo} replace />;
  }

  const updateCaps = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsOn(event.getModifierState("CapsLock"));
  };

  const handleFill = () => {
    setUsername(DEMO_USERNAME);
    setPassword(DEMO_PASSWORD);
    setError(null);
    passwordRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (signingIn) return;

    setError(null);
    setSigningIn(true);

    const ok = signIn(username, password);
    if (!ok) {
      setSigningIn(false);
      setError(loginCopy.wrongCredentials);
      setShake(true);
      window.setTimeout(() => setShake(false), 360);
      passwordRef.current?.focus();
      passwordRef.current?.select();
      return;
    }

    window.setTimeout(() => {
      navigate(returnTo, { replace: true });
    }, 700);
  };

  return (
    <main
      className={cn(
        "relative min-h-screen bg-bg text-text transition-opacity duration-500 ease-out",
        entered ? "opacity-100" : "opacity-0",
      )}
      data-testid="login"
    >
      <div className="flex min-h-screen">
        {/* Left 60%: live network visual */}
        <section
          className="relative hidden w-[60%] overflow-hidden border-r border-border lg:block"
          aria-label="Network topology preview"
        >
          <NetworkMesh
            mode="ambient"
            intensity={0.85}
            reducedMotion={reduced}
            labels={LOGIN_LABELS}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-bg/90" />
          <div className="absolute bottom-8 left-8 max-w-sm">
            <p className="text-sm text-text-faint">Remote network status</p>
            <p className="mt-1 text-base text-text-muted">
              India West region with one branch tunnel degraded
            </p>
          </div>
        </section>

        {/* Right 40%: sign-in */}
        <section className="relative flex w-full flex-col justify-center bg-surface-1 px-8 py-12 lg:w-[40%] lg:px-14">
          <div className="mx-auto w-full max-w-[360px]">
            <p className="text-lg font-medium tracking-tight text-text">
              {loginCopy.productName}
            </p>
            <h1 className="mt-2 text-xl font-medium tracking-tight text-text">
              {loginCopy.panelTitle}
            </h1>
            <p className="mt-3 text-base text-text-muted">
              Sign in to continue triage for Acme Corp
            </p>

            <form className="mt-10 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col gap-2">
                <label htmlFor="username" className="text-sm text-text-muted">
                  {loginCopy.usernameLabel}
                </label>
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={cn(
                    "h-10 rounded-[var(--radius-control)] border border-border bg-surface-1 px-3 text-base text-text outline-none transition-colors placeholder:text-text-faint focus:border-border-strong focus:outline focus:outline-1 focus:outline-offset-2 focus:outline-accent",
                    shake && "animate-field-shake",
                  )}
                  data-testid="login-username"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm text-text-muted">
                  {loginCopy.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={updateCaps}
                    onKeyUp={updateCaps}
                    className={cn(
                      "h-10 w-full rounded-[var(--radius-control)] border border-border bg-surface-1 py-2 pl-3 pr-11 text-base text-text outline-none transition-colors placeholder:text-text-faint focus:border-border-strong focus:outline focus:outline-1 focus:outline-offset-2 focus:outline-accent",
                      shake && "animate-field-shake",
                    )}
                    data-testid="login-password"
                    aria-invalid={Boolean(error)}
                    aria-describedby={
                      error ? "login-error" : capsOn ? "caps-warning" : undefined
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-control)] text-text-muted hover:bg-surface-2 hover:text-text"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? loginCopy.hidePassword : loginCopy.showPassword
                    }
                    data-testid="toggle-password"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {capsOn ? (
                  <p id="caps-warning" className="text-sm text-warn" data-testid="caps-warning">
                    {loginCopy.capsLock}
                  </p>
                ) : null}
              </div>

              {error ? (
                <p
                  id="login-error"
                  role="alert"
                  className="text-sm text-danger"
                  data-testid="login-error"
                >
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                className="h-10 w-full"
                disabled={signingIn}
                data-testid="sign-in"
              >
                {signingIn ? loginCopy.signingIn : loginCopy.signIn}
              </Button>

              <Tooltip content={loginCopy.ssoTooltip} className="w-full">
                <span className="inline-flex w-full">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10 w-full"
                    disabled
                    aria-disabled="true"
                    title={loginCopy.ssoTooltip}
                    data-testid="sso-button"
                  >
                    {loginCopy.sso}
                  </Button>
                </span>
              </Tooltip>
            </form>

            <div
              className="mt-8 rounded-[var(--radius-panel)] border border-border bg-surface-1 p-4"
              data-testid="demo-credentials"
            >
              <p className="text-sm text-text-muted">{loginCopy.demoCard}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={handleFill}
                data-testid="fill-for-me"
              >
                {loginCopy.fillForMe}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
