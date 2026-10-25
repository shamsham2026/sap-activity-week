# 滬江小學 活動週活動安排登記表

公開畀全校同事用嘅活動週登記站，獨立於行政管理平台。

- 登記頁：`/`（乾淨網址，冇 token、冇路徑參數）
- 已知活動：`GET /api/activity-week/subs`（公開，做撞期提示用）
- 提交登記：`POST /api/activity-week/submit`（公開，每 IP 每分鐘最多 10 次）

## 資料儲存

同行政管理平台共用同一個 GitHub store 檔案：

```
<repo>/activity-week/subs.json
```

由 `GITHUB_STORE_TOKEN` + `GITHUB_STORE_REPO` 指定。
因為兩個 app 都寫同一個檔，每次寫入之前都會重新讀取最新版本，
並且喺撞到 409 衝突時重讀再試，避免蓋咗對方啱啱改咗嘅內容。

平台端嘅內建活動（seed）喺 `src/data/activity-week-handoff.json`，
呢邊只讀不改。

## 舊連結

舊嘅 `https://hujiang-admin.vercel.app/aw-reg/smy-aw-2627`
會 301 去呢個新站，已經派咗出去嘅連結照樣可以用。

## 開發

```bash
npm install
npm run dev
```

冇 `GITHUB_STORE_TOKEN` 嘅話，本地會改用 `data/activity-week-subs.json`。
