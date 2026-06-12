# worldcup

2026 世界杯桌面版與網頁版應用，提供小組賽程、積分榜、淘汰賽賽程、對陣圖、即時比分、世界杯新聞與規則式勝出預測。

## 開發

- `npm install`
- `npm run dev`

## 網頁打包

- `npm run build`

## GitHub Pages

- `npm run build:pages`
- GitHub Actions 會在 `main` 推送後與每小時自動更新 Pages 靜態資料

## macOS 桌面版打包

- `npm run package:mac`
- 預設輸出較小的 `tar.xz` 發佈檔，較容易避開 GitHub 100 MB 限制
- 如果仍需要 zip，可用 `npm run package:mac:zip`

產物會輸出到 `release/` 目錄。
