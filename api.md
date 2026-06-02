# LLMChat-UI 外部 API 對接文件

LLMChat-UI 是一個純前端架構的應用程式。本文件詳細記錄了應用程式在瀏覽器端直接向外部大語言模型（LLM）API 發送的請求格式與響應解析規格，方便進行第三方 API 對接或本機開發擴展。

---

## 🎯 支援的供應商規格

應用程式主要向兩種規格的 API 發送請求：
1. **Ollama 原生 API 規格**
2. **OpenAI 相容 API 規格**（適用於 OpenAI、DeepSeek、Groq 或任何自定義相容端點）

---

## 🏠 1. Ollama 原生 API 規格

當供應商類型設定為 `ollama` 時，前端將直接請求本地或指定的 Ollama 服務。

### 獲取可用模型列表
- **端點**: `GET {baseUrl}/api/tags`
- **響應格式 (JSON)**:
  ```json
  {
    "models": [
      {
        "name": "llama3:latest",
        "modified_at": "2025-11-20T15:30:00Z",
        "size": 4661224676
      }
    ]
  }
  ```

### 發送對話請求 (串流)
- **端點**: `POST {baseUrl}/api/chat`
- **標頭**: `Content-Type: application/json`
- **請求參數 (JSON)**:
  ```json
  {
    "model": "llama3:latest",
    "messages": [
      { "role": "user", "content": "你好" }
    ],
    "options": {
      "temperature": 0.7,
      "num_predict": 2048
    },
    "stream": true
  }
  ```
- **響應格式 (NDJSON/JSON-lines)**:
  每一行是一個獨立的 JSON 字串，例如：
  ```json
  {"message": {"role": "assistant", "content": "你好"}, "done": false}
  {"message": {"role": "assistant", "content": "！"}, "done": false}
  {"done": true, "eval_count": 25}
  ```

---

## ☁️ 2. OpenAI 相容 API 規格

當供應商類型設定為 `openai`、`deepseek`、`groq` 或 `custom` 時，前端將調用此格式端點。

### 獲取可用模型列表
- **端點**: `GET {baseUrl}/v1/models`
- **標頭**: `Authorization: Bearer {apiKey}` (若需要金鑰)
- **響應格式 (JSON)**:
  ```json
  {
    "data": [
      {
        "id": "gpt-4o",
        "object": "model",
        "owned_by": "openai"
      }
    ]
  }
  ```

### 發送對話請求 (串流)
- **端點**: `POST {baseUrl}/v1/chat/completions`
- **標頭**:
  - `Content-Type: application/json`
  - `Authorization: Bearer {apiKey}` (若設定金鑰)
- **請求參數 (JSON)**:
  ```json
  {
    "model": "gpt-4o",
    "messages": [
      { "role": "user", "content": "Hello" }
    ],
    "temperature": 0.7,
    "max_tokens": 2048,
    "stream": true
  }
  ```
- **多模態圖片上傳格式** (若有附加圖片):
  ```json
  {
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": [
          { "type": "text", "text": "這張圖片是什麼？" },
          { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." } }
        ]
      }
    ],
    "stream": true
  }
  ```
- **響應格式 (Server-Sent Events / SSE)**:
  ```
  data: {"id": "chatcmpl-123", "choices": [{"delta": {"content": "Hello"}}]}
  data: {"id": "chatcmpl-123", "choices": [{"delta": {"content": "!"}}]}
  data: [DONE]
  ```

---

## 🧠 DeepSeek R1 思考過程解析

若使用的模型會輸出思考過程：
1. **Ollama 思考輸出**：Ollama 通常會直接在 `content` 欄位中輸出 `<think>思考內容</think>` 標記。前端串流解析器會自動分離標記內的字串並將其導向思考面板。
2. **DeepSeek 原生 API 思考輸出**：DeepSeek R1 SSE 串流會在 choices 的 delta 中包含 `reasoning_content` 欄位，前端會自動解析並流式渲染：
   ```
   data: {"choices": [{"delta": {"reasoning_content": "分析用戶問題..."}}]}
   ```

---

## 🦉 3. Anthropic Claude API 規格 (原生直連)

當供應商類型設定為 `anthropic` 或 `synthetic` 時，前端將直接與 Anthropic 規格的端點進行通訊。

### 獲取可用模型列表
- **端點**: `GET {baseUrl}/v1/models`
- **標頭**:
  - `x-api-key: {apiKey}`
  - `anthropic-version: 2023-06-01`
  - `dangerously-allow-browser: true`

### 發送對話請求 (串流)
- **端點**: `POST {baseUrl}/v1/messages`
- **標頭**:
  - `Content-Type: application/json`
  - `x-api-key: {apiKey}` (若設定金鑰)
  - `anthropic-version: 2023-06-01`
  - `dangerously-allow-browser: true` (允許前端直接請求，避免某些客戶端阻擋)
- **請求參數 (JSON)**:
  ```json
  {
    "model": "claude-3-5-sonnet-20241022",
    "system": "你是一個有用的AI助手，請用繁體中文回答用戶的問題。",
    "messages": [
      { "role": "user", "content": "Hello" }
    ],
    "max_tokens": 4096,
    "stream": true
  }
  ```
- **響應格式 (SSE)**:
  Anthropic 串流採用事件標籤，前端串流解析器會提取事件中包含的文字增量：
  ```
  event: message_start
  data: {"type": "message_start", ...}

  event: content_block_start
  data: {"type": "content_block_start", ...}

  event: content_block_delta
  data: {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "Hello"}}
  ```
