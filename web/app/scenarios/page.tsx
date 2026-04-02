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
      eyebrow="Scenario Archive"
      title="Scenarios"
      description="Counterfactual dossiers, each tying geography, institutional drift, and policy choice into a distinct urban formation problem."
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
