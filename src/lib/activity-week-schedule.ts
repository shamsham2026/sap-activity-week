/**
 * 期考後時間表、活動週上課時段同表格說明。
 * 資料來源：T151《2026-2027年度活動週安排資料表》PDF（掃描版，已逐格對過）。
 */

/** 表格一格：上面係日期，下面係當日活動。 */
export type ScheduleCell = {
  date?: string;
  items: string[];
};

export type ScheduleTable = {
  title: string;
  columns: string[];
  rows: ScheduleCell[][];
};

const WEEKDAYS = ["星期一", "星期二", "星期三", "星期四", "星期五"];

const cell = (date: string | undefined, ...items: string[]): ScheduleCell => ({
  date,
  items,
});

/** 上學期期考後時間表：16-18/12 核卷、21-22/12、4-8/1 活動週。 */
export const SEM1_POST_EXAM_TABLE: ScheduleTable = {
  title: "上學期期考後時間表",
  columns: WEEKDAYS,
  rows: [
    [cell(undefined), cell(undefined), cell("16/12", "核卷"), cell("17/12", "核卷"), cell("18/12", "核卷")],
    [cell("21/12", "學習活動"), cell("22/12", "聖誕聯歡"), cell(undefined), cell(undefined), cell(undefined)],
    [
      cell("4/1", "學習活動"),
      cell("5/1", "音樂會"),
      cell("6/1", "音樂會"),
      cell("7/1", "嘉年華"),
      cell("8/1", "嘉年華"),
    ],
    [cell(undefined), cell(undefined, "拍攝"), cell(undefined, "拍攝"), cell(undefined, "綵排"), cell(undefined, "綵排")],
  ],
};

/** 下學期期考後時間表：16/6 開始，畢業禮綵排、嘉年華、結業禮。 */
export const SEM2_POST_EXAM_TABLE: ScheduleTable = {
  title: "下學期期考後時間表",
  columns: WEEKDAYS,
  rows: [
    [cell(undefined), cell(undefined), cell("16/6"), cell("17/6"), cell("18/6")],
    [cell("21/6"), cell("22/6"), cell("23/6"), cell("24/6"), cell("25/6", "P.4父(母)會")],
    [cell("28/6"), cell("29/6"), cell("30/6"), cell(undefined), cell("2/7")],
    [
      cell(undefined, "畢業禮", "綵排"),
      cell(undefined, "畢業禮", "綵排"),
      cell(undefined, "畢業禮", "綵排"),
      cell(undefined),
      cell(undefined, "畢業禮", "綵排"),
    ],
    [cell("5/7"), cell("6/7"), cell("7/7"), cell("8/7"), cell("9/7")],
    [cell(undefined), cell(undefined, "放榜日/", "P.5交流"), cell(undefined), cell(undefined), cell(undefined, "結業禮")],
  ],
};

export type PeriodRow = {
  name: string;
  start: string;
  end: string;
  minutes: number;
  note?: string;
};

/** 活動週上課時段：早會（班主任節）至第五節。 */
export const ACTIVITY_WEEK_PERIOD_ROWS: PeriodRow[] = [
  { name: "早會（班主任節）", start: "08:10", end: "08:35", minutes: 25 },
  { name: "第一節", start: "08:35", end: "09:15", minutes: 40 },
  { name: "第1小息", start: "09:15", end: "09:35", minutes: 20 },
  { name: "第二節", start: "09:35", end: "10:05", minutes: 30 },
  { name: "第三節", start: "10:05", end: "10:35", minutes: 30 },
  { name: "第2小息", start: "10:35", end: "10:55", minutes: 20 },
  { name: "第四節", start: "10:55", end: "11:25", minutes: 30 },
  { name: "第五節", start: "11:25", end: "12:00", minutes: 35, note: "11:55準備放學" },
];

/** 表格頂部三行：電子/紙本表格、科組/其他、聯絡教師。 */
export const FORM_SECTION_LABELS = {
  submitMethod: "電子／紙本表格",
  panel: "科組／其他",
  contact: "聯絡教師",
} as const;

/** 表格欄位標題，跟 PDF 後頁次序。 */
export const FORM_COLUMN_LABELS = [
  "活動名稱",
  "級別／班別／人數",
  "日期（如需指定）",
  "地點（如需指定）",
  "科任、活動時長（如需指定）",
  "備註",
] as const;

/** 表格說明文字，PDF 第一頁底部。 */
export const FORM_INSTRUCTIONS = [
  "如同事在上學期／下學期期考後學習活動週欲安排學科活動／補課／問卷調查／外出參觀／體驗日等，請填妥及交回表格給沈美玉主任。",
  "上學期期考後的活動安排最遲於 30-11-2026 交回表格；下學期期考後的活動安排最遲於 14-5-2027 交回表格。",
  "如以電子表格交回，只需在後頁圈出電子表格及簽名後。",
] as const;

/** PDF 例子行嘅提示，俾同事知道點填。 */
export const FORM_EXAMPLE = {
  title: "例子：matatalab",
  audience: "P2",
  venue: "視藝室／408",
  note: "每班約 1 小時，每次只可安排一班進行活動，編數學科任。",
} as const;
