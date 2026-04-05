import { NextResponse } from "next/server";

/**
 * A fallback mock API for comparison data.
 * Used when the real Python backend is not active or accessible.
 * To activate the real backend, set NEXT_PUBLIC_COMPARE_API_URL to point to /api/compare (Vercel)
 * or a local FastAPI server.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { scenario = "baseline", policies = ["gaussian-thompson"] } = payload;

    // Generate some interesting mock data that changes slightly with the scenario
    const isBaseline = scenario === "baseline";
    
    const results = policies.map((policy: string) => {
      const basePerformance = isBaseline ? 0.8 : 0.6;
      const randomness = Math.random() * 0.1;
      const performance = basePerformance + (policy.includes("thompson") ? 0.05 : 0) + randomness;
      
      return {
        policy,
        cumulative: performance * 100,
        regret: (1 - performance) * 50,
        // Mock timeseries data for charts
        history: Array.from({ length: 10 }, (_, i) => ({
          step: i * 10,
          reward: performance + Math.sin(i) * 0.05,
        })),
      };
    });

    return NextResponse.json({
      scenario: {
        name: scenario.toUpperCase(),
        description: `Simulated comparison results for the ${scenario} environment.`,
        overrides: {},
      },
      config: { seed: 7, horizon: 100 },
      terrain_summary: { land_mass: 0.42, resource_density: 0.18 },
      sites: [
        { id: 1, x: 12, y: 15, suitability: 0.8, boomtown: false },
        { id: 2, x: 45, y: 32, suitability: 0.6, boomtown: true },
      ],
      results,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}
