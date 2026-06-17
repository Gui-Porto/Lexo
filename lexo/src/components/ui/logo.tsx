interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 36 }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="st-bg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a5b4fc" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
        <radialGradient id="st-shine" cx="35%" cy="22%" r="55%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="36" height="36" rx="9" fill="url(#st-bg)" />
      {/* Glass highlight */}
      <rect width="36" height="36" rx="9" fill="url(#st-shine)" />

      {/* STRATA bars — left-aligned, ascending width */}
      <rect x="7" y="8"  width="9"  height="5" rx="2.5" fill="white" fillOpacity="0.45" />
      <rect x="7" y="17" width="15" height="5" rx="2.5" fill="white" fillOpacity="0.75" />
      <rect x="7" y="26" width="22" height="5" rx="2.5" fill="white" />
    </svg>
  );
}

export function LogoWordmark({ size = 36 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.28 }}>
      <LogoMark size={size} />
      <span
        style={{
          fontSize: size * 0.44,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          background: "linear-gradient(135deg, #c7d2fe 0%, #818cf8 50%, #a78bfa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: 1,
          fontFamily: '"Outfit", "Inter", system-ui, sans-serif',
        }}
      >
        Lexo
      </span>
    </div>
  );
}
