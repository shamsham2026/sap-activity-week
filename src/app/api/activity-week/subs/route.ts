import { NextResponse } from "next/server";
import { getActivityState, toConflictItem } from "@/lib/activity-week-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 公開讀取：已知嘅活動（內建 seed + 已經有人登記咗嘅）。
 * 登記表用嚟做撞期提示，所以任何人都睇得，但冇任何敏感資料。
 */
export async function GET() {
  const { entries } = await getActivityState();
  return NextResponse.json({
    seed: entries.filter((e) => e.builtin).map(toConflictItem),
    submissions: entries.filter((e) => !e.builtin).map(toConflictItem),
  });
}
