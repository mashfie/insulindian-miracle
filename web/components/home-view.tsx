import type { ReactNode } from "react";

import { HeroScene } from "@/components/hero-scene";
import { ProseHtml } from "@/components/prose-html";
import { SectionNav } from "@/components/section-nav";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/animations";
import type { ArchivePage } from "@/lib/content/types";
import { SITE_ROUTES } from "@/lib/navigation";

type HomeViewProps = {
  archive: ArchivePage;
  visuals: ReactNode[];
  variant?: "archive" | "cartographic-ledger" | "polyhedral-report";
};

export function HomeView({
  archive,
  visuals,
  variant = "archive",
}: HomeViewProps) {
  const routeLinks = SITE_ROUTES;

  return (
    <main id="main-content" className="archive-page" data-variant={variant}>
      <HeroScene title={archive.title} variant={variant} />
      <article className="site-shell">
        <FadeIn as="section" className="intro-grid" delay={0.1}>
          <div>
            <h1 className="headline">{archive.title}</h1>
            <p className="dek">{archive.dek}</p>
            <p className="lede">{archive.lede}</p>
            <div className="lede-meta">
              <span>Terrain / Institutions / Policy</span>
              <span>Static-first exhibition</span>
              <span>{archive.references.length} anchor texts</span>
            </div>
          </div>
          <SectionNav
            items={archive.sections.map((section) => ({
              id: section.id,
              title: section.title,
            }))}
            caption="The archive now proceeds as an evidence program: cohort accounting, model structure, estimands, policy morphology, and the refusal of false totality."
          />
        </FadeIn>

        <StaggerChildren as="section" className="figure-grid section-block">
          {visuals.slice(0, 2).map((visual, index) => (
            <StaggerItem key={index}>
              {visual}
            </StaggerItem>
          ))}
        </StaggerChildren>

        {archive.sections.map((section, index) => {
          const visual = visuals[(index + 2) % visuals.length];
          const quote = archive.pullQuotes[index % Math.max(archive.pullQuotes.length, 1)];

          if (section.layout === "full") {
            return (
              <FadeIn as="section" key={section.id} id={section.id} className="section-full" delay={0.2 + index * 0.1}>
                <div className="section-kicker">Archive Chapter {String(index + 1).padStart(2, "0")}</div>
                <h2>{section.title}</h2>
                <ProseHtml html={section.html} />
                {visual ? <div className="section-full__figure" style={{ marginTop: "2rem" }}>{visual}</div> : null}
              </FadeIn>
            );
          }

          return (
            <FadeIn as="section" key={section.id} id={section.id} className="section-row section-block" delay={0.2 + index * 0.1}>
              <div className="section-row__text">
                <div className="section-kicker">Archive Chapter {String(index + 1).padStart(2, "0")}</div>
                <h2>{section.title}</h2>
                <ProseHtml html={section.html} />
              </div>
              <div className="section-row__figure">
                {visual}
                {quote ? (
                  <aside className="pull-quote">
                    <span>
                      {'\u201C'}
                      {quote.text}
                      {'\u201D'}
                    </span>
                    {quote.attribution ? (
                      <div className="pull-quote__attribution">{quote.attribution}</div>
                    ) : null}
                  </aside>
                ) : null}
              </div>
            </FadeIn>
          );
        })}

        <FadeIn as="footer" className="site-footer" delay={0.4}>
          <div className="site-footer__colophon">
            <div className="site-footer__identity">Insulindian Miracle Archive</div>
            <div className="footer-links">
              {routeLinks.map((link) => (
                <a key={link.href} className="route-link" href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </FadeIn>
      </article>
    </main>
  );
}
