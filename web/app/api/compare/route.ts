import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COMPARE_TIMEOUT_MS = 20_000;

function normalizeCompareApiUrl(rawUrl: string | undefined): string | null {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return null;
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

export async function POST(request: Request) {
  const compareApiUrl = normalizeCompareApiUrl(
    process.env.COMPARE_API_URL ?? process.env.NEXT_PUBLIC_COMPARE_API_URL
  );

  if (!compareApiUrl) {
    return NextResponse.json(
      {
        error:
          "COMPARE_API_URL is not configured for the web app. Point it at the Python compare service.",
      },
      { status: 503 }
    );
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: "Invalid JSON body for compare request." },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), COMPARE_TIMEOUT_MS);
    const response = await fetch(compareApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.name === "AbortError"
            ? `Compare service timed out after ${COMPARE_TIMEOUT_MS / 1000}s.`
            : error instanceof Error
            ? error.message
            : "Failed to reach compare service.",
      },
      { status: 502 }
    );
  }
}
