import { HomeView } from "@/components/home-view";
import { buildLandingVisuals } from "@/lib/data/archive-figures";
import {
  getLandingArchivePage,
  getRawResultFile,
  getReferenceEntries,
} from "@/lib/content/repository";

export default async function PolyhedralReportPage() {
  const [archive, references, whittleRun, ucbBaitSummary] = await Promise.all([
    getLandingArchivePage(),
    getReferenceEntries(),
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
      references={references}
      visuals={visuals}
      variant="polyhedral-report"
    />
  );
}
