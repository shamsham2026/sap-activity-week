"use client";

import { useCallback, useEffect, useMemo, useState, type FocusEvent, type FormEvent } from "react";
import { regWarnings, splitList } from "@/lib/activity-week-conflicts";
import {
  formatShownDate,
  registrationCalendars,
  type RegistrationCalendarMonth,
} from "@/lib/activity-week-grid";
import { revealFocusedField } from "@/lib/reveal-focused-field";
import { AW_REG_WINDOW_LINES } from "@/lib/activity-week-reg";
import {
  FORM_INSTRUCTIONS,
  SEM1_POST_EXAM_TABLE,
  SEM2_POST_EXAM_TABLE,
} from "@/lib/activity-week-schedule";
import { ACTIVITY_WEEK_SEED } from "@/lib/activity-week-seed";
import type { ConflictItem } from "@/lib/activity-week-types";
import { ActivityWeekTimetable } from "@/components/ActivityWeekTimetable";
import { ActivityWeekFormTable } from "@/components/ActivityWeekFormTable";
import { ScheduleTableView } from "@/components/ScheduleTableView";

const WEEKDAY_HEADS = ["日", "一", "二", "三", "四", "五", "六"] as const;
const REGISTRATION_CALENDARS: RegistrationCalendarMonth[] = registrationCalendars();

function singleDmyToIso(raw: string): string | null {
  const match = raw.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shownConstraint(line: string): string {
  const splitAt = line.indexOf("：");
  if (splitAt < 0) return line;
  return `${formatShownDate(line.slice(0, splitAt))}${line.slice(splitAt)}`;
}

const EMPTY = {
  title: "",
  dateOrWindow: "",
  periods: "",
  venue: "",
  grades: [] as string[],
  classGroups: "",
  junior: false,
  senior: false,
  headcountOnly: false,
  headcount: "",
  owner: "",
  subjectTeachers: "",
  hold: false,
  notes: "",
  submitterName: "",
};

export function ActivityWeekRegisterClient() {
  const [form, setForm] = useState(EMPTY);
  const [agreed, setAgreed] = useState(false);
  const [known, setKnown] = useState<ConflictItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/activity-week/subs", { cache: "no-store" });
      const data = (await res.json()) as {
        seed?: ConflictItem[];
        submissions?: ConflictItem[];
      };
      const seed = (data.seed ?? []).map((item) => ({
        ...item,
        periods: item.periods ?? [],
        venue: item.venue ?? "",
      }));
      const submissions = (data.submissions ?? []).map((item) => ({
        ...item,
        periods: item.periods ?? [],
        venue: item.venue ?? "",
      }));
      setKnown([...seed, ...submissions]);
    } catch {
      setKnown(
        ACTIVITY_WEEK_SEED.seed.map((item) => ({
          id: item.id,
          title: item.title,
          dateOrWindow: item.dateOrWindow,
          periods: [...item.periods],
          venue: item.venue,
          hold: item.hold,
        })),
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const warnings = useMemo(
    () => regWarnings(form.dateOrWindow, known, form.venue, form.periods),
    [form.dateOrWindow, form.venue, form.periods, known],
  );
  const showWarnings =
    warnings.conflicts.length > 0 || warnings.hallFull || warnings.constraints.length > 0;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(null);
    if (!agreed) {
      setError("請先確認免責聲明");
      return;
    }
    let audience = "";
    const gradePart = form.grades.join("、");
    const classPart = form.classGroups.trim();
    if (form.headcountOnly) {
      const count = Number(form.headcount);
      if (!Number.isFinite(count) || count < 1) {
        setError("請填人數");
        return;
      }
      audience = `${Math.round(count)}人`;
    } else {
      audience = [
        gradePart,
        classPart,
        form.junior ? "初小" : "",
        form.senior ? "高小" : "",
      ]
        .filter(Boolean)
        .join("、");
    }
    setBusy(true);
    try {
      const res = await fetch("/api/activity-week/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          dateOrWindow: form.dateOrWindow.trim(),
          periods: splitList(form.periods),
          venue: form.venue.trim(),
          audience,
          owner: form.owner.trim(),
          subjectTeachers: form.subjectTeachers.trim(),
          hold: form.hold,
          notes: form.notes.trim(),
          submitterName: form.submitterName.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "提交失敗");
        return;
      }
      setForm(EMPTY);
      setAgreed(false);
      setDone("已提交，謝謝");
      await load();
    } catch {
      setError("網絡錯誤，請稍後再試");
    } finally {
      setBusy(false);
    }
  }

  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(form.dateOrWindow)
    ? form.dateOrWindow
    : (singleDmyToIso(form.dateOrWindow) ?? "");
  const shownDate = /^\d{4}-\d{2}-\d{2}$/.test(form.dateOrWindow)
    ? formatShownDate(form.dateOrWindow)
    : form.dateOrWindow;

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-sm leading-relaxed text-[var(--brand-ink)]">
        {AW_REG_WINDOW_LINES.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      {/* 左右擺放：左邊係 PDF 時間表，右邊係揀日期月曆 */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <ScheduleTableView table={SEM1_POST_EXAM_TABLE} />
            <ScheduleTableView table={SEM2_POST_EXAM_TABLE} />
          </div>
          <ActivityWeekTimetable />
        </div>
        <div className="min-w-0">
          <RegistrationCalendar
            selected={dateValue}
            onPick={(iso) => setForm((current) => ({ ...current, dateOrWindow: iso }))}
          />
        </div>
      </div>

      {/* PDF 第一頁底部：交表說明 */}
      <section className="space-y-1 rounded-xl border border-[var(--brand-line)] bg-white px-3 py-2 text-xs leading-relaxed text-[var(--brand-ink)]">
        {FORM_INSTRUCTIONS.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>
    <form
        id="aw-reg-form"
        className="section-block grid min-w-0 max-w-full gap-3"
        onSubmit={onSubmit}
        onFocus={(event: FocusEvent<HTMLFormElement>) => {
          const target = event.target;
          if (!(target instanceof HTMLElement) || target === event.currentTarget) return;
          if (!target.matches("input, textarea, select")) return;
          revealFocusedField(target);
        }}
      >
        <ActivityWeekFormTable
          form={form}
          setForm={setForm}
          dateValue={dateValue}
          shownDate={shownDate}
          singleDmyToIso={singleDmyToIso}
        />
        {showWarnings ? (
          <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            {warnings.conflicts.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {warnings.hallFull ? (
              <p className="font-semibold">該天禮堂已滿／已有安排，請另選一天</p>
            ) : null}
            {warnings.constraints.map((line) => (
              <p key={line} className="text-amber-900/80">
                提示：{shownConstraint(line)}
              </p>
            ))}
          </div>
        ) : null}
        <div className="space-y-1.5 rounded-xl border border-[var(--brand-line)] bg-[var(--brand-soft)] px-3 py-2">
          <p className="text-xs font-medium text-[var(--brand-ink)]">
            最終活動時間由沈美玉主任安排及通知，謝謝。
          </p>
          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[var(--brand-accent)]"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>本人已閱讀並同意上述安排說明</span>
          </label>
        </div>
        {error ? <p className="text-xs text-red-700">{error}</p> : null}
        {done ? <p className="text-xs font-medium text-emerald-700">{done}</p> : null}
        <div>
          <button type="submit" className="btn-primary" disabled={busy || !agreed}>
            {busy ? "提交中…" : "提交登記"}
          </button>
        </div>
      </form>
    </div>
  );
}

function RegistrationCalendar({
  selected,
  onPick,
}: {
  selected: string;
  onPick: (iso: string) => void;
}) {
  const groups: { title: string; months: RegistrationCalendarMonth[] }[] = [];
  for (const month of REGISTRATION_CALENDARS) {
    const last = groups[groups.length - 1];
    if (last?.title === month.group) last.months.push(month);
    else groups.push({ title: month.group, months: [month] });
  }
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <section key={group.title} className="min-w-0">
          <h2 className="mb-1 text-sm font-semibold leading-snug text-[var(--brand-ink)]">{group.title}</h2>
          <div className="grid grid-cols-2 gap-2">
            {group.months.map((month) => (
              <div
                key={`${month.year}-${month.month}`}
                className="min-w-0 rounded-xl border border-[var(--brand-line)] bg-white p-2 shadow-sm"
              >
                <p className="text-[11px] text-[var(--brand-muted)]">
                  {`${month.year}年${month.month}月`}
                </p>
                <div className="mt-1 grid grid-cols-7 gap-0.5 text-center">
                  {WEEKDAY_HEADS.map((name) => (
                    <div key={name} className="text-[10px] leading-4 text-[var(--brand-muted)]">
                      {name}
                    </div>
                  ))}
                  {month.weeks.flatMap((week, weekIndex) =>
                    week.map((day, weekday) =>
                      day ? (
                        <button
                          key={day.date}
                          type="button"
                          aria-label={day.label}
                          aria-pressed={selected === day.date}
                          onClick={() => onPick(day.date)}
                          className={`rounded-md py-1 text-xs font-semibold leading-none ${
                            selected === day.date
                              ? "bg-[var(--brand-accent)] text-white"
                              : "bg-[var(--brand-soft)] text-[var(--brand-ink)]"
                          }`}
                        >
                          {Number(day.date.slice(8, 10))}
                        </button>
                      ) : (
                        <div
                          key={`${month.year}-${month.month}-${weekIndex}-${weekday}`}
                          aria-hidden
                          className="py-1"
                        />
                      ),
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
