import type { ReactNode } from "react";

import { ComparisonModule } from "@/components/comparison-module";
import { HeroScene } from "@/components/hero-scene";
import { ProseHtml } from "@/components/prose-html";
import { SectionNav } from "@/components/section-nav";
import { StatsTable } from "@/components/figures";
import type { ScenarioPage } from "@/lib/content/types";
import { SITE_ROUTES } from "@/lib/navigation";

type ScenarioViewProps = {
  page: ScenarioPage;
  visuals: ReactNode[];
  variant?: "archive" | "cartographic-ledger" | "polyhedral-report";
};

export function ScenarioView({
  page,
  visuals,
  variant = "archive",
}: ScenarioViewProps) {
  const archive = page.archive;
  const navItems = archive.sections.map((section) => ({
    id: section.id,
    title: section.title,
  }));

  return (
    <main id="main-content" className="archive-page" data-variant={variant}>
      <HeroScene title={archive.title} variant={variant} slug={page.slug} />
      <article className="site-shell">
        <section className="intro-grid motion-reveal" style={{ ["--reveal-order" as string]: 0 }}>
          <div>
            <h1 className="headline">{archive.title}</h1>
            <p className="dek">{archive.dek}</p>
            <p className="lede">{archive.lede}</p>
            <div className="lede-meta">
              <span>{page.result?.runs ?? 0} experimental runs</span>
              <span>{page.result?.policyKeys.length ?? 0} tracked policies</span>
              <span>{page.document?.title ?? "scenario dossier"}</span>
            </div>
          </div>
          <SectionNav
            items={navItems}
            caption={
              page.result?.scenario.description ??
              "This route pairs archive prose with the experiment record and a live compare hook."
            }
          />
        </section>

        <section className="section-block scenario-trajectory">
          {visuals[1]}
        </section>

        <section className="stats-grid section-block">
          <StatsTable title="Scenario summary" rows={page.stats} />
          {visuals[0]}
        </section>

        {archive.sections.map((section, index) => {
          // Skip first two visuals as they are already used prominently at the top.
          // Skip the last visual if it's the duplicate stats table (index 4).
          const availableVisuals = visuals.slice(2, 4);
          const visual = availableVisuals[index % availableVisuals.length];

          return (
            <section key={section.id} id={section.id} className="section-row section-block motion-reveal" style={{ ["--reveal-order" as string]: index + 1 }}>
              <div className="section-row__text">
                <div className="section-kicker">Scenario reading {String(index + 1).padStart(2, "0")}</div>
                <h2>{section.title}</h2>
                <div className={index === 0 ? "article-columns-2 article-body drop-cap" : "article-columns-2 article-body"}>
                  <ProseHtml html={section.html} />
                </div>
                {index === archive.sections.length - 1 && page.document ? (
                  <div style={{ marginTop: "2rem" }}>
                    <div className="section-kicker">Repository note</div>
                    <ProseHtml html={page.document.summaryHtml} />
                  </div>
                ) : null}
              </div>
              <div className="section-row__figure">
                {visual}
                {archive.pullQuotes[index] ? (
                  <aside className="pull-quote">
                    <span>
                      {'\u201C'}
                      {archive.pullQuotes[index]?.text}
                      {'\u201D'}
                    </span>
                    {archive.pullQuotes[index]?.attribution ? (
                      <div className="pull-quote__attribution">
                        {archive.pullQuotes[index]?.attribution}
                      </div>
                    ) : null}
                  </aside>
                ) : null}
              </div>
            </section>
          );
        })}

        <section className="section-full section-block">
          <div className="section-kicker">Runtime Hook</div>
          <ComparisonModule
            scenario={page.result?.scenario.name ?? "baseline"}
            policies={["ucb1", "gaussian-thompson", "whittle-index"]}
            note="The core route is statically generated from checked-in results. This module is the only client-side bridge to the Python compare API."
          />
        </section>
      </article>
    </main>
  );
}