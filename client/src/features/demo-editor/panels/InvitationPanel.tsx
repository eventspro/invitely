/**
 * Invitation panel – couple names, date, hero text.
 */
import { useDemoEditor } from "../DemoEditorContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "./shared/Field";

export default function InvitationPanel() {
  const { config, updateConfig } = useDemoEditor();
  const { couple, wedding, hero } = config;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Couple</h3>
        <div className="space-y-3">
          <Field label="Groom's Name">
            <Input
              value={couple.groomName}
              onChange={(e) =>
                updateConfig({
                  couple: { ...couple, groomName: e.target.value, combinedNames: `${e.target.value} & ${couple.brideName}` },
                })
              }
            />
          </Field>
          <Field label="Bride's Name">
            <Input
              value={couple.brideName}
              onChange={(e) =>
                updateConfig({
                  couple: { ...couple, brideName: e.target.value, combinedNames: `${couple.groomName} & ${e.target.value}` },
                })
              }
            />
          </Field>
          <Field label="Combined Names (displayed in header)">
            <Input
              value={couple.combinedNames}
              onChange={(e) => updateConfig({ couple: { ...couple, combinedNames: e.target.value } })}
            />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Wedding Date</h3>
        <div className="space-y-3">
          <Field label="Date">
            <Input
              type="datetime-local"
              value={wedding.date.slice(0, 16)}
              onChange={(e) => updateConfig({ wedding: { ...wedding, date: e.target.value + ":00" } })}
            />
          </Field>
          <Field label="Displayed Date (e.g. October 11, 2025)">
            <Input
              value={wedding.displayDate}
              onChange={(e) => updateConfig({ wedding: { ...wedding, displayDate: e.target.value } })}
            />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Hero Text</h3>
        <div className="space-y-3">
          <Field label="Invitation Line">
            <Input
              value={hero.invitation}
              onChange={(e) => updateConfig({ hero: { ...hero, invitation: e.target.value } })}
            />
          </Field>
          <Field label="Welcome Message">
            <Textarea
              value={hero.welcomeMessage}
              rows={2}
              onChange={(e) => updateConfig({ hero: { ...hero, welcomeMessage: e.target.value } })}
            />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Countdown</h3>
        <Field label="Subtitle (e.g. 'Until our wedding day')">
          <Input
            value={config.countdown.subtitle}
            onChange={(e) => updateConfig({ countdown: { ...config.countdown, subtitle: e.target.value } })}
          />
        </Field>
      </section>
    </div>
  );
}
