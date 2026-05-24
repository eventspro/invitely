import React from "react";
import type { TableShape } from "../types";

interface SeatInfo {
  seatNumber: number;
  guestId?: string;
  initials?: string;
  isSelected?: boolean;
}

interface VisualTableProps {
  shape: TableShape;
  capacity: number;
  seats?: SeatInfo[];
  onSeatClick?: (seatNumber: number) => void;
  size?: number; // width in px; height auto-scales
  compact?: boolean;
  tableColor?: string;
}

interface ChairPos {
  cx: number;
  cy: number;
  angle: number; // degrees, 0 = top
}

function getLayout(shape: TableShape): { vw: number; vh: number; tableEl: React.ReactNode } {
  switch (shape) {
    case "circle": return { vw: 200, vh: 200, tableEl: <ellipse cx={100} cy={100} rx={55} ry={55} fill="#F5F0E8" stroke="#D7B56D" strokeWidth={2} /> };
    case "oval":   return { vw: 240, vh: 180, tableEl: <ellipse cx={120} cy={90} rx={80} ry={55} fill="#F5F0E8" stroke="#D7B56D" strokeWidth={2} /> };
    case "square": return { vw: 200, vh: 200, tableEl: <rect x={50} y={50} width={100} height={100} rx={8} fill="#F5F0E8" stroke="#D7B56D" strokeWidth={2} /> };
    case "rectangle": return { vw: 260, vh: 180, tableEl: <rect x={40} y={50} width={180} height={80} rx={8} fill="#F5F0E8" stroke="#D7B56D" strokeWidth={2} /> };
    case "long": return { vw: 340, vh: 140, tableEl: <rect x={20} y={40} width={300} height={60} rx={8} fill="#F5F0E8" stroke="#D7B56D" strokeWidth={2} /> };
    case "head": return { vw: 300, vh: 120, tableEl: <rect x={20} y={35} width={260} height={55} rx={8} fill="#F5F0E8" stroke="#D7B56D" strokeWidth={2} /> };
    default: return { vw: 200, vh: 200, tableEl: <ellipse cx={100} cy={100} rx={55} ry={55} fill="#F5F0E8" stroke="#D7B56D" strokeWidth={2} /> };
  }
}

function getChairPositions(shape: TableShape, capacity: number): ChairPos[] {
  const positions: ChairPos[] = [];

  switch (shape) {
    case "circle":
    case "oval": {
      const cx = shape === "oval" ? 120 : 100;
      const cy = shape === "oval" ? 90 : 100;
      const rx = shape === "oval" ? 80 : 55;
      const ry = shape === "oval" ? 55 : 55;
      const dr = 22; // distance from table edge
      for (let i = 0; i < capacity; i++) {
        const a = (2 * Math.PI * i) / capacity - Math.PI / 2;
        positions.push({
          cx: cx + (rx + dr) * Math.cos(a),
          cy: cy + (ry + dr) * Math.sin(a),
          angle: (a * 180) / Math.PI + 90,
        });
      }
      break;
    }
    case "square": {
      // distribute on all 4 sides
      const perSide = Math.ceil(capacity / 4);
      const extra = capacity - perSide * 4;
      const sides = [perSide, perSide, perSide + Math.max(0, extra), perSide];
      // top, right, bottom, left
      const edges = [
        { x0: 50, x1: 150, y: 38, axis: "x", dir: 0 },
        { x0: 50, x1: 150, y: 162, axis: "x", dir: 0 },
        { x0: 38, x1: 38, y0: 50, y1: 150, axis: "y", dir: 90 },
        { x0: 162, x1: 162, y0: 50, y1: 150, axis: "y", dir: -90 },
      ];
      let idx = 0;
      for (let e = 0; e < 4; e++) {
        const n = sides[e];
        const edge = edges[e];
        for (let i = 0; i < n && idx < capacity; i++, idx++) {
          if (edge.axis === "x") {
            const x = edge.x0 + ((edge.x1 - edge.x0) / (n + 1)) * (i + 1);
            positions.push({ cx: x, cy: edge.y as number, angle: e === 0 ? 0 : 180 });
          } else {
            const y = (edge.y0 as number) + (((edge.y1 as number) - (edge.y0 as number)) / (n + 1)) * (i + 1);
            positions.push({ cx: edge.x0, cy: y, angle: edge.dir });
          }
        }
      }
      break;
    }
    case "rectangle": {
      const top = Math.ceil(capacity / 2);
      const bottom = capacity - top;
      for (let i = 0; i < top; i++) {
        const x = 40 + (180 / (top + 1)) * (i + 1);
        positions.push({ cx: x, cy: 35, angle: 0 });
      }
      for (let i = 0; i < bottom; i++) {
        const x = 40 + (180 / (bottom + 1)) * (i + 1);
        positions.push({ cx: x, cy: 145, angle: 180 });
      }
      break;
    }
    case "long": {
      const top = Math.ceil(capacity / 2);
      const bottom = capacity - top;
      for (let i = 0; i < top; i++) {
        const x = 20 + (300 / (top + 1)) * (i + 1);
        positions.push({ cx: x, cy: 25, angle: 0 });
      }
      for (let i = 0; i < bottom; i++) {
        const x = 20 + (300 / (bottom + 1)) * (i + 1);
        positions.push({ cx: x, cy: 115, angle: 180 });
      }
      break;
    }
    case "head": {
      // all chairs on one side (front/bottom)
      for (let i = 0; i < capacity; i++) {
        const x = 20 + (260 / (capacity + 1)) * (i + 1);
        positions.push({ cx: x, cy: 105, angle: 180 });
      }
      break;
    }
  }
  return positions;
}

export default function VisualTable({
  shape,
  capacity,
  seats = [],
  onSeatClick,
  size = 140,
  compact = false,
  tableColor,
}: VisualTableProps) {
  const { vw, vh, tableEl } = getLayout(shape);
  const chairs = getChairPositions(shape, capacity);
  const seatMap = new Map(seats.map(s => [s.seatNumber, s]));
  const chairR = compact ? 9 : 12;
  const fontSize = compact ? 7 : 9;
  const height = Math.round((size * vh) / vw);

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      width={size}
      height={height}
      style={{ overflow: "visible", display: "block", flexShrink: 0 }}
    >
      {/* drop shadow */}
      <defs>
        <filter id="tbl-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx={0} dy={2} stdDeviation={3} floodOpacity={0.12} />
        </filter>
        {tableColor && (
          <filter id="tbl-color">
            <feFlood floodColor={tableColor} floodOpacity={0.18} result="color" />
            <feComposite in="color" in2="SourceGraphic" operator="in" />
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>
        )}
      </defs>

      <g filter="url(#tbl-shadow)">
        {tableEl}
      </g>

      {chairs.map((pos, idx) => {
        const seatNum = idx + 1;
        const info = seatMap.get(seatNum);
        const occupied = !!info?.guestId;
        const selected = info?.isSelected ?? false;
        const initials = info?.initials ?? "";
        const clickable = !!onSeatClick;

        const chairFill = selected ? "#064E3B" : occupied ? "#064E3B" : "#FFFFFF";
        const chairStroke = selected ? "#003F2D" : occupied ? "#003F2D" : "#D7B56D";
        const textFill = occupied || selected ? "#FFFFFF" : compact ? "transparent" : "#9CA3AF";

        return (
          <g
            key={seatNum}
            transform={`translate(${pos.cx},${pos.cy}) rotate(${pos.angle})`}
            onClick={clickable ? (e) => { e.stopPropagation(); onSeatClick!(seatNum); } : undefined}
            style={{ cursor: clickable ? "pointer" : "default" }}
          >
            <rect
              x={-chairR}
              y={-chairR * 0.6}
              width={chairR * 2}
              height={chairR * 1.4}
              rx={compact ? 3 : 4}
              fill={chairFill}
              stroke={chairStroke}
              strokeWidth={selected ? 2 : 1.5}
            />
            {!compact && (
              <text
                x={0}
                y={chairR * 0.35}
                textAnchor="middle"
                fontSize={fontSize}
                fill={textFill}
                fontWeight={600}
                fontFamily="Inter, system-ui, sans-serif"
                transform={`rotate(${-pos.angle})`}
              >
                {occupied ? initials : String(seatNum)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
