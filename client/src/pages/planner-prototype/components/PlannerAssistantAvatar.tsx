import React, { useRef } from "react";

let _nextId = 0;

interface Props {
  size?: number;
  notificationDot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function PlannerAssistantAvatar({ size = 56, notificationDot = false, className, style }: Props) {
  const id = useRef(`ppAv${++_nextId}`).current;
  const bgId  = `${id}bg`;
  const clipId = `${id}clip`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        <radialGradient id={bgId} cx="50%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#00904F" />
          <stop offset="100%" stopColor="#003D28" />
        </radialGradient>
        <clipPath id={clipId}>
          <circle cx="28" cy="28" r="28" />
        </clipPath>
      </defs>

      {/* Background */}
      <circle cx="28" cy="28" r="28" fill={`url(#${bgId})`} />

      <g clipPath={`url(#${clipId})`}>
        {/* Gold ears (behind head) */}
        <circle cx="9"  cy="25" r="5" fill="#F5A623" />
        <circle cx="47" cy="25" r="5" fill="#F5A623" />
        {/* Ear shine */}
        <circle cx="7.5"  cy="23.5" r="1.5" fill="rgba(255,255,255,0.35)" />
        <circle cx="45.5" cy="23.5" r="1.5" fill="rgba(255,255,255,0.35)" />

        {/* Antenna stem */}
        <line x1="28" y1="8" x2="28" y2="13" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />

        {/* Head (white rounded rect) */}
        <rect x="11" y="12" width="34" height="25" rx="8" fill="#F8FAFA" />
        {/* Head inner shadow top */}
        <rect x="11" y="12" width="34" height="4" rx="8" fill="rgba(0,0,0,0.03)" />

        {/* Face screen (dark green inset) */}
        <rect x="13" y="14" width="30" height="20" rx="6" fill="#054035" />
        {/* Screen ambient glow */}
        <rect x="13" y="14" width="30" height="4" rx="6" fill="rgba(0,200,120,0.07)" />

        {/* Left eye — white sclera */}
        <circle cx="21.5" cy="22" r="3.2" fill="#FFFFFF" />
        {/* Left pupil */}
        <circle cx="22.3" cy="22.8" r="1.7" fill="#00C875" />
        {/* Left eye glint */}
        <circle cx="23.2" cy="21.2" r="0.7" fill="#FFFFFF" />

        {/* Right eye — white sclera */}
        <circle cx="34.5" cy="22" r="3.2" fill="#FFFFFF" />
        {/* Right pupil */}
        <circle cx="35.3" cy="22.8" r="1.7" fill="#00C875" />
        {/* Right eye glint */}
        <circle cx="36.2" cy="21.2" r="0.7" fill="#FFFFFF" />

        {/* Smile */}
        <path d="M19.5 28.5 Q28 33.5 36.5 28.5" stroke="#00C875" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Antenna ball (gold, on top of head) */}
        <circle cx="28" cy="6.5" r="3" fill="#F5A623" />
        <circle cx="27" cy="5.5" r="1" fill="rgba(255,255,255,0.45)" />

        {/* Body / chest */}
        <rect x="15" y="38" width="26" height="16" rx="6" fill="rgba(255,255,255,0.14)" />
        <rect x="15" y="38" width="26" height="2" rx="6" fill="rgba(255,255,255,0.08)" />

        {/* Gold heart on chest */}
        <path
          d="M28,50 C28,50 20.5,45.5 20.5,42 C20.5,39.5 23,38.2 25.5,39.5 C26.5,40.2 27.3,41 28,41.8 C28.7,41 29.5,40.2 30.5,39.5 C33,38.2 35.5,39.5 35.5,42 C35.5,45.5 28,50 28,50 Z"
          fill="#F5A623"
        />
        {/* Heart glint */}
        <path d="M23 41 Q24.5 39.5 26.5 40" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" strokeLinecap="round" fill="none" />

        {/* Notification dot (red badge) */}
        {notificationDot && (
          <>
            <circle cx="43" cy="11" r="5.5" fill="#DC2626" />
            <circle cx="43" cy="11" r="5.5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
            <text x="43" y="14.2" textAnchor="middle" fontSize="6.5" fill="white" fontWeight="bold" fontFamily="system-ui">!</text>
          </>
        )}
      </g>
    </svg>
  );
}
