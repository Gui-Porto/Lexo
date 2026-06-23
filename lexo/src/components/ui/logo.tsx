interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 36 }: LogoMarkProps) {
  const iconSize = Math.round(size * 0.56);
  const radius = Math.round(size * 0.265);
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "oklch(0.18 0.02 264)",
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 4.5V15H15" />
        <path d="M5 19.5h14" stroke="oklch(0.72 0.16 290)" strokeWidth={2} />
      </svg>
    </span>
  );
}

export function LogoWordmark({ size = 36 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(size * 0.31) }}>
      <LogoMark size={size} />
      <span
        style={{
          fontSize: size * 0.63,
          fontWeight: 700,
          letterSpacing: "-0.033em",
          color: "oklch(0.98 0.008 264)",
          lineHeight: 1,
          fontFamily: '"Geist", var(--font-geist), sans-serif',
        }}
      >
        Lexo
      </span>
    </div>
  );
}
