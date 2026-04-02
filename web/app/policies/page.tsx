import { CatalogGrid } from "@/components/catalog-grid";
import { getPolicyPages } from "@/lib/content/repository";
import type { PolicyPage } from "@/lib/content/types";

export default async function PoliciesPage() {
  const pages: PolicyPage[] = await getPolicyPages();

  return (
    <CatalogGrid
      eyebrow="Policy Archive"
      title="Policies"
      description="Bandit policies treated as competing political technologies: each one selects, concentrates, hesitates, and overcommits differently."
      items={pages.map((page) => ({
        href: `/policies/${page.slug}/`,
        meta: page.evidenceScenario ? `evidence: ${page.evidenceScenario}` : "policy note",
        title: page.document.title,
        description: page.archive.dek,
      }))}
    />
  );
}
