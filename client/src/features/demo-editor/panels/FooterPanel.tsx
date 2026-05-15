/**
 * Footer editor panel.
 */
import { useDemoEditor } from "../DemoEditorContext";
import { Input } from "@/components/ui/input";
import { Field } from "./shared/Field";

export default function FooterPanel() {
  const { config, updateConfig } = useDemoEditor();
  const { footer, navigation } = config;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Footer</h3>
        <Field label="Thank You Message">
          <Input
            value={footer.thankYouMessage}
            onChange={(e) => updateConfig({ footer: { ...footer, thankYouMessage: e.target.value } })}
          />
        </Field>
        <Field label="Separator symbol between names (e.g. 💕, ∞, &)">
          <Input
            value={footer.separator ?? "💕"}
            onChange={(e) => updateConfig({ footer: { ...footer, separator: e.target.value } })}
            className="w-20"
          />
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Navigation Labels</h3>
        {(
          [
            { key: "home", label: "Home" },
            { key: "countdown", label: "Countdown" },
            { key: "calendar", label: "Calendar" },
            { key: "locations", label: "Venues" },
            { key: "timeline", label: "Schedule" },
            { key: "rsvp", label: "RSVP" },
            { key: "photos", label: "Photos" },
          ] as const
        ).map(({ key, label }) => (
          <Field key={key} label={label}>
            <Input
              value={navigation[key]}
              onChange={(e) => updateConfig({ navigation: { ...navigation, [key]: e.target.value } })}
            />
          </Field>
        ))}
      </section>
    </div>
  );
}
