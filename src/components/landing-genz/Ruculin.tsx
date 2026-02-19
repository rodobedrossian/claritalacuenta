import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type Mood = "happy" | "thinking" | "wink" | "surprised";
type Size = "sm" | "md" | "lg";

const sizes = { sm: 64, md: 96, lg: 140 };

interface RuculinProps {
  mood?: Mood;
  size?: Size;
  className?: string;
}

export function Ruculin({ mood = "happy", size = "md", className }: RuculinProps) {
  const s = sizes[size];
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const eyeScaleY = blink ? 0.1 : 1;

  // mouth paths per mood
  const mouth: Record<Mood, React.ReactNode> = {
    happy: (
      <path d={`M${s * 0.35} ${s * 0.62} Q${s * 0.5} ${s * 0.75} ${s * 0.65} ${s * 0.62}`}
        stroke="#1a5c2e" strokeWidth={s * 0.03} fill="none" strokeLinecap="round" />
    ),
    thinking: (
      <line x1={s * 0.4} y1={s * 0.65} x2={s * 0.6} y2={s * 0.63}
        stroke="#1a5c2e" strokeWidth={s * 0.03} strokeLinecap="round" />
    ),
    wink: (
      <path d={`M${s * 0.35} ${s * 0.62} Q${s * 0.5} ${s * 0.73} ${s * 0.65} ${s * 0.62}`}
        stroke="#1a5c2e" strokeWidth={s * 0.03} fill="none" strokeLinecap="round" />
    ),
    surprised: (
      <ellipse cx={s * 0.5} cy={s * 0.65} rx={s * 0.06} ry={s * 0.08}
        fill="#1a5c2e" />
    ),
  };

  const leftEyeScaleY = mood === "wink" ? eyeScaleY : eyeScaleY;
  const rightEyeScaleY = mood === "wink" ? 0.1 : eyeScaleY;
  const eyeRy = mood === "surprised" ? s * 0.07 : s * 0.055;

  // Leaf stem on top
  const leafStem = (
    <g>
      <path
        d={`M${s * 0.5} ${s * 0.12} Q${s * 0.42} ${s * -0.02} ${s * 0.35} ${s * -0.08}`}
        stroke="#2d7a4f" strokeWidth={s * 0.025} fill="none" strokeLinecap="round"
      />
      <ellipse cx={s * 0.33} cy={s * -0.07} rx={s * 0.07} ry={s * 0.04}
        fill="#3da362" transform={`rotate(-30 ${s * 0.33} ${s * -0.07})`} />
    </g>
  );

  return (
    <motion.svg
      width={s}
      height={s}
      viewBox={`${-s * 0.05} ${-s * 0.15} ${s * 1.1} ${s * 1.1}`}
      className={className}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      {/* Shadow */}
      <ellipse cx={s * 0.5} cy={s * 0.92} rx={s * 0.3} ry={s * 0.04} fill="rgba(0,0,0,0.08)" />

      {/* Body */}
      <circle cx={s * 0.5} cy={s * 0.48} r={s * 0.38} fill="url(#ruculinGrad)" />

      {/* Gradient */}
      <defs>
        <radialGradient id="ruculinGrad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </radialGradient>
      </defs>

      {leafStem}

      {/* Cheeks */}
      <circle cx={s * 0.3} cy={s * 0.55} r={s * 0.05} fill="rgba(255,182,193,0.4)" />
      <circle cx={s * 0.7} cy={s * 0.55} r={s * 0.05} fill="rgba(255,182,193,0.4)" />

      {/* Eyes */}
      <g>
        {/* Left eye white */}
        <ellipse cx={s * 0.38} cy={s * 0.44} rx={s * 0.065} ry={s * 0.07} fill="white" />
        {/* Left pupil */}
        <motion.ellipse
          cx={s * 0.39} cy={s * 0.45} rx={s * 0.035} ry={s * 0.04}
          fill="#1a1a2e"
          animate={{ scaleY: leftEyeScaleY }}
          transition={{ duration: 0.1 }}
          style={{ transformOrigin: `${s * 0.39}px ${s * 0.45}px` }}
        />
        {/* Left eye shine */}
        <circle cx={s * 0.37} cy={s * 0.42} r={s * 0.012} fill="white" />

        {/* Right eye white */}
        <ellipse cx={s * 0.62} cy={s * 0.44} rx={s * 0.065} ry={s * 0.07} fill="white" />
        {/* Right pupil */}
        <motion.ellipse
          cx={s * 0.63} cy={s * 0.45} rx={s * 0.035} ry={s * 0.04}
          fill="#1a1a2e"
          animate={{ scaleY: rightEyeScaleY }}
          transition={{ duration: 0.1 }}
          style={{ transformOrigin: `${s * 0.63}px ${s * 0.45}px` }}
        />
        {/* Right eye shine */}
        {mood !== "wink" && (
          <circle cx={s * 0.61} cy={s * 0.42} r={s * 0.012} fill="white" />
        )}
        {/* Wink line */}
        {mood === "wink" && (
          <path
            d={`M${s * 0.56} ${s * 0.45} Q${s * 0.62} ${s * 0.49} ${s * 0.68} ${s * 0.45}`}
            stroke="#1a5c2e" strokeWidth={s * 0.025} fill="none" strokeLinecap="round"
          />
        )}
      </g>

      {/* Thinking eyebrow */}
      {mood === "thinking" && (
        <line x1={s * 0.55} y1={s * 0.35} x2={s * 0.7} y2={s * 0.33}
          stroke="#1a5c2e" strokeWidth={s * 0.025} strokeLinecap="round" />
      )}

      {/* Mouth */}
      {mouth[mood]}
    </motion.svg>
  );
}
