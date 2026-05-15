/**
 * Gallery / photos editor panel.
 * Uses FileReader for local preview – no uploads to server.
 */
import { useRef } from "react";
import { useDemoEditor } from "../DemoEditorContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "./shared/Field";
import { Plus, Trash2, Upload } from "lucide-react";

export default function GalleryPanel() {
  const { config, updateConfig } = useDemoEditor();
  const { photos } = config;
  const fileRef = useRef<HTMLInputElement>(null);

  function addLocalImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const existing = photos.galleryImages ?? [];
      updateConfig({ photos: { ...photos, galleryImages: [...existing, dataUrl] } });
    };
    reader.readAsDataURL(file);
  }

  function removeGalleryImage(index: number) {
    const updated = (photos.galleryImages ?? []).filter((_, i) => i !== index);
    updateConfig({ photos: { ...photos, galleryImages: updated } });
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach(addLocalImage);
    // Reset so same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Section Text</h3>
        <Field label="Title">
          <Input value={photos.title} onChange={(e) => updateConfig({ photos: { ...photos, title: e.target.value } })} />
        </Field>
        <Field label="Description">
          <Input value={photos.description} onChange={(e) => updateConfig({ photos: { ...photos, description: e.target.value } })} />
        </Field>
        <Field label="'Photos coming soon' placeholder text">
          <Input
            value={photos.comingSoonMessage}
            onChange={(e) => updateConfig({ photos: { ...photos, comingSoonMessage: e.target.value } })}
          />
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Demo Gallery Images</h3>
        <p className="text-xs text-gray-400">
          Upload local images to preview the gallery. These are stored only in your browser and won't be sent anywhere.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2 w-full">
          <Upload size={14} /> Upload Photos (local preview)
        </Button>

        {(photos.galleryImages ?? []).length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {(photos.galleryImages ?? []).map((src, i) => (
              <div key={i} className="relative group rounded-md overflow-hidden border border-gray-200 aspect-square">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeGalleryImage(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
