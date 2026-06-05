/**
 * Shared elegant SVG icon set for wedding detail/note cards.
 * Used by Aurelia template and the Builder V2 icon picker.
 */
import React from "react";

export const DETAIL_ICON_KEYS = [
  "hanger",
  "gift",
  "car",
  "calendar",
  "map-pin",
  "music",
  "champagne",
  "camera",
  "ring",
  "fork-knife",
  "flower",
  "heart",
] as const;

export type DetailIconKey = (typeof DETAIL_ICON_KEYS)[number];

export const DETAIL_ICON_LABELS: Record<DetailIconKey, string> = {
  hanger:       "Dress Code",
  gift:         "Gift",
  car:          "Parking",
  calendar:     "RSVP Date",
  "map-pin":    "Location",
  music:        "Music",
  champagne:    "Toast",
  camera:       "Photo",
  ring:         "Rings",
  "fork-knife": "Dining",
  flower:       "Flowers",
  heart:        "Heart",
};

interface DetailIconProps {
  iconKey: string;
  stroke:  string;
  size?:   number;
}

export function DetailIcon({ iconKey, stroke, size = 38 }: DetailIconProps) {
  const s: React.SVGProps<SVGSVGElement> = {
    width: size, height: size, viewBox: "0 0 38 38",
    fill: "none", stroke,
    strokeWidth: "1.3",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (iconKey) {
    case "hanger":
      return (
        <svg {...s}>
          <circle cx="19" cy="7" r="3" />
          <path d="M19 10v3M19 13L5 29h28L19 13Z" />
        </svg>
      );
    case "gift":
      return (
        <svg {...s}>
          <rect x="7" y="17" width="24" height="14" rx="1" />
          <rect x="5" y="12" width="28" height="6" rx="1" />
          <path d="M19 12V31" />
          <path d="M13 12c0-4 3-6 5-5s3 5-1 5M25 12c0-4-3-6-5-5s-3 5 1 5" />
        </svg>
      );
    case "car":
      return (
        <svg {...s}>
          <path d="M7 29V19l5-9h14l5 9v10" />
          <path d="M3 22h32" />
          <circle cx="11" cy="29" r="3" />
          <circle cx="27" cy="29" r="3" />
          <path d="M11 22v-5h16v5" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...s}>
          <rect x="6" y="10" width="26" height="21" rx="1" />
          <path d="M6 17h26M13 10V6M25 10V6" />
        </svg>
      );
    case "map-pin":
      return (
        <svg {...s}>
          <path d="M19 4a9 9 0 0 1 9 9c0 7-9 17-9 17S10 20 10 13a9 9 0 0 1 9-9z" />
          <circle cx="19" cy="13" r="3.5" />
        </svg>
      );
    case "music":
      return (
        <svg {...s}>
          <path d="M14 29V10l16-4v19" />
          <circle cx="11" cy="29" r="3.5" />
          <circle cx="27" cy="25" r="3.5" />
        </svg>
      );
    case "champagne":
      return (
        <svg {...s}>
          <path d="M14 4h10l-4 16v10" />
          <path d="M11 30h16" />
          <path d="M16 10h6" />
        </svg>
      );
    case "camera":
      return (
        <svg {...s}>
          <rect x="3" y="11" width="32" height="21" rx="2" />
          <path d="M24 11l-2-4h-6l-2 4" />
          <circle cx="19" cy="22" r="5.5" />
        </svg>
      );
    case "ring":
      return (
        <svg {...s}>
          <circle cx="19" cy="24" r="8" />
          <path d="M12 24L19 6l7 18" />
        </svg>
      );
    case "fork-knife":
      return (
        <svg {...s}>
          <path d="M10 4v12M7 4v8a3 3 0 0 0 6 0V4M10 16v16" />
          <path d="M24 4v22M27 4a5 5 0 0 1-3 5v17" />
        </svg>
      );
    case "flower":
      return (
        <svg {...s}>
          <circle cx="19" cy="19" r="3.5" />
          <ellipse cx="19" cy="10" rx="3" ry="5" />
          <ellipse cx="19" cy="28" rx="3" ry="5" />
          <ellipse cx="10" cy="19" rx="5" ry="3" />
          <ellipse cx="28" cy="19" rx="5" ry="3" />
        </svg>
      );
    case "heart":
      return (
        <svg {...s}>
          <path d="M19 31C4 21 4 10 11.5 7a7.5 7.5 0 0 1 7.5 4 7.5 7.5 0 0 1 7.5-4C34 10 34 21 19 31z" />
        </svg>
      );
    default:
      return null;
  }
}
