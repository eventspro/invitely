/**
 * EditableElement.tsx
 * Core wrapper that marks any child as click-editable in the demo editor.
 *
 * Usage:
 *   <EditableElement path="couple.groomName" label="Groom's Name" type="text">
 *     <span>{config.couple.groomName}</span>
 *   </EditableElement>
 */
import React, { useRef, useState } from "react";
import { useDemoEditor } from "../DemoEditorContext";
import type { EditableType } from "./editableRegistry";
import { Pencil } from "lucide-react";

interface EditableElementProps {
  path: string;
  label: string;
  type: EditableType;
  children: React.ReactNode;
  className?: string;
  /** Force block display (default: inline) */
  block?: boolean;
}

export interface EditTarget {
  path: string;
  label: string;
  type: EditableType;
  anchorRect: DOMRect;
}

export default function EditableElement({ path, label, type, children, className = "", block = false }: EditableElementProps) {
  const { isClickEditMode, openEditor } = useDemoEditor();
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (!isClickEditMode) {
    return <>{children}</>;
  }

  const Tag = block ? "div" : ("span" as React.ElementType);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    openEditor({ path, label, type, anchorRect: rect });
  }

  const borderColor = hovered ? "rgba(159,18,57,0.8)" : "rgba(159,18,57,0.4)";

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`relative cursor-pointer select-none ${className}`}
      style={{
        outline: `2px solid ${borderColor}`,
        outlineOffset: "2px",
        borderRadius: "3px",
        transition: "outline-color 0.15s ease",
        display: block ? "block" : "inline",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {children}
      {hovered && (
        <span
          style={{
            position: "absolute",
            top: "-22px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(159,18,57,0.92)",
            color: "white",
            fontSize: "10px",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            letterSpacing: "0.03em",
            padding: "2px 7px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          <Pencil size={8} />
          {label}
        </span>
      )}
    </Tag>
  );
}
