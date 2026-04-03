import Link from "next/link";

import { ArchiveSettingsPanel } from "@/components/archive-settings-panel";
import { HeroScene } from "@/components/hero-scene";

type CatalogItem = {
  href: string;
  meta: string;
  title: string;
  description: string;
};

export function CatalogGrid({
  title,
  eyebrow,
  description,
  items,
}: {
  title: string;
  eyebrow: string;
  description: string;
  items: CatalogItem[];
}) {
  return (
    <main id="main-content" className="archive-page" data-variant="archive">
      <ArchiveSettingsPanel
        links={[
          { href: "/", label: "Home" },
          { href: "/atlas/", label: "Atlas" },
          { href: "/scenarios/", label: "Scenarios" },
          { href: "/policies/", label: "Policies" },
          { href: "/references/", label: "References" },
        ]}
        accentLabel="Paper / ink"
        motionLabel="Atlas kinetics"
      />
      <HeroScene title={title} variant="archive" />
      <article className="document-view site-shell">
        <header className="document-view__header">
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="headline">{title}</h1>
          <p className="dek">{description}</p>
        </header>
        <section className="index-grid">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="index-card">
              <div className="index-card__meta">{item.meta}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Link>
          ))}
        </section>
      </article>
    </main>
  );
}
