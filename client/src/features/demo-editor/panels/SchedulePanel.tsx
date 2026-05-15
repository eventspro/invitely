/**
 * Schedule / timeline editor panel.
 */
import { useDemoEditor } from "../DemoEditorContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field } from "./shared/Field";
import { Plus, Trash2, GripVertical } from "lucide-react";

export default function SchedulePanel() {
  const { config, updateConfig } = useDemoEditor();
  const { timeline } = config;

  function updateEvent(index: number, patch: Partial<(typeof timeline.events)[0]>) {
    const updated = timeline.events.map((e, i) => (i === index ? { ...e, ...patch } : e));
    updateConfig({ timeline: { ...timeline, events: updated } });
  }

  function addEvent() {
    const newEvent = { id: `evt-${Date.now()}`, time: "", title: "", description: "" };
    updateConfig({ timeline: { ...timeline, events: [...timeline.events, newEvent] } });
  }

  function removeEvent(index: number) {
    if (timeline.events.length <= 1) return;
    const updated = timeline.events.filter((_, i) => i !== index);
    updateConfig({ timeline: { ...timeline, events: updated } });
  }

  return (
    <div className="space-y-5">
      <Field label="Section Title">
        <Input
          value={timeline.title}
          onChange={(e) => updateConfig({ timeline: { ...timeline, title: e.target.value } })}
        />
      </Field>

      <div className="space-y-3">
        {timeline.events.map((evt, idx) => (
          <div key={evt.id ?? idx} className="rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <GripVertical size={14} className="text-gray-300 shrink-0" />
              <span className="text-xs font-medium text-gray-500 flex-1">Event {idx + 1}</span>
              <button
                onClick={() => removeEvent(idx)}
                disabled={timeline.events.length <= 1}
                className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Time">
                <Input value={evt.time} onChange={(e) => updateEvent(idx, { time: e.target.value })} />
              </Field>
              <div className="col-span-2">
                <Field label="Title">
                  <Input value={evt.title} onChange={(e) => updateEvent(idx, { title: e.target.value })} />
                </Field>
              </div>
            </div>
            <Field label="Description (optional)">
              <Input value={evt.description ?? ""} onChange={(e) => updateEvent(idx, { description: e.target.value })} />
            </Field>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addEvent} className="w-full gap-2">
        <Plus size={14} /> Add Event
      </Button>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Closing Message</h3>
        <Field label="Thank You Line">
          <Input
            value={timeline.afterMessage.thankYou}
            onChange={(e) =>
              updateConfig({ timeline: { ...timeline, afterMessage: { ...timeline.afterMessage, thankYou: e.target.value } } })
            }
          />
        </Field>
        <Field label="Notes / Reminders">
          <Textarea
            rows={3}
            value={timeline.afterMessage.notes}
            onChange={(e) =>
              updateConfig({ timeline: { ...timeline, afterMessage: { ...timeline.afterMessage, notes: e.target.value } } })
            }
          />
        </Field>
      </section>
    </div>
  );
}
