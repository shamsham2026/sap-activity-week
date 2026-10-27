/**
 * 同事活動週登記入口（全年公開、免密碼）。
 * seed 入面的 windows 係活動週日子，唔係登記開關。
 *
 * 呢個 app 已經係獨立 project，網址本身乾淨（例：
 * https://sap-activity-week.vercel.app），所以唔再需要 token 路徑。
 * 舊嗰條 /aw-reg/smy-aw-2627 會由舊 app 301 過嚟，唔好改。
 */
export const AW_REG_TITLE = "2026/27年度滬江小學活動週活動安排登記表";

/**
 * 表單說明，唔係頂欄。
 * 三個窗口分開：期考後 ≠ 下學期；六月窗口係下學期活動週，唔叫期考後。
 */
export const AW_REG_WINDOW_LINES = [
  "上學期／期考後時間表 2026/12/16–18、21",
  "上學期活動週 2027/1/4–8",
  "下學期活動週 2027/6/14～7/8（結業前）",
] as const;
