/**
 * ClickEditorOverlay.tsx
 * Renders the active editor (text/image/icon) based on what element was clicked.
 * Mounts at the DemoEditorPage level, not inside the template.
 */
import { useDemoEditor } from "../DemoEditorContext";
import InlineTextEditor from "./InlineTextEditor";
import ImageEditDialog from "./ImageEditDialog";
import IconPickerDialog from "./IconPickerDialog";

export default function ClickEditorOverlay() {
  const { activeEditTarget, closeEditor } = useDemoEditor();

  if (!activeEditTarget) return null;

  const { path, label, type, anchorRect } = activeEditTarget;

  if (type === "text" || type === "textarea" || type === "button" || type === "date") {
    return (
      <InlineTextEditor
        path={path}
        label={label}
        multiline={type === "textarea"}
        anchorRect={anchorRect}
        onClose={closeEditor}
      />
    );
  }

  if (type === "image") {
    return (
      <ImageEditDialog
        path={path}
        label={label}
        anchorRect={anchorRect}
        onClose={closeEditor}
      />
    );
  }

  if (type === "icon") {
    return (
      <IconPickerDialog
        path={path}
        label={label}
        onClose={closeEditor}
      />
    );
  }

  return null;
}
