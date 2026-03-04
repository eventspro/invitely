/**
 * TypingLoader — full-screen brand-name typing animation loader.
 *
 * Props
 * ─────
 * show         boolean  — controls visibility; when false the overlay fades out then unmounts
 * text         string   — text to type (default "4ever.am")
 * speed        number   — ms per character typed (default 80)
 * deleteSpeed  number   — ms per character deleted (default 40)
 * pauseMs      number   — ms to pause at full/empty text (default 900)
 * minShowMs    number   — minimum visible duration so it never flashes (default 600)
 *
 * Accessibility
 * ─────────────
 * • prefers-reduced-motion → shows static text, no animation
 * • inert + aria-hidden while fading out so focus can't land inside it
 * • aria-live="polite" region announces loading state
 */

import { useEffect, useRef, useState } from "react";

interface TypingLoaderProps {
  show: boolean;
  text?: string;
  speed?: number;
  deleteSpeed?: number;
  pauseMs?: number;
  minShowMs?: number;
}

type Phase = "typing" | "pause-full" | "deleting" | "pause-empty";

export function TypingLoader({
  show,
  text = "4ever.am",
  speed = 80,
  deleteSpeed = 40,
  pauseMs = 900,
  minShowMs = 600,
}: TypingLoaderProps) {
  // Whether prefers-reduced-motion is active
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Controlled mount: stay mounted while fading out so the CSS transition plays
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(show); // drives opacity transition

  // Displayed substring index
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");

  // Track the earliest time we're allowed to dismiss (minShowMs guard)
  const readyAt = useRef<number>(Date.now() + minShowMs);

  // Mount/unmount + fade lifecycle
  useEffect(() => {
    if (show) {
      readyAt.current = Date.now() + minShowMs;
      setMounted(true);
      // Next tick so the initial opacity-0 class paints before we add opacity-100
      requestAnimationFrame(() => setVisible(true));
    } else {
      const delay = Math.max(0, readyAt.current - Date.now());
      const t = setTimeout(() => {
        setVisible(false);
        // After fade-out transition (250 ms) fully unmount
        setTimeout(() => setMounted(false), 260);
      }, delay);
      return () => clearTimeout(t);
    }
  }, [show, minShowMs]);

  // Typing animation — only runs when not reducedMotion
  useEffect(() => {
    if (reducedMotion || !mounted) return;

    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      setPhase((prev) => {
        if (prev === "typing") {
          setCharCount((c) => {
            const next = c + 1;
            if (next >= text.length) {
              // Full — switch to pause before deleting
              timer = setTimeout(() => {
                setPhase("pause-full");
                timer = setTimeout(() => {
                  setPhase("deleting");
                  timer = setTimeout(tick, deleteSpeed);
                }, pauseMs);
              }, speed);
            } else {
              timer = setTimeout(tick, speed);
            }
            return next;
          });
          return "typing";
        }

        if (prev === "deleting") {
          setCharCount((c) => {
            const next = c - 1;
            if (next <= 0) {
              // Empty — pause then retype
              timer = setTimeout(() => {
                setPhase("pause-empty");
                timer = setTimeout(() => {
                  setPhase("typing");
                  timer = setTimeout(tick, speed);
                }, pauseMs);
              }, deleteSpeed);
            } else {
              timer = setTimeout(tick, deleteSpeed);
            }
            return next;
          });
          return "deleting";
        }

        return prev;
      });
    };

    // Kick off
    timer = setTimeout(tick, speed);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, reducedMotion]);

  if (!mounted) return null;

  const displayed = reducedMotion ? text : text.slice(0, charCount);

  return (
    <div
      role="status"
      aria-label="Loading"
      aria-live="polite"
      // inert while fading out prevents focus trap after content loads
      {...(!visible ? { inert: "" } : {})}
      className={[
        // Layout
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center",
        // Background — matches site's cream palette
        "bg-[hsl(340,30%,97%)]",
        // Subtle backdrop blur for polish
        "backdrop-blur-0",
        // Fade transition
        "transition-opacity duration-[250ms] ease-in-out",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      {/* Brand text */}
      <span
        aria-hidden="true"
        className="
          font-serif
          text-5xl sm:text-6xl
          tracking-wide
          text-[hsl(340,15%,20%)]
          select-none
          whitespace-nowrap
        "
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {displayed}
        {/* Blinking cursor */}
        <span
          className={[
            "inline-block w-[2px] ml-[2px] align-middle",
            "bg-[hsl(340,45%,65%)]", // soft-gold accent
            "rounded-full",
            reducedMotion ? "opacity-100" : "typing-cursor",
          ].join(" ")}
          style={{ height: "1em" }}
          aria-hidden="true"
        />
      </span>

      {/* Screen reader text (always present, not animated) */}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
