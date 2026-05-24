/**
 * /demo/david-rose-romantic
 * Auto-starts the demo session and redirects to the editor immediately.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function DemoLandingPage() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const res = await fetch("/api/demo/customer-edits", { method: "POST" });
        if (!res.ok) throw new Error("Failed to start demo.");
        const data = await res.json() as { editId: string };
        if (!cancelled) navigate(`/demo/david-rose-romantic/edit/${data.editId}`);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    }
    start();
    return () => { cancelled = true; };
  }, [navigate]);

  if (error) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#faf8f4", fontFamily: "Inter, sans-serif" }}>
        <p style={{ color: "#9f1239", fontSize: 14 }}>{error}</p>
        <button
          onClick={() => { setError(null); window.location.reload(); }}
          style={{ padding: "10px 24px", borderRadius: 12, background: "#9f1239", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#faf8f4" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #f3d6dc", borderTopColor: "#9f1239", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

