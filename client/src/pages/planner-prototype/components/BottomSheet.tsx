import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: "auto" | "tall" | "full";
}

export default function BottomSheet({ open, onClose, title, children, height = "tall" }: BottomSheetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const maxH = height === "full" ? "100dvh" : height === "tall" ? "90dvh" : "70dvh";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(17,24,39,0.4)",
          backdropFilter: "blur(2px)",
        }}
      />
      {/* sheet */}
      <div
        ref={ref}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 640,
          marginLeft: "auto",
          marginRight: "auto",
          background: "#FFFFFF",
          borderRadius: "24px 24px 0 0",
          maxHeight: maxH,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(17,24,39,0.14)",
          animation: "sheetSlideUp 0.22s ease",
        }}
      >
        <style>{`@keyframes sheetSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        {/* handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E5E7EB" }} />
        </div>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 10px" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</span>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, color: "#6B7280", display: "flex", alignItems: "center" }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
