# LLMChat-UI 更新日誌 (Changelog)

本文檔記錄了 LLMChat-UI (純前端客戶端版) 的版本演進與功能更新歷史。

---


### v260820 (2026-08-20)

- 🔒 **型別健康 (TypeScript 0 error)**：
  - 新增 `src/vite-env.d.ts`，為 `import.meta.env` 的 4 個 `VITE_*` 變數提供型別（原 8 個 tsc error 清除）。
  - `ChatSettings` 補上 `systemPrompt` 欄位；簡化 `User` type（移除未使用的 createdAt/lastLoginAt）。
- 🐛 **Bug 修復**：訊息/對話/語音/壓縮共 8 處原先用 `Date.now()` 直接當 ID，同一毫秒會碰撞 → 改用 `makeMessageId()`（時間戳 + 遞增計數）確保唯一。
- 🧹 **死碼清除**：刪除孤兒元件 `LanguageSelector.tsx`、8 個未使用的 lucide import、以及純前端 guest 模式下恆為 false 的 `authLoading`/`authError` 與對應的 dead early-return。
- 📝 **文件重構與補完**：README 雙語拆為 `readme.md`（繁中）與 `readme_en.md`（英文）並互設交叉連結；CHANGELOG 收斂（178 → 128 行）；api.md 對照程式碼驗證一致；README 功能特色補上 v260809 的 **Context 用量指示器與 `/compact` 對話壓縮**（此前漏列）。
- 🌐 **國際化（i18n）完整覆蓋**：
  - 補全 `/compact` 對話壓縮（6 key）+ `system.summarizationPrompt` + `header.contextUsage`（Context 用量指示器 tooltip）的 5 語翻譯（zh-TW/zh-CN/en/ja/ko），此前 en/ja/ko 皆 fallback 成中文。
  - 全面掃描 code 所有 `t('key')` 使用點，補齊 `header.model.*`、`conversation.export.*`、`input.files.pdfNote` 等遺漏 key，五語 0 缺口。
  - Header 的 `app.title`/`app.version` 改用 `APP_CONFIG` 常數（版本號為動態值，不應硬編進語系檔而過時）。
  - 日文/韓文文句重寫為自然表達，移除混入英文的「Context の空き」等不自然句。
- ✅ **健檢**：前端 `tsc --noEmit` 由 baseline 10 → 0 error；`vite build` 通過；i18n 全面掃描 0 缺口。

---

### v260809 (2026-08-09)

- 📊 **新增 Context 用量指示器 (Context Token Usage Indicator)**:
  - 於左上方模型選單右側新增一個用量指示器，即時顯示當前對話已消耗的 Token 數量以及所佔最大上下文 (Max Context Size) 的百分比比例，格式為：`"xxxK (nnn%)"`。
  - 對話總 Token 包含了系統提示詞 (System Prompt)、歷史對話、以及當前正在串流中的文字，生成時可即時跳動更新。
- 🗜️ **對話壓縮功能 (`/compact`)**:
  - 當點擊 Context 用量指示器，或是使用者手動輸入 `/compact` 指令時，會自動觸發歷史對話壓縮（對話摘要）。
  - 系統會調用 AI 將目前的對話記錄摘要成一段緊湊的「歷史摘要」，並將其作為 `System Prompt` 注入或作為隱藏的歷史起點，隨後清空過往詳細對話，將上下文佔用比例重置到最低，解決長對話爆 Token 限制的問題。
- 🔄 **清除快取後模型載入同步邏輯修正**:
  - 修正了當瀏覽器快取被清空時，重新加載首頁導致選用模型跳回清單第一個模型的 Bug。引進了「階層式模型選擇解析」，優先沿用資料庫回傳的 `serverSettings.model`。
- 🐛 **Bug 修正 (發送端重複發送與 Token 估算跳動)**:
  - 修正了發送請求時，最新使用者 Prompt 被重複組裝到 `history` 載荷中發送兩次的 Bug，大幅節省 Token 消耗。
  - 修正了串流生成前後，由於未儲存的 `streamingMessage` 殘留以及助理 `msg.tokenCount` 低估所引起的「Token 用量顯示跳水/跳動」的問題。
- 📝 **文件同步更新**：同步更新 `package.json` 與 `CHANGELOG.md` 並更新版號。

---

### v260723 (2026-07-23)

- 🔑 **地端 LLM 引擎支援選填 API Key (Optional API Key for Local Engines)**:
  - 允許使用者在配置本地 `Ollama`、`vLLM`、`SGLang` 與 `LM Studio` 時輸入選填（Optional）的 API Key，以便支援前端有自建驗證代理（Reverse Proxy）或 API 閘道的部署環境。
- 📝 **文件同步更新**：同步更新 `package.json` 與 `CHANGELOG.md` 並更新版號。

---

### v260702 (2026-07-02)

- 🛠️ **模型設定與參數解析優化 (Fix Ollama Cloud & 400 parameter errors)**:
  - 修正了在對話發送時，`useChatStreaming` 錯誤地將 `maxTokens`（Context Size）套用到 `num_predict` 的問題。現在只會正確地將其套用為 `num_ctx`，解決了 Ollama Cloud 上 `:cloud` 模型及部分 OpenAI 相容 API（如 9router/Groq）因 Context 設太大而觸發單次輸出上限（HTTP 400 Bad Request）的 Bug。
- 👁️ **API 錯誤診斷機制大提升**:
  - 前端配合將底層詳細錯誤資訊直接呈現在對話卡片上，取代原本含糊的「抱歉，發生錯誤。請檢查後端服務是否正常運行。」，以 `[HTTP狀態碼]: 錯誤主體` 的格式（例如 `[400]: {"error":"max_tokens..."}`）顯示，供使用者即時診斷 API 連線與參數問題。
- 📅 **防止日期幻覺與 Ambiguity 警告 (Prevent Date Hallucination)**:
  - 在發送對話時，前端 `useChatStreaming` 會自動獲取當前系統時間並轉換為 `YYYY年M月D日` 格式注入 System Prompt，並在月日小於等於 12 且不相等時（如 7 月 2 日）附帶月日防混淆警告，引導 AI 正確理解當下日期。
- 🎨 **UI 介面微調 (Max Context Size 與選單寬度優化)**:
  - 將 UI 及多國語系 locale 檔中的「Max Tokens (Context Size)」全面更名為更精確的 **「Max Context Size」**。
  - 將頂部 Title 旁的模型選單下拉寬度由 `w-48`（192px）加寬至 **`w-80`（320px）**，並加上 `overflow-x-hidden`，徹底解決長模型名稱（如 `nvidia/minimaxai/minimax-m2.7`）在選單內折行或下方冒出左右滾動條的視覺問題。
- 📝 **文件同步更新**：同步更新 `README.md`、`api.md` 與 `CHANGELOG.md` 並更新版號。

---

### v260618 (2026-06-18)

- 🎨 **重構 AI 供應商配置介面與版面升級**：
  - 將配置視窗由原先的單欄式大幅拓寬並改為 **2x2 網格佈局**（左上：供應商選擇，右上：API 金鑰與認證；左下：純文字模型，右下：視覺/多模態模型），提供更清晰、寬敞且不會擁擠的視覺體驗。
- 👁️ **新增獨立的視覺模型 (Vision Model) 支援**：
  - 在設定介面中加入專屬的「視覺模型」選擇下拉選單。
  - 實作智慧動態切換：當用戶輸入框中未附加圖片時，系統依舊使用預設的純文字模型以節省成本；一旦偵測到附加圖片，將自動在背景把 API 請求切換為設定的視覺模型（例如平常對話用 `llama3`，傳圖時自動切為 `llava`）。
- 🎛️ **補齊進階生成參數**：
  - 在進階參數區塊中，除了原有的 Temperature 與 Max Tokens (Context Size) 外，重新加回了 **Top P** 與 **Top K** 兩個精細控制參數的滑桿。
  - 將上述參數完整串接到底層請求中，包含 Ollama NDJSON 規格、Anthropic 格式以及 OpenAI 相容 API 格式皆能正確傳遞。

---

### v260617 (2026-06-17)

- 🔌 **引進全新 API 端點解析器與 URL 清理機制**：
  - 實作了強大的 `resolveEndpoints` 輔助工具，能精確清理並解析各種 API URL 後綴（如 `/chat/completions`、`/v1/chat/completions`、`/api/chat` 等），自動提取正確的對話與模型列表端點，徹底解決當用戶將 Base URL 填寫為包含 `/chat/completions` 等路徑或使用 Google Gemini OpenAI 相容端點時 models API 報 404/連線失敗的問題。
- 🐙 **新增 GitHub Models 供應商支援**：
  - 在可選 AI Provider 列表中新增了 **GitHub Models** (`https://models.github.ai/v1`)，便於用戶接入 GitHub Marketplace 提供的各類先進 AI 模型。
- 🔑 **實作純前端 GitHub OAuth 快速登入功能 (PKCE 授權碼流程)**：
  - 在設定面板中新增了 GitHub OAuth 互動登入模組。使用者可以配置自己的 GitHub Client ID 並一鍵完成 OAuth 登入，登入後系統自動在背景透過安全的 PKCE 流程向 GitHub 伺服器兌換 Token 並填入設定，同時也提供了手動建立 Personal Access Token (PAT) 作為備用方案的引導。
- 🔄 **更新預設最新熱門模型庫**：
  - 更新了各大主要 AI Provider（包括 OpenAI, Gemini, Groq, xAI Grok 等）的預設 fallback 模型列表（例如新增了 OpenAI 的 `o1`/`o3-mini`、Gemini `2.0`/`2.5` 以及 Groq 的 `llama-3.3-70b-specdec`/`deepseek-r1` 等）。

---

### v260611 (2026-06-11)

- 🌐 **優化本地與遠端大模型 (Ollama, LM Studio 等) 的連線與 CORS 相容性**：
  - **移除了 GET 請求中不必要的 Content-Type 標頭**：在連線檢查與獲取模型列表的 `GET` 請求中移除 `'Content-Type': 'application/json'`。這使得無金鑰的本地或遠端伺服器請求能作為 CORS 的「簡單請求」發送，成功避免被 Cloudflare WAF 或代理伺服器安全規則阻擋而導致連線失敗。
  - **新增 X-Requested-With 標頭解決瀏覽器不送 Origin 的問題**：在無金鑰本機/遠端大模型 `GET` 請求中加入 `'X-Requested-With': 'XMLHttpRequest'` 自訂標頭。這會強制瀏覽器送出 `OPTIONS` 預檢請求，並確保發送正確的 `Origin: http://localhost:3000` 標頭，從而使 Ollama / Cloudflare 順利返回 CORS 跨來源放行回應。
  - **支援 Ollama 走 OpenAI 相容端點**：當選用 Ollama 且 API 網址設定以 `/v1` 結尾時（例如 `https://ollama.johantw.qzz.io/v1`），系統將自動選用 OpenAI 相容端點（`/v1/models` 與 `/v1/chat/completions`）進行通訊，以適應僅轉發 `/v1` 路徑的遠端反向代理；而無 `/v1` 時則維持原生 Ollama API 以確保向下相容性。
  - **惠及所有本地大模型伺服器**：LM Studio、vLLM、SGLang 等其他本地伺服器在無密鑰連線時，亦受惠於 GET CORS 預檢優化，連線與使用更為流暢。
  - **文件提示新增**：於 `README.md` 中新增針對 Page Assist 等瀏覽器插件的詳細衝突排除指南。詳細說明 Page Assist 插件如何在一般模式下自動攔截發往 Ollama 的請求並重寫 `Origin` 標頭為目標主機，從而導致瀏覽器 CORS 機制失敗並阻擋回應（顯示 `net::ERR_CONNECTION_REFUSED` 或 CORS Header 缺失）的底層原因與排除方法。
  - **錯誤提示優化**：在五國語系 (中/英/日/韓) 的 API 連線測試失敗錯誤提示 (`corsHint`) 中，主動補充檢查是否執行干擾之擴充功能 (如 Page Assist) 的提示，提升使用者的排查效率。

---

### v260602 (2026-06-02)

- 🚀 **純前端 Serverless 架構全面升級**：直接對齊 `llmchat` 最新版的前端優化與玻璃擬態樣式。全面移除 Node.js/Express 後端，支援以純靜態網頁部署至 Vercel、Netlify、GitHub Pages 等平台。
- 🗄️ **瀏覽器本地資料持久化 (localStorage)**：
  - 重構對話管理，將對話歷史儲存從後端伺服器轉移到瀏覽器本地儲存（`llmchat_conversations` 鍵值），支援自動還原儲存時的 timestamp 格式。
  - 將使用者偏好設定（語系、主題、Token 統計開關等）全數儲存至本地 `llmchat_settings`，刷新網頁立刻載入偏好。
  - 修正了主題模式衝突所導致的 Token 統計數據對比度問題：
    1. 在 `tailwind.config.js` 中加入了 `darkMode: 'class'` 設置，避免當系統/瀏覽器開啟深色模式但應用配置為亮色模式時，Tailwind 強制啟用 `dark:` 樣式（進而將 Token 統計底色渲染為深灰色）所造成的混亂。
    2. 將 `text-gray-600` 與 `dark:text-gray-300` 直接顯式綁定在 Token 統計數據 span 上，確保在亮色與深色模式下均有清晰的對比度。
- ⚡ **前端直連 AI 供應商 API (CORS Ready & Anthropic 支援)**：
  - 支援在瀏覽器端直接向本地 Ollama 或者是雲端 API (OpenAI, DeepSeek, Groq 等相容規格之 `/v1/chat/completions` 網址) 發送連線。
  - 改用瀏覽器原生 **AbortController** 中斷連線，在使用者雙擊「停止生成」時直接在客戶端中止 API 請求。
  - 解析器同時支援並相容 OpenAI SSE 規格、Ollama NDJSON 規格與 Anthropic 原生協定（含 `/v1/messages` 格式與 `content_block_delta` SSE 串流），並特別優化了 DeepSeek R1 思考過程的 `reasoning_content` 即時串流解析與折疊展示。
  - 在 `App.tsx` 的 `AVAILABLE_PROVIDERS` 中補全所有供應商，與母專案 `llmchat` 的 Provider Manager 完整對齊（包含 Gemini、Anthropic Claude、Mistral、xAI Grok、OpenRouter、Together、Moonshot 等）。
  - 對本地及無金鑰 Provider（Ollama, vLLM, LM Studio 等）動態設定免 API Key，其餘雲端服務則動態驗證 API Key。
  - 新增 API URL `/v1` 容錯清理，自動移除填寫的重複路徑以避免 404 連線錯誤。
- 🔧 **整合 API 設定彈窗 (ProviderSettings Modal) 與 5 語系 i18n**：
  - 在使用者偏好設定選單內新增「配置 API 與模型」按鈕，點擊喚起精美的玻璃擬態彈框進行大模型 API 的對接配置。
  - **模型名稱動態獲取與選擇（對齊母專案 llmchat）**：在設定彈框中新增了「獲取模型」按鈕。當點擊時，前端會直連該 Provider API（Ollama 使用 `/api/tags`，雲端使用 `/v1/models`）獲取可用模型清單，並自動將手動輸入框轉換為下拉式選單（`<select>`）以便使用者點選；同時提供一鍵切換回手動輸入（✏️/📋）的彈性機制。
  - 針對瀏覽器直連雲端 API 常遇到的 **CORS 跨來源限制**，加入 **模型清單 Fallback 機制**。當連線檢查或模型載入失敗時，系統會自動載入該供應商的主流模型（如 `gpt-4o`、`deepseek-chat`）以確保使用者能直接連線，且允許手動鍵入任何非清單模型。
  - 重構 `ProviderSettings.tsx` 中的連線測試機制，改為直接由前端 fetch 網址並回傳連線成功與否，若失敗會提供詳細的 CORS 偵錯建議。
  - 新增並補全了語系字串，使「配置 API 與模型」按鈕、彈窗標題與 `ProviderSettings.tsx` 中的所有欄位、連線檢查狀態與詳細錯誤訊息（包含 401 授權、CORS 錯誤、各狀態碼等），在五種語言（中/英/日/韓）下皆能正確多國語系化。
  - 移除了 `ProviderSettings.tsx` 內部重複的多餘標題，解決彈窗頂部出現雙重標題的問題。
- ⚙️ **顯示禁用的聯網搜尋按鈕**：
  - 在聊天輸入列中重新顯示地球（聯網搜尋）按鈕以對齊母專案排版。將其設定為禁用並支援滑鼠懸停 tooltip 提示：“💡 純前端版暫不支援自訂聯網搜尋功能”（已翻譯為 5 國語言）。
- 🌐 **雙語說明 README 與 GitHub Pages 自動部署**：
  - 簡化 `vite.config.js`，移除了後端服務代理路由 (proxy)。
  - 將 `.env.example` 改寫為前端預設供應商與模型之變數。
  - 重構 `README.md` 為英中雙語結構，頂部提供快速跳轉連結，並新增 Vercel/Netlify/GitHub Pages 部署指南與啟用 CORS 跨來源連線（`OLLAMA_ORIGINS=*`）說明。
  - 修正了 `Header.tsx` 中的 GitHub 圖示路徑為相對路徑，解決子目錄託管環境下的圖示 404 問題，並將導覽列連結與 README 中的一鍵部署連結重定向至最新的前端專案庫 `https://github.com/anomixer/llmchat-ui`。
- ⚡ **極致編譯效能優化 (Code Splitting & Start Script)**：
  - 配置 `vite.config.js` 的 `manualChunks` 機制，將 `react-markdown` 與 `react-syntax-highlighter` 等重型庫抽離。
  - 首頁主 bundle 從原先的 `1.1MB` 驟降至 `126.67 kB`，消除編譯大型 chunks 警告，大幅改善靜態網站首屏載入速度。
  - 在 `package.json` 中新增 `start` 腳本對應到 `vite` 指令，方便使用者直接執行 `npm start` 啟動本地開發。

---

## 🗂️ 早期版本（v1.2.0 ~ v1.0.0，精簡摘要）

以下為 2025-11 初版開發版本，各以一行摘要重點：

- **v1.2.0 (2025-11-17)** — 純前端架構（移除後端、直連 Ollama API）、靜態部署（Vercel/Netlify）、Markdown 完整支援、串流智能滾動、程式碼一鍵複製。
- **v1.1.0 (2025-11-16)** — 玻璃擬態視覺、全螢幕沉浸、thinking 可收合顯示、GitHub 標誌連結。
- **v1.0.0 (2025-11-15)** — 初版全功能：多對話管理、實時串流、檔案上傳、語音、快捷鍵、JSON/MD 導出。
