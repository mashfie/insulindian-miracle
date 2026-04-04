import { CatalogGrid } from "@/components/catalog-grid";
import { getScenarioPages } from "@/lib/content/repository";
import type { ScenarioPage } from "@/lib/content/types";

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default async function ScenariosPage() {
  const pages: ScenarioPage[] = await getScenarioPages();

  return (
    <CatalogGrid
      eyebrow="Case Studies"
      title="Scenarios"
      description="Nine institutional experiments, each grounded in real economic history. Iran's petrodollar trap, Norway's sovereign wealth fund, the Hanseatic League's trade network, Korea's post-crisis reform. The history leads; the parameters follow."
      items={pages.map((page) => ({
        href: `/scenarios/${page.slug}/`,
        meta: page.result?.scenario.name ?? "scenario",
        title: page.document?.title ?? page.archive.title,
        description:
          page.result?.scenario.description ??
          stripHtml(page.document?.summaryHtml ?? page.archive.dek),
      }))}
    />
  );
}
