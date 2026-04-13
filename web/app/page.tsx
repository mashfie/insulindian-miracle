import { HomeView } from "@/components/home-view";
import { buildLandingVisuals } from "@/lib/data/archive-figures";
import {
  getCohortSynthesis,
  getLandingArchivePage,
  getRawResultFile,
} from "@/lib/content/repository";

export default async function Page() {
  const [archive, cohortSynthesis, whittleRun] = await Promise.all([
    getLandingArchivePage(),
    getCohortSynthesis(),
    getRawResultFile("whittle-run"),
  ]);

  const visuals = buildLandingVisuals({
    archive,
    cohortSynthesis,
    whittleRun,
  });

  return <HomeView archive={archive} visuals={visuals} />;
}
