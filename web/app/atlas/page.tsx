import { ArchiveSettingsPanel } from "@/components/archive-settings-panel";
import { AtlasMap } from "@/components/atlas-map";
import { HeroScene } from "@/components/hero-scene";
import {
  getAtlasChapters,
  getAtlasSource,
} from "@/lib/content/repository";

export default async function AtlasPage() {
  const source = getAtlasSource();
  const chapters = getAtlasChapters();

  return (
    <main className="archive-page" data-variant="archive">
      <ArchiveSettingsPanel
        links={[
          { href: "/", label: "Home" },
          { href: "/atlas/", label: "Atlas" },
          { href: "/scenarios/", label: "Scenarios" },
          { href: "/policies/", label: "Policies" },
          { href: "/references/", label: "References" },
        ]}
        accentLabel="Layered field"
        motionLabel="Atlas kinetics"
      />
      <HeroScene title="Atlas" variant="archive" />
      <article className="site-shell">
        <header className="atlas__header">
          <div className="eyebrow">Chaptered Map</div>
          <h1 className="headline">Atlas</h1>
          <p className="dek">
            A non-sticky explorable plate derived from the backend terrain model. Each chapter pivots the same peninsula through a different inferential layer.
          </p>
          <p className="lede">
            Terrain is not a neutral surface. It is already sorted into access, slope, river adjacency, defensive depth, and pockets of extractive promise before policy begins to choose.
          </p>
        </header>
        {source ? (
          <AtlasMap source={source} chapters={chapters} />
        ) : (
          <p className="lede">Atlas source data is missing.</p>
        )}
      </article>
    </main>
  );
}
