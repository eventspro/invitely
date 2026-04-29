import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { WeddingConfig } from "@/templates/types";

interface NavigationProps {
  config?: WeddingConfig;
}

export default function Navigation({ config }: NavigationProps) {
  // Autoplay header control mode: music enabled + autoplay flag set
  const isAutoplayMode = config.music?.enabled === true && config.music?.autoplay === true;

  // Start muted — Chrome and Safari both allow muted autoplay.
  // The mute button is shown immediately so the user can unmute on first interaction.
  const [isMuted, setIsMuted] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isAutoplayMode) {
      // Clean up if mode changed away from autoplay
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setAudioStarted(false);
      return;
    }

    const musicUrl = config.music?.audioUrl;
    if (!musicUrl) return;

    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = config.music?.volume || 0.3;
    // Always start muted — the only reliable cross-browser autoplay strategy.
    // Chrome policy and Safari both allow muted autoplay without a user gesture.
    audio.muted = true;
    audioRef.current = audio;

    // Single muted play attempt. If even this is blocked (iOS Safari with
    // strictest settings), audioRef stays set so toggleMute can call play()
    // on the first user gesture — which is always allowed.
    audio.play().then(() => {
      setAudioStarted(true);
      // isMuted stays true — user sees VolumeX and taps to unmute
    }).catch(() => {
      // Blocked even muted. toggleMute will resume on user gesture.
    });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [isAutoplayMode, config.music?.audioUrl, config.music?.volume]);

  const toggleMute = async () => {
    if (!audioRef.current) {
      // Audio was blocked entirely — start on first user gesture (guaranteed to work)
      const musicUrl = config.music?.audioUrl;
      if (!musicUrl) return;
      const audio = new Audio(musicUrl);
      audio.loop = true;
      audio.volume = config.music?.volume || 0.3;
      audio.muted = false;
      audioRef.current = audio;
      try {
        await audio.play();
        setAudioStarted(true);
        setIsMuted(false);
      } catch {
        // Extremely rare after a user gesture — ignore
      }
      return;
    }

    if (isMuted) {
      // Unmuting: on Safari the muted autoplay may have been blocked, leaving
      // audio paused. Resume play() first (safe inside a user gesture), then unmute.
      try {
        if (audioRef.current.paused) {
          await audioRef.current.play();
          setAudioStarted(true);
        }
        audioRef.current.muted = false;
        setIsMuted(false);
      } catch {
        // play() rejected even on user gesture — extremely rare, ignore
      }
    } else {
      // Muting is always safe — no play() call needed
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  return (
    <nav 
      className="fixed top-0 w-full z-50 bg-transparent backdrop-blur-sm"
      data-testid="navigation"
    >
      <div className="max-w-6xl mx-auto px-4 py-4 relative">
        {/* Couple Names Only */}
        {(config.couple?.groomName || config.couple?.brideName) && (
          <div className="flex justify-center">
            <span className="text-xl font-serif font-bold flex items-center gap-2 text-charcoal">
              {config.couple?.groomName && <span>{config.couple.groomName}</span>}
              {config.couple?.groomName && config.couple?.brideName && (
                <span className="mx-1" style={{ color: config.theme?.colors?.accent || config.theme?.colors?.primary }}>{config.footer?.separator || '∞'}</span>
              )}
              {config.couple?.brideName && <span>{config.couple.brideName}</span>}
            </span>
          </div>
        )}

        {/* Mute/Unmute button — always visible in autoplay_header_control mode.
            Shows VolumeX when muted or when autoplay was blocked (invites user to tap/click to start). */}
        {isAutoplayMode && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <button
              onClick={toggleMute}
              className={[
                "flex items-center justify-center w-10 h-10 rounded-full",
                "transition-colors ease-in-out",
                (isMuted || !audioStarted) ? "animate-[music-pulse_1.5s_ease-in-out_infinite]" : "",
              ].join(" ")}
              style={{
                color: config.theme?.colors?.primary || '#888',
                background: `${config.theme?.colors?.accent || config.theme?.colors?.primary || '#c0a080'}18`,
              }}
              aria-label={isMuted || !audioStarted ? 'Play music' : 'Mute music'}
              data-testid="button-header-music-toggle"
            >
              {isMuted || !audioStarted
                ? <VolumeX className="w-5 h-5" />
                : <Volume2 className="w-5 h-5" />
              }
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
