import { notFound } from "next/navigation";

import { DocumentView } from "@/components/document-view";
import {
  getReferenceEntries,
  getTheoryPage,
  getTheoryPages,
} from "@/lib/content/repository";
import type { NormalizedDoc } from "@/lib/content/types";

export async function generateStaticParams() {
  const pages: NormalizedDoc[] = await getTheoryPages();
  return pages.map((page) => ({
    slug: page.slug,
  }));
}

export default async function TheoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [page, references] = await Promise.all([
    getTheoryPage(slug),
    getReferenceEntries(),
  ]);

  if (!page) {
    notFound();
  }

  const relatedReferences = references.filter((reference) =>
    page.tags.some((tag) => reference.category.includes(tag.replace(/_/g, "-"))),
  );

  return (
    <DocumentView
      document={page}
      eyebrow="Theory Dossier"
      deck="Conceptual notes, model constraints, and the analytic vocabulary used to read the archive."
      references={relatedReferences.slice(0, 3)}
    />
  );
}
