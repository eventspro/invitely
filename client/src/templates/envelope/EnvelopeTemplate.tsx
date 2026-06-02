/**
 * Envelope Romance — v4 Premium Mobile-First Wedding Template
 *
 * Mobile 390px is the primary design target.
 * 11 sections. Real images everywhere. Luxury premium feel.
 * Zero Tailwind. Scoped <style> only.
 */

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { MapPin, Clock, Wine, Sparkles, Camera, Music, Heart, Star, Users } from "lucide-react";
import { insertRsvpSchema, type InsertRsvp } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { WeddingConfig } from "../types";
import { defaultConfig } from "./config";

// ── Confirmed-working image URLs (same source as Aurelia template) ─────────────
const HERO_IMG =
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop";
const SCHEDULE_PHOTO =
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&q=80&auto=format&fit=crop";

const GALLERY_DEFAULTS = [
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80&auto=format&fit=crop",
];

const STORY_DEFAULTS = [
  {
    year: "2018", title: "First Meeting",
    text: "A serendipitous introduction that sparked something beautiful.",
    img: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=500&q=80&auto=format&fit=crop",
  },
  {
    year: "2022", title: "Falling in Love",
    text: "Adventures across continents and quiet evenings at home.",
    img: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=500&q=80&auto=format&fit=crop",
  },
  {
    year: "2026", title: "Forever Begins",
    text: "The beginning of our greatest chapter, surrounded by those we love.",
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80&auto=format&fit=crop",
  },
];

const JOURNEY_DEFAULTS = [
  { time: "4:00 PM", title: "Ceremony",    venue: "Grand Estate Chapel",
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80&auto=format&fit=crop" },
  { time: "5:30 PM", title: "Photoshoot", venue: "Garden & Terrace",
    img: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=400&q=80&auto=format&fit=crop" },
  { time: "7:00 PM", title: "Reception",  venue: "The Grand Ballroom",
    img: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80&auto=format&fit=crop" },
  { time: "9:00 PM", title: "After Party", venue: "The Sky Lounge",
    img: "https://images.unsplash.com/photo-1585007600263-71228e40c8d1?w=400&q=80&auto=format&fit=crop" },
];

const SCHEDULE_DEFAULTS = [
  { time: "3:30 PM", title: "Welcome Drinks",  icon: "wine" },
  { time: "4:00 PM", title: "Ceremony",         icon: "heart" },
  { time: "5:00 PM", title: "Photography",      icon: "camera" },
  { time: "7:00 PM", title: "Dinner",           icon: "star" },
  { time: "8:30 PM", title: "First Dance",      icon: "music" },
  { time: "9:00 PM", title: "Evening Party",    icon: "sparkles" },
];

const DRESS_COLORS_DEFAULT = ["#F5F0E8", "#C9A45C", "#173D2F", "#2C2218", "#E8D5B7"];

// ── Scoped CSS ─────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap');

.envr-root {
  font-family: 'Inter', system-ui, sans-serif;
  background: #FAF7F2;
  overflow-x: hidden;
  color: #2C1A0E;
}
.envr-root *, .envr-root *::before, .envr-root *::after { box-sizing: border-box; }

/* ── Envelope Screen ─────────────────────────────────────────────────────── */
.envr-screen {
  min-height: 100dvh;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #F9F4EC 0%, #F0E6D3 45%, #E8D9C0 100%);
  padding: 40px 18px 32px;
  position: relative;
  overflow: hidden;
}
.envr-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 20% 80%, rgba(201,164,92,0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(23,61,47,0.05) 0%, transparent 60%);
  pointer-events: none;
}

/* ── Envelope box ──────────────────────────────────────────────────────────── */
.envr-env-box {
  perspective: 900px;
  width: min(330px, calc(100vw - 60px));
  height: 215px;
  position: relative;
  margin: 0 auto 36px;
  filter: drop-shadow(0 24px 52px rgba(65,45,20,0.28)) drop-shadow(0 4px 12px rgba(65,45,20,0.12));
  cursor: pointer;
}
.envr-env-body {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #EEE4D2 0%, #E0CEB4 100%);
  border-radius: 3px 3px 8px 8px;
  overflow: hidden;
}
/* Diagonal fold lines on body back */
.envr-env-body::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, transparent calc(50% - 0.5px), rgba(160,130,90,0.18) 50%, transparent calc(50% + 0.5px)),
    linear-gradient(225deg, transparent calc(50% - 0.5px), rgba(160,130,90,0.18) 50%, transparent calc(50% + 0.5px));
}
/* Bottom flap triangle */
.envr-env-flap-bottom {
  position: absolute;
  bottom: 0; left: 0;
  width: 100%; height: 55%;
  clip-path: polygon(0 100%, 50% 10%, 100% 100%);
  background: linear-gradient(170deg, #DDD0BC 0%, #C8B89A 100%);
  z-index: 2;
}
/* Left side flap */
.envr-env-flap-left {
  position: absolute;
  top: 0; left: 0;
  width: 52%; height: 100%;
  clip-path: polygon(0 0, 100% 52%, 0 100%);
  background: linear-gradient(130deg, #E6D8C4 0%, #D4C2A8 100%);
  z-index: 3;
}
/* Right side flap */
.envr-env-flap-right {
  position: absolute;
  top: 0; right: 0;
  width: 52%; height: 100%;
  clip-path: polygon(100% 0, 0 52%, 100% 100%);
  background: linear-gradient(230deg, #E6D8C4 0%, #D4C2A8 100%);
  z-index: 3;
}
/* Inner card rising up */
.envr-env-inner-card {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%) translateY(0);
  width: 76%;
  height: 74%;
  background: #fff;
  border-radius: 2px;
  overflow: hidden;
  z-index: 4;
  transition: transform 1.4s cubic-bezier(0.34, 1.08, 0.64, 1) 1.0s;
  box-shadow: 0 2px 16px rgba(0,0,0,0.18);
}
.envr-env-inner-card.revealing {
  transform: translateX(-50%) translateY(-58%);
}
/* Top flap (rotates open) */
.envr-env-flap-top {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 60%;
  clip-path: polygon(0 0, 100% 0, 50% 72%);
  background: linear-gradient(170deg, #EAD9C3 0%, #D8C5A6 50%, #CCB898 100%);
  transform-origin: 50% 0%;
  transform-style: preserve-3d;
  transition: transform 1.3s cubic-bezier(0.4, 0, 0.2, 1) 0.25s;
  z-index: 6;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
}
.envr-env-flap-top.open {
  transform: rotateX(178deg);
  z-index: 1;
}
/* Wax seal */
.envr-env-seal {
  position: absolute;
  width: 54px; height: 54px;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, #E0C070 0%, #B89028 45%, #8A6010 100%);
  border: 2px solid rgba(255,220,110,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s;
  box-shadow: 0 3px 14px rgba(100,60,0,0.38), inset 0 1px 3px rgba(255,220,100,0.28);
}
.envr-env-seal.gone {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.7) rotate(-8deg);
}

/* ── Scroll reveal ────────────────────────────────────────────────────────── */
@keyframes envr-fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes envr-float {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}

/* ── Layout ──────────────────────────────────────────────────────────────── */
.envr-section {
  padding: 60px 18px;
  background: #FAF7F2;
  position: relative;
}
.envr-section--alt  { background: linear-gradient(160deg, #F4EEE5 0%, #EDE5D6 100%); }
.envr-section--green { background: #173D2F; }
.envr-inner {
  max-width: 540px;
  margin: 0 auto;
}

/* ── Typography ──────────────────────────────────────────────────────────── */
.envr-eyebrow {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #C9A45C;
  margin: 0 0 8px;
  display: block;
}
.envr-h2 {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(28px, 7vw, 38px);
  font-weight: 400;
  color: #1A1A18;
  line-height: 1.18;
  margin: 0 0 24px;
}
.envr-h2--sm {
  font-size: clamp(24px, 6vw, 32px);
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
.envr-hero-card {
  width: calc(100vw - 36px);
  max-width: 540px;
  height: 420px;
  border-radius: 32px;
  overflow: hidden;
  position: relative;
  background: #1A1208;
  box-shadow: 0 24px 64px rgba(65,45,20,0.28), 0 4px 20px rgba(0,0,0,0.16);
  margin: 0 auto;
}
.envr-hero-card img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.envr-hero-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 32px 24px 24px;
  background: linear-gradient(0deg, rgba(8,18,10,0.9) 0%, rgba(8,18,10,0.45) 65%, transparent 100%);
}
.envr-hero-names {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(34px, 10vw, 46px);
  font-weight: 400;
  color: #FFF8EE;
  line-height: 1.1;
  margin: 0 0 6px;
}
.envr-hero-meta {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,248,238,0.65);
  margin: 0 0 18px;
}
.envr-hero-btn {
  display: inline-block;
  padding: 11px 26px;
  background: linear-gradient(135deg, #C9A45C, #A87830);
  color: #0D1A0E;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(180,130,40,0.38);
  text-decoration: none;
}
.envr-scroll-hint {
  text-align: center;
  margin-top: 18px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: rgba(74,55,40,0.4);
  animation: envr-float 2.6s ease-in-out infinite;
}

/* ── Countdown ──────────────────────────────────────────────────────────── */
.envr-cd-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
}
.envr-cd-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 20px 12px 16px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(65,45,20,0.08);
  border-top: 3px solid #C9A45C;
}
.envr-cd-num {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(38px, 10vw, 52px);
  font-weight: 300;
  color: #1A1A18;
  line-height: 1;
  display: block;
}
.envr-cd-lbl {
  font-family: 'Inter', sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(74,55,40,0.48);
  display: block;
  margin-top: 4px;
}

/* ── Details ──────────────────────────────────────────────────────────── */
.envr-detail-card {
  background: #FFFFFF;
  border-radius: 22px;
  padding: 18px 16px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  box-shadow: 0 4px 22px rgba(65,45,20,0.08);
  border: 1px solid rgba(201,164,92,0.15);
  margin-bottom: 12px;
}
.envr-detail-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(23,61,47,0.09) 0%, rgba(201,164,92,0.13) 100%);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.envr-detail-label {
  font-family: 'Inter', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #C9A45C;
  margin: 0 0 3px;
}
.envr-detail-name {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 18px;
  font-weight: 500;
  color: #1A1A18;
  margin: 0 0 3px;
  line-height: 1.3;
}
.envr-detail-sub {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: rgba(74,55,40,0.5);
  line-height: 1.4;
  margin: 0;
}
.envr-detail-link {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: #C9A45C;
  font-weight: 500;
  text-decoration: none;
  margin-top: 5px;
  display: inline-block;
}

/* ── Story ────────────────────────────────────────────────────────────── */
.envr-story-item {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
}
.envr-story-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 63px;
  top: calc(100% + 2px);
  width: 1.5px;
  height: 22px;
  background: linear-gradient(to bottom, rgba(201,164,92,0.35), transparent);
}
.envr-story-img {
  width: 128px;
  min-width: 128px;
  height: 162px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 28px rgba(65,45,20,0.16);
}
.envr-story-img img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.envr-story-year {
  display: inline-block;
  padding: 3px 13px;
  background: linear-gradient(135deg, #C9A45C, #A87830);
  color: #0D1810;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  border-radius: 999px;
  margin-bottom: 10px;
}
.envr-story-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 21px;
  font-weight: 500;
  color: #1A1A18;
  margin: 0 0 8px;
}
.envr-story-text {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: rgba(74,55,40,0.65);
  line-height: 1.65;
  margin: 0;
}

/* ── Schedule ─────────────────────────────────────────────────────────── */
.envr-sched-item {
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
  align-items: flex-start;
}
.envr-sched-time {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 14px;
  color: #C9A45C;
  width: 64px;
  min-width: 64px;
  text-align: right;
  padding-top: 9px;
}
.envr-sched-dot {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #173D2F 0%, #235C43 100%);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: #C9A45C;
  box-shadow: 0 3px 10px rgba(23,61,47,0.25);
  position: relative;
  z-index: 1;
  margin-top: 4px;
}
.envr-sched-dot::after {
  content: '';
  position: absolute;
  top: 100%; left: 50%;
  transform: translateX(-50%);
  width: 1.5px;
  height: 20px;
  background: rgba(201,164,92,0.22);
}
.envr-sched-item:last-child .envr-sched-dot::after { display: none; }
.envr-sched-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 18px;
  font-weight: 500;
  color: #1A1A18;
  margin: 0;
  padding-top: 6px;
}
.envr-sched-photo {
  border-radius: 26px;
  overflow: hidden;
  position: relative;
  height: 200px;
  margin-top: 24px;
  box-shadow: 0 14px 40px rgba(23,61,47,0.22);
}
.envr-sched-photo img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.envr-sched-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(23,61,47,0.82) 0%, rgba(23,61,47,0.18) 70%, transparent 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 22px 18px;
}
.envr-sched-overlay-text {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 19px;
  font-style: italic;
  color: #FFF8EE;
  text-align: center;
  line-height: 1.35;
}

/* ── Helicopter ───────────────────────────────────────────────────────── */
.envr-journey-map {
  background: linear-gradient(148deg, #ECF3EF 0%, #E2EDE6 100%);
  border-radius: 26px;
  padding: 18px 14px 14px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(23,61,47,0.11);
  margin-bottom: 16px;
}
.envr-map-hint {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  color: rgba(23,61,47,0.42);
  text-align: center;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.envr-heli-btn {
  position: absolute;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 58px; height: 34px;
  transition: left 3.6s cubic-bezier(0.4,0,0.2,1);
  filter: drop-shadow(0 4px 8px rgba(23,61,47,0.28));
  z-index: 10;
}
.envr-heli-btn:focus-visible { outline: 2px solid #C9A45C; border-radius: 4px; }
.envr-heli-idle { animation: envr-heli-bob 2.2s ease-in-out infinite; }
@keyframes envr-heli-bob {
  0%,100% { transform: translateY(0) rotate(-1deg); }
  50%      { transform: translateY(-6px) rotate(1deg); }
}
.envr-stops {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.envr-stop-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(65,45,20,0.1);
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1);
}
.envr-stop-card.visible {
  opacity: 1;
  transform: translateY(0);
}
.envr-stop-card-img {
  width: 100%;
  height: 72px;
  object-fit: cover;
  display: block;
}
.envr-stop-body { padding: 9px 11px 10px; }
.envr-stop-time {
  font-family: 'Inter', sans-serif;
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #C9A45C; margin: 0 0 2px;
}
.envr-stop-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 14px; font-weight: 500;
  color: #1A1A18; margin: 0 0 1px;
}
.envr-stop-venue {
  font-family: 'Inter', sans-serif;
  font-size: 10px; color: rgba(74,55,40,0.5); margin: 0;
}

/* ── Gallery ──────────────────────────────────────────────────────────── */
.envr-gallery-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}
.envr-gal-tile {
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 16px rgba(65,45,20,0.1);
  background: #E8E0D4;
}
.envr-gal-tile--wide { grid-column: span 2; }
.envr-gal-tile img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
  transition: transform 0.5s ease;
}
.envr-gal-tile:hover img { transform: scale(1.04); }

/* ── Dress Code ───────────────────────────────────────────────────────── */
.envr-dress-card {
  background: #FFFFFF;
  border-radius: 26px;
  padding: 26px 22px;
  box-shadow: 0 8px 32px rgba(65,45,20,0.1);
  border: 1px solid rgba(201,164,92,0.17);
}
.envr-dress-text {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: rgba(74,55,40,0.68);
  line-height: 1.65;
  margin: 0 0 18px;
}
.envr-swatches {
  display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px;
}
.envr-swatch {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(201,164,92,0.28);
  box-shadow: 0 2px 8px rgba(0,0,0,0.09);
}
.envr-dress-style {
  display: flex; align-items: center; gap: 14px;
  padding-top: 16px;
  border-top: 1px solid rgba(201,164,92,0.14);
}
.envr-dress-style-text {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 22px; font-weight: 400; color: #1A1A18; margin: 0;
}

/* ── RSVP ─────────────────────────────────────────────────────────────── */
.envr-rsvp-card {
  background: #FFFFFF;
  border-radius: 28px;
  padding: 26px 20px;
  box-shadow: 0 12px 48px rgba(65,45,20,0.11);
  border: 1px solid rgba(201,164,92,0.18);
}
.envr-rsvp-desc {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: rgba(74,55,40,0.6);
  line-height: 1.65;
  white-space: pre-line;
  margin: 0 0 18px;
}
.envr-attend-row { display: flex; gap: 10px; margin-bottom: 16px; }
.envr-attend-btn {
  flex: 1; height: 52px;
  border-radius: 14px;
  border: 1.5px solid rgba(201,164,92,0.22);
  background: transparent;
  font-family: 'Inter', sans-serif;
  font-size: 11px; font-weight: 600;
  color: rgba(74,55,40,0.55);
  cursor: pointer;
  transition: all 0.2s;
}
.envr-attend-btn.active {
  background: #173D2F;
  border-color: #173D2F;
  color: #FFF8EE;
  box-shadow: 0 4px 16px rgba(23,61,47,0.3);
}
.envr-field {
  width: 100%;
  padding: 13px 14px;
  background: #FAFAF8;
  border: 1.5px solid rgba(201,164,92,0.18);
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #1A1A18;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  display: block;
}
.envr-field:focus {
  border-color: rgba(201,164,92,0.55);
  box-shadow: 0 0 0 3px rgba(201,164,92,0.1);
}
.envr-field::placeholder { color: rgba(74,55,40,0.33); }
.envr-field-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;
}
.envr-rsvp-submit {
  width: 100%; height: 54px;
  background: linear-gradient(135deg, #173D2F 0%, #235C43 100%);
  color: #FFF8EE;
  border: none;
  border-radius: 14px;
  font-family: 'Inter', sans-serif;
  font-size: 11px; font-weight: 700; letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 6px 22px rgba(23,61,47,0.32);
  transition: opacity 0.2s, transform 0.2s;
  margin-top: 14px;
}
.envr-rsvp-submit:hover:not(:disabled) { transform: translateY(-2px); opacity: 0.95; }
.envr-rsvp-submit:disabled { opacity: 0.48; cursor: not-allowed; }

/* ── Final message ────────────────────────────────────────────────────── */
.envr-final-names {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(36px, 10vw, 54px);
  font-weight: 300;
  color: #FFF8EE;
  line-height: 1.15;
  margin: 16px 0 8px;
  text-align: center;
}
.envr-final-tagline {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 17px; font-style: italic;
  color: rgba(255,248,238,0.65);
  margin: 0 0 10px;
  text-align: center;
}
.envr-final-date {
  font-family: 'Inter', sans-serif;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: rgba(201,164,92,0.8); margin: 0;
  text-align: center;
}
.envr-final-note {
  font-family: 'Inter', sans-serif;
  font-size: 12px; color: rgba(255,248,238,0.45);
  line-height: 1.7; margin-top: 14px; text-align: center;
}
.envr-footer-strip {
  max-width: 540px;
  margin: 44px auto 0;
  border-top: 1px solid rgba(201,164,92,0.2);
  padding-top: 18px;
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 10px; color: rgba(201,164,92,0.45); letter-spacing: 0.06em;
}

/* ── Ornament ─────────────────────────────────────────────────────────── */
.envr-orn {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  margin: 10px 0;
}

/* ── Desktop breakpoints ─────────────────────────────────────────────── */
@media (min-width: 640px) {
  .envr-env-box      { width: 380px; height: 248px; }
  .envr-hero-card    { height: 480px; max-width: 600px; }
  .envr-cd-grid      { grid-template-columns: repeat(4, 1fr); }
  .envr-inner        { max-width: 700px; }
  .envr-stops        { grid-template-columns: repeat(4, 1fr); }
  .envr-gallery-grid { grid-template-columns: repeat(3, 1fr); }
  .envr-gal-tile--wide { grid-column: span 1; }
  .envr-story-img    { width: 150px; min-width: 150px; height: 190px; }
}

@media (min-width: 1024px) {
  .envr-section   { padding: 80px 40px; }
  .envr-inner     { max-width: 1200px; }
  .envr-hero-card { height: 560px; max-width: 680px; }
  .envr-story-list { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .envr-story-item:not(:last-child)::after { display: none; }
  .envr-story-img { width: 180px; min-width: 180px; height: 220px; }
  .envr-sched-two { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; align-items: start; }
  .envr-sched-photo { height: 380px; margin-top: 0; }
  .envr-gallery-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .envr-gal-tile--wide { grid-column: span 2; }
  .envr-stops     { grid-template-columns: repeat(4, 1fr); }
  .envr-rsvp-card { max-width: 580px; margin: 0 auto; }
}

/* ── Reduced motion ───────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .envr-heli-idle  { animation: none; }
  .envr-scroll-hint { animation: none; }
}

/* ── Main content entry animation ─────────────────────────────────────── */
.envr-main-content {
  animation: envr-fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both;
}
`;

// ── Hooks ──────────────────────────────────────────────────────────────────────
function useSectionReveal(skip: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(skip);
  useEffect(() => {
    if (skip) { setTriggered(true); return; }
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setTriggered(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTriggered(true); io.disconnect(); } },
      { threshold: 0.04, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [skip]);
  return { ref, triggered };
}

function useCountdown(isoDate: string) {
  const calc = () => {
    const diff = new Date(isoDate).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [isoDate]); // eslint-disable-line
  return t;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function Ornament({ c }: { c: string }) {
  return (
    <div className="envr-orn">
      <div style={{ width: 36, height: 1, background: `${c}55` }} />
      <div style={{ width: 4, height: 4, borderRadius: "50%", background: c }} />
      <div style={{ width: 5, height: 5, transform: "rotate(45deg)", background: c }} />
      <div style={{ width: 4, height: 4, borderRadius: "50%", background: c }} />
      <div style={{ width: 36, height: 1, background: `${c}55` }} />
    </div>
  );
}

function HeliSVG({ col }: { col: string }) {
  return (
    <svg viewBox="0 0 60 36" fill="none" style={{ width: "100%", height: "100%" }}>
      <ellipse cx="30" cy="22" rx="17" ry="7.5" fill={col} />
      <ellipse cx="24" cy="20" rx="8" ry="6" fill={col} opacity="0.75" />
      <ellipse cx="23" cy="19" rx="5" ry="4" fill="rgba(190,230,255,0.65)" />
      <rect x="46" y="20" width="13" height="3" rx="1.5" fill={col} />
      <rect x="56" y="16" width="1.5" height="12" rx="0.75" fill={col} />
      <rect x="14" y="29" width="22" height="2" rx="1" fill={col} opacity="0.65" />
      <rect x="17" y="27" width="2" height="4" rx="1" fill={col} opacity="0.5" />
      <rect x="31" y="27" width="2" height="4" rx="1" fill={col} opacity="0.5" />
      <rect x="4" y="12" width="42" height="2.5" rx="1.25" fill={col} />
      <circle cx="25" cy="13" r="3" fill={col} />
      <rect x="24" y="12" width="2" height="8" rx="1" fill={col} opacity="0.55" />
    </svg>
  );
}

function SchedIcon({ icon, col }: { icon: string; col: string }) {
  const s: React.CSSProperties = { width: 14, height: 14, color: col, strokeWidth: 1.6 };
  if (icon === "wine" || icon === "cocktail") return <Wine style={s} />;
  if (icon === "heart" || icon === "ceremony") return <Heart style={s} />;
  if (icon === "camera" || icon === "photo")   return <Camera style={s} />;
  if (icon === "music" || icon === "dance")    return <Music style={s} />;
  if (icon === "sparkles" || icon === "party") return <Sparkles style={s} />;
  if (icon === "users")  return <Users style={s} />;
  return <Star style={s} />;
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface EnvelopeTemplateProps {
  config?: Partial<WeddingConfig>;
  templateId?: string;
  builderMode?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function EnvelopeRomanceTemplate({
  config: configProp,
  templateId,
  builderMode = false,
}: EnvelopeTemplateProps) {
  const config = { ...defaultConfig, ...configProp } as WeddingConfig;
  const cx = config as any;

  // ── Colors ──
  const gold  = config.theme?.colors?.primary    ?? "#C9A45C";
  const green = "#173D2F";
  const bg    = config.theme?.colors?.background ?? "#FAF7F2";
  const dark  = "#1A1A18";
  const serif = "'Cormorant Garamond', Georgia, serif";
  const sans  = "'Inter', system-ui, sans-serif";

  // ── Envelope state ──
  type EnvPhase = "sealed" | "opening" | "revealed" | "done";
  const [envPhase, setEnvPhase] = useState<EnvPhase>(builderMode ? "done" : "sealed");
  const envTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function openEnvelope() {
    if (envPhase !== "sealed") return;
    setEnvPhase("opening");
    envTimers.current.push(
      setTimeout(() => setEnvPhase("revealed"), 2100),
      setTimeout(() => setEnvPhase("done"),    3700),
    );
  }
  function skipEnvelope() {
    envTimers.current.forEach(clearTimeout);
    setEnvPhase("done");
  }
  useEffect(() => () => envTimers.current.forEach(clearTimeout), []);

  // ── Helicopter ──
  const [heliLeft,  setHeliLeft]  = useState(3);
  const [heliFlying, setHeliFlying] = useState(false);
  const [routeProg, setRouteProg] = useState(builderMode ? 1 : 0);
  const [visStops,  setVisStops]  = useState<number[]>(builderMode ? [0, 1, 2, 3] : []);
  const heliTimers = useRef<number[]>([]);

  function startHeli() {
    if (heliFlying || heliLeft > 4) return;
    setHeliFlying(true);
    setHeliLeft(82);
    const start = Date.now();
    const dur = 3500;
    const id = window.setInterval(() => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setRouteProg(p);
      if (p >= 1) clearInterval(id);
    }, 40);
    heliTimers.current.push(
      id,
      window.setTimeout(() => setVisStops(v => [...v, 0]), 750),
      window.setTimeout(() => setVisStops(v => [...v, 1]), 1550),
      window.setTimeout(() => setVisStops(v => [...v, 2]), 2350),
      window.setTimeout(() => setVisStops(v => [...v, 3]), 3100),
      window.setTimeout(() => setHeliFlying(false), 3900),
    );
  }
  useEffect(() => () => heliTimers.current.forEach(clearTimeout), []);

  // ── RSVP ──
  const [rsvpAttend, setRsvpAttend] = useState<"attending" | "not-attending">("attending");
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  type RsvpData = Omit<InsertRsvp, "templateId">;
  const form = useForm<RsvpData>({
    resolver: zodResolver(insertRsvpSchema.omit({ templateId: true })),
    defaultValues: { attendance: "attending", guestCount: "1" },
  });
  const rsvpMutation = useMutation({
    mutationFn: (data: RsvpData) =>
      apiRequest("POST", `/api/templates/${templateId}/rsvp`, { ...data, templateId }),
    onSuccess: () => setRsvpSuccess(true),
  });

  // ── Section reveals ──
  const heroRev     = useSectionReveal(builderMode);
  const cdRev       = useSectionReveal(builderMode);
  const detailsRev  = useSectionReveal(builderMode);
  const storyRev    = useSectionReveal(builderMode);
  const schedRev    = useSectionReveal(builderMode);
  const journeyRev  = useSectionReveal(builderMode);
  const galleryRev  = useSectionReveal(builderMode);
  const dressRev    = useSectionReveal(builderMode);
  const rsvpRev     = useSectionReveal(builderMode);
  const finalRev    = useSectionReveal(builderMode);

  // ── Countdown ──
  const cd = useCountdown(config.wedding?.date ?? "2026-10-04T16:00:00");

  // ── Derived config values ──
  const coupleNames  = config.couple?.combinedNames ?? "Alexander & Isabella";
  const displayDate  = config.wedding?.displayDate  ?? "October 4, 2026";
  const heroImg      = cx.heroImage ?? (config.hero as any)?.backgroundImage ?? HERO_IMG;
  const heroLocation = cx.heroLocation ?? (config.wedding as any)?.venueName ?? "Grand Estate, California";
  const footerTagline = cx.footerTagline ?? config.footer?.thankYouMessage ?? "With Love & Gratitude";
  const finalTitle   = cx.finalTitle ?? "We can't wait to celebrate with you";
  const finalNote    = cx.finalNote  ?? "Thank you for being part of our special day";
  const galleryTitle = cx.galleryTitle ?? config.photos?.title ?? "Our Moments";
  const storyHeading = cx.storyHeading ?? "Our Story";
  const dressCodeText  = cx.dressCodeText  ?? "We kindly ask you to wear one of these beautiful colors.";
  const dressCodeStyle = cx.dressCodeStyle ?? "Black Tie";
  const dressColors    = (cx.dressColors ?? []).length > 0 ? cx.dressColors : DRESS_COLORS_DEFAULT;
  const initials = cx.envelopeInitials ?? "A & I";

  const gallery = (() => {
    const imgs = config.photos?.galleryImages ?? (config.photos as any)?.gallery ?? [];
    return Array.isArray(imgs) && imgs.length > 0 ? imgs : GALLERY_DEFAULTS;
  })();

  const storyItems = (() => {
    const si = cx.storyItems;
    if (Array.isArray(si) && si.length > 0) return si;
    const evts = config.timeline?.events ?? [];
    if (evts.length > 0) {
      return evts.map((e: any, i: number) => ({
        year: e.time ?? e.year ?? "—",
        title: e.title,
        text: e.description ?? e.text ?? "",
        img: e.img ?? STORY_DEFAULTS[i % 3].img,
      }));
    }
    return STORY_DEFAULTS;
  })();

  const schedItems = (() => {
    const si = cx.scheduleItems;
    if (Array.isArray(si) && si.length > 0) return si;
    return SCHEDULE_DEFAULTS;
  })();

  const journeyStops = (() => {
    const js = cx.journeyStops;
    return Array.isArray(js) && js.length > 0 ? js : JOURNEY_DEFAULTS;
  })();

  const venues = (() => {
    const v = (config.locations as any)?.venues;
    if (Array.isArray(v) && v.length > 0) return v;
    return [
      { id: "ceremony",  title: "Ceremony",  name: "Grand Estate Chapel", time: "4:00 PM", address: "1 Chapel Lane, CA" },
      { id: "reception", title: "Reception", name: "The Grand Ballroom",   time: "7:00 PM", address: "" },
    ];
  })();

  // ── Fade helper ──
  function rev(r: { triggered: boolean }) {
    return r.triggered
      ? { animation: "envr-fade-up 0.72s cubic-bezier(0.22,1,0.36,1) both" }
      : { opacity: 0, transform: "translateY(24px)" };
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="envr-root" style={{ background: bg }}>
      <style>{STYLES}</style>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. ENVELOPE OPENING                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {envPhase !== "done" && (
        <section className="envr-screen" data-v2-section="env-envelope">
          <p style={{
            fontFamily: sans, fontSize: 11, letterSpacing: "0.24em",
            textTransform: "uppercase", color: `${gold}bb`, marginBottom: 24, textAlign: "center",
          }}>
            {cx.envelopeTitle ?? "You Are Invited"}
          </p>

          {/* Envelope */}
          <div
            className="envr-env-box"
            onClick={envPhase === "sealed" ? openEnvelope : undefined}
            style={{ cursor: envPhase === "sealed" ? "pointer" : "default" }}
          >
            <div className="envr-env-body" />
            <div className="envr-env-flap-left" />
            <div className="envr-env-flap-right" />
            <div className="envr-env-flap-bottom" />

            {/* Inner card with photo */}
            <div className={`envr-env-inner-card${envPhase === "revealed" ? " revealing" : ""}`}>
              <img
                src={heroImg}
                alt={coupleNames}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = HERO_IMG; }}
              />
            </div>

            {/* Top flap */}
            <div className={`envr-env-flap-top${envPhase !== "sealed" ? " open" : ""}`} />

            {/* Wax seal */}
            <div className={`envr-env-seal${envPhase !== "sealed" ? " gone" : ""}`}>
              <span style={{
                fontFamily: serif, fontSize: 11, fontWeight: 600,
                color: "#0D1810", letterSpacing: "0.03em",
              }}>
                {initials}
              </span>
            </div>
          </div>

          {/* Text below envelope */}
          <div style={{ textAlign: "center", maxWidth: 320, margin: "0 auto" }}>
            <h1 style={{
              fontFamily: serif, fontSize: "clamp(28px,7vw,38px)", fontWeight: 300,
              color: dark, margin: "0 0 6px", lineHeight: 1.2,
            }}>
              {coupleNames}
            </h1>
            <p style={{
              fontFamily: sans, fontSize: 11, letterSpacing: "0.18em",
              textTransform: "uppercase", color: `${dark}66`, margin: "0 0 28px",
            }}>
              {displayDate}
            </p>

            {envPhase === "sealed" && (
              <button
                onClick={openEnvelope}
                style={{
                  padding: "14px 38px",
                  background: `linear-gradient(135deg, ${gold}, #A87830)`,
                  color: "#0D1810", fontFamily: sans, fontSize: 12,
                  fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
                  border: "none", borderRadius: "999px", cursor: "pointer",
                  boxShadow: `0 6px 24px ${gold}55`,
                  display: "block", margin: "0 auto 16px",
                }}
              >
                Open Invitation
              </button>
            )}
            {envPhase !== "sealed" && (
              <p style={{
                fontFamily: serif, fontSize: 16, fontStyle: "italic",
                color: `${dark}55`, margin: "0 0 16px",
              }}>
                Opening…
              </p>
            )}

            <button
              onClick={skipEnvelope}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: sans, fontSize: 11, color: `${dark}40`,
                letterSpacing: "0.1em", textDecoration: "underline", padding: "4px 8px",
              }}
            >
              Skip
            </button>
          </div>
        </section>
      )}

      {/* Main content (hidden until envelope done) */}
      <div className={envPhase === "done" ? "envr-main-content" : undefined} style={{ display: envPhase === "done" ? "block" : "none" }}>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* 2. HERO                                                              */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <section
          className="envr-section"
          data-v2-section="env-hero"
          style={{ paddingTop: 28, paddingBottom: 48, background: "#FAF7F2" }}
        >
          <div
            ref={heroRev.ref}
            style={{ margin: "0 auto", maxWidth: 540, ...rev(heroRev) }}
          >
            <div className="envr-hero-card">
              <img
                src={heroImg}
                alt={coupleNames}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = HERO_IMG; }}
              />
              <div className="envr-hero-overlay">
                <h1
                  data-v2-element="env-hero-names"
                  className="envr-hero-names"
                >
                  {coupleNames}
                </h1>
                <p data-v2-element="env-hero-date" className="envr-hero-meta">
                  {displayDate}&nbsp;·&nbsp;{heroLocation}
                </p>
                <a href="#rsvp" style={{ textDecoration: "none" }}>
                  <span className="envr-hero-btn">RSVP Now</span>
                </a>
              </div>
            </div>
            <p className="envr-scroll-hint">↓ scroll to explore</p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* 3. COUNTDOWN                                                         */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <section
          className="envr-section envr-section--alt"
          data-v2-section="env-countdown"
        >
          <div
            ref={cdRev.ref}
            className="envr-inner"
            style={rev(cdRev)}
          >
            <span className="envr-eyebrow">Days Until The Wedding</span>
            <h2 className="envr-h2" data-v2-element="env-countdown-subtitle">
              {config.countdown?.subtitle ?? "Until We Say I Do"}
            </h2>
            <div className="envr-cd-grid">
              {[
                { n: cd.d, lbl: "Days" },
                { n: cd.h, lbl: "Hours" },
                { n: cd.m, lbl: "Minutes" },
                { n: cd.s, lbl: "Seconds" },
              ].map(({ n, lbl }) => (
                <div key={lbl} className="envr-cd-card">
                  <span className="envr-cd-num">{String(n).padStart(2, "0")}</span>
                  <span className="envr-cd-lbl">{lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* 4. DETAILS                                                           */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <section className="envr-section" data-v2-section="env-details">
          <div
            ref={detailsRev.ref}
            className="envr-inner"
            style={rev(detailsRev)}
          >
            <span className="envr-eyebrow">Wedding Details</span>
            <h2 className="envr-h2 envr-h2--sm" data-v2-element="env-details-label">
              When &amp; Where
            </h2>
            <div>
              {venues.slice(0, 4).map((v: any, i: number) => (
                <div key={i} className="envr-detail-card">
                  <div className="envr-detail-icon">
                    <MapPin style={{ width: 20, height: 20, color: green }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="envr-detail-label">{v.title ?? v.id ?? "Venue"}</p>
                    <p className="envr-detail-name">{v.description?.split("\n")[0] ?? v.name}</p>
                    <p className="envr-detail-sub">
                      {[v.time ?? (v.description ? v.name : null), v.address].filter(Boolean).join(" · ")}
                    </p>
                    {v.mapUrl && (
                      <a href={v.mapUrl} target="_blank" rel="noopener noreferrer" className="envr-detail-link">
                        View on Map →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* 5. STORY                                                             */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <section className="envr-section envr-section--alt" data-v2-section="env-story">
          <div
            ref={storyRev.ref}
            className="envr-inner"
            style={rev(storyRev)}
          >
            <span className="envr-eyebrow">Our Journey</span>
            <h2
              data-v2-element="env-story-heading"
              className="envr-h2"
            >
              {storyHeading}
            </h2>
            <div className="envr-story-list">
            {storyItems.map((item: any, i: number) => (
              <div
                key={i}
                className="envr-story-item"
                style={storyRev.triggered
                  ? { animation: `envr-fade-up 0.72s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.1}s both` }
                  : { opacity: 0 }
                }
              >
                <div className="envr-story-img">
                  <img
                    src={item.img}
                    alt={item.title}
                    onError={e => { (e.currentTarget as HTMLImageElement).src = HERO_IMG; }}
                  />
                </div>
                <div style={{ paddingTop: 4 }}>
                  <span className="envr-story-year">{item.year}</span>
                  <h3 className="envr-story-title">{item.title}</h3>
                  <p className="envr-story-text">{item.text}</p>
                </div>
              </div>
            ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* 6. SCHEDULE                                                          */}
        <section className="envr-section" data-v2-section="env-schedule">
          <div
            ref={schedRev.ref}
            className="envr-inner"
            style={rev(schedRev)}
          >
            <span className="envr-eyebrow">The Wedding Day</span>
            <h2 className="envr-h2 envr-h2--sm">{cx.scheduleTitle ?? "Day-of Schedule"}</h2>
            <div className="envr-sched-two">
              {/* Timeline */}
              <div>
                {schedItems.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="envr-sched-item"
                    style={schedRev.triggered
                      ? { animation: `envr-fade-up 0.72s cubic-bezier(0.22,1,0.36,1) ${0.08 * i}s both` }
                      : { opacity: 0 }
                    }
                  >
                    <span className="envr-sched-time">{item.time}</span>
                    <div className="envr-sched-dot">
                      <SchedIcon icon={item.icon ?? "star"} col={gold} />
                    </div>
                    <div>
                      <p className="envr-sched-title">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Photo card */}
              <div
                className="envr-sched-photo"
                style={schedRev.triggered
                  ? { animation: "envr-fade-up 0.72s cubic-bezier(0.22,1,0.36,1) 0.2s both" }
                  : { opacity: 0 }
                }
              >
                <img
                  src={cx.schedulePhoto ?? SCHEDULE_PHOTO}
                  alt="wedding celebration"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = SCHEDULE_PHOTO; }}
                />
                <div className="envr-sched-overlay">
                  <p className="envr-sched-overlay-text">
                    "We can't wait to celebrate with you"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* 7. HELICOPTER JOURNEY MAP                                            */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <section
          className="envr-section envr-section--alt"
          data-v2-section="env-journey"
        >
          <div
            ref={journeyRev.ref}
            className="envr-inner"
            style={rev(journeyRev)}
          >
            <span className="envr-eyebrow">Wedding Journey</span>
            <h2 className="envr-h2 envr-h2--sm">{cx.journeyTitle ?? "The Wedding Route"}</h2>
            <p style={{
              fontFamily: sans, fontSize: 13, color: "rgba(74,55,40,0.6)",
              marginBottom: 20, lineHeight: 1.6,
            }}>
              {cx.journeySubtitle ?? "Tap the helicopter to reveal the route"}
            </p>

            {/* Map card */}
            <div className="envr-journey-map">
              <p className="envr-map-hint">
                {heliFlying ? "Flying the route\u2026" : heliLeft > 4 ? "Route revealed \u2713" : "Tap helicopter to reveal the route"}
              </p>

              <div style={{ position: "relative", height: 86, width: "100%" }}>
                <svg
                  viewBox="0 0 380 86"
                  preserveAspectRatio="none"
                  style={{ display: "block", width: "100%", height: "100%" }}
                >
                  {/* Faint guide path */}
                  <path
                    d="M 22 55 C 80 32, 115 68, 168 52 C 222 36, 252 68, 298 50 C 336 36, 358 54, 372 46"
                    stroke={`${green}22`} strokeWidth="2.5" strokeDasharray="8 5" fill="none"
                  />
                  {/* Animated drawn path */}
                  <path
                    d="M 22 55 C 80 32, 115 68, 168 52 C 222 36, 252 68, 298 50 C 336 36, 358 54, 372 46"
                    pathLength={400}
                    stroke={gold} strokeWidth="2.5" strokeDasharray={400}
                    strokeDashoffset={400 * (1 - routeProg)} fill="none"
                    style={{ transition: "stroke-dashoffset 3.6s cubic-bezier(0.4,0,0.2,1)" }}
                  />
                  {/* Stop pin circles at key points */}
                  {([
                    { x: 22,  y: 55 },
                    { x: 168, y: 52 },
                    { x: 298, y: 50 },
                    { x: 372, y: 46 },
                  ] as const).map((pt, i) => (
                    <g key={i}>
                      <circle
                        cx={pt.x} cy={pt.y} r="6"
                        fill={visStops.includes(i) ? green : "transparent"}
                        stroke={visStops.includes(i) ? gold : `${green}44`}
                        strokeWidth="2"
                        style={{ transition: "fill 0.4s, stroke 0.4s" }}
                      />
                      <text
                        x={pt.x} y={pt.y - 11}
                        textAnchor="middle" fill={green}
                        fontSize="9" fontFamily="Inter, sans-serif"
                        style={{ opacity: visStops.includes(i) ? 1 : 0, transition: "opacity 0.4s" }}
                      >
                        {journeyStops[i]?.time ?? ""}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Helicopter button */}
                <button
                  className={`envr-heli-btn${!heliFlying && heliLeft < 5 ? " envr-heli-idle" : ""}`}
                  onClick={startHeli}
                  aria-label="Fly helicopter to reveal route"
                  style={{ left: `${heliLeft}%`, top: "30%" }}
                >
                  <HeliSVG col={green} />
                </button>
              </div>
            </div>

            {/* Stop cards */}
            <div className="envr-stops">
              {journeyStops.map((stop: any, i: number) => (
                <div
                  key={i}
                  className={`envr-stop-card${visStops.includes(i) ? " visible" : ""}`}
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <img
                    src={stop.img}
                    alt={stop.title}
                    className="envr-stop-card-img"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = JOURNEY_DEFAULTS[i % 4].img; }}
                  />
                  <div className="envr-stop-body">
                    <p className="envr-stop-time">{stop.time}</p>
                    <p className="envr-stop-title">{stop.title}</p>
                    <p className="envr-stop-venue">{stop.venue ?? stop.sub ?? ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* 8. GALLERY                                                           */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <section className="envr-section" data-v2-section="env-gallery">
          <div
            ref={galleryRev.ref}
            className="envr-inner"
            style={rev(galleryRev)}
          >
            <span className="envr-eyebrow">Gallery</span>
            <h2
              data-v2-element="env-gallery-title"
              className="envr-h2 envr-h2--sm"
            >
              {galleryTitle}
            </h2>
            <div className="envr-gallery-grid">
              {gallery.slice(0, 6).map((src: string, i: number) => (
                <div
                  key={i}
                  className={`envr-gal-tile${i === 0 ? " envr-gal-tile--wide" : ""}`}
                  style={{
                    aspectRatio: i === 0 ? "16/9" : "1",
                    animation: galleryRev.triggered
                      ? `envr-fade-up 0.72s cubic-bezier(0.22,1,0.36,1) ${0.06 * i}s both`
                      : undefined,
                  }}
                >
                  <img
                    src={src}
                    alt={`wedding moment ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = GALLERY_DEFAULTS[0];
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* 9. DRESS CODE                                                        */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <section
          className="envr-section envr-section--alt"
          data-v2-section="env-dresscode"
        >
          <div ref={dressRev.ref} className="envr-inner" style={rev(dressRev)}>
            <span className="envr-eyebrow">Attire</span>
            <h2 className="envr-h2 envr-h2--sm">Dress Code</h2>
            <div className="envr-dress-card">
              <p className="envr-dress-text">{dressCodeText}</p>
              <div className="envr-swatches">
                {dressColors.map((col: string, i: number) => (
                  <div key={i} className="envr-swatch" style={{ background: col }} />
                ))}
              </div>
              <div className="envr-dress-style">
                <div style={{ width: 1, height: 32, background: `${gold}44`, flexShrink: 0 }} />
                <div>
                  <p className="envr-dress-style-text">{dressCodeStyle}</p>
                  <svg viewBox="0 0 40 22" fill="none" style={{ width: 38, height: 21, marginTop: 5 }}>
                    <path d="M4 2 L20 11 L36 2 L36 20 L20 11 L4 20 Z"
                      stroke={gold} strokeWidth="1.5" fill={`${gold}16`} />
                    <circle cx="20" cy="11" r="3" fill={gold} />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* 10. RSVP                                                             */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <section className="envr-section" data-v2-section="env-rsvp" id="rsvp">
          <div
            ref={rsvpRev.ref}
            className="envr-inner"
            style={rev(rsvpRev)}
          >
            <span className="envr-eyebrow">Kindly Reply</span>
            <h2
              data-v2-element="env-rsvp-title"
              className="envr-h2 envr-h2--sm"
            >
              {config.rsvp?.title ?? "Will You Join Us?"}
            </h2>
            <div className="envr-rsvp-card">
              <p
                data-v2-element="env-rsvp-desc"
                className="envr-rsvp-desc"
              >
                {config.rsvp?.description ?? "Please respond by September 1st, 2026.\nWe can't wait to celebrate with you."}
              </p>

              {rsvpSuccess ? (
                <div style={{ padding: "20px 0", textAlign: "center" }}>
                  <Ornament c={gold} />
                  <p style={{
                    fontFamily: serif, fontSize: 21, fontStyle: "italic",
                    color: green, margin: "16px 0 8px",
                  }}>
                    {config.rsvp?.messages?.success ?? "Thank you! We look forward to celebrating with you."}
                  </p>
                  <p style={{ fontFamily: sans, fontSize: 12, color: "rgba(74,55,40,0.5)" }}>
                    We'll be in touch soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(d => rsvpMutation.mutate(d))}>
                  {/* Attendance */}
                  <div className="envr-attend-row">
                    {(["attending", "not-attending"] as const).map(val => (
                      <button
                        key={val} type="button"
                        className={`envr-attend-btn${rsvpAttend === val ? " active" : ""}`}
                        onClick={() => { setRsvpAttend(val); form.setValue("attendance", val); }}
                      >
                        {val === "attending"
                          ? (config.rsvp?.form?.attendingYes ?? "Joyfully Accepts")
                          : (config.rsvp?.form?.attendingNo  ?? "Regretfully Declines")}
                      </button>
                    ))}
                  </div>

                  {/* Name row */}
                  <div className="envr-field-row">
                    <input
                      {...form.register("firstName")}
                      placeholder={config.rsvp?.form?.firstNamePlaceholder ?? "First name"}
                      className="envr-field"
                    />
                    <input
                      {...form.register("lastName")}
                      placeholder={config.rsvp?.form?.lastNamePlaceholder ?? "Last name"}
                      className="envr-field"
                    />
                  </div>

                  {/* Email */}
                  <input
                    {...form.register("email")}
                    type="email"
                    placeholder={config.rsvp?.form?.emailPlaceholder ?? "your@email.com"}
                    className="envr-field"
                    style={{ marginBottom: 10 }}
                  />

                  {/* Guests / notes */}
                  <div className="envr-field-row">
                    <select
                      {...form.register("guestCount")}
                      className="envr-field"
                      style={{ appearance: "none", cursor: "pointer" }}
                    >
                      {(config.rsvp?.guestOptions ?? [
                        { value: "1", label: "1 Guest" },
                        { value: "2", label: "2 Guests" },
                        { value: "3", label: "3 Guests" },
                        { value: "4", label: "4 Guests" },
                      ]).map((opt: any) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <textarea
                      {...form.register("guestNames")}
                      placeholder={config.rsvp?.form?.guestNamesPlaceholder ?? "Dietary notes"}
                      className="envr-field"
                      style={{ resize: "none", height: 48 }}
                    />
                  </div>

                  {rsvpMutation.isError && (
                    <p style={{ textAlign: "center", fontFamily: sans, fontSize: 11, color: "#C94040", margin: "6px 0 0" }}>
                      {config.rsvp?.messages?.error ?? "Something went wrong. Please try again."}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={rsvpMutation.isPending}
                    className="envr-rsvp-submit"
                  >
                    {rsvpMutation.isPending
                      ? (config.rsvp?.form?.submittingButton ?? "Sending…")
                      : (config.rsvp?.form?.submitButton    ?? "Confirm RSVP")}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* 11. FINAL MESSAGE                                                    */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <section
          className="envr-section envr-section--green"
          data-v2-section="env-footer"
          style={{ position: "relative", overflow: "hidden", padding: "72px 18px 44px" }}
        >
          {/* Decorative leaf motifs */}
          <svg
            style={{ position: "absolute", top: 0, right: 0, opacity: 0.1, pointerEvents: "none" }}
            width="150" height="150" viewBox="0 0 150 150"
          >
            <path d="M150 0 Q74 26 54 96 Q80 50 150 0 Z" fill={gold} />
            <path d="M130 0 Q60 38 38 120 Q78 65 130 0 Z" fill={gold} opacity="0.55" />
          </svg>
          <svg
            style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.1, pointerEvents: "none" }}
            width="120" height="120" viewBox="0 0 120 120"
          >
            <path d="M0 120 Q26 72 82 52 Q38 88 0 120 Z" fill={gold} />
          </svg>

          <div
            ref={finalRev.ref}
            className="envr-inner"
            style={rev(finalRev)}
          >
            <div style={{ textAlign: "center" }}>
              <p style={{
                fontFamily: sans, fontSize: 9, letterSpacing: "0.28em",
                textTransform: "uppercase", color: `${gold}bb`, margin: 0,
              }}>
                <span data-v2-element="env-footer-tagline">{footerTagline}</span>
              </p>

              <Ornament c={gold} />

              <h2 className="envr-final-names">{coupleNames}</h2>
              <p className="envr-final-tagline">{finalTitle}</p>
              <p className="envr-final-date">{displayDate}</p>
              <Ornament c={gold} />
              <p className="envr-final-note">{finalNote}</p>
            </div>

            <div className="envr-footer-strip">
              <span>© {new Date().getFullYear()} {coupleNames}. All rights reserved.</span>
              <span>Made with ♥</span>
            </div>
          </div>
        </section>

      </div>{/* /main content */}
    </div>
  );
}
