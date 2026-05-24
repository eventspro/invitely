import { createContext, useContext, useState, type ReactNode } from "react";
import { getPlannerText, type Locale, type PlannerText } from "./plannerTextConfig";

interface PlannerLocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const PlannerLocaleContext = createContext<PlannerLocaleContextValue>({
  locale: "hy",
  setLocale: () => {},
});

export function PlannerLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem("planner-locale") as Locale | null;
    return stored === "en" || stored === "hy" ? stored : "hy";
  });

  function handleSetLocale(l: Locale) {
    setLocale(l);
    try { localStorage.setItem("planner-locale", l); } catch { /* ignore */ }
  }

  return (
    <PlannerLocaleContext.Provider value={{ locale, setLocale: handleSetLocale }}>
      {children}
    </PlannerLocaleContext.Provider>
  );
}

export function usePlannerLocale() {
  return useContext(PlannerLocaleContext);
}

export function usePlannerText(): PlannerText {
  const { locale } = usePlannerLocale();
  return getPlannerText(locale);
}

// ─── Language Switcher component ─────────────────────────────────────────────
export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = usePlannerLocale();

  const options: { value: Locale; label: string }[] = [
    { value: "hy", label: "ՀԱՅ" },
    { value: "en", label: "EN" },
  ];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#F3F4F6",
        borderRadius: 8,
        padding: 2,
        gap: 1,
      }}
      title="Switch language"
    >
      {options.map(opt => {
        const active = locale === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setLocale(opt.value)}
            style={{
              border: "none",
              borderRadius: 6,
              padding: compact ? "3px 7px" : "4px 10px",
              fontSize: compact ? 10 : 11,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.04em",
              transition: "all 0.15s",
              background: active ? "#FFFFFF" : "transparent",
              color: active ? "#064E3B" : "#9CA3AF",
              boxShadow: active ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
