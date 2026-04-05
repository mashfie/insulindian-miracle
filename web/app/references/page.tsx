import { HeroScene } from "@/components/hero-scene";
import { getReferenceEntries } from "@/lib/content/repository";
import { SITE_ROUTES } from "@/lib/navigation";

export default async function ReferencesPage() {
  const references = await getReferenceEntries();
  const sortedReferences = [...references].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <main id="main-content" className="archive-page" data-variant="archive">
      <HeroScene title="Bibliography" variant="archive" />
      <article className="document-view site-shell">
        <header className="document-view__header">
          <h1 className="headline">Bibliography</h1>
          <p className="dek">
            Bibliography as working field, not ornamental end matter. A 16-point anchor for the archive&apos;s theoretical commitments — spanning bandit theory, institutional drift, and urban geography.
          </p>
        </header>

        <section className="section-block" style={{ width: "100%" }}>
          <div className="reference-grid">
            {sortedReferences.map((reference) => (
              <article key={reference.id} className="reference-card">
                <div className="reference-card__meta">
                  {reference.type} / {reference.tier} / {reference.year ?? "n.d."}
                </div>
                <h3>
                  {reference.landingUrl ? (
                    <a
                      href={reference.landingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "inherit",
                        textDecoration: "underline",
                        textDecorationColor: "rgba(19,19,19,0.25)",
                        textUnderlineOffset: "0.15em",
                      }}
                    >
                      {reference.title}
                    </a>
                  ) : (
                    reference.title
                  )}
                </h3>
                <p>{reference.annotation ?? reference.notes}</p>
                <div className="comparison-note" style={{ marginTop: "auto", paddingTop: "0.8rem" }}>
                  {reference.authors.join(", ")}
                </div>
                <div className="tag" style={{ marginTop: "0.8rem" }}>
                  {reference.category}
                </div>
              </article>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
