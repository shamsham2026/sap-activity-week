"use client";

import type { Dispatch, SetStateAction } from "react";
import { FORM_EXAMPLE, FORM_SECTION_LABELS } from "@/lib/activity-week-schedule";
import { ACTIVITY_WEEK_SEED } from "@/lib/activity-week-seed";
import type { RegistrationDateOption } from "@/lib/activity-week-grid";

export type ActivityWeekForm = {
  title: string;
  /** 已揀選嘅登記日期（ISO），可以揀多日。 */
  dates: string[];
  periods: string;
  venue: string;
  grades: string[];
  classGroups: string;
  junior: boolean;
  senior: boolean;
  headcountOnly: boolean;
  headcount: string;
  owner: string;
  subjectTeachers: string;
  hold: boolean;
  notes: string;
  submitterName: string;
};

/** 年級選項：P.1–P.3 屬初小，P.4–P.6 屬高小。 */
export const GRADE_OPTIONS = [
  { code: "P.1", band: "junior" },
  { code: "P.2", band: "junior" },
  { code: "P.3", band: "junior" },
  { code: "P.4", band: "senior" },
  { code: "P.5", band: "senior" },
  { code: "P.6", band: "senior" },
] as const;

const DURATION_OPTS = [
  "30分鐘",
  "45分鐘",
  "60分鐘",
  "90分鐘",
  ...ACTIVITY_WEEK_SEED.periods.map((p) => p.name),
  "全日",
  "頭三節",
];

const VENUE_OPTS = ACTIVITY_WEEK_SEED.venues.map((v) =>
  v.code ? `${v.code} ${v.name}` : v.name,
);

/** 細格：每個欄位一個 TEXT BOX，跟 PDF 後頁。 */
const BOX = "field w-full";
const LABEL = "block text-[11px] leading-tight text-[var(--brand-muted)]";

export function ActivityWeekFormTable({
  form,
  setForm,
  dateOptions,
}: {
  form: ActivityWeekForm;
  setForm: Dispatch<SetStateAction<ActivityWeekForm>>;
  dateOptions: RegistrationDateOption[];
}) {
  const groups: { title: string; days: RegistrationDateOption[] }[] = [];
  for (const option of dateOptions) {
    const last = groups[groups.length - 1];
    if (last?.title === option.group) last.days.push(option);
    else groups.push({ title: option.group, days: [option] });
  }

  return (
    <div className="space-y-2.5">
      {/* 表格頂部三格：提交方式、科組／其他、聯絡教師 */}
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--brand-line)] bg-white p-2">
          <span className={LABEL}>* {FORM_SECTION_LABELS.submitMethod}</span>
          <span className="mt-1 flex flex-wrap gap-2 text-[11px]">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="aw-submit-method"
                className="h-3.5 w-3.5 accent-[var(--brand-accent)]"
                defaultChecked
              />
              電子
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="aw-submit-method"
                className="h-3.5 w-3.5 accent-[var(--brand-accent)]"
              />
              紙本
            </label>
          </span>
        </div>
        <div className="rounded-lg border border-[var(--brand-line)] bg-white p-2">
          <span className={LABEL}>* {FORM_SECTION_LABELS.panel}</span>
          <input
            className={`${BOX} mt-1`}
            aria-label={FORM_SECTION_LABELS.panel}
            placeholder="例如 數學科"
            value={form.submitterName}
            onChange={(e) => setForm((f) => ({ ...f, submitterName: e.target.value }))}
          />
        </div>
        <div className="rounded-lg border border-[var(--brand-line)] bg-white p-2">
          <span className={LABEL}>* {FORM_SECTION_LABELS.contact}</span>
          <input
            className={`${BOX} mt-1`}
            aria-label={FORM_SECTION_LABELS.contact}
            placeholder="負責老師（聯絡人）"
            value={form.owner}
            onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
            required
          />
        </div>
      </div>

      {/* 主表格：PDF 第二頁嗰個欄位表，左右擺放 */}
      <div className="grid gap-2 md:grid-cols-2">
        {/* 活動名稱 */}
        <div className="rounded-lg border border-[var(--brand-line)] bg-white p-2">
          <span className={LABEL}>活動名稱 *</span>
          <input
            className={`${BOX} mt-1`}
            aria-label="活動名稱"
            placeholder={FORM_EXAMPLE.title}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        {/* 級別／班別／人數 */}
        <div className="rounded-lg border border-[var(--brand-line)] bg-white p-2">
          <span className={LABEL}>級別／班別／人數（如需指定）</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {GRADE_OPTIONS.map((opt) => {
              const checked = form.grades.includes(opt.code);
              return (
                <label
                  key={opt.code}
                  className={`cursor-pointer rounded border px-1.5 py-0.5 text-[11px] font-semibold ${
                    checked
                      ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white"
                      : "border-[var(--brand-line)] bg-white text-[var(--brand-ink)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) =>
                      setForm((f) => {
                        const grades = e.target.checked
                          ? [...f.grades, opt.code]
                          : f.grades.filter((g) => g !== opt.code);
                        // 年級同初小／高小保持一致
                        const bands = new Set(
                          grades.map((g) =>
                            GRADE_OPTIONS.find((o) => o.code === g)?.band,
                          ),
                        );
                        return {
                          ...f,
                          grades,
                          junior: bands.has("junior"),
                          senior: bands.has("senior"),
                        };
                      })
                    }
                  />
                  {opt.code}
                </label>
              );
            })}
          </div>
          <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
            <input
              className={BOX}
              aria-label="班別"
              placeholder="班別（如 3A、5B）"
              value={form.classGroups}
              onChange={(e) => setForm((f) => ({ ...f, classGroups: e.target.value }))}
            />
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-[var(--brand-accent)]"
                  checked={form.junior}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      junior: e.target.checked,
                      headcountOnly: e.target.checked ? false : f.headcountOnly,
                    }))
                  }
                />
                初小
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-[var(--brand-accent)]"
                  checked={form.senior}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      senior: e.target.checked,
                      headcountOnly: e.target.checked ? false : f.headcountOnly,
                    }))
                  }
                />
                高小
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-[var(--brand-accent)]"
                  checked={form.headcountOnly}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      headcountOnly: e.target.checked,
                      junior: e.target.checked ? false : f.junior,
                      senior: e.target.checked ? false : f.senior,
                    }))
                  }
                />
                人數
              </label>
            </div>
          </div>
          {form.headcountOnly ? (
            <input
              className={`${BOX} mt-1.5`}
              type="number"
              min={1}
              inputMode="numeric"
              aria-label="人數"
              placeholder="人數"
              value={form.headcount}
              onChange={(e) => setForm((f) => ({ ...f, headcount: e.target.value }))}
              required
            />
          ) : null}
        </div>

        {/* 日期（如需指定）：checkbox 點選，可以揀多日 */}
        <div className="rounded-lg border border-[var(--brand-line)] bg-white p-2 md:col-span-2">
          <span className={LABEL}>日期（如需指定）*（可揀多日）</span>
          <div className="mt-1 space-y-2">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="text-[11px] font-semibold text-[var(--brand-ink)]">
                  {group.title}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {group.days.map((day) => {
                    const checked = form.dates.includes(day.date);
                    return (
                      <label
                        key={day.date}
                        className={`flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-[11px] ${
                          checked
                            ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white"
                            : "border-[var(--brand-line)] bg-white text-[var(--brand-ink)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              dates: e.target.checked
                                ? [...f.dates, day.date].sort()
                                : f.dates.filter((d) => d !== day.date),
                            }))
                          }
                        />
                        {day.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {form.dates.length ? (
            <p className="mt-1.5 text-[11px] text-[var(--brand-muted)]">
              已揀：
              {form.dates
                .map((d) => {
                  const found = dateOptions.find((o) => o.date === d);
                  return found ? found.label : d;
                })
                .join("、")}
            </p>
          ) : null}
        </div>

        {/* 地點（如需指定） */}
        <div className="rounded-lg border border-[var(--brand-line)] bg-white p-2">
          <span className={LABEL}>地點（如需指定）</span>
          <input
            className={`${BOX} mt-1`}
            aria-label="地點"
            list="aw-reg-venue-opts"
            placeholder={FORM_EXAMPLE.venue}
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
          />
          <datalist id="aw-reg-venue-opts">
            {VENUE_OPTS.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </div>

        {/* 科任、活動時長（如需指定） */}
        <div className="rounded-lg border border-[var(--brand-line)] bg-white p-2">
          <span className={LABEL}>科任、活動時長（如需指定）</span>
          <div className="mt-1 grid gap-1.5 sm:grid-cols-2">
            <input
              className={BOX}
              aria-label="科任老師"
              placeholder="科任老師"
              value={form.subjectTeachers}
              onChange={(e) => setForm((f) => ({ ...f, subjectTeachers: e.target.value }))}
            />
            <input
              className={BOX}
              aria-label="活動時長"
              list="aw-reg-duration-opts"
              placeholder="例如 45分鐘 或 全日"
              value={form.periods}
              onChange={(e) => setForm((f) => ({ ...f, periods: e.target.value }))}
            />
          </div>
          <datalist id="aw-reg-duration-opts">
            {DURATION_OPTS.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </div>

        {/* 備註 */}
        <div className="rounded-lg border border-[var(--brand-line)] bg-white p-2 md:col-span-2">
          <span className={LABEL}>備註</span>
          <textarea
            className="field mt-1 min-h-[56px] w-full"
            aria-label="備註"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <label className="mt-1 flex items-center gap-1.5 text-[11px]">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-[var(--brand-accent)]"
              checked={form.hold}
              onChange={(e) => setForm((f) => ({ ...f, hold: e.target.checked }))}
            />
            Hold 場地／時段
          </label>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--brand-muted)]">
            {FORM_EXAMPLE.note}
          </p>
        </div>
      </div>
    </div>
  );
}
