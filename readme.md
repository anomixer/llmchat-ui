> 🇬🇧 English: [readme_en.md](readme_en.md)

## 中文說明

一個運行於瀏覽器端的現代化大語言模型用戶端 (LLM Client)，採用**純前端靜態架構**。不需依賴後端 Node.js 伺服器，直接與本地的 Ollama、OpenAI、DeepSeek、Groq 或任何相容 OpenAI 格式的 API 終端直接連線，非常適合部署在 Vercel、Netlify、GitHub Pages 等靜態託管平台。

![介面截圖](./public/screenshot-1.png)

> [!NOTE]
> - 本專案是母專案 [LLMChat](https://github.com/anomixer/llmchat) 的純前端客戶端（免伺服器）版本。詳細的開發者 API 連線規格與版本演進歷程，請參閱 [API 對接文件](api.md) 與 [更新日誌 CHANGELOG.md](CHANGELOG.md)。
> - 💡 純前端版暫不支援自訂聯網搜尋功能。

### 🌟 功能特色

- **純前端無後端架構**：100% 於瀏覽器內執行。所有的對話歷史記錄、API 設定、密鑰都安全地儲存於本地 `localStorage`，保障私隱。
- **多元 AI 供應商連線**：支援本地 Ollama (`http://localhost:11434`)，以及 OpenAI, DeepSeek, Groq 或者是任何自定義的 OpenAI 規格網址。
- **DeepSeek R1 思考過程顯示**：完整支援流式思考輸出，提供精美的可折疊思考區塊，方便閱讀推理過程。
- **現代玻璃擬態介面**：極致美學的毛玻璃設計，具備亮色、暗色與隨系統變換的自適應主題，並配備寬敞的 2x2 網格 AI 供應商配置介面。
- **進階生成參數控制**：支援完整的模型微調參數，包含 Temperature、Top P、Top K 與 Max Context Size。
- **Context 用量指示器與對話壓縮**：模型選單旁即時顯示當前對話已消耗的 Token 佔用比例（`xxxK (nnn%)`），並提供 `/compact` 指令（或點擊指示器）將歷史對話自動摘要壓縮，釋放上下文空間、避免長對話爆 Token 上限。
- **多功能對話輔助**：支援語音辨識輸入、語音朗讀、文字與檔案上傳（作為對話上下文）、程式碼區塊一鍵複製等。
- **多語系介面**：支援 5 種語言（繁體中文、簡體中文、英文、日文、韓文），可在設定面板即時切換。
- **快捷鍵操作**：使用鍵盤快捷鍵快速新增對話、清除內容、開啟設定，提供專業使用者高效率工作流。
- **對話匯入與匯出**：可一鍵將對話記錄匯出為 JSON 與 Markdown 格式。

### 📋 系統需求

- **Node.js**: 16.0.0 或更高版本
- **NPM**: 8.0.0 或更高版本
- **Ollama**: 若欲連線本地模型，請確保已啟動且啟用 CORS (例如執行 `OLLAMA_ORIGINS="*" ollama serve`）。

### 🚀 快速開始

#### 1. 安裝套件
```bash
npm install
```

#### 2. 設定預設變數 (可選)
複製並編輯環境變數檔案以配置預設首頁變數：
```bash
cp .env.example .env
```
可調整之屬性包括：
- `VITE_DEFAULT_PROVIDER_TYPE`：預設的供應商類型。
- `VITE_OLLAMA_API_URL`：預設本地 Ollama API 網址。
- `VITE_DEFAULT_MODEL`：預設啟用的模型名稱。

#### 3. 啟動開發伺服器
```bash
npm run dev
```
在瀏覽器中開啟 `http://localhost:3000` 即可開始使用！

### ⚙️ CORS 與 API 金鑰說明

由於本專案為純前端應用：
1. **本地執行 Ollama**：在本地調用 Ollama 時，必須確保設定環境變數 `OLLAMA_ORIGINS="*"` 啟動，否則瀏覽器會因跨來源請求 (CORS) 阻擋連線。
2. **雲端 API 密鑰**：若直接在瀏覽器呼叫 OpenAI、Gemini 或 GitHub Models 的官方雲端 API，請確認您的瀏覽器已啟用 CORS 繞過插件（例如安裝 Chrome 擴充套件 「Allow CORS: Access-Control-Allow-Origin」並啟用），或者使用自建的反向代理伺服器（CORS Proxy）以轉發請求。所有密鑰與 Token 將安全儲存於您的本機網頁快取 (`localStorage`)，絕不上傳到任何第三方伺服器。

*提示：專案配置了先進的智慧端點解析器 (`resolveEndpoints`)，會自動清理與辨識 API URL 後置的路徑（如 `/chat/completions`、`/v1/chat/completions` 或 `/v1beta/openai`），並自動拼接對應的 models 與 chat 接口。這能完美相容於各種自定義 Proxy 代理網址、Google Gemini OpenAI 相容 Gateway、以及 Vercel/Cloudflare AI Gateway。*

*GitHub Models OAuth 登入：本專案為 GitHub Models 設計了基於安全的 PKCE 授權碼流登入機制。您可以註冊自己的 GitHub OAuth App（回調與主頁網址皆設定為當前網頁 origin）並輸入 Client ID 來一鍵完成授權；或者，您也可以手動建立具有 `read:packages` 權限的 GitHub 個人存取權杖 (PAT) 並貼在 API Key 欄位使用。*

> [!WARNING]
> **與 Page Assist 等 Ollama 瀏覽器插件的相衝突問題：**
> 若您安裝並啟用了 [Page Assist](https://chromewebstore.google.com/detail/page-assist-a-web-ui-for/jfgfiigpkhlkbnfnbobbkinehhfdhndo) 等 Ollama 網頁輔助插件，它們會在 Chrome 一般模式下自動攔截所有發往 Ollama 的請求。此攔截機制會將請求的 `Origin` 標頭竄改為目標主機，雖然騙過了伺服器端，但會導致瀏覽器本身以 CORS 安全錯誤阻擋回應（顯示 `net::ERR_CONNECTION_REFUSED` 或 CORS Header 缺失）。
> **解決方法：請暫時停用 Page Assist 插件、將您的自訂 Ollama 網域加入排除名單，或者改用無痕模式/無安裝該插件的瀏覽器（如 Firefox）進行測試。** *(在 API 連線測試失敗時，系統也會在錯誤訊息中提供此項診斷提示，方便您快速定位問題。)*

> [!WARNING]
> **Ollama 雲端模型 (`:cloud` 後綴) 的使用限制：**
> 如果您在使用地端 Ollama 服務時，試圖選取帶有 `:cloud` 後綴的雲端模型（需事先透過 `ollama signin` 登入），**在純前端版本 (llmchat-ui) 中將無法使用並會引發連線錯誤**。原因是 Ollama 伺服器在代理這些模型時，會發生跨網域重定向，進而觸發瀏覽器嚴格的 CORS 安全阻擋。若您必須使用 Ollama 的 `:cloud` 雲端模型，請改用「有後台版本」的 `llmchat`，因為 Node.js 後端不受瀏覽器 CORS 政策的限制。

### ☁️ 部署說明

#### Vercel 部署
1. 註冊並登入 [vercel.com](https://vercel.com)。
2. 匯入您的 GitHub 專案。
3. 點選 Deploy 即完成！Vercel 將自動讀取專案中的 `vercel.json` 配置檔，套用預設的靜態網站與編譯設定進行發佈。

#### Netlify 部署
1. 註冊並登入 [netlify.com](https://netlify.com)。
2. 匯入您的 GitHub 專案。
3. 點選 Deploy，Netlify 將自動讀取專案中的 `netlify.toml` 設定檔，套用預設的靜態網站與 SPA 路由重定向配置進行發佈。

#### GitHub Pages 部署
1. 將代碼推送至 `main` 分支。
2. 專案中已配置 `.github/workflows/deploy.yml` 工作流，GitHub Actions 會自動執行編譯並發佈至 `gh-pages` 分支。
3. 前往 GitHub 專案設定 -> Pages，將來源分支設定為 `gh-pages` 即可完成部署與開啟線上 demo。

