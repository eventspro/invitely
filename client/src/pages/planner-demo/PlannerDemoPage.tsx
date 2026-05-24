import { useState } from "react";
import PlannerPrototypePage from "../planner-prototype/PlannerPrototypePage";
import ContactRequestModal from "./ContactRequestModal";

export const DEMO_LIMITS = { maxGuests: 5, maxTables: 2, maxBudgetItems: 5 };

export default function PlannerDemoPage() {
  const [modalFeature, setModalFeature] = useState<string | null>(null);

  return (
    <>
      <PlannerPrototypePage
        isDemoMode
        demoLimits={DEMO_LIMITS}
        onDemoLimitReached={feature => setModalFeature(feature)}
      />
      {modalFeature !== null && (
        <ContactRequestModal
          feature={modalFeature}
          onClose={() => setModalFeature(null)}
        />
      )}
    </>
  );
}
