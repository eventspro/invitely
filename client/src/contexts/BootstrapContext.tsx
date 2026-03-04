/**
 * BootstrapContext — provides pre-fetched startup data to any component in the tree.
 * All data here was resolved BEFORE the app was rendered (in main.tsx bootstrap).
 * Consumers can use this to skip their own on-mount network requests.
 */
import { createContext, useContext, ReactNode } from "react";
import type { BootstrapData } from "@/App";

const BootstrapContext = createContext<BootstrapData | null>(null);

export function BootstrapProvider({
  data,
  children,
}: {
  data: BootstrapData;
  children: ReactNode;
}) {
  return (
    <BootstrapContext.Provider value={data}>{children}</BootstrapContext.Provider>
  );
}

/** Returns the full bootstrap payload. Always non-null — app doesn't render without it. */
export function useBootstrap(): BootstrapData {
  const ctx = useContext(BootstrapContext);
  if (!ctx) throw new Error("useBootstrap must be used inside BootstrapProvider");
  return ctx;
}
