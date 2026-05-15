/**
 * RSVP text editor panel.
 */
import { useDemoEditor } from "../DemoEditorContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "./shared/Field";

export default function RsvpPanel() {
  const { config, updateConfig } = useDemoEditor();
  const { rsvp } = config;

  function setForm(key: keyof typeof rsvp.form, value: string) {
    updateConfig({ rsvp: { ...rsvp, form: { ...rsvp.form, [key]: value } } });
  }

  function setMessage(key: keyof typeof rsvp.messages, value: string) {
    updateConfig({ rsvp: { ...rsvp, messages: { ...rsvp.messages, [key]: value } } });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Section Header</h3>
        <Field label="Title">
          <Input value={rsvp.title} onChange={(e) => updateConfig({ rsvp: { ...rsvp, title: e.target.value } })} />
        </Field>
        <Field label="Description">
          <Textarea rows={2} value={rsvp.description} onChange={(e) => updateConfig({ rsvp: { ...rsvp, description: e.target.value } })} />
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Form Labels</h3>
        {(
          [
            { key: "firstName", label: "First Name label" },
            { key: "lastName", label: "Last Name label" },
            { key: "email", label: "Email label" },
            { key: "guestCount", label: "Guest Count label" },
            { key: "attendance", label: "Attendance label" },
            { key: "attendingYes", label: "'Attending' option text" },
            { key: "attendingNo", label: "'Declining' option text" },
            { key: "submitButton", label: "Submit button text" },
          ] as const
        ).map(({ key, label }) => (
          <Field key={key} label={label}>
            <Input value={rsvp.form[key]} onChange={(e) => setForm(key, e.target.value)} />
          </Field>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Messages</h3>
        <Field label="Success message">
          <Input value={rsvp.messages.success} onChange={(e) => setMessage("success", e.target.value)} />
        </Field>
        <Field label="Error message">
          <Input value={rsvp.messages.error} onChange={(e) => setMessage("error", e.target.value)} />
        </Field>
      </section>
    </div>
  );
}
