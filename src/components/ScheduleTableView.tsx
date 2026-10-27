"use client";

import type { ScheduleTable } from "@/lib/activity-week-schedule";

/**
 * PDF 第一頁嗰兩個時間表。
 * 每格上面係日期，下面係當日活動；空白格代表 PDF 度冇寫嘢。
 * 細格版：淨係睇到大約時間，唔佔咗好多位。
 */
export function ScheduleTableView({ table }: { table: ScheduleTable }) {
  return (
    <section
      data-testid={`schedule-${table.title}`}
      className="min-w-0 rounded-xl border border-[var(--brand-line)] bg-white p-2 shadow-sm"
    >
      <h2 className="font-display mb-1 text-sm font-bold text-[var(--brand-ink)]">
        {table.title}
      </h2>
      <div className="-mx-0.5 overflow-x-auto px-0.5">
        <table className="w-full min-w-[22rem] border-collapse text-[11px]">
          <thead>
            <tr>
              {table.columns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="border border-[var(--brand-line)] bg-[var(--brand-soft)] px-1 py-0.5 text-center font-semibold text-[var(--brand-ink)]"
                >
                  {col.slice(2)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border border-[var(--brand-line)] px-1 py-0.5 align-top leading-tight"
                  >
                    {cell.date ? (
                      <div className="text-center font-semibold text-[var(--brand-ink)]">
                        {cell.date}
                      </div>
                    ) : null}
                    {cell.items.length ? (
                      <div className="mt-0.5 text-center text-[var(--brand-ink)]">
                        {cell.items.join("、")}
                      </div>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
