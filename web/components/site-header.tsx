"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";

import { SITE_ROUTES } from "@/lib/navigation";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (pathname === "/") return null;

    const segments = pathname.split("/").filter(Boolean);
    const crumbs = [{ href: "/", label: "Archive" }];

    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}/`;
      
      // Try to find a matching route label
      const route = SITE_ROUTES.find(r => r.href === currentPath || r.href === currentPath.slice(0, -1));
      const label = route ? route.label : segment.replace(/-/g, " ");

      crumbs.push({
        href: currentPath,
        label: label
      });
    });

    return crumbs;
  }, [pathname]);

  return (
    <header className="site-header" data-open={open || undefined}>
      <div className="site-header__brand-zone">
        {breadcrumbs ? (
          <nav className="header-breadcrumb" aria-label="Breadcrumb">
            <ol>
              {breadcrumbs.map((crumb, i) => (
                <li key={crumb.href}>
                  {i < breadcrumbs.length - 1 ? (
                    <Link href={crumb.href}>{crumb.label}</Link>
                  ) : (
                    <span aria-current="page">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : (
          <Link href="/" className="site-header__identity">
            Insulindian Miracle Archive
          </Link>
        )}
      </div>

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
