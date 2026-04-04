import type { ReactNode } from "react";

import { ArchiveSettingsPanel } from "@/components/archive-settings-panel";
import { HeroScene } from "@/components/hero-scene";
import { ProseHtml } from "@/components/prose-html";
import { SectionNav } from "@/components/section-nav";
import type { ArchivePage, ReferenceEntry } from "@/lib/content/types";
import { SITE_ROUTES } from "@/lib/navigation";

type HomeViewProps = {
  archive: ArchivePage;
  references: ReferenceEntry[];
  visuals: ReactNode[];
  variant?: "archive" | "cartographic-ledger" | "polyhedral-report";
};

export function HomeView({
  archive,
  references,
  visuals,
  variant = "archive",
}: HomeViewProps) {
  const routeLinks = SITE_ROUTES;

  return (
    <main id="main-content" className="archive-page" data-variant={variant}>
      <ArchiveSettingsPanel
        links={routeLinks}
        accentLabel={variant === "polyhedral-report" ? "Brass / umber" : "Sea-green / ink"}
        motionLabel="Atlas kinetics"
      />
      <HeroScene title={archive.title} variant={variant} />
      <article className="site-shell">
        <section className="intro-grid motion-reveal" style={{ ["--reveal-order" as string]: 0 }}>
          <div>
            <div className="eyebrow">Insulindian Miracle Archive</div>
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
            caption="The archive proceeds like an annotated field report: terrain first, then policy, then the consequences of choosing speed over durability."
          />
        </section>

        <section className="figure-grid section-block">
          {visuals.slice(0, 2).map((visual, index) => (
            <div key={index} className="motion-reveal" style={{ ["--reveal-order" as string]: index + 1 }}>
              {visual}
            </div>
          ))}
        </section>

        {archive.sections.map((section, index) => {
          const visual = visuals[(index + 2) % visuals.length];
          const quote = archive.pullQuotes[index % Math.max(archive.pullQuotes.length, 1)];

          if (section.layout === "full") {
            return (
              <section key={section.id} id={section.id} className="section-full motion-reveal" style={{ ["--reveal-order" as string]: index + 2 }}>
                <div className="section-kicker">Archive Chapter {String(index + 1).padStart(2, "0")}</div>
                <h2>{section.title}</h2>
                <ProseHtml html={section.html} />
                {visual ? <div className="section-full__figure" style={{ marginTop: "2rem" }}>{visual}</div> : null}
              </section>
            );
          }

          return (
            <section key={section.id} id={section.id} className="section-row section-block motion-reveal" style={{ ["--reveal-order" as string]: index + 2 }}>
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
            </section>
          );
        })}

        <footer className="site-footer section-block">
          <div className="site-footer__figure">
            <div className="pull-quote">
              <span>
                {'\u201C'}
                The archive is trying to keep two incompatible things visible at once: the lure of
                extractive acceleration and the slow institutional cost it conceals.
                {'\u201D'}
              </span>
              <div className="pull-quote__attribution">Landing plate</div>
            </div>
          </div>
          <div>
            <div className="section-kicker">Annotated Archive</div>
            <h2 style={{ fontSize: "2.8rem" }}>Reference Field</h2>
            <div className="reference-grid">
              {references.slice(0, 4).map((reference) => (
                <article key={reference.id} className="reference-card">
                  <div className="reference-card__meta">
                    {reference.category} / {reference.year ?? "n.d."}
                  </div>
                  <h3>{reference.title}</h3>
                  <p>{reference.annotation ?? reference.notes}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="site-footer__colophon">
            <div className="site-footer__identity">Insulindian Miracle Archive</div>
            <div className="footer-links">
              {routeLinks.map((link) => (
                <a key={link.href} className="route-link" href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
            <div className="site-footer__tagline">
              An editorial exhibition on city formation and multi-armed bandits.
            </div>
          </div>
        </footer>
      </article>
    </main>
  );
}
