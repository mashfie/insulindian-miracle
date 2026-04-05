"use client";

import React from "react";

export const BauhausCubeIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 22V12" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 12L3 7" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 12L21 7" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export const BauhausCircleIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="3" />
    <circle cx="12" cy="12" r="2" fill={color} />
  </svg>
);

export const BauhausTriangleIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L20 18H4L12 4Z" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
    <rect x="11" y="11" width="2" height="4" fill={color} />
  </svg>
);

export const BauhausGridIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="6" height="6" stroke={color} strokeWidth="2" />
    <rect x="14" y="4" width="6" height="6" stroke={color} strokeWidth="2" />
    <rect x="4" y="14" width="6" height="6" stroke={color} strokeWidth="2" />
    <rect x="14" y="14" width="6" height="6" stroke={color} strokeWidth="2" />
  </svg>
);

export const BauhausPlusIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4V20M4 12H20" stroke={color} strokeWidth="3" strokeLinecap="square" />
  </svg>
);

export const BauhausMinusIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12H20" stroke={color} strokeWidth="3" strokeLinecap="square" />
  </svg>
);

export const BauhausLeverIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="18" width="16" height="3" fill={color} />
    <path d="M12 18V10" stroke={color} strokeWidth="2.5" />
    <circle cx="12" cy="6" r="4" stroke={color} strokeWidth="2.5" />
    <path d="M10 6L14 6" stroke={color} strokeWidth="1.5" />
  </svg>
);

export const BauhausDiceIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" stroke={color} strokeWidth="2" rx="1" />
    <circle cx="8" cy="8" r="1.5" fill={color} />
    <circle cx="16" cy="16" r="1.5" fill={color} />
    <circle cx="12" cy="12" r="1.5" fill={color} />
  </svg>
);

export const BauhausCrosshairIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
    <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke={color} strokeWidth="2" />
    <rect x="11" y="11" width="2" height="2" fill={color} />
  </svg>
);

export const BauhausScaleIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4V20M4 20H20" stroke={color} strokeWidth="2" strokeLinecap="square" />
    <path d="M4 10L12 7L20 10" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="4" cy="14" r="3" stroke={color} strokeWidth="1.5" />
    <circle cx="20" cy="14" r="3" stroke={color} strokeWidth="1.5" />
  </svg>
);

export const BauhausWaveIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 12C2 12 5 7 12 12C19 17 22 12 22 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M2 17C2 17 5 12 12 17C19 22 22 17 22 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M2 7C2 7 5 2 12 7C19 12 22 7 22 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

export const BauhausPeakIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20L12 4L20 20" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <path d="M8 12L12 8L16 12" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <rect x="11" y="16" width="2" height="4" fill={color} />
  </svg>
);

export const BauhausArrowIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12H20M20 12L14 6M20 12L14 18" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="round" />
  </svg>
);

export const BauhausInfoIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <rect x="11" y="10" width="2" height="7" fill={color} />
    <rect x="11" y="7" width="2" height="2" fill={color} />
  </svg>
);
