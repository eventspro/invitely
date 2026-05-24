import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";

const FEATURE_MESSAGES: Record<string, { title: string; subtitle: string }> = {
  guests: {
    title: "Unlock Full Access",
    subtitle: "You've reached the 5-guest demo limit. The full planner supports unlimited guests.",
  },
  tables: {
    title: "Unlock Full Access",
    subtitle: "You've reached the 2-table demo limit. The full planner supports unlimited tables.",
  },
  budget: {
    title: "Unlock Full Access",
    subtitle: "You've reached the 5-item budget demo limit. The full planner has no budget item limits.",
  },
  seats: {
    title: "Unlock Full Access",
    subtitle: "Seat assignment is available in the full version. Get in touch to upgrade.",
  },
  more: {
    title: "Unlock Full Access",
    subtitle: "Export, import and advanced settings are available in the full version.",
  },
};

interface Props {
  feature?: string;
  onClose: () => void;
}

type State = "form" | "submitting" | "success" | "error";

export default function ContactRequestModal({ feature = "more", onClose }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [callbackRequested, setCallbackRequested] = useState(false);
  const [state, setState] = useState<State>("form");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const { title, subtitle } = FEATURE_MESSAGES[feature] ?? FEATURE_MESSAGES.more;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setState("submitting");
    try {
      const res = await fetch("/api/planner-demo/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), message: message.trim(), callbackRequested, feature }),
      });
      if (!res.ok) throw new Error("Server error");
      setState("success");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setState("error");
    }
  }

  return (
    <div
      onClick={state !== "submitting" ? onClose : undefined}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(5,12,8,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420,
          background: "linear-gradient(145deg, #0d1e14 0%, #0f2d22 100%)",
          borderRadius: 20,
          border: "1px solid rgba(216,182,106,0.25)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#d8b66a", marginBottom: 6 }}>
              PLANNER DEMO
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff8ef", lineHeight: 1.3 }}>
              {title}
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
              {subtitle}
            </p>
          </div>
          {state !== "submitting" && (
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "rgba(255,255,255,0.5)", marginLeft: 12, flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ margin: "18px 24px", height: 1, background: "rgba(216,182,106,0.15)" }} />

        {state === "success" ? (
          <div style={{ padding: "8px 24px 28px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(216,182,106,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Check size={24} color="#d8b66a" />
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#fff8ef" }}>Thank you!</p>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>We'll be in touch soon.</p>
            <button
              onClick={onClose}
              style={{ marginTop: 24, padding: "10px 28px", borderRadius: 12, background: "linear-gradient(135deg, #d8b66a, #c9a030)", color: "#0e1e15", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: 5, letterSpacing: "0.06em" }}>
                NAME *
              </label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                disabled={state === "submitting"}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: "1.5px solid rgba(216,182,106,0.25)",
                  color: "#fff8ef", fontSize: 14, outline: "none",
                  transition: "border-color 0.2s",
                }}
                className="crm-input"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: 5, letterSpacing: "0.06em" }}>
                PHONE *
              </label>
              <input
                required
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+374 XX XXX XXX"
                disabled={state === "submitting"}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: "1.5px solid rgba(216,182,106,0.25)",
                  color: "#fff8ef", fontSize: 14, outline: "none",
                }}
                className="crm-input"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: 5, letterSpacing: "0.06em" }}>
                MESSAGE (optional)
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Any questions or notes..."
                rows={3}
                disabled={state === "submitting"}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: "1.5px solid rgba(216,182,106,0.25)",
                  color: "#fff8ef", fontSize: 14, outline: "none",
                  resize: "none",
                }}
                className="crm-input"
              />
            </div>

            {/* Callback checkbox */}
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <div
                onClick={() => setCallbackRequested(v => !v)}
                style={{
                  width: 18, height: 18, borderRadius: 5,
                  border: `2px solid ${callbackRequested ? "#d8b66a" : "rgba(216,182,106,0.3)"}`,
                  background: callbackRequested ? "rgba(216,182,106,0.2)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.15s",
                }}
              >
                {callbackRequested && <Check size={11} color="#d8b66a" strokeWidth={3} />}
              </div>
              <input
                type="checkbox"
                checked={callbackRequested}
                onChange={e => setCallbackRequested(e.target.checked)}
                style={{ display: "none" }}
              />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>Please call me back</span>
            </label>

            {state === "error" && (
              <p style={{ margin: 0, fontSize: 12, color: "#f87171" }}>{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={state === "submitting" || !name.trim() || !phone.trim()}
              style={{
                marginTop: 4,
                padding: "12px 0", borderRadius: 12,
                background: state === "submitting" || !name.trim() || !phone.trim()
                  ? "rgba(216,182,106,0.3)"
                  : "linear-gradient(135deg, #d8b66a, #c9a030)",
                color: "#0e1e15",
                border: "none",
                cursor: state === "submitting" || !name.trim() || !phone.trim() ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 700,
                transition: "background 0.2s",
              }}
            >
              {state === "submitting" ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}

        <style>{`.crm-input::placeholder{color:rgba(255,255,255,0.28)!important}.crm-input:focus{border-color:rgba(216,182,106,0.6)!important}`}</style>
      </div>
    </div>
  );
}
