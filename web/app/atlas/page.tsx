import { AtlasMap } from "@/components/atlas-map";
import { HeroScene } from "@/components/hero-scene";
import {
  getAtlasChapters,
  getAtlasSource,
} from "@/lib/content/repository";
import { SITE_ROUTES } from "@/lib/navigation";

export default async function AtlasPage() {
  const source = getAtlasSource();
  const chapters = getAtlasChapters();

  return (
    <main id="main-content" className="archive-page" data-variant="archive">
      <HeroScene title="Atlas" variant="archive" />
      <article className="site-shell">
        <header className="atlas__header">
          <h1 className="headline">Atlas</h1>
          <p className="dek">
            The peninsula as experimental apparatus. Each chapter pivots the same Perlin-noise terrain through a different inferential layer — elevation, hydrology, resource endowment, institutional allocation, settlement outcome.
          </p>
          <p className="lede">
            Terrain is not neutral. It is already sorted into coastal access, river adjacency, defensive depth, and pockets of extractive promise before any algorithm begins to choose. Geography is the prior; institutions are the posterior.
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
