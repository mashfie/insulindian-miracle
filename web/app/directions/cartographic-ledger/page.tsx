import { HomeView } from "@/components/home-view";
import { buildLandingVisuals } from "@/lib/data/archive-figures";
import {
  getLandingArchivePage,
  getRawResultFile,
} from "@/lib/content/repository";

export default async function CartographicLedgerPage() {
  const [archive, whittleRun, ucbBaitSummary] = await Promise.all([
    getLandingArchivePage(),
    getRawResultFile("whittle-run"),
    getRawResultFile("ucb-bait-boomtown-v4"),
  ]);

  const visuals = buildLandingVisuals({
    archive,
    whittleRun,
    ucbBaitSummary,
  });

  return (
    <HomeView
      archive={archive}
      visuals={visuals}
      variant="cartographic-ledger"
    />
  );
}
