"use client";

import type { ScheduleTable } from "@/lib/activity-week-schedule";

/**
 * PDF 第一頁嗰兩個時間表。
 * 每格入面日期同活動寫埋一格一行；空白格代表 PDF 度冇寫嘢。
 * 五欄平均闊，唔會因為內容長短歪咗。
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
        <table className="w-full min-w-[26rem] table-fixed border-collapse text-[11px]">
          <colgroup>
            {table.columns.map((col) => (
              <col key={col} style={{ width: `${100 / table.columns.length}%` }} />
            ))}
          </colgroup>
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
                    className="border border-[var(--brand-line)] px-1 py-0.5 align-middle leading-tight"
                  >
                    <div className="text-center break-words text-[var(--brand-ink)]">
                      {cell.date ? (
                        <span className="font-semibold">{cell.date}</span>
                      ) : null}
                      {cell.date && cell.items.length ? (
                        <span className="mx-0.5">·</span>
                      ) : null}
                      {cell.items.length ? <span>{cell.items.join(" ")}</span> : null}
                    </div>
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
