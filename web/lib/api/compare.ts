export type CompareRequest = {
  seed: number;
  scenario: string;
  policies: string[];
  horizon?: number;
  num_sites?: number;
  min_site_spacing?: number;
  terrain_overrides?: Record<string, number>;
};

export type CompareResponse = {
  scenario: {
    name: string;
    description: string;
    overrides: Record<string, number>;
  };
  config: Record<string, unknown>;
  terrain_summary: Record<string, number>;
  sites: Array<Record<string, number | boolean>>;
  results: Array<Record<string, unknown>>;
};

export async function fetchComparison(payload: CompareRequest): Promise<CompareResponse> {
  const endpoint = process.env.NEXT_PUBLIC_COMPARE_API_URL;

  if (!endpoint) {
    throw new Error("NEXT_PUBLIC_COMPARE_API_URL is not configured.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Comparison request failed with status ${response.status}.`);
  }

  return (await response.json()) as CompareResponse;
}
