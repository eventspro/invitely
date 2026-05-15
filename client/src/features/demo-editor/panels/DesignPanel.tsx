/**
 * Design editor panel – color palette & typography.
 */
import { useDemoEditor } from "../DemoEditorContext";
import { PALETTE_PRESETS } from "../demoConfig";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function DesignPanel() {
  const { config, updateConfig } = useDemoEditor();
  const colors = config.theme?.colors ?? {};
  const fonts = config.theme?.fonts ?? {};

  function applyPreset(presetId: string) {
    const preset = PALETTE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    updateConfig({ theme: { colors: preset.colors } });
  }

  function setColor(key: keyof typeof colors, value: string) {
    updateConfig({ theme: { colors: { ...colors, [key]: value } } });
  }

  return (
    <div className="space-y-6">
      {/* Palette presets */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Color Palette</h3>
        <div className="grid grid-cols-3 gap-2">
          {PALETTE_PRESETS.map((preset) => {
            const isActive = colors.primary === preset.colors.primary;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                  isActive ? "border-rose-600 ring-2 ring-rose-300" : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="flex h-8">
                  <div className="flex-1" style={{ backgroundColor: preset.colors.primary }} />
                  <div className="flex-1" style={{ backgroundColor: preset.colors.secondary }} />
                  <div className="flex-1" style={{ backgroundColor: preset.colors.background }} />
                </div>
                <span className="block text-xs py-1 text-center text-gray-600">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Custom colors */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Custom Colors</h3>
        <div className="space-y-3">
          {(
            [
              { key: "primary", label: "Primary" },
              { key: "secondary", label: "Secondary" },
              { key: "accent", label: "Accent" },
              { key: "background", label: "Background" },
              { key: "textColor", label: "Text" },
              { key: "buttonColor", label: "Button" },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <input
                type="color"
                value={(colors as Record<string, string>)[key] ?? "#000000"}
                onChange={(e) => setColor(key, e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-gray-200 p-0.5"
              />
              <Label className="flex-1 text-sm">{label}</Label>
              <Input
                value={(colors as Record<string, string>)[key] ?? ""}
                onChange={(e) => setColor(key, e.target.value)}
                className="w-28 font-mono text-xs"
                maxLength={9}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Typography</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Heading Font</Label>
            <select
              value={fonts.heading ?? "Playfair Display, serif"}
              onChange={(e) => updateConfig({ theme: { fonts: { ...fonts, heading: e.target.value } } })}
              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
            >
              <option value="Playfair Display, serif">Playfair Display (Elegant)</option>
              <option value="Cormorant Garamond, serif">Cormorant Garamond (Classic)</option>
              <option value="Great Vibes, cursive">Great Vibes (Script)</option>
              <option value="Cinzel, serif">Cinzel (Formal)</option>
              <option value="Lora, serif">Lora (Traditional)</option>
              <option value="Montserrat, sans-serif">Montserrat (Modern)</option>
            </select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Body Font</Label>
            <select
              value={fonts.body ?? "Inter, sans-serif"}
              onChange={(e) => updateConfig({ theme: { fonts: { ...fonts, body: e.target.value } } })}
              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
            >
              <option value="Inter, sans-serif">Inter (Clean)</option>
              <option value="Raleway, sans-serif">Raleway (Stylish)</option>
              <option value="Lato, sans-serif">Lato (Friendly)</option>
              <option value="Open Sans, sans-serif">Open Sans (Readable)</option>
              <option value="Nunito, sans-serif">Nunito (Soft)</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
