import { useEffect } from "react";

const SPLASH_DURATION_MS = 1000;

interface IOSSplashScreenProps {
  onFinish: () => void;
}

/**
 * Full-screen splash with app brand color and logo. Calls onFinish after ~1s.
 * iOS only; used by IOSAppGate before showing PIN or Auth.
 */
export function IOSSplashScreen({ onFinish }: IOSSplashScreenProps) {
  useEffect(() => {
    const t = setTimeout(() => {
      onFinish();
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center min-h-screen min-w-full"
      style={{ backgroundColor: "hsl(152 48% 38%)" }}
    >
      <img
        src="/rucula-logo.png"
        alt="Rucula"
        className="w-24 h-24 object-contain"
      />
    </div>
  );
}
