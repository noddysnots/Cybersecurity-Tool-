import { useEffect, useRef } from "react";

import { readMeshPalette } from "@/lib/css-tokens";
import { cn } from "@/lib/utils";

export type MeshLabel = {
  id: string;
  label: string;
  x: number;
  y: number;
  tone: "accent" | "signal" | "warn" | "muted";
  pulse?: boolean;
};

type NetworkMeshProps = {
  className?: string;
  mode?: "splash" | "ambient";
  intensity?: number;
  converge?: number;
  reducedMotion?: boolean;
  labels?: MeshLabel[];
  "aria-hidden"?: boolean;
};

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
};

type Link = {
  a: number;
  b: number;
  pulse: number;
  speed: number;
};

function seedNodes(count: number, width: number, height: number): Node[] {
  const nodes: Node[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 0.18 + ((i * 37) % 100) / 220;
    nodes.push({
      x: width * (0.5 + Math.cos(angle) * radius * 0.95),
      y: height * (0.5 + Math.sin(angle) * radius * 0.7),
      vx: (Math.sin(i * 1.7) * 0.08) / 60,
      vy: (Math.cos(i * 1.3) * 0.06) / 60,
      r: 1.2 + (i % 4) * 0.45,
      phase: i * 0.37,
    });
  }
  return nodes;
}

function buildLinks(nodes: Node[], maxDist: number): Link[] {
  const links: Link[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.hypot(dx, dy);
      if (dist < maxDist && (i + j) % 3 !== 0) {
        links.push({
          a: i,
          b: j,
          pulse: (i * 13 + j * 7) % 100 / 100,
          speed: 0.25 + ((i + j) % 5) * 0.08,
        });
      }
    }
  }
  return links;
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) {
    return `rgba(124, 140, 255, ${alpha})`;
  }
  const r = Number.parseInt(cleaned.slice(0, 2), 16);
  const g = Number.parseInt(cleaned.slice(2, 4), 16);
  const b = Number.parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function NetworkMesh({
  className,
  mode = "ambient",
  intensity = 1,
  converge = 0,
  reducedMotion = false,
  labels = [],
  "aria-hidden": ariaHidden = true,
}: NetworkMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelsRef = useRef(labels);
  const convergeRef = useRef(converge);
  const intensityRef = useRef(intensity);
  const reducedRef = useRef(reducedMotion);

  labelsRef.current = labels;
  convergeRef.current = converge;
  intensityRef.current = intensity;
  reducedRef.current = reducedMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let disposed = false;
    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let links: Link[] = [];
    let last = performance.now();
    let time = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = mode === "splash" ? 42 : 36;
      nodes = seedNodes(count, width, height);
      links = buildLinks(nodes, Math.min(width, height) * 0.22);
    };

    const drawStatic = () => {
      const palette = readMeshPalette();
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * (mode === "splash" ? 0.46 : 0.5);

      for (const link of links) {
        const a = nodes[link.a];
        const b = nodes[link.b];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = hexToRgba(palette.border, 0.55);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(palette.textFaint, 0.85);
        ctx.fill();
      }

      // Soft center focus
      const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.min(width, height) * 0.28);
      glow.addColorStop(0, hexToRgba(palette.accent, 0.12));
      glow.addColorStop(1, hexToRgba(palette.accent, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      drawLabels(ctx, width, height, palette, 1);
    };

    const drawLabels = (
      context: CanvasRenderingContext2D,
      w: number,
      h: number,
      palette: ReturnType<typeof readMeshPalette>,
      pulseT: number,
    ) => {
      const activeLabels = labelsRef.current;
      if (activeLabels.length === 0) return;

      context.save();
      context.font = '12px "Geist Sans", ui-sans-serif, system-ui, sans-serif';
      context.textBaseline = "middle";

      for (const item of activeLabels) {
        const x = item.x * w;
        const y = item.y * h;
        const tone =
          item.tone === "warn"
            ? palette.warn
            : item.tone === "signal"
              ? palette.signal
              : item.tone === "accent"
                ? palette.accent
                : palette.textMuted;

        const pulse =
          item.pulse && !reducedRef.current
            ? 0.55 + Math.sin(pulseT * 2.4 + x) * 0.45
            : item.pulse
              ? 0.85
              : 0.35;

        if (item.pulse) {
          context.beginPath();
          context.arc(x, y, 10 + pulse * 6, 0, Math.PI * 2);
          context.fillStyle = hexToRgba(tone, 0.12 * pulse);
          context.fill();
        }

        context.beginPath();
        context.arc(x, y, item.pulse ? 3.4 : 2.6, 0, Math.PI * 2);
        context.fillStyle = tone;
        context.shadowColor = tone;
        context.shadowBlur = item.pulse ? 10 * pulse : 4;
        context.fill();
        context.shadowBlur = 0;

        const padX = 8;
        const textW = context.measureText(item.label).width;
        const boxW = textW + padX * 2;
        const boxH = 22;
        const boxX = x + 12;
        const boxY = y - boxH / 2;

        context.fillStyle = hexToRgba(palette.surface1, 0.82);
        context.strokeStyle = hexToRgba(palette.border, 0.9);
        context.lineWidth = 1;
        context.beginPath();
        context.roundRect(boxX, boxY, boxW, boxH, 6);
        context.fill();
        context.stroke();

        context.fillStyle = item.tone === "muted" ? palette.textMuted : palette.text;
        context.fillText(item.label, boxX + padX, y);
      }

      context.restore();
    };

    const tick = (now: number) => {
      if (disposed) return;
      const dt = Math.min(32, now - last);
      last = now;
      time += dt / 1000;

      const palette = readMeshPalette();
      const intensity = intensityRef.current;
      const converge = Math.max(0, Math.min(1, convergeRef.current));
      const cx = width * 0.5;
      const cy = height * (mode === "splash" ? 0.44 : 0.48);
      const drift = mode === "splash" ? 1 : 0.45;

      if (!reducedRef.current) {
        for (const node of nodes) {
          node.x += node.vx * dt * drift;
          node.y += node.vy * dt * drift;
          if (node.x < width * 0.06 || node.x > width * 0.94) node.vx *= -1;
          if (node.y < height * 0.08 || node.y > height * 0.92) node.vy *= -1;

          if (converge > 0) {
            node.x += (cx - node.x) * 0.0009 * converge * dt;
            node.y += (cy - node.y) * 0.0009 * converge * dt;
          }
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Deep field
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);

      const vignette = ctx.createRadialGradient(
        cx,
        cy,
        Math.min(width, height) * 0.1,
        cx,
        cy,
        Math.max(width, height) * 0.75,
      );
      vignette.addColorStop(0, hexToRgba(palette.surface2, 0.35));
      vignette.addColorStop(1, hexToRgba(palette.bg, 0));
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      for (const link of links) {
        const a = nodes[link.a];
        const b = nodes[link.b];
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const towardCenter =
          1 - Math.min(1, Math.hypot(midX - cx, midY - cy) / (Math.min(width, height) * 0.55));
        const energy =
          (0.15 + towardCenter * 0.55 + Math.sin(time * link.speed + link.pulse * 6) * 0.12) *
          intensity *
          (0.55 + converge * 0.7);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = hexToRgba(
          towardCenter > 0.55 || converge > 0.4 ? palette.accent : palette.border,
          0.25 + energy * 0.55,
        );
        ctx.lineWidth = towardCenter > 0.6 ? 1.25 : 1;
        ctx.stroke();

        // Traveling packet
        if (!reducedRef.current && energy > 0.35) {
          const t = (time * link.speed * 0.35 + link.pulse) % 1;
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;
          ctx.beginPath();
          ctx.arc(px, py, 1.4, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(palette.signal, 0.35 + converge * 0.45);
          ctx.fill();
        }
      }

      // Convergence beams into name center (splash)
      if (mode === "splash" && converge > 0.05) {
        const beamCount = 12;
        for (let i = 0; i < beamCount; i += 1) {
          const angle = (i / beamCount) * Math.PI * 2 + time * 0.12;
          const outer = Math.min(width, height) * (0.48 - converge * 0.1);
          const x0 = cx + Math.cos(angle) * outer;
          const y0 = cy + Math.sin(angle) * outer * 0.68;
          const grad = ctx.createLinearGradient(x0, y0, cx, cy);
          grad.addColorStop(0, hexToRgba(palette.accent, 0));
          grad.addColorStop(0.55, hexToRgba(palette.accent, 0.08 + converge * 0.12));
          grad.addColorStop(1, hexToRgba(palette.signal, 0.2 + converge * 0.35));
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(cx, cy);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1 + converge * 0.6;
          ctx.stroke();
        }
      }

      for (const node of nodes) {
        const glow = 0.35 + Math.sin(time * 1.4 + node.phase) * 0.2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(palette.textMuted, 0.45 + glow * 0.35 * intensity);
        ctx.fill();
      }

      const core = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.min(width, height) * 0.22);
      core.addColorStop(0, hexToRgba(palette.accent, 0.08 + converge * 0.18));
      core.addColorStop(1, hexToRgba(palette.accent, 0));
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, width, height);

      drawLabels(ctx, width, height, palette, time);

      if (!reducedRef.current) {
        raf = requestAnimationFrame(tick);
      }
    };

    resize();
    const onResize = () => {
      resize();
      if (reducedRef.current) drawStatic();
    };
    window.addEventListener("resize", onResize);

    if (reducedMotion) {
      drawStatic();
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [mode, reducedMotion]);

  // Re-draw when reduced and converge/labels change via animation frame already reading refs
  useEffect(() => {
    if (!reducedMotion) return;
    // force a static redraw by dispatching resize-like paint through ref mutation
    const canvas = canvasRef.current;
    if (!canvas) return;
    const event = new Event("resize");
    window.dispatchEvent(event);
  }, [reducedMotion, converge, labels, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 h-full w-full", className)}
      aria-hidden={ariaHidden}
    />
  );
}
