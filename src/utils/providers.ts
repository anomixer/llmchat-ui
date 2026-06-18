// Provider 類型定義
export type ProviderType = 
    | 'openai' 
    | 'anthropic' 
    | 'google-gemini' 
    | 'mistral' 
    | 'groq' 
    | 'xai-grok'
    | 'github-copilot'
    | 'github-models'
    | 'nvidia'
    | 'together' 
    | 'openrouter' 
    | 'kilo-gateway' 
    | 'synthetic' 
    | 'moonshot' 
    | 'deepseek'
    | 'vercel-gateway' 
    | 'cloudflare-gateway' 
    | 'ollama-cloud' 
    | 'ollama' 
    | 'vllm' 
    | 'sglang' 
    | 'lm-studio' 
    | 'custom'

// 所有支援的 Provider 完整列表
export const AVAILABLE_PROVIDERS = [
    {
        name: 'OpenAI',
        type: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        description: 'GPT-4, GPT-3.5 等模型',
        requiresApiKey: true,
        modelPlaceholder: 'gpt-4.1, gpt-4o-mini'
    },
    {
        name: 'Anthropic Claude',
        type: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        description: 'Claude 系列模型',
        requiresApiKey: true,
        modelPlaceholder: 'claude-sonnet-4-20250514'
    },
    {
        name: 'Google Gemini',
        type: 'google-gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        description: 'Gemini 系列模型',
        requiresApiKey: true,
        modelPlaceholder: 'gemini-2.5-flash'
    },
    {
        name: 'Mistral',
        type: 'mistral',
        baseUrl: 'https://api.mistral.ai/v1',
        description: 'Mistral 系列模型',
        requiresApiKey: true,
        modelPlaceholder: 'mistral-large'
    },
    {
        name: 'Groq',
        type: 'groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        description: '高速推理引擎',
        requiresApiKey: true,
        modelPlaceholder: 'llama3-70b'
    },
    {
        name: 'xAI (Grok)',
        type: 'xai-grok',
        baseUrl: 'https://api.x.ai/v1',
        description: 'xAI Grok 系列模型',
        requiresApiKey: true,
        modelPlaceholder: 'grok-3, grok-3-mini'
    },
    {
        name: 'GitHub Models',
        type: 'github-models',
        baseUrl: 'https://models.github.ai/v1',
        description: 'GitHub Marketplace 提供的 AI 模型 (支援 OAuth 登入)',
        requiresApiKey: true,
        modelPlaceholder: 'gpt-4o, claude-3.5-sonnet'
    },
    {
        name: 'DeepSeek',
        type: 'deepseek',
        baseUrl: 'https://api.deepseek.com/v1',
        description: 'DeepSeek-V3, DeepSeek-R1 推理模型',
        requiresApiKey: true,
        modelPlaceholder: 'deepseek-chat, deepseek-reasoner'
    },
    {
        name: 'NVIDIA NIM',
        type: 'nvidia',
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        description: 'NVIDIA 雲端 NIM 推理服務',
        requiresApiKey: true,
        modelPlaceholder: 'meta/llama-3.1-70b-instruct'
    },
    {
        name: 'Together AI',
        type: 'together',
        baseUrl: 'https://api.together.xyz/v1',
        description: 'Together AI 平台',
        requiresApiKey: true,
        modelPlaceholder: 'meta-llama/Llama-3.1-70B'
    },
    {
        name: 'OpenRouter',
        type: 'openrouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        description: 'OpenRouter 多模型聚合路由平台',
        requiresApiKey: true,
        modelPlaceholder: 'openai/gpt-4o, anthropic/claude-3.5-sonnet'
    },
    {
        name: 'Kilo Gateway',
        type: 'kilo-gateway',
        baseUrl: 'https://api.kilo.ai/api/gateway',
        description: 'Kilo AI Gateway 企業路由',
        requiresApiKey: true,
        modelPlaceholder: 'auto'
    },
    {
        name: 'Synthetic (Anthropic-compatible)',
        type: 'synthetic',
        baseUrl: 'https://api.synthetic.new/anthropic',
        description: 'Synthetic AI (Anthropic 格式相容)',
        requiresApiKey: true,
        modelPlaceholder: 'claude-3-7-sonnet-20250219'
    },
    {
        name: 'Moonshot AI (Kimi)',
        type: 'moonshot',
        baseUrl: 'https://api.moonshot.ai/v1',
        description: '月之暗面 Kimi 系列模型（全球版）',
        requiresApiKey: true,
        modelPlaceholder: 'kimi-k2.6, moonshot-v1-8k'
    },
    {
        name: 'Vercel AI Gateway',
        type: 'vercel-gateway',
        baseUrl: 'https://gateway.ai.vercel.com/v1',
        description: 'Vercel AI Gateway 統一路由',
        requiresApiKey: true,
        modelPlaceholder: 'auto'
    },
    {
        name: 'Cloudflare AI Gateway',
        type: 'cloudflare-gateway',
        baseUrl: 'https://gateway.ai.cloudflare.com/v1',
        description: 'Cloudflare AI Gateway 統一路由',
        requiresApiKey: true,
        modelPlaceholder: 'auto'
    },
    {
        name: 'Ollama Cloud',
        type: 'ollama-cloud',
        baseUrl: 'https://ollama.com',
        description: 'Ollama Cloud 官方服務（需要 API Key）',
        requiresApiKey: true,
        modelPlaceholder: 'llama3.2, qwen2.5'
    },
    {
        name: 'Ollama',
        type: 'ollama',
        baseUrl: 'http://127.0.0.1:11434',
        description: '本地 Ollama 服務（支援 llama, qwen, deepseek 等）',
        requiresApiKey: false,
        modelPlaceholder: 'llama3.2, qwen2.5, deepseek-r1'
    },
    {
        name: 'vLLM',
        type: 'vllm',
        baseUrl: 'http://127.0.0.1:8000/v1',
        description: 'vLLM 高效能本地推理服務',
        requiresApiKey: false,
        modelPlaceholder: '（自動從服務獲取）'
    },
    {
        name: 'SGLang',
        type: 'sglang',
        baseUrl: 'http://127.0.0.1:30000/v1',
        description: 'SGLang 本地推理服務',
        requiresApiKey: false,
        modelPlaceholder: '（自動從服務獲取）'
    },
    {
        name: 'LM Studio',
        type: 'lm-studio',
        baseUrl: 'http://127.0.0.1:1234/v1',
        description: 'LM Studio 本地 GUI 推理服務',
        requiresApiKey: false,
        modelPlaceholder: '（自動從服務獲取）'
    },
    {
        name: 'Custom Provider (自訂)',
        type: 'custom',
        baseUrl: 'http://127.0.0.1:11434/v1',
        description: '企業 Gateway 或自架 OpenAI 相容服務',
        requiresApiKey: true,
        modelPlaceholder: '請填寫實際模型名稱'
    }
]

// 本地 / 不需要 API Key 的 Provider 列表
export const LOCAL_NOAUTH_PROVIDERS = [
    'ollama',
    'vllm',
    'sglang',
    'lm-studio'
]
