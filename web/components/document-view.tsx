import type { ReactNode } from "react";

import { HeroScene } from "@/components/hero-scene";
import { ProseHtml } from "@/components/prose-html";
import { SectionNav } from "@/components/section-nav";
import type { NormalizedDoc, ReferenceEntry } from "@/lib/content/types";

type DocumentViewProps = {
  document: NormalizedDoc;
  deck: string;
  slug?: string;
  references?: ReferenceEntry[];
  aside?: ReactNode;
};

export function DocumentView({
  document,
  deck,
  slug,
  references = [],
  aside,
}: DocumentViewProps) {
  return (
    <main id="main-content" className="archive-page" data-variant="archive">
      <HeroScene title={document.title} variant="archive" slug={slug} />
      <article className="document-view site-shell">
        <header className="document-view__header">
          <h1 className="headline">{document.title}</h1>
          <p className="dek">{deck}</p>
        </header>
        <div className="document-view__body">
          <div className="article-columns-2 article-body">
            <div className="drop-cap">
              <ProseHtml html={document.summaryHtml} />
            </div>
            {document.sections.map((section) => (
              <section key={section.id} id={section.id} className="section-block">
                <h2>{section.title}</h2>
                <ProseHtml html={section.html} />
              </section>
            ))}
          </div>
          <aside>
            <SectionNav
              items={document.sections.map((section) => ({
                id: section.id,
                title: section.title,
              }))}
              caption={`Source group: ${document.sourceGroup}. Tags: ${document.tags.join(", ") || "uncategorized"}.`}
            />
            {aside}
            {references.length ? (
              <div style={{ marginTop: "1.5rem" }} className="reference-grid">
                {references.slice(0, 3).map((reference) => (
                  <article key={reference.id} className="reference-card">
                    <div className="reference-card__meta">
                      {reference.category} / {reference.year ?? "n.d."}
                    </div>
                    <h3>{reference.title}</h3>
                    <p>{reference.annotation ?? reference.notes}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      </article>
    </main>
  );
}