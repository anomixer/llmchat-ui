# LLMChat-UI

[English](#english-readme) | [繁體中文](#中文說明)

---

## English README

A modern, glassmorphic LLM client interface running entirely in your browser. It communicates directly with Ollama, OpenAI, DeepSeek, Groq, and custom OpenAI-compatible API endpoints without requiring any backend servers. Ideal for static hosting platforms like Vercel, Netlify, or GitHub Pages.

> [!NOTE]
> This project is the pure client-side (serverless) version of the parent project [LLMChat](https://github.com/anomixer/llmchat). For developer API schemas and release notes, please refer to the [API Document](api.md) and [CHANGELOG.md](CHANGELOG.md).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fanomixer%2Fllmchat)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/anomixer/llmchat)

### 🌟 Key Features

- **Pure Client-Side Architecture**: Operates 100% inside your browser. All data (conversations, history, settings) is stored securely in your browser's local storage (`localStorage`).
- **Direct API Connectivity**: Direct connection to local Ollama (`http://localhost:11434`) or cloud providers (OpenAI, DeepSeek, Groq, or any OpenAI-compatible API URL).
- **DeepSeek R1 & Reasoning Support**: Beautiful display of reasoning steps for thinking models (e.g. DeepSeek R1), with collapsible reasoning/thinking blocks.
- **Glassmorphic UI**: High-end glassmorphism design with responsive dark/light/system theme modes.
- **Rich Interaction**: Supports voice speech-to-text input, text-to-speech audio outputs, file attachments (context sharing), code blocks copy-pasting, and markdown rendering.
- **Keyboard Shortcuts**: Maximize efficiency with built-in hotkeys.
- **Data Portability**: Import and export your conversations to JSON or Markdown formats.

### 📋 Prerequisites

- **Node.js**: 16.0.0 or higher
- **NPM**: 8.0.0 or higher
- **Ollama**: If using a local LLM environment (ensure CORS is enabled: `OLLAMA_ORIGINS="*" ollama serve`).

### 🚀 Getting Started

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Configure Local Settings (Optional)
Copy `.env.example` to `.env` to configure your build-time default settings:
```bash
cp .env.example .env
```
Available properties:
- `VITE_DEFAULT_PROVIDER_TYPE`: The default provider (`ollama`, `openai`, `deepseek`, `groq`, `custom`).
- `VITE_OLLAMA_API_URL`: The default URL for Ollama service.
- `VITE_DEFAULT_MODEL`: The default model name to start with.

#### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to start chatting!

### ⚙️ API configuration & CORS

Because LLMChat-UI runs entirely in the browser, direct cloud API connections (e.g., to OpenAI or DeepSeek) might be blocked by CORS unless:
1. You use a local Ollama instance with CORS allowed (`OLLAMA_ORIGINS="*" ollama serve`).
2. You run a local CORS reverse-proxy for cloud APIs.
3. You configure your own proxy server endpoint in settings.

### ☁️ Cloud Deployments

#### Vercel
1. Sign up on [vercel.com](https://vercel.com).
2. Connect your GitHub repository.
3. Deploy! The project's `vercel.json` will be automatically loaded to configure build and output directories.

#### Netlify
1. Sign up on [netlify.com](https://netlify.com).
2. Connect your GitHub repository.
3. Deploy! The project's `netlify.toml` will be automatically loaded to configure build settings and SPA redirects.

---

## 中文說明

一個運行於瀏覽器端的現代化大語言模型用戶端 (LLM Client)，採用**純前端靜態架構**。不需依賴後端 Node.js 伺服器，直接與本地的 Ollama、OpenAI、DeepSeek、Groq 或任何相容 OpenAI 格式的 API 終端直接連線，非常適合部署在 Vercel、Netlify、GitHub Pages 等靜態託管平台。

> [!NOTE]
> 本專案是母專案 [LLMChat](https://github.com/anomixer/llmchat) 的純前端客戶端（免伺服器）版本。詳細的開發者 API 連線規格與版本演進歷程，請參閱 [API 對接文件](api.md) 與 [更新日誌 CHANGELOG.md](CHANGELOG.md)。

### 🌟 功能特色

- **純前端無後端架構**：100% 於瀏覽器內執行。所有的對話歷史記錄、API 設定、密鑰都安全地儲存於本地 `localStorage`，保障私隱。
- **多元 AI 供應商連線**：支援本地 Ollama (`http://localhost:11434`)，以及 OpenAI, DeepSeek, Groq 或者是任何自定義的 OpenAI 規格網址。
- **DeepSeek R1 思考過程顯示**：完整支援流式思考輸出，提供精美的可折疊思考區塊，方便閱讀推理過程。
- **現代玻璃擬態介面**：極致美學的毛玻璃設計，具備亮色、暗色與隨系統變換的自適應主題。
- **多功能對話輔助**：支援語音辨識輸入、語音朗讀、文字與檔案上傳（作為對話上下文）、程式碼區塊一鍵複製等。
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
2. **雲端 API 密鑰**：若直接在瀏覽器打 OpenAI 或 DeepSeek 的雲端 API，請確認您的網路環境能繞過 CORS，或使用反向代理伺服器（CORS Proxy）以轉發請求。密鑰將儲存在您的本機網頁快取中，不會上傳到任何第三方伺服器。

### ☁️ 部署說明

#### Vercel 部署
1. 註冊並登入 [vercel.com](https://vercel.com)。
2. 匯入您的 GitHub 專案。
3. 點選 Deploy 即完成！Vercel 將自動讀取專案中的 `vercel.json` 配置檔，套用預設的靜態網站與編譯設定進行發佈。

#### Netlify 部署
1. 註冊並登入 [netlify.com](https://netlify.com)。
2. 匯入您的 GitHub 專案。
3. 點選 Deploy，Netlify 將自動讀取專案中的 `netlify.toml` 設定檔，套用預設的靜態網站與 SPA 路由重定向配置進行發佈。
