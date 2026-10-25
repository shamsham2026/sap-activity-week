import { NextResponse } from "next/server";
import { addSubmission } from "@/lib/activity-week-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 公開登記 endpoint。
 *
 * 呢個 form 係公開畀全校同事用，所以加一個好簡單嘅限流，
 * 避免有人寫 script 塞爆個 GitHub store。
 * 每個 IP 每分鐘最多 10 次提交。
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

const hits = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function tooMany(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  if (tooMany(clientKey(req))) {
    return NextResponse.json(
      { error: "提交太頻密，請稍後再試" },
      { status: 429 },
    );
  }
  const body = (await req.json().catch(() => null)) as {
    title?: string;
    dateOrWindow?: string;
    periods?: string[] | string;
    venue?: string;
    audience?: string;
    owner?: string;
    hold?: boolean;
    notes?: string;
    submitterName?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "提交失敗" }, { status: 400 });
  try {
    const submission = await addSubmission(body);
    return NextResponse.json({ ok: true, submission });
  } catch (err) {
    const message = err instanceof Error ? err.message : "提交失敗";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
