/** Shared labeled field wrapper */
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface FieldProps {
  label: string;
  children: ReactNode;
  description?: string;
}

export function Field({ label, children, description }: FieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-gray-600">{label}</Label>
      {children}
      {description && <p className="text-xs text-gray-400">{description}</p>}
    </div>
  );
}
