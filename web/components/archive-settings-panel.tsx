"use client";

import { useEffect, useEffectEvent, useState } from "react";

type ArchiveSettingsPanelProps = {
  links?: readonly { href: string; label: string }[];
  accentLabel: string;
  motionLabel: string;
};

export function ArchiveSettingsPanel({
  accentLabel,
  motionLabel,
}: ArchiveSettingsPanelProps) {
  const [visible, setVisible] = useState(false);

  const handleScroll = useEffectEvent(() => {
    setVisible(window.scrollY > 320);
  });

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <details className={`settings-panel${visible ? " visible" : ""}`}>
      <summary className="settings-title">
        <span>Archive Controls</span>
        <span className="details-icon-closed" aria-hidden="true">
          &gt;
        </span>
      </summary>
      <div>
        <div className="settings-section-title">
          <span>Register</span>
          <span>{accentLabel}</span>
        </div>
        <div className="settings-fields">
          <div className="settings-note">{motionLabel}</div>
        </div>
      </div>
    </details>
  );
}
