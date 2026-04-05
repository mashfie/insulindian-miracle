import React from "react";

type IconProps = { size?: number; color?: string };

// --- SOVIET STYLE (Industrial, Heavy, Constructivist) ---

export const SovietCubeIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="3" />
    <path d="M3 7L12 12L21 7M12 12V22" stroke={color} strokeWidth="3" />
  </svg>
);

export const SovietCircleIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="4" />
    <path d="M12 8V16M8 12H16" stroke={color} strokeWidth="2" />
  </svg>
);

export const SovietTriangleIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3L21 19H3L12 3Z" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="3" />
    <rect x="10.5" y="10" width="3" height="6" fill={color} />
  </svg>
);

export const SovietGridIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 4H20V20H4V4Z" stroke={color} strokeWidth="3" />
    <path d="M12 4V20M4 12H20" stroke={color} strokeWidth="3" />
  </svg>
);

export const SovietPlusIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 4V20M4 12H20" stroke={color} strokeWidth="4" strokeLinecap="square" />
  </svg>
);

export const SovietMinusIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 12H20" stroke={color} strokeWidth="4" strokeLinecap="square" />
  </svg>
);

export const SovietLeverIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="18" width="18" height="4" fill={color} />
    <path d="M12 18V4" stroke={color} strokeWidth="4" />
    <circle cx="12" cy="4" r="3" fill={color} />
  </svg>
);

export const SovietDiceIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="16" height="16" stroke={color} strokeWidth="3" />
    <rect x="7" y="7" width="3" height="3" fill={color} />
    <rect x="14" y="14" width="3" height="3" fill={color} />
    <rect x="10.5" y="10.5" width="3" height="3" fill={color} />
  </svg>
);

export const SovietCrosshairIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2.5" />
    <path d="M12 2V22M2 12H22" stroke={color} strokeWidth="1.5" />
    <rect x="10.5" y="10.5" width="3" height="3" fill={color} />
  </svg>
);

export const SovietScaleIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 4V20M4 21H20" stroke={color} strokeWidth="3" strokeLinecap="square" />
    <path d="M3 10L12 6L21 10" stroke={color} strokeWidth="3" />
    <rect x="2" y="12" width="4" height="2" fill={color} />
    <rect x="18" y="12" width="4" height="2" fill={color} />
  </svg>
);

export const SovietWaveIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M2 12L7 7L12 12L17 17L22 12" stroke={color} strokeWidth="4" strokeLinejoin="miter" />
  </svg>
);

export const SovietPeakIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 22H22L12 2Z" fill={color} fillOpacity="0.2" />
    <path d="M12 2L2 22M12 2L22 22" stroke={color} strokeWidth="4" />
    <path d="M7 12H17" stroke={color} strokeWidth="2" />
  </svg>
);

export const SovietArrowIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M2 12H22M22 12L14 4M22 12L14 20" stroke={color} strokeWidth="4" strokeLinecap="square" />
  </svg>
);

export const SovietInfoIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" stroke={color} strokeWidth="3" />
    <rect x="10.5" y="7" width="3" height="3" fill={color} />
    <rect x="10.5" y="11" width="3" height="6" fill={color} />
  </svg>
);

// --- ABORETO STYLE (Renaissance, Roman, Classical Serif) ---

export const AboretoCubeIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3L4 7V17L12 21L20 17V7L12 3Z" stroke={color} strokeWidth="0.8" />
    <path d="M12 3V21M4 7L20 17M20 7L4 17" stroke={color} strokeWidth="0.5" opacity="0.6" />
    <circle cx="12" cy="12" r="1.5" fill={color} />
  </svg>
);

export const AboretoCircleIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1" />
    <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="0.5" strokeDasharray="1 1" />
    <path d="M12 8V16M8 12H16" stroke={color} strokeWidth="0.5" />
  </svg>
);

export const AboretoTriangleIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 4L21 19H3L12 4Z" stroke={color} strokeWidth="1" />
    <path d="M12 4V19" stroke={color} strokeWidth="0.5" opacity="0.5" />
    <path d="M8 12H16" stroke={color} strokeWidth="0.5" opacity="0.5" />
  </svg>
);

export const AboretoGridIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="5" y="5" width="14" height="14" stroke={color} strokeWidth="1" />
    <path d="M12 5V19M5 12H19" stroke={color} strokeWidth="0.5" />
    <circle cx="12" cy="12" r="1" fill={color} />
  </svg>
);

export const AboretoPlusIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 5V19M5 12H19" stroke={color} strokeWidth="1.2" />
    <path d="M11 5H13M11 19H13M5 11V13M19 11V13" stroke={color} strokeWidth="1" />
  </svg>
);

export const AboretoMinusIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12H19" stroke={color} strokeWidth="1.2" />
    <path d="M5 11V13M19 11V13" stroke={color} strokeWidth="1" />
  </svg>
);

export const AboretoLeverIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 20H18" stroke={color} strokeWidth="1.5" />
    <path d="M12 20V8" stroke={color} strokeWidth="1" />
    <circle cx="12" cy="6" r="3" stroke={color} strokeWidth="1" />
    <path d="M10 6C10 6 11 5 12 5C13 5 14 6 14 6" stroke={color} strokeWidth="0.5" />
  </svg>
);

export const AboretoDiceIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="5" y="5" width="14" height="14" stroke={color} strokeWidth="1" rx="2" />
    <circle cx="12" cy="12" r="1.5" stroke={color} strokeWidth="0.5" />
    <circle cx="8" cy="8" r="1.2" fill={color} />
    <circle cx="16" cy="16" r="1.2" fill={color} />
  </svg>
);

export const AboretoCrosshairIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1" />
    <circle cx="12" cy="12" r="0.5" fill={color} />
    <path d="M12 2V22M2 12H22" stroke={color} strokeWidth="0.3" opacity="0.5" />
    <path d="M12 4V7M12 17V20M4 12H7M17 12H20" stroke={color} strokeWidth="1" />
  </svg>
);

export const AboretoScaleIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 6V19M6 19H18" stroke={color} strokeWidth="1" />
    <path d="M6 10L12 8L18 10" stroke={color} strokeWidth="1" />
    <circle cx="6" cy="14" r="2.5" stroke={color} strokeWidth="0.8" />
    <circle cx="18" cy="14" r="2.5" stroke={color} strokeWidth="0.8" />
  </svg>
);

export const AboretoWaveIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 12C3 12 6 8 12 12C18 16 21 12 21 12" stroke={color} strokeWidth="1" />
    <path d="M3 15C3 15 6 11 12 15C18 19 21 15 21 15" stroke={color} strokeWidth="0.5" opacity="0.6" />
    <path d="M3 9C3 9 6 5 12 9C18 13 21 9 21 9" stroke={color} strokeWidth="0.5" opacity="0.6" />
  </svg>
);

export const AboretoPeakIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 4L4 18H20L12 4Z" stroke={color} strokeWidth="1" />
    <path d="M12 4L12 18" stroke={color} strokeWidth="0.5" opacity="0.4" />
    <path d="M10 10H14" stroke={color} strokeWidth="0.5" />
    <path d="M9 13H15" stroke={color} strokeWidth="0.5" />
  </svg>
);

export const AboretoArrowIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 12H20M20 12L15 8M20 12L15 16" stroke={color} strokeWidth="1" />
    <path d="M15 7V9M15 15V17" stroke={color} strokeWidth="0.8" />
  </svg>
);

export const AboretoInfoIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1" />
    <path d="M12 10V16" stroke={color} strokeWidth="1.2" />
    <circle cx="12" cy="8" r="1" fill={color} />
  </svg>
);

// --- KILIM STYLE (Handwoven Rugs, Tribal Geometry, Persian/Turkish Motifs) ---

export const KilimCubeIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke={color} strokeWidth="1.5" />
    <path d="M12 22V12M12 12L3 7M12 12L21 7" stroke={color} strokeWidth="1" />
    <path d="M12 6L9 8L12 10L15 8L12 6Z" fill={color} fillOpacity="0.2" />
    <path d="M6 14L9 12.5V15.5L6 14Z" fill={color} fillOpacity="0.2" />
    <path d="M18 14L15 12.5V15.5L18 14Z" fill={color} fillOpacity="0.2" />
  </svg>
);

export const KilimCircleIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
    <path d="M12 3L14 12L12 21L10 12L12 3Z" fill={color} fillOpacity="0.3" />
    <path d="M3 12L12 14L21 12L12 10L3 12Z" fill={color} fillOpacity="0.3" />
    <rect x="11" y="11" width="2" height="2" fill={color} />
  </svg>
);

export const KilimTriangleIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3L21 19H3L12 3Z" stroke={color} strokeWidth="2" />
    <path d="M12 7L15 13H9L12 7Z" fill={color} />
    <path d="M6 19L4 22H20L18 19" stroke={color} strokeWidth="1" />
  </svg>
);

export const KilimGridIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="16" height="16" stroke={color} strokeWidth="1.5" />
    <path d="M4 12H20M12 4V20" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
    <path d="M8 8L12 4L16 8L12 12L8 8Z" fill={color} fillOpacity="0.2" />
    <path d="M8 16L12 12L16 16L12 20L8 16Z" fill={color} fillOpacity="0.2" />
  </svg>
);

export const KilimPlusIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 4V20M4 12H20" stroke={color} strokeWidth="2.5" />
    <path d="M10 4L12 2L14 4M10 20L12 22L14 20M4 10L2 12L4 14M20 10L22 12L20 14" stroke={color} strokeWidth="1.5" />
  </svg>
);

export const KilimMinusIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 12H20" stroke={color} strokeWidth="3" />
    <path d="M4 10L2 12L4 14M20 10L22 12L20 14" stroke={color} strokeWidth="1.5" />
  </svg>
);

export const KilimLeverIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 20H20V22H4V20Z" fill={color} />
    <path d="M12 20V8" stroke={color} strokeWidth="2" />
    <path d="M12 4L8 8L12 12L16 8L12 4Z" fill={color} />
    <path d="M10 20L8 16M14 20L16 16" stroke={color} strokeWidth="1" />
  </svg>
);

export const KilimDiceIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="16" height="16" stroke={color} strokeWidth="2" />
    <path d="M8 8L10 10L8 12L6 10L8 8Z" fill={color} />
    <path d="M16 12L18 14L16 16L14 14L16 12Z" fill={color} />
    <path d="M12 10L14 12L12 14L10 12L12 10Z" fill={color} fillOpacity="0.4" />
  </svg>
);

export const KilimCrosshairIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="16" height="16" stroke={color} strokeWidth="1" strokeDasharray="1 1" />
    <path d="M12 2V22M2 12H22" stroke={color} strokeWidth="1" />
    <path d="M12 8L16 12L12 16L8 12L12 8Z" stroke={color} strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1" fill={color} />
  </svg>
);

export const KilimScaleIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 4V20M4 20H20" stroke={color} strokeWidth="2" />
    <path d="M4 10L12 6L20 10" stroke={color} strokeWidth="2" />
    <path d="M3 14L5 10L7 14H3Z" fill={color} />
    <path d="M17 14L19 10L21 14H17Z" fill={color} />
  </svg>
);

export const KilimWaveIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M2 12L6 8L10 12L14 8L18 12L22 8" stroke={color} strokeWidth="2" strokeLinejoin="miter" />
    <path d="M2 16L6 12L10 16L14 12L18 16L22 12" stroke={color} strokeWidth="1" strokeLinejoin="miter" opacity="0.5" />
  </svg>
);

export const KilimPeakIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 4L2 20H22L12 4Z" stroke={color} strokeWidth="2" />
    <path d="M12 8L14 12L12 16L10 12L12 8Z" fill={color} />
    <path d="M8 20L10 17M16 20L14 17" stroke={color} strokeWidth="1" />
  </svg>
);

export const KilimArrowIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M2 12H22M22 12L16 6M22 12L16 18" stroke={color} strokeWidth="2.5" />
    <path d="M14 12L10 8V16L14 12Z" fill={color} fillOpacity="0.4" />
  </svg>
);

export const KilimInfoIcon = ({ size = 24, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="16" height="16" stroke={color} strokeWidth="2" />
    <path d="M12 8V16" stroke={color} strokeWidth="2" />
    <rect x="11" y="6" width="2" height="1" fill={color} />
    <path d="M8 4L12 2L16 4M8 20L12 22L16 20" stroke={color} strokeWidth="1" />
  </svg>
);

// --- STYLE LOOKUP HELPER ---

export type ThematicIconStyle = "soviet" | "aboreto" | "kilim" | "bauhaus";

export const getThematicIcons = (style: ThematicIconStyle) => {
  if (style === "soviet") {
    return {
      Cube: SovietCubeIcon,
      Circle: SovietCircleIcon,
      Triangle: SovietTriangleIcon,
      Grid: SovietGridIcon,
      Plus: SovietPlusIcon,
      Minus: SovietMinusIcon,
      Lever: SovietLeverIcon,
      Dice: SovietDiceIcon,
      Crosshair: SovietCrosshairIcon,
      Scale: SovietScaleIcon,
      Wave: SovietWaveIcon,
      Peak: SovietPeakIcon,
      Arrow: SovietArrowIcon,
      Info: SovietInfoIcon,
    };
  }
  if (style === "aboreto") {
    return {
      Cube: AboretoCubeIcon,
      Circle: AboretoCircleIcon,
      Triangle: AboretoTriangleIcon,
      Grid: AboretoGridIcon,
      Plus: AboretoPlusIcon,
      Minus: AboretoMinusIcon,
      Lever: AboretoLeverIcon,
      Dice: AboretoDiceIcon,
      Crosshair: AboretoCrosshairIcon,
      Scale: AboretoScaleIcon,
      Wave: AboretoWaveIcon,
      Peak: AboretoPeakIcon,
      Arrow: AboretoArrowIcon,
      Info: AboretoInfoIcon,
    };
  }
  if (style === "kilim") {
    return {
      Cube: KilimCubeIcon,
      Circle: KilimCircleIcon,
      Triangle: KilimTriangleIcon,
      Grid: KilimGridIcon,
      Plus: KilimPlusIcon,
      Minus: KilimMinusIcon,
      Lever: KilimLeverIcon,
      Dice: KilimDiceIcon,
      Crosshair: KilimCrosshairIcon,
      Scale: KilimScaleIcon,
      Wave: KilimWaveIcon,
      Peak: KilimPeakIcon,
      Arrow: KilimArrowIcon,
      Info: KilimInfoIcon,
    };
  }
  // Default to Bauhaus
  return {
    Cube: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" fill="currentColor" /></svg>,
    Circle: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="currentColor" /></svg>,
    Triangle: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><path d="M12 4L20 18H4L12 4Z" fill="currentColor" /></svg>,
    Grid: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><path d="M4 4H10V10H4V4ZM14 4H20V10H14V4ZM4 14H10V20H4V14ZM14 14H20V20H14V14Z" fill="currentColor" /></svg>,
    Plus: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z" fill="currentColor" /></svg>,
    Minus: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><path d="M5 11H19V13H5V11Z" fill="currentColor" /></svg>,
    Lever: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><rect x="11" y="4" width="2" height="12" fill="currentColor" /><circle cx="12" cy="4" r="3" fill="currentColor" /><rect x="4" y="18" width="16" height="2" fill="currentColor" /></svg>,
    Dice: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" /><circle cx="8" cy="8" r="1.5" fill="currentColor" /><circle cx="16" cy="16" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>,
    Crosshair: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" /><path d="M12 2V22M2 12H22" stroke="currentColor" strokeWidth="1" /></svg>,
    Scale: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><path d="M12 4V20M4 20H20M6 10L12 6L18 10" stroke="currentColor" strokeWidth="2" /></svg>,
    Wave: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><path d="M2 12C2 12 5 8 12 12C19 16 22 12 22 12" stroke="currentColor" strokeWidth="2" /></svg>,
    Peak: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><path d="M12 4L4 20H20L12 4Z" fill="currentColor" opacity="0.3" /><path d="M12 4L4 20M12 4L20 20" stroke="currentColor" strokeWidth="2" /></svg>,
    Arrow: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><path d="M4 12H20M20 12L14 6M20 12L14 18" stroke="currentColor" strokeWidth="2" /></svg>,
    Info: (props: IconProps) => <svg {...props} width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 11V17M12 7V9" stroke="currentColor" strokeWidth="2" /></svg>,
  };
};

// --- RE-EXPORT ORIGINAL BAUHAUS SET FOR COMPATIBILITY ---
export * from "./bauhaus-icons";
