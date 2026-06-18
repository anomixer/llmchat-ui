/**
 * 解析與清理 API 基礎路徑，並產生正確的對話端點與模型端點。
 */
export interface ResolvedEndpoints {
    chatUrl: string
    modelsUrl: string
    isOllamaNative: boolean
}

export function resolveEndpoints(providerType: string, baseUrl: string): ResolvedEndpoints {
    let rootUrl = baseUrl.trim().replace(/\/+$/, '');
    
    // 移除常見的端點後綴
    rootUrl = rootUrl
        .replace(/\/chat\/completions$/, '')
        .replace(/\/messages$/, '')
        .replace(/\/models$/, '')
        .replace(/\/api\/chat$/, '')
        .replace(/\/api\/tags$/, '')
        .replace(/\/+$/, '');

    const isOllama = providerType === 'ollama' || providerType === 'ollama-cloud';
    const isOllamaNative = isOllama && !rootUrl.includes('/v1');

    if (isOllamaNative) {
        return {
            chatUrl: `${rootUrl}/api/chat`,
            modelsUrl: `${rootUrl}/api/tags`,
            isOllamaNative: true
        };
    }

    // 檢查是否有包含路徑版本或閘道器段 (例如 /v1, /v1beta, /gateway, /openai)
    const hasPathSegment = /\/(v\d+|v\d+beta|gateway|openai|api\/gateway)\b/i.test(rootUrl);

    if (providerType === 'anthropic' || providerType === 'synthetic') {
        if (hasPathSegment) {
            return {
                chatUrl: `${rootUrl}/messages`,
                modelsUrl: `${rootUrl}/models`,
                isOllamaNative: false
            };
        } else {
            return {
                chatUrl: `${rootUrl}/v1/messages`,
                modelsUrl: `${rootUrl}/v1/models`,
                isOllamaNative: false
            };
        }
    }

    // 適用於 OpenAI 以及所有 OpenAI 相容的 API (DeepSeek, Groq, Gemini 等)
    if (hasPathSegment) {
        return {
            chatUrl: `${rootUrl}/chat/completions`,
            modelsUrl: `${rootUrl}/models`,
            isOllamaNative: false
        };
    } else {
        return {
            chatUrl: `${rootUrl}/v1/chat/completions`,
            modelsUrl: `${rootUrl}/v1/models`,
            isOllamaNative: false
        };
    }
}
