/**
 * IconPickerDialog.tsx
 * Curated set of elegant wedding SVG icons for the demo editor.
 */
import { useDemoEditor } from "../DemoEditorContext";
import { X } from "lucide-react";

interface IconPickerDialogProps {
  path: string;
  label: string;
  onClose: () => void;
}

const WEDDING_ICONS: { id: string; label: string; svg: string }[] = [
  { id: "heart",    label: "Heart",    svg: "♥" },
  { id: "rings",    label: "Rings",    svg: "💍" },
  { id: "calendar", label: "Calendar", svg: "📅" },
  { id: "pin",      label: "Location", svg: "📍" },
  { id: "church",   label: "Ceremony", svg: "⛪" },
  { id: "toast",    label: "Toast",    svg: "🥂" },
  { id: "music",    label: "Music",    svg: "🎵" },
  { id: "camera",   label: "Camera",   svg: "📷" },
  { id: "dinner",   label: "Dinner",   svg: "🍽️" },
  { id: "dress",    label: "Attire",   svg: "👗" },
  { id: "gift",     label: "Gift",     svg: "🎁" },
  { id: "flower",   label: "Flower",   svg: "💐" },
  { id: "dove",     label: "Dove",     svg: "🕊️" },
  { id: "star",     label: "Star",     svg: "⭐" },
  { id: "moon",     label: "Moon",     svg: "🌙" },
  { id: "infinity", label: "Forever",  svg: "∞" },
  { id: "sparkle",  label: "Sparkle",  svg: "✨" },
  { id: "clock",    label: "Time",     svg: "🕐" },
  { id: "envelope", label: "Invite",   svg: "✉️" },
  { id: "ribbon",   label: "Ribbon",   svg: "🎀" },
];

export default function IconPickerDialog({ path, label, onClose }: IconPickerDialogProps) {
  const { updateConfigByPath } = useDemoEditor();

  function handleSelect(svg: string) {
    updateConfigByPath(path, svg);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-[99998] bg-black/40" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[99999] bg-white rounded-2xl shadow-2xl p-5 max-w-sm mx-auto sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {WEDDING_ICONS.map((icon) => (
            <button
              key={icon.id}
              onClick={() => handleSelect(icon.svg)}
              title={icon.label}
              className="flex flex-col items-center gap-1 p-2 rounded-xl border border-gray-100 hover:border-rose-300 hover:bg-rose-50 transition-all text-center"
            >
              <span className="text-2xl leading-none">{icon.svg}</span>
              <span className="text-[9px] text-gray-400 truncate w-full text-center">{icon.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
