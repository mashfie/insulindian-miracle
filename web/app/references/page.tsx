import { ArchiveSettingsPanel } from "@/components/archive-settings-panel";
import { HeroScene } from "@/components/hero-scene";
import { getReferenceEntries } from "@/lib/content/repository";
import { SITE_ROUTES } from "@/lib/navigation";

export default async function ReferencesPage() {
  const references = await getReferenceEntries();
  const grouped = references.reduce<Record<string, typeof references>>((accumulator, reference) => {
    const group = accumulator[reference.category] ?? [];
    group.push(reference);
    accumulator[reference.category] = group;
    return accumulator;
  }, {});

  return (
    <main id="main-content" className="archive-page" data-variant="archive">
      <ArchiveSettingsPanel
        links={SITE_ROUTES}
        accentLabel="Annotation / citation"
        motionLabel="Atlas kinetics"
      />
      <HeroScene title="References" variant="archive" />
      <article className="document-view site-shell">
        <header className="document-view__header">
          <div className="eyebrow">Working Bibliography</div>
          <h1 className="headline">References</h1>
          <p className="dek">
            Bibliography as working field, not ornamental end matter. Grouped by problem domain — bandits, urban geography, institutions — and paired with interpretive annotations that explain why each paper matters to this archive.
          </p>
        </header>
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="section-full section-block">
            <div className="section-kicker">Reference group</div>
            <h2 style={{ fontSize: "2.5rem" }}>{category}</h2>
            <div className="reference-grid">
              {items.map((reference) => (
                <article key={reference.id} className="reference-card">
                  <div className="reference-card__meta">
                    {reference.type} / {reference.tier} / {reference.year ?? "n.d."}
                    {reference.openAccess ? " / open access" : ""}
                  </div>
                  <h3>
                    {reference.landingUrl ? (
                      <a href={reference.landingUrl} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textDecorationColor: "rgba(19,19,19,0.25)", textUnderlineOffset: "0.15em" }}>
                        {reference.title}
                      </a>
                    ) : (
                      reference.title
                    )}
                  </h3>
                  <p>{reference.annotation ?? reference.notes}</p>
                  <p className="comparison-note" style={{ marginTop: "0.8rem" }}>
                    {reference.authors.join(", ")}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </article>
    </main>
  );
}
