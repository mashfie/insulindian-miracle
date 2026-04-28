import type { ReactNode } from "react";

import { HeroScene } from "@/components/hero-scene";
import { ProseHtml } from "@/components/prose-html";
import { SectionNav } from "@/components/section-nav";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/animations";
import type { NormalizedDoc, ReferenceEntry } from "@/lib/content/types";

type DocumentViewProps = {
  document: NormalizedDoc;
  deck: string;
  slug?: string;
  references?: ReferenceEntry[];
  aside?: ReactNode;
  visuals?: ReactNode[];
};

export function DocumentView({
  document,
  deck,
  slug,
  references = [],
  aside,
  visuals = [],
}: DocumentViewProps) {
  return (
    <main id="main-content" className="archive-page" data-variant="archive">
      <HeroScene title={document.title} variant="archive" slug={slug} />
      <article className="document-view site-shell">
        <FadeIn as="header" className="document-view__header">
          <h1 className="headline">{document.title}</h1>
          <p className="dek">{deck}</p>
        </FadeIn>
        <div className="document-view__body">
          <div className="article-columns-2 article-body">
            <FadeIn delay={0.2} className="drop-cap">
              <ProseHtml html={document.summaryHtml} />
            </FadeIn>
            {visuals[0] ? <FadeIn delay={0.3} className="figure-embed">{visuals[0]}</FadeIn> : null}
            {document.sections.map((section, index) => (
              <FadeIn delay={0.4 + index * 0.1} as="section" key={section.id} id={section.id} className="section-block">
                <h2>{section.title}</h2>
                <ProseHtml html={section.html} />
                {visuals[index + 1] ? <div className="figure-embed">{visuals[index + 1]}</div> : null}
              </FadeIn>
            ))}
          </div>
          <aside>
            <FadeIn delay={0.2}>
              <SectionNav
                items={document.sections.map((section) => ({
                  id: section.id,
                  title: section.title,
                }))}
                caption={`Source group: ${document.sourceGroup}. Tags: ${document.tags.join(", ") || "uncategorized"}.`}
              />
            </FadeIn>
            {aside ? <FadeIn delay={0.3}>{aside}</FadeIn> : null}
            {references.length ? (
              <StaggerChildren className="reference-grid" style={{ marginTop: "1.5rem" }}>
                {references.slice(0, 3).map((reference) => (
                  <StaggerItem key={reference.id}>
                    <article className="reference-card">
                      <div className="reference-card__meta">
                        {reference.category} / {reference.year ?? "n.d."}
                      </div>
                      <h3>{reference.title}</h3>
                      <p>{reference.annotation ?? reference.notes}</p>
                    </article>
                  </StaggerItem>
                ))}
              </StaggerChildren>
            ) : null}
          </aside>
        </div>
      </article>
    </main>
  );
}