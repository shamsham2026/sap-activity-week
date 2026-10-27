"use client";

import { ACTIVITY_WEEK_PERIOD_ROWS } from "@/lib/activity-week-schedule";

/** 活動週上課時段。淨係睇時段同大概時間，唔使再寫課節長度。 */
export function ActivityWeekTimetable() {
  return (
    <section
      data-testid="activity-week-timetable"
      className="rounded-xl border border-[var(--brand-line)] bg-white p-2.5 shadow-sm sm:p-3"
    >
      <h2 className="font-display mb-1.5 text-sm font-bold text-[var(--brand-ink)]">
        活動週上課時段
      </h2>
      <table className="w-full border-collapse text-xs">
        <tbody>
          {ACTIVITY_WEEK_PERIOD_ROWS.map((row) => (
            <tr key={row.name}>
              <th
                scope="row"
                className="w-1/2 border-b border-[var(--brand-line)] py-1 pl-1 text-left font-medium text-[var(--brand-ink)]"
              >
                {row.name}
              </th>
              <td className="border-b border-[var(--brand-line)] py-1 pr-1 text-right tabular-nums text-[var(--brand-muted)]">
                {row.start} – {row.end}
                {row.note ? (
                  <span className="ml-1 text-[10px]">（{row.note}）</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
