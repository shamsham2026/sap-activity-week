import type { Metadata } from "next";
import { ActivityShell } from "@/components/ActivityShell";
import { ActivityWeekRegisterClient } from "@/components/ActivityWeekRegisterClient";
import { AW_REG_TITLE } from "@/lib/activity-week-reg";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: AW_REG_TITLE,
  description: "滬江小學 2026/27 年度活動週活動安排登記",
};

export default function ActivityWeekRegisterPage() {
  return (
    <ActivityShell title={AW_REG_TITLE} titleBelowLogo>
      <ActivityWeekRegisterClient />
    </ActivityShell>
  );
}
