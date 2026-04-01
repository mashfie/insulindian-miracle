"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";

type SettingsLink = {
  href: string;
  label: string;
};

type ArchiveSettingsPanelProps = {
  links: SettingsLink[];
  accentLabel: string;
  motionLabel: string;
};

export function ArchiveSettingsPanel({
  links,
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
    <details className={`settings-panel${visible ? " visible" : ""}`} open>
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
        <div className="settings-section-title">
          <span>Routes</span>
          <span>{links.length}</span>
        </div>
        <div className="settings-fields settings-links">
          <div className="settings-note">
            The shell keeps the page in report mode: one hero plate, then alternating editorial bands.
          </div>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}
