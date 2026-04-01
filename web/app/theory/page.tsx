import { CatalogGrid } from "@/components/catalog-grid";
import { getTheoryPages } from "@/lib/content/repository";
import type { NormalizedDoc } from "@/lib/content/types";

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default async function TheoryPage() {
  const pages: NormalizedDoc[] = await getTheoryPages();

  return (
    <CatalogGrid
      eyebrow="Theory / System"
      title="Theory"
      description="The archive's conceptual substrate: restless bandits, resource curse logic, urban hierarchy, simulation design, and reward decomposition."
      items={pages.map((page) => ({
        href: `/theory/${page.slug}/`,
        meta: page.sourceGroup,
        title: page.title,
        description: stripHtml(page.summaryHtml),
      }))}
    />
  );
}
