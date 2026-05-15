/**
 * Venues editor panel.
 */
import { useDemoEditor } from "../DemoEditorContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field } from "./shared/Field";
import { Plus, Trash2 } from "lucide-react";

export default function VenuesPanel() {
  const { config, updateConfig } = useDemoEditor();
  const { locations } = config;

  function updateVenue(index: number, patch: Partial<(typeof locations.venues)[0]>) {
    const updated = locations.venues.map((v, i) => (i === index ? { ...v, ...patch } : v));
    updateConfig({ locations: { ...locations, venues: updated } });
  }

  function addVenue() {
    const newVenue = {
      id: `venue-${Date.now()}`,
      title: "New Venue",
      name: "",
      description: "",
      mapButton: "Open in Maps",
      mapIcon: "🗺️",
      address: "",
      latitude: undefined,
      longitude: undefined,
      image: "",
      imagePositionX: 50,
      imagePositionY: 50,
    };
    updateConfig({ locations: { ...locations, venues: [...locations.venues, newVenue] } });
  }

  function removeVenue(index: number) {
    if (locations.venues.length <= 1) return;
    const updated = locations.venues.filter((_, i) => i !== index);
    updateConfig({ locations: { ...locations, venues: updated } });
  }

  return (
    <div className="space-y-6">
      <Field label="Section Title">
        <Input
          value={locations.sectionTitle}
          onChange={(e) => updateConfig({ locations: { ...locations, sectionTitle: e.target.value } })}
        />
      </Field>

      {locations.venues.map((venue, idx) => (
        <div key={venue.id} className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Venue {idx + 1}</h3>
            <button
              onClick={() => removeVenue(idx)}
              disabled={locations.venues.length <= 1}
              className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <Field label="Tab Label (e.g. 'Ceremony')">
            <Input value={venue.title} onChange={(e) => updateVenue(idx, { title: e.target.value })} />
          </Field>
          <Field label="Venue Name">
            <Input value={venue.name} onChange={(e) => updateVenue(idx, { name: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea rows={2} value={venue.description} onChange={(e) => updateVenue(idx, { description: e.target.value })} />
          </Field>
          <Field label="Address (optional)">
            <Input value={venue.address ?? ""} onChange={(e) => updateVenue(idx, { address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Latitude">
              <Input
                type="number"
                step="any"
                value={venue.latitude ?? ""}
                onChange={(e) => updateVenue(idx, { latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </Field>
            <Field label="Longitude">
              <Input
                type="number"
                step="any"
                value={venue.longitude ?? ""}
                onChange={(e) => updateVenue(idx, { longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </Field>
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addVenue} className="w-full gap-2">
        <Plus size={14} /> Add Venue
      </Button>
    </div>
  );
}
