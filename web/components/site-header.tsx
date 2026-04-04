"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SITE_ROUTES } from "@/lib/navigation";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="site-header" data-open={open || undefined}>
      <Link href="/" className="site-header__identity">
        Insulindian Miracle Archive
      </Link>
      <button
        className="site-header__toggle"
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="site-header__hamburger" />
      </button>
      <nav className="site-header__nav" aria-label="Main navigation">
        {SITE_ROUTES.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={`site-header__link${pathname === route.href || (route.href !== "/" && pathname.startsWith(route.href)) ? " is-active" : ""}`}
            onClick={() => setOpen(false)}
          >
            {route.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
