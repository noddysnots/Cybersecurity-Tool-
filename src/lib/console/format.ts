/** PAN-OS style column helpers. No color, mono-friendly aligned text. */

export function pad(value: string, width: number, align: "left" | "right" = "left"): string {
  if (value.length >= width) return value.slice(0, width);
  const space = " ".repeat(width - value.length);
  return align === "left" ? `${value}${space}` : `${space}${value}`;
}

export function table(headers: string[], rows: string[][], widths: number[]): string {
  const head = headers.map((h, i) => pad(h, widths[i] ?? 12)).join(" ");
  const rule = widths.map((w) => "-".repeat(w)).join(" ");
  const body = rows.map((row) => row.map((cell, i) => pad(cell, widths[i] ?? 12)).join(" ")).join("\n");
  return body ? `${head}\n${rule}\n${body}` : `${head}\n${rule}`;
}

export function kv(pairs: Array<[string, string]>, keyWidth = 22): string {
  return pairs.map(([k, v]) => `${pad(`${k}:`, keyWidth)}${v}`).join("\n");
}
