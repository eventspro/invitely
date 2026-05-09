/**
 * WeddingCarRoadmapIcon
 *
 * A refined front-facing vintage wedding car SVG icon designed for use as a
 * roadmap/journey path marker in the Aurelia wedding template.
 *
 * Design language: cinematic, editorial, premium luxury.
 * Works cleanly at 32×32 through 96×96.
 *
 * Builder V2 ready — all visual properties are exposed as props.
 */

import React, { useEffect, useRef } from "react";

// ─── Props ─────────────────────────────────────────────────────────────────────
export interface WeddingCarRoadmapIconProps {
  /** Rendered width and height in px (icon is always square) */
  size?: number;

  /** Optional CSS class */
  className?: string;

  /** Outline / stroke color — default: muted gold */
  strokeColor?: string;

  /** Car body fill color — default: champagne ivory */
  fillColor?: string;

  /** Accent color used for headlights & floral detail — default: soft gold */
  accentColor?: string;

  /** Stroke line width (scales with icon, override if needed) */
  strokeWidth?: number;

  /** Show subtle floral garland on hood */
  showFloral?: boolean;

  /** Show tiny heart accent on grille */
  showHeart?: boolean;

  /** Drop-shadow / glow strength 0–1 (0 = off) */
  glowStrength?: number;

  /** Animate: "float" | "scale-in" | "pulse" | "none" */
  animation?: "float" | "scale-in" | "pulse" | "none";
}

// ─── Component ────────────────────────────────────────────────────────────────
export function WeddingCarRoadmapIcon({
  size          = 48,
  className,
  strokeColor   = "#D7B777",   // Aurelia gold
  fillColor     = "#F7F0E3",   // Aurelia ivory
  accentColor   = "#C8A96A",   // slightly deeper gold for accents
  strokeWidth   = 1.4,
  showFloral    = true,
  showHeart     = true,
  glowStrength  = 0.7,
  animation     = "float",
}: WeddingCarRoadmapIconProps) {
  const nodeRef = useRef<SVGSVGElement>(null);

  // ── Inject keyframe CSS once ────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "wc-car-anim-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes wc-float {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-4px); }
      }
      @keyframes wc-scale-in {
        from { transform: scale(0.4); opacity: 0; }
        to   { transform: scale(1);   opacity: 1; }
      }
      @keyframes wc-pulse {
        0%, 100% { transform: scale(1); }
        50%       { transform: scale(1.08); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const animStyle: React.CSSProperties =
    animation === "float"    ? { animation: "wc-float 3s ease-in-out infinite" }  :
    animation === "scale-in" ? { animation: "wc-scale-in 0.55s cubic-bezier(.22,1,.36,1) both" } :
    animation === "pulse"    ? { animation: "wc-pulse 2.4s ease-in-out infinite" } :
    {};

  // Glow filter intensity
  const glowDev  = (glowStrength * 8).toFixed(1);
  const glowAlpha = (glowStrength * 0.85).toFixed(2);

  // ── SVG viewBox is fixed at 64×64 — scaling done by width/height props ──────
  // All paths designed on a 64×64 grid:
  //   - Car body occupies roughly y=22–54, x=8–56
  //   - Grille/windshield region y=22–36
  //   - Roof arch y=14–26
  //   - Headlights at x≈17, x≈47, y≈46
  //   - Wheels at x≈18, x≈46, y≈52–58 (front view: two side silhouettes)
  //   - Floral garland spans x=20–44, y=32–38
  //   - Heart at x=32, y=30

  return (
    <svg
      ref={nodeRef}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", overflow: "visible", ...animStyle }}
      aria-label="Wedding car"
      role="img"
    >
      <defs>
        {/* Glow filter */}
        <filter id="wc-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={glowDev} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Subtle inner shadow on car body */}
        <filter id="wc-body-shadow" x="-5%" y="-5%" width="110%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={strokeColor} floodOpacity="0.18" />
        </filter>
      </defs>

      {/* ── Outer glow ring (shown when glowStrength > 0) ── */}
      {glowStrength > 0 && (
        <ellipse
          cx="32" cy="55" rx="22" ry="4"
          fill={strokeColor}
          fillOpacity={String(parseFloat(glowAlpha) * 0.18)}
          style={{ filter: `blur(${glowDev}px)` }}
        />
      )}

      {/* ── Car body — rounded vintage compact silhouette ── */}
      {/*
        Front-view vintage car:
        Wide bumper base, two arched wheel arches, central grille indent,
        roof arch rising from the bodyline.
      */}
      <g filter="url(#wc-body-shadow)">

        {/* Main body shape */}
        <path
          d={`
            M 14 50
            Q 10 50 10 46
            L 10 40
            Q 10 36 14 36
            L 16 36
            Q 18 30 20 28
            L 22 26
            Q 24 22 28 21
            L 36 21
            Q 40 22 42 26
            L 44 28
            Q 46 30 48 36
            L 50 36
            Q 54 36 54 40
            L 54 46
            Q 54 50 50 50
            Z
          `}
          fill={fillColor}
          fillOpacity="0.96"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />

        {/* Bumper bar — slightly wider, slightly lower */}
        <path
          d="M 11 51 Q 32 54 53 51"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />

        {/* Roof / cabin arch */}
        <path
          d="M 20 36 Q 21 26 26 22 Q 32 18 38 22 Q 43 26 44 36"
          fill={fillColor}
          fillOpacity="0.80"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />

        {/* Windshield glare (subtle highlight inside roof arch) */}
        <path
          d="M 23 35 Q 24 27 28 24 Q 32 21 36 24 Q 40 27 41 35"
          fill={strokeColor}
          fillOpacity="0.06"
          stroke={strokeColor}
          strokeWidth={strokeWidth * 0.6}
          strokeLinejoin="round"
        />

        {/* Central grille — vertical bars */}
        <rect
          x="28" y="40" width="8" height="7"
          rx="1.5"
          stroke={strokeColor}
          strokeWidth={strokeWidth * 0.85}
          fill={fillColor}
          fillOpacity="0.5"
        />
        <line x1="32" y1="40" x2="32" y2="47" stroke={strokeColor} strokeWidth={strokeWidth * 0.7} opacity="0.55" />
        <line x1="30" y1="40" x2="30" y2="47" stroke={strokeColor} strokeWidth={strokeWidth * 0.5} opacity="0.35" />
        <line x1="34" y1="40" x2="34" y2="47" stroke={strokeColor} strokeWidth={strokeWidth * 0.5} opacity="0.35" />

        {/* Left headlight */}
        <circle
          cx="18" cy="44" r="4"
          fill={fillColor}
          stroke={accentColor}
          strokeWidth={strokeWidth}
        />
        <circle cx="18" cy="44" r="2" fill={accentColor} fillOpacity="0.30" />
        {/* Left headlight glare dot */}
        <circle cx="17" cy="43" r="0.8" fill="white" fillOpacity="0.55" />

        {/* Right headlight */}
        <circle
          cx="46" cy="44" r="4"
          fill={fillColor}
          stroke={accentColor}
          strokeWidth={strokeWidth}
        />
        <circle cx="46" cy="44" r="2" fill={accentColor} fillOpacity="0.30" />
        {/* Right headlight glare dot */}
        <circle cx="45" cy="43" r="0.8" fill="white" fillOpacity="0.55" />

        {/* Left wheel arch indent */}
        <path
          d="M 10 46 Q 14 53 20 53 Q 26 53 28 46"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill={strokeColor}
          fillOpacity="0.06"
        />

        {/* Right wheel arch indent */}
        <path
          d="M 36 46 Q 38 53 44 53 Q 50 53 54 46"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill={strokeColor}
          fillOpacity="0.06"
        />

        {/* Left wheel face (two concentric circles) */}
        <circle cx="19" cy="52" r="4.5" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth * 0.85} />
        <circle cx="19" cy="52" r="2" fill="none" stroke={strokeColor} strokeWidth={strokeWidth * 0.6} opacity="0.55" />

        {/* Right wheel face */}
        <circle cx="45" cy="52" r="4.5" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth * 0.85} />
        <circle cx="45" cy="52" r="2" fill="none" stroke={strokeColor} strokeWidth={strokeWidth * 0.6} opacity="0.55" />

      </g>

      {/* ── Floral garland on hood ── */}
      {showFloral && (
        <g opacity="0.82">
          {/* Slender stem arc */}
          <path
            d="M 20 36 Q 32 32 44 36"
            stroke={accentColor}
            strokeWidth={strokeWidth * 0.8}
            strokeLinecap="round"
            fill="none"
          />
          {/* Tiny leaf left */}
          <ellipse cx="22" cy="34.5" rx="2.2" ry="1.1" fill={accentColor} fillOpacity="0.55" transform="rotate(-30 22 34.5)" />
          {/* Tiny bloom left */}
          <circle cx="25" cy="33.5" r="1.4" fill={accentColor} fillOpacity="0.70" />
          {/* Center bloom */}
          <circle cx="32" cy="32.5" r="1.8" fill={accentColor} fillOpacity="0.80" />
          <circle cx="32" cy="32.5" r="0.7" fill="white" fillOpacity="0.45" />
          {/* Tiny bloom right */}
          <circle cx="39" cy="33.5" r="1.4" fill={accentColor} fillOpacity="0.70" />
          {/* Tiny leaf right */}
          <ellipse cx="42" cy="34.5" rx="2.2" ry="1.1" fill={accentColor} fillOpacity="0.55" transform="rotate(30 42 34.5)" />
        </g>
      )}

      {/* ── Tiny heart above grille ── */}
      {showHeart && (
        <g opacity="0.75">
          <path
            d="M 32 30 C 32 30 30 28 29 29 C 28 30 29 32 32 33.5 C 35 32 36 30 35 29 C 34 28 32 30 32 30 Z"
            fill={accentColor}
            stroke="none"
          />
        </g>
      )}
    </svg>
  );
}

// ─── Roadmap marker wrapper ────────────────────────────────────────────────────
/**
 * WeddingCarMapMarker
 *
 * Drop-in replacement for the SVG <g> car marker used in AureliaTemplate's
 * roadmap path. Renders the car icon inside an SVG <foreignObject> so the
 * React component slots directly into the existing SVG route animation.
 *
 * Usage in the SVG roadmap block:
 *
 *   {carPt && (
 *     <WeddingCarMapMarker
 *       x={carPt.x}
 *       y={carPt.y}
 *       size={52}
 *       strokeColor={C.gold}
 *       accentColor={C.goldSoft}
 *     />
 *   )}
 */
export interface WeddingCarMapMarkerProps extends WeddingCarRoadmapIconProps {
  /** SVG coordinate of the centre point on the path */
  x: number;
  y: number;
}

export function WeddingCarMapMarker({
  x,
  y,
  size = 52,
  strokeColor  = "#D7B777",
  fillColor    = "#F7F0E3",
  accentColor  = "#C8A96A",
  strokeWidth  = 1.4,
  showFloral   = true,
  showHeart    = true,
  glowStrength = 0.7,
  animation    = "float",
}: WeddingCarMapMarkerProps) {
  const half = size / 2;
  return (
    <foreignObject
      x={x - half}
      y={y - half}
      width={size}
      height={size}
      style={{ overflow: "visible" }}
    >
      <WeddingCarRoadmapIcon
        size={size}
        strokeColor={strokeColor}
        fillColor={fillColor}
        accentColor={accentColor}
        strokeWidth={strokeWidth}
        showFloral={showFloral}
        showHeart={showHeart}
        glowStrength={glowStrength}
        animation={animation}
      />
    </foreignObject>
  );
}

export default WeddingCarRoadmapIcon;
