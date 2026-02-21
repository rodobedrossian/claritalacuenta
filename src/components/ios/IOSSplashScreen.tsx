import { useEffect, useState } from "react";

const DEFAULT_MIN_DURATION_MS = 2200;

interface IOSSplashScreenProps {
  onFinish: () => void;
  /** Minimum time to show splash (ms). */
  minDurationMs?: number;
  /** When false, splash stays until this becomes true and minDurationMs has passed. Use e.g. ready={!authLoading}. */
  ready?: boolean;
}

/**
 * Full-screen splash with app brand color and logo (R). Calls onFinish after minDurationMs
 * and optionally after ready is true. iOS only; used by IOSAppGate.
 */
export function IOSSplashScreen({
  onFinish,
  minDurationMs = DEFAULT_MIN_DURATION_MS,
  ready = true,
}: IOSSplashScreenProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), minDurationMs);
    return () => clearTimeout(t);
  }, [minDurationMs]);

  useEffect(() => {
    if (minTimeElapsed && ready) {
      onFinish();
    }
  }, [minTimeElapsed, ready, onFinish]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center min-h-screen min-w-full"
      style={{ backgroundColor: "hsl(152 48% 38%)" }}
    >
      <img
        src="/rucula-logo.png"
        alt="Rucula"
        className="w-48 h-48 object-contain"
      />
    </div>
  );
}
