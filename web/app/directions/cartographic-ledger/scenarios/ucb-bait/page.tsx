import { ScenarioView } from "@/components/scenario-view";
import { buildScenarioVisuals } from "@/lib/data/archive-figures";
import { getRawResultFile, getScenarioPage } from "@/lib/content/repository";

export default async function CartographicLedgerScenarioPage() {
  const page = await getScenarioPage("ucb-bait");
  const raw = page.result ? getRawResultFile(page.result.fileSlug) : null;
  const visuals = buildScenarioVisuals({ page, rawResult: raw });

  return <ScenarioView page={page} visuals={visuals} variant="cartographic-ledger" />;
}
