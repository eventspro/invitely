import React, { useState, useEffect, FormEvent } from "react";
import { useLocation } from "wouter";
import { Heart, Mail, Lock, ArrowRight } from "lucide-react";
import { plannerText } from "../planner-prototype/plannerTextConfig";
import { usePlannerAuth } from "./usePlannerAuth";

// ─── Design tokens (match approved planner-prototype) ─────────────────────────
const BG        = "#FBFAF7";
const WHITE     = "#FFFFFF";
const PRIMARY   = "#064E3B";
const DEEP      = "#003F2D";
const GRADIENT  = "linear-gradient(135deg, #00472F 0%, #006B4A 100%)";
const SOFT      = "#EAF5EF";
const GOLD      = "#D7B56D";
const TEXT      = "#111827";
const SECONDARY = "#6B7280";
const MUTED     = "#9CA3AF";
const BORDER    = "#E5E7EB";
const DANGER    = "#E85D5D";
const DANGER_BG = "#FEF2F2";

export default function PlannerLoginPage() {
  const [, setLocation] = useLocation();
  const { authState, login } = usePlannerAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (authState.status === "authenticated") {
      setLocation("/planner");
    }
  }, [authState.status, setLocation]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    if (result.error) {
      setError(plannerText.auth.invalidLogin);
    }
    // On success, the useEffect above will redirect to /planner
    setLoading(false);
  }

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  // ─── Shared input style ──────────────────────────────────────────────────
  const inputWrap: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 52,
    paddingLeft: 44,
    paddingRight: 16,
    borderRadius: 12,
    border: `1.5px solid ${error ? DANGER : BORDER}`,
    fontSize: 15,
    color: TEXT,
    background: WHITE,
    outline: "none",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: 14,
    color: MUTED,
    pointerEvents: "none",
    display: "flex",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: TEXT,
    marginBottom: 7,
    display: "block",
    fontFamily: "Inter, -apple-system, sans-serif",
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: WHITE,
          borderRadius: 24,
          boxShadow: "0 8px 40px rgba(17, 24, 39, 0.10)",
          overflow: "hidden",
        }}
      >
        {/* Header strip */}
        <div
          style={{
            background: GRADIENT,
            padding: "28px 32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Heart size={26} color={GOLD} fill={GOLD} />
          </div>

          {/* Brand name */}
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {plannerText.app.name}
          </div>
        </div>

        {/* Form area */}
        <div style={{ padding: "28px 32px 32px" }}>
          {/* Title + subtitle */}
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: TEXT,
                margin: 0,
                marginBottom: 8,
                lineHeight: 1.3,
              }}
            >
              {plannerText.auth.signInTitle}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: SECONDARY,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {plannerText.auth.signInSubtitle}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              style={{
                background: DANGER_BG,
                border: `1.5px solid ${DANGER}`,
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                color: DANGER,
                fontWeight: 500,
                marginBottom: 18,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{plannerText.auth.email}</label>
              <div style={inputWrap}>
                <span style={iconStyle}><Mail size={17} /></span>
                <input
                  type="email"
                  style={inputStyle}
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  autoComplete="email"
                  autoFocus
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>{plannerText.auth.password}</label>
              <div style={inputWrap}>
                <span style={iconStyle}><Lock size={17} /></span>
                <input
                  type="password"
                  style={inputStyle}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 14,
                border: "none",
                background: canSubmit ? GRADIENT : BORDER,
                color: canSubmit ? WHITE : MUTED,
                fontSize: 15,
                fontWeight: 700,
                cursor: canSubmit ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background 0.15s",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {loading ? plannerText.auth.signingIn : (
                <>
                  {plannerText.auth.signIn}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Contact support */}
          <div
            style={{
              marginTop: 20,
              textAlign: "center",
              fontSize: 13,
              color: MUTED,
            }}
          >
            {plannerText.auth.contactSupport}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div
        style={{
          marginTop: 20,
          fontSize: 12,
          color: MUTED,
          textAlign: "center",
        }}
      >
        {plannerText.app.name} &mdash; 4ever.am
      </div>
    </div>
  );
}
