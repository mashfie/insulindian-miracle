type HeroSceneProps = {
  title: string;
  variant: "archive" | "cartographic-ledger" | "polyhedral-report";
};

const VARIANT_ACCENT: Record<HeroSceneProps["variant"], string> = {
  archive: "#2e4d5d",
  "cartographic-ledger": "#3f5c52",
  "polyhedral-report": "#714b33",
};

export function HeroScene({ title, variant }: HeroSceneProps) {
  const accent = VARIANT_ACCENT[variant];

  return (
    <section className="site-hero" aria-hidden="true">
      <svg
        className="site-hero__stage"
        viewBox="0 0 1440 980"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`ledger-grid-${variant}`} width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" stroke="rgba(19,19,19,0.12)" strokeWidth="1" />
          </pattern>
          <pattern id={`contours-${variant}`} width="180" height="180" patternUnits="userSpaceOnUse">
            <path
              d="M0 120C52 40 118 40 180 102"
              stroke="rgba(19,19,19,0.12)"
              strokeWidth="1.1"
            />
            <path
              d="M-18 154C42 86 114 76 194 130"
              stroke="rgba(19,19,19,0.08)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="1440" height="980" fill={`url(#ledger-grid-${variant})`} />
        <rect width="1440" height="980" fill={`url(#contours-${variant})`} opacity="0.9" />
        <g className="slice-in" style={{ transformOrigin: "50% 50%" }}>
          <path
            d="M210 222L502 118L810 248L686 548L380 584L210 222Z"
            fill="rgba(255,255,255,0.36)"
            stroke="rgba(19,19,19,0.18)"
            strokeWidth="2"
          />
          <path
            d="M810 248L1042 164L1218 352L990 562L686 548L810 248Z"
            fill="rgba(255,255,255,0.18)"
            stroke={accent}
            strokeWidth="2.6"
          />
          <path
            d="M380 584L686 548L990 562L1160 770L748 844L402 786L380 584Z"
            fill="rgba(255,255,255,0.22)"
            stroke="rgba(19,19,19,0.18)"
            strokeWidth="2"
          />
          <path
            d="M498 118L678 12L1054 72L1042 164L810 248L498 118Z"
            fill="rgba(255,255,255,0.16)"
            stroke="rgba(19,19,19,0.12)"
            strokeWidth="1.8"
          />
          <path
            d="M468 602L612 472L804 494L870 676L674 750L468 602Z"
            fill="rgba(255,255,255,0.08)"
            stroke={accent}
            strokeDasharray="9 8"
            strokeWidth="2"
          />
          <path
            d="M746 240L838 312L770 420L640 386L658 280L746 240Z"
            fill="rgba(19,19,19,0.06)"
            stroke="rgba(19,19,19,0.22)"
            strokeWidth="2"
          />
          <path
            d="M286 262L448 212L544 332L382 386L286 262Z"
            fill="rgba(255,255,255,0.12)"
            stroke={accent}
            strokeWidth="1.6"
          />
          <path
            d="M1074 260L1194 354L1108 458L966 404L1074 260Z"
            fill="rgba(19,19,19,0.04)"
            stroke="rgba(19,19,19,0.16)"
            strokeWidth="1.6"
          />
        </g>
        <g opacity="0.75">
          <path d="M112 716L316 716" stroke={accent} strokeWidth="1.5" />
          <path d="M112 748L380 748" stroke="rgba(19,19,19,0.18)" strokeWidth="1.2" />
          <path d="M112 780L284 780" stroke="rgba(19,19,19,0.18)" strokeWidth="1.2" />
        </g>
        <text
          x="112"
          y="852"
          fill="rgba(19,19,19,0.82)"
          fontFamily="var(--font-suisse)"
          fontSize="16"
          letterSpacing="5.6"
        >
          {title.toUpperCase()}
        </text>
      </svg>
    </section>
  );
}
