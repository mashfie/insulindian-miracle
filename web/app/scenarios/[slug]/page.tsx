import { notFound } from "next/navigation";

import { ScenarioView } from "@/components/scenario-view";
import { buildScenarioVisuals } from "@/lib/data/archive-figures";
import {
  getRawResultFile,
  getScenarioPage,
  getScenarioPages,
} from "@/lib/content/repository";
import type { ScenarioPage } from "@/lib/content/types";

export async function generateStaticParams() {
  const pages: ScenarioPage[] = await getScenarioPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getScenarioPage(slug);

  if (!page.document && !page.result && !page.archive.sections.length) {
    notFound();
  }

  const raw = page.result ? getRawResultFile(page.result.fileSlug) : null;
  const visuals = buildScenarioVisuals({ page, rawResult: raw });

  return <ScenarioView page={page} visuals={visuals} />;
}
