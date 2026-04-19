import Link from "next/link";

import { HeroScene } from "@/components/hero-scene";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/animations";

type CatalogItem = {
  href: string;
  meta: string;
  title: string;
  description: string;
};

export function CatalogGrid({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: CatalogItem[];
}) {
  return (
    <main id="main-content" className="archive-page" data-variant="archive">
      <HeroScene title={title} variant="archive" />
      <article className="document-view site-shell">
        <FadeIn as="header" className="document-view__header">
          <h1 className="headline">{title}</h1>
          <p className="dek">{description}</p>
        </FadeIn>
        <StaggerChildren as="section" className="index-grid">
          {items.map((item) => (
            <StaggerItem key={item.href}>
              <Link href={item.href} className="index-card">
                <div className="index-card__meta">{item.meta}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </article>
    </main>
  );
}
