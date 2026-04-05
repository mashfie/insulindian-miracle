import { CatalogGrid } from "@/components/catalog-grid";
import { getPolicyPages } from "@/lib/content/repository";
import type { PolicyPage } from "@/lib/content/types";

export default async function PoliciesPage() {
  const pages: PolicyPage[] = await getPolicyPages();

  return (
    <CatalogGrid
      title="Policy Dossier"
      description="Ten multi-armed bandit policies, each with a different epistemology of investment. Optimism, forgetting, spatial modelling, posterior sampling. The math speaks for itself; the results table settles the argument."
      items={pages.map((page) => ({
        href: `/policies/${page.slug}/`,
        meta: page.evidenceScenario ? `evidence: ${page.evidenceScenario}` : "policy note",
        title: page.document.title,
        description: page.archive.dek,
      }))}
    />
  );
}
