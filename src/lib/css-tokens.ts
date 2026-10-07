/** Read a CSS custom property from :root. Safe for canvas drawing. */
export function readCssToken(name: string, fallback = ""): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export function readMeshPalette() {
  return {
    bg: readCssToken("--bg", "#0a0e1a"),
    surface1: readCssToken("--surface-1", "#0f1424"),
    surface2: readCssToken("--surface-2", "#151b2e"),
    border: readCssToken("--border", "#222b42"),
    text: readCssToken("--text", "#e6eaf2"),
    textMuted: readCssToken("--text-muted", "#8a94ab"),
    textFaint: readCssToken("--text-faint", "#5a6480"),
    accent: readCssToken("--accent", "#7c8cff"),
    signal: readCssToken("--signal", "#3dd6c6"),
    warn: readCssToken("--warn", "#f5c451"),
  };
}
