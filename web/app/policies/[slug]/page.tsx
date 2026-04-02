import { notFound } from "next/navigation";

import { ComparisonModule } from "@/components/comparison-module";
import { DocumentView } from "@/components/document-view";
import type { PolicyPage } from "@/lib/content/types";
import {
  getPolicyPage,
  getPolicyPages,
  getReferenceEntries,
} from "@/lib/content/repository";

export async function generateStaticParams() {
  const pages: PolicyPage[] = await getPolicyPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPolicyPage(slug);
  if (!page) {
    notFound();
  }

  const references = (await getReferenceEntries()).filter((reference) =>
    reference.category.includes("bandit"),
  );

  return (
    <DocumentView
      document={page.document}
      eyebrow="Policy Dossier"
      deck={page.archive.dek}
      references={references}
      aside={
        page.evidenceScenario ? (
          <ComparisonModule
            scenario={page.evidenceScenario}
            policies={["ucb1", "gaussian-thompson", "whittle-index"]}
            note="Policy pages can request a fresh compare against the backend without changing the static archive shell."
          />
        ) : null
      }
    />
  );
}
