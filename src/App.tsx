import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Settings, Trash2, Moon, Sun, Plus, MessageSquare, Paperclip, X, Mic, MicOff, Volume2, Download, Square, Maximize2, Minimize2, RefreshCw, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import MarkdownMessage from './MarkdownMsg'
import { Header } from './components/Header'
import { useChatStreaming } from './hooks/useChatStreaming'
import { useConversations } from './hooks/useConversations'
import type { Message } from './hooks/useConversations'
import { useSpeech } from './hooks/useSpeech'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useOutsideClickClosePanels } from './hooks/useOutsideClickClosePanels'
import { useMobileView } from './hooks/useMobileView'
import { useAutoScroll } from './hooks/useAutoScroll'
import { useApplyThemeClasses, usePrefersColorSchemeSync } from './hooks/useThemeEffects'
import { ProviderSettings } from './components/ProviderSettings'

interface ChatSettings {
    type?: string
    model: string
    temperature: number
    maxTokens: number
    apiUrl: string
    apiKey: string
    topP: number
    topK: number
    showTokenStats: boolean
}

const AVAILABLE_PROVIDERS = [
    {
        name: 'Ollama',
        type: 'ollama',
        baseUrl: 'http://127.0.0.1:11434/v1',
        description: '本地 Ollama 服務器，無需 API Key',
        requiresApiKey: false
    },
    {
        name: 'OpenAI',
        type: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        description: 'GPT-4, GPT-3.5 等模型，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'Anthropic Claude',
        type: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        description: 'Claude 系列模型，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'Google Gemini',
        type: 'google-gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        description: 'Gemini 系列模型，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'DeepSeek',
        type: 'deepseek',
        baseUrl: 'https://api.deepseek.com',
        description: 'DeepSeek 雲端服務，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'Mistral',
        type: 'mistral',
        baseUrl: 'https://api.mistral.ai/v1',
        description: 'Mistral 系列模型，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'Groq',
        type: 'groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        description: 'Groq 高速推理引擎，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'xAI (Grok)',
        type: 'xai-grok',
        baseUrl: 'https://api.x.ai/v1',
        description: 'xAI Grok 模型，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'NVIDIA NIM',
        type: 'nvidia',
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        description: 'NVIDIA 雲端服務，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'Together AI',
        type: 'together',
        baseUrl: 'https://api.together.xyz/v1',
        description: 'Together AI 平台，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'OpenRouter',
        type: 'openrouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        description: 'OpenRouter 聚合平台，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'Kilo Gateway',
        type: 'kilo-gateway',
        baseUrl: 'https://api.kilo.ai/api/gateway/',
        description: 'Kilo AI Gateway，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'Synthetic (Anthropic-compatible)',
        type: 'synthetic',
        baseUrl: 'https://api.synthetic.new/anthropic',
        description: 'Synthetic AI (Anthropic 相容)，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'Moonshot AI (Kimi)',
        type: 'moonshot',
        baseUrl: 'https://api.moonshot.ai/v1',
        description: '月之暗面 Kimi 模型，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'Vercel AI Gateway',
        type: 'vercel-gateway',
        baseUrl: 'https://gateway.ai.vercel.com/v1/',
        description: 'Vercel AI Gateway，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'Cloudflare AI Gateway',
        type: 'cloudflare-gateway',
        baseUrl: 'https://gateway.ai.cloudflare.com/v1/',
        description: 'Cloudflare AI Gateway，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'Ollama Cloud',
        type: 'ollama-cloud',
        baseUrl: 'https://ollama.com',
        description: 'Ollama 雲端服務，需要 API Key',
        requiresApiKey: true
    },
    {
        name: 'vLLM',
        type: 'vllm',
        baseUrl: 'http://127.0.0.1:8000/v1',
        description: 'vLLM 本地服務，無需 API Key',
        requiresApiKey: false
    },
    {
        name: 'SGLang',
        type: 'sglang',
        baseUrl: 'http://127.0.0.1:30000/v1',
        description: 'SGLang 本地服務，無需 API Key',
        requiresApiKey: false
    },
    {
        name: 'LM Studio',
        type: 'lm-studio',
        baseUrl: 'http://127.0.0.1:1234/v1',
        description: 'LM Studio 本地服務，無需 API Key',
        requiresApiKey: false
    },
    {
        name: 'Customer Provider (自訂)',
        type: 'custom',
        baseUrl: 'http://127.0.0.1:11434/v1',
        description: '企業 Gateway 或自架服務，需要 API Key',
        requiresApiKey: true
    }
]

const App: React.FC = () => {
    const { t, i18n } = useTranslation()

    // 純前端訪客使用者與 Token 模擬
    const user = { email: 'guest@llmchat-ui.local', role: 'user', id: 'guest' }
    const token = 'guest-token'
    const authLoading = false
    const authError = null

    const logout = () => {
        const confirmed = window.confirm("確定要清除所有對話與設定嗎？此動作將重置整個應用程式。")
        if (confirmed) {
            localStorage.clear()
            window.location.reload()
        }
    }

    const { isStreaming, streamingMessage, streamingThinking, stopRequested, stopConfirmText, tokenCount, tokensPerSecond, requestStop, streamChat } = useChatStreaming()

    const {
        conversations,
        conversationsLoaded,
        currentConversationId,
        setCurrentConversationId,
        createConversation,
        createNewConversation: createNewConversationInternal,
        addConversation,
        removeConversation,
        updateConversationTitle,
        clearConversationMessages,
        appendMessage,
        deleteMessage
    } = useConversations({
        getDefaultConversationTitle: (index: number) => `${t('conversation.defaultTitle')} ${index}`
    })

    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const {
        isRecording,
        startVoiceInput,
        isSpeaking,
        speechQueue,
        globalSpeakingMessageId,
        currentPlayingItemRef,
        toggleSpeechForMessage,
        getSpeechButtonState,
        isSpeechButtonDisabled
    } = useSpeech({
        userId: user?.id,
        language: i18n.language,
        onTranscript: (text: string) => setInput(prev => prev + text),
        unsupportedVoiceInputText: t('input.voice.unsupported'),
        unsupportedVoiceText: t('messages.voice.unsupported')
    })

    const inputTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const setInputDebounced = useCallback((value: string) => {
        setInput(value)

        if (inputTimeoutRef.current) {
            clearTimeout(inputTimeoutRef.current)
        }

        inputTimeoutRef.current = setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
                textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
            }
        }, 100)
    }, [])

    const [showSettings, setShowSettings] = useState(false)
    const [showModelOnly, setShowModelOnly] = useState(false)
    const [showConversations, setShowConversations] = useState(false)
    const [showProviderSettingsModal, setShowProviderSettingsModal] = useState(false)

    const [isDarkMode, setIsDarkMode] = useState(() => {
        try {
            const saved = localStorage.getItem('theme')
            if (saved === 'dark') return true
            if (saved === 'light') return false
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        } catch (error) {
            console.error('Error loading theme from localStorage:', error)
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
    })

    const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string }>>([])
    const [isLoadingModels, setIsLoadingModels] = useState(true)

    const [settings, setSettings] = useState<ChatSettings>(() => {
        const adminSettings = localStorage.getItem('adminProviderSettings')
        if (adminSettings) {
            try {
                const parsed = JSON.parse(adminSettings)
                return {
                    type: parsed.type || 'ollama',
                    model: parsed.model || '',
                    temperature: parsed.temperature || 0.7,
                    maxTokens: parsed.maxTokens || 8192,
                    apiUrl: parsed.baseUrl || 'http://127.0.0.1:11434',
                    apiKey: parsed.apiKey || '',
                    topP: parsed.topP || 0.9,
                    topK: parsed.topK || 40,
                    showTokenStats: true
                }
            } catch (e) {
                console.error('解析 adminSettings 失敗:', e)
            }
        }
        return {
            type: import.meta.env.VITE_DEFAULT_PROVIDER_TYPE || 'ollama',
            model: import.meta.env.VITE_DEFAULT_MODEL || '',
            temperature: 0.7,
            maxTokens: 8192,
            apiUrl: import.meta.env.VITE_OLLAMA_API_URL || 'http://127.0.0.1:11434',
            apiKey: import.meta.env.VITE_DEFAULT_API_KEY || '',
            topP: 0.9,
            topK: 40,
            showTokenStats: true
        }
    })

    const [userSettings, setUserSettings] = useState(() => {
        const savedTheme = localStorage.getItem('theme')
        return {
            type: 'ollama',
            language: 'zh-TW',
            theme: (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'auto')
                ? savedTheme
                : 'auto',
            model: '',
            temperature: 0.7,
            maxTokens: 8192,
            apiUrl: '',
            apiKey: '',
            topP: 0.9,
            topK: 40,
            showTokenStats: true
        }
    })

    const [attachedFiles, setAttachedFiles] = useState<File[]>([])
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set())
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
    const [showStreamingThinking, setShowStreamingThinking] = useState(false)

    const isMobileView = useMobileView(768)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)

    const currentMessages = conversations.find(c => c.id === currentConversationId)?.messages || []

    const { shouldAutoScroll, setShouldAutoScroll, scrollToBottom } = useAutoScroll({
        isStreaming,
        messagesEndRef,
        messagesContainerRef,
        currentMessages,
        streamingMessage
    })

    const toggleTheme = () => {
        const order: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto']
        const current = userSettings.theme as 'light' | 'dark' | 'auto'
        const next = order[(order.indexOf(current) + 1) % 3]
        const newIsDark = next === 'dark' ? true : next === 'auto' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
        setIsDarkMode(newIsDark)
        updateAndSaveSettings('theme', next)
    }

    const toggleFullscreen = () => {
        const newFullscreen = !isFullscreen
        setIsFullscreen(newFullscreen)
        document.body.classList.toggle('fullscreen-mode', newFullscreen)
    }

    const toggleThinking = (messageId: string) => {
        setExpandedThinking(prev => {
            const newSet = new Set(prev)
            if (newSet.has(messageId)) {
                newSet.delete(messageId)
            } else {
                newSet.add(messageId)
                setTimeout(() => scrollToBottom(), 100)
            }
            return newSet
        })
    }

    const toggleFiles = (messageId: string) => {
        setExpandedFiles(prev => {
            const newSet = new Set(prev)
            if (newSet.has(messageId)) {
                newSet.delete(messageId)
            } else {
                newSet.add(messageId)
            }
            return newSet
        })
    }

    const loadDefaultConfig = async () => {
        if (!localStorage.getItem('adminProviderSettings')) {
            const defaultSettings = {
                type: import.meta.env.VITE_DEFAULT_PROVIDER_TYPE || 'ollama',
                baseUrl: import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434',
                apiKey: import.meta.env.VITE_DEFAULT_API_KEY || '',
                model: import.meta.env.VITE_DEFAULT_MODEL || '',
                temperature: 0.7,
                maxTokens: 8192,
                topP: 0.9,
                topK: 40,
                showTokenStats: true
            }
            localStorage.setItem('adminProviderSettings', JSON.stringify(defaultSettings))
        }
    }

    const loadAvailableModels = async (currentModelOverride?: string) => {
        try {
            setIsLoadingModels(true)
            const effectiveModel = currentModelOverride !== undefined ? currentModelOverride : settings.model

            const adminSettings = localStorage.getItem('adminProviderSettings')
            let apiUrl = 'http://127.0.0.1:11434'
            let apiKey = ''
            let providerType = 'ollama'

            if (adminSettings) {
                try {
                    const parsed = JSON.parse(adminSettings)
                    apiUrl = parsed.baseUrl || 'http://127.0.0.1:11434'
                    apiKey = parsed.apiKey || ''
                    providerType = parsed.type || 'ollama'
                } catch (e) {}
            } else {
                apiUrl = settings.apiUrl || 'http://127.0.0.1:11434'
                apiKey = settings.apiKey || ''
                providerType = settings.type || 'ollama'
            }

            console.log('載入模型列表 - type:', providerType, 'apiUrl:', apiUrl)

            let models: Array<{ id: string; name: string }> = []
            const cleanApiUrl = apiUrl.replace(/\/v1\/?$/, '')

            try {
                const isOllama = providerType === 'ollama' || providerType === 'ollama-cloud'
                const isOllamaNative = isOllama && !apiUrl.includes('/v1')

                if (isOllamaNative) {
                    const headers: Record<string, string> = {}
                    if (apiKey) {
                        headers['Authorization'] = `Bearer ${apiKey}`
                    } else {
                        headers['X-Requested-With'] = 'XMLHttpRequest'
                    }
                    const response = await fetch(`${cleanApiUrl}/api/tags`, {
                        method: 'GET',
                        headers
                    })
                    if (response.ok) {
                        const data = await response.json()
                        models = (data.models || []).map((m: any) => ({
                            id: m.name,
                            name: m.name
                        }))
                    } else {
                        throw new Error(`Ollama returned status ${response.status}`)
                    }
                } else if (providerType === 'anthropic' || providerType === 'synthetic') {
                    const headers: Record<string, string> = {
                        'anthropic-version': '2023-06-01',
                        'dangerously-allow-browser': 'true'
                    }
                    if (apiKey) {
                        headers['x-api-key'] = apiKey
                    }
                    const response = await fetch(`${cleanApiUrl}/v1/models`, {
                        method: 'GET',
                        headers
                    })
                    if (response.ok) {
                        const data = await response.json()
                        models = (data.data || []).map((m: any) => ({
                            id: m.id,
                            name: m.id
                        }))
                    } else {
                        throw new Error(`Anthropic returned status ${response.status}`)
                    }
                } else {
                    const headers: Record<string, string> = {}
                    if (apiKey) {
                        headers['Authorization'] = `Bearer ${apiKey}`
                    } else {
                        headers['X-Requested-With'] = 'XMLHttpRequest'
                    }
                    const response = await fetch(`${cleanApiUrl}/v1/models`, {
                        method: 'GET',
                        headers
                    })
                    if (response.ok) {
                        const data = await response.json()
                        models = (data.data || []).map((m: any) => ({
                            id: m.id,
                            name: m.id
                        }))
                    } else {
                        throw new Error(`Provider returned status ${response.status}`)
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch models from API, using fallback list:', error)
                if (providerType === 'openai') {
                    models = [
                        { id: 'gpt-4o', name: 'gpt-4o' },
                        { id: 'gpt-4o-mini', name: 'gpt-4o-mini' },
                        { id: 'gpt-4-turbo', name: 'gpt-4-turbo' },
                        { id: 'o1-mini', name: 'o1-mini' }
                    ]
                } else if (providerType === 'anthropic' || providerType === 'synthetic') {
                    models = [
                        { id: 'claude-3-5-sonnet-20241022', name: 'claude-3-5-sonnet-20241022' },
                        { id: 'claude-3-5-haiku-20241022', name: 'claude-3-5-haiku-20241022' },
                        { id: 'claude-3-opus-20240229', name: 'claude-3-opus-20240229' }
                    ]
                } else if (providerType === 'google-gemini') {
                    models = [
                        { id: 'gemini-2.5-flash', name: 'gemini-2.5-flash' },
                        { id: 'gemini-2.5-pro', name: 'gemini-2.5-pro' }
                    ]
                } else if (providerType === 'deepseek') {
                    models = [
                        { id: 'deepseek-chat', name: 'deepseek-chat' },
                        { id: 'deepseek-reasoner', name: 'deepseek-reasoner' }
                    ]
                } else if (providerType === 'groq') {
                    models = [
                        { id: 'llama-3.3-70b-versatile', name: 'llama-3.3-70b-versatile' },
                        { id: 'llama-3.1-8b-instant', name: 'llama-3.1-8b-instant' },
                        { id: 'mixtral-8x7b-32768', name: 'mixtral-8x7b-32768' }
                    ]
                } else if (providerType === 'mistral') {
                    models = [
                        { id: 'mistral-large-latest', name: 'mistral-large-latest' },
                        { id: 'open-mixtral-8x22b', name: 'open-mixtral-8x22b' }
                    ]
                } else if (providerType === 'xai-grok') {
                    models = [
                        { id: 'grok-2-1212', name: 'grok-2-1212' },
                        { id: 'grok-2-vision-1212', name: 'grok-2-vision-1212' }
                    ]
                } else if (providerType === 'together') {
                    models = [
                        { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', name: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo' },
                        { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', name: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo' }
                    ]
                } else if (providerType === 'openrouter') {
                    models = [
                        { id: 'google/gemini-2.5-pro', name: 'google/gemini-2.5-pro' },
                        { id: 'meta-llama/llama-3.3-70b-instruct', name: 'meta-llama/llama-3.3-70b-instruct' }
                    ]
                } else if (providerType === 'moonshot') {
                    models = [
                        { id: 'moonshot-v1-8k', name: 'moonshot-v1-8k' },
                        { id: 'moonshot-v1-32k', name: 'moonshot-v1-32k' }
                    ]
                } else {
                    models = [
                        { id: 'local-model', name: 'local-model' }
                    ]
                }
            }

            if (effectiveModel && !models.some(m => m.id === effectiveModel)) {
                models.unshift({ id: effectiveModel, name: effectiveModel })
            }

            setAvailableModels(models)

            if (models.length > 0) {
                const isCurrentModelValid = models.some((m: any) => m.id === effectiveModel)
                if (!effectiveModel || !isCurrentModelValid) {
                    const fallbackModel = models[0].id
                    setSettings(prev => ({ ...prev, model: fallbackModel }))
                    setUserSettings(prev => ({ ...prev, model: fallbackModel }))
                    try {
                        const existing = localStorage.getItem('adminProviderSettings')
                        if (existing) {
                            const parsed = JSON.parse(existing)
                            parsed.model = fallbackModel
                            localStorage.setItem('adminProviderSettings', JSON.stringify(parsed))
                        }
                    } catch (e) {}
                } else if (effectiveModel !== settings.model) {
                    setSettings(prev => ({ ...prev, model: effectiveModel }))
                    setUserSettings(prev => ({ ...prev, model: effectiveModel }))
                }
            } else {
                setSettings(prev => ({ ...prev, model: '' }))
                setUserSettings(prev => ({ ...prev, model: '' }))
            }
        } catch (error) {
            console.error('Error loading models:', error)
            setAvailableModels([])
        } finally {
            setIsLoadingModels(false)
        }
    }

    usePrefersColorSchemeSync({ setIsDarkMode })
    useApplyThemeClasses({ isDarkMode })

    const loadUserSettings = async () => {
        try {
            await loadDefaultConfig()

            const adminSettings = localStorage.getItem('adminProviderSettings')
            let providerConfig = {
                type: 'ollama',
                apiUrl: 'http://localhost:11434',
                apiKey: '',
                model: '',
                temperature: 0.7,
                maxTokens: 8192,
                topP: 0.9,
                topK: 40,
                showTokenStats: true
            }

            if (adminSettings) {
                try {
                    const parsed = JSON.parse(adminSettings)
                    providerConfig = {
                        ...providerConfig,
                        type: parsed.type || 'ollama',
                        apiUrl: parsed.baseUrl || 'http://localhost:11434',
                        apiKey: parsed.apiKey || '',
                        model: parsed.model || '',
                        temperature: parsed.temperature || 0.7,
                        maxTokens: parsed.maxTokens || 8192,
                    }
                } catch (e) {
                    console.error('解析 adminSettings 失敗:', e)
                }
            }

            const savedPrefs = localStorage.getItem('llmchat_settings')
            let userPrefs = {
                language: 'zh-TW',
                theme: 'auto',
                showTokenStats: true
            }
            if (savedPrefs) {
                try {
                    userPrefs = { ...userPrefs, ...JSON.parse(savedPrefs) }
                } catch (e) {}
            }

            const mergedSettings = {
                ...providerConfig,
                ...userPrefs
            }

            setUserSettings(mergedSettings)
            setSettings(mergedSettings)

            if (mergedSettings.language) {
                await i18n.changeLanguage(mergedSettings.language)
                const htmlElement = document.getElementById('html-root') as HTMLHtmlElement
                if (htmlElement) {
                    htmlElement.lang = mergedSettings.language
                }
            }

            const localTheme = mergedSettings.theme
            if (localTheme) {
                if (localTheme === 'auto') {
                    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
                    setIsDarkMode(mediaQuery.matches)
                } else {
                    setIsDarkMode(localTheme === 'dark')
                }
            }

            setTimeout(() => {
                loadAvailableModels(mergedSettings.model)
            }, 100)
        } catch (error) {
            console.error('Error loading user settings:', error)
        }
    }

    const saveUserSettingsToServer = async (settingsToSave: any) => {
        try {
            const saved = localStorage.getItem('llmchat_settings')
            let current = saved ? JSON.parse(saved) : {}
            const updated = { ...current, ...settingsToSave }
            localStorage.setItem('llmchat_settings', JSON.stringify(updated))
            
            setUserSettings(prev => ({ ...prev, ...settingsToSave }))
            setSettings(prev => ({ ...prev, ...settingsToSave }))
        } catch (error) {
            console.error('Error saving settings:', error)
        }
    }

    const updateAndSaveSettings = async (key: string, value: any) => {
        const nextSettings = { ...userSettings, [key]: value }
        
        setUserSettings(nextSettings)
        setSettings(prev => ({ ...prev, [key]: value }))
        
        if (key === 'theme') {
            localStorage.setItem('theme', value)
        }
        if (key === 'language') {
            try { localStorage.setItem('llmchat_language', value) } catch {}
        }
        
        await saveUserSettingsToServer({ [key]: value })
        return nextSettings
    }

    const handleSaveProviderSettings = async (providerData: {
        type: string
        baseUrl: string
        apiKey: string
        model: string
        temperature: number
        maxTokens: number
    }) => {
        localStorage.setItem('adminProviderSettings', JSON.stringify({
            type: providerData.type,
            baseUrl: providerData.baseUrl,
            apiKey: providerData.apiKey,
            model: providerData.model,
            temperature: providerData.temperature,
            maxTokens: providerData.maxTokens
        }))

        setSettings(prev => ({
            ...prev,
            type: providerData.type,
            apiUrl: providerData.baseUrl,
            apiKey: providerData.apiKey,
            model: providerData.model,
            temperature: providerData.temperature,
            maxTokens: providerData.maxTokens
        }))

        setUserSettings(prev => ({
            ...prev,
            type: providerData.type,
            apiUrl: providerData.baseUrl,
            apiKey: providerData.apiKey,
            model: providerData.model,
            temperature: providerData.temperature,
            maxTokens: providerData.maxTokens
        }))

        setTimeout(() => {
            loadAvailableModels(providerData.model)
        }, 100)
    }

    useEffect(() => {
        loadUserSettings()

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'adminProviderSettings') {
                console.log('Provider settings updated, reloading models...')
                setTimeout(() => {
                    loadAvailableModels()
                }, 100)
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [])

    const createNewConversation = () => {
        createNewConversationInternal()
        setShouldAutoScroll(true)
    }

    const switchConversation = (conversationId: string) => {
        setCurrentConversationId(conversationId)
        setShowConversations(false)
    }

    const deleteConversation = (conversationId: string) => {
        const conversation = conversations.find(c => c.id === conversationId)
        if (!conversation) return

        const confirmed = window.confirm(t('conversation.delete.confirm', { title: conversation.title }))
        if (!confirmed) return

        if (conversationId === currentConversationId && isStreaming) {
            requestStop(true)
        }

        removeConversation(conversationId)
    }

    const handleDeleteMessage = (conversationId: string, messageId: string) => {
        const conversation = conversations.find(c => c.id === conversationId)
        if (!conversation) return

        const message = conversation.messages.find(m => m.id === messageId)
        if (!message) return

        const confirmed = window.confirm(t('messages.delete.confirm'))
        if (!confirmed) return

        deleteMessage(conversationId, messageId)
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        const validFiles = files.filter(file => {
            if (file.size > 50 * 1024 * 1024) {
                alert(t('input.files.sizeError', { name: file.name }))
                return false
            }
            const allowedTypes = ['image/', 'text/', 'application/pdf', 'application/json']
            if (!allowedTypes.some(type => file.type.startsWith(type))) {
                alert(t('input.files.typeError', { type: file.type }))
                return false
            }
            return true
        })
        setAttachedFiles(prev => [...prev, ...validFiles])
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const readFileContent = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (file.type === 'application/pdf') {
                resolve(`[PDF檔案: ${file.name}]\n${t('input.files.pdfNote')}`)
            } else if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = () => reject(reader.error)
                reader.readAsDataURL(file)
            } else {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = () => reject(reader.error)
                reader.readAsText(file)
            }
        })
    }

    const exportConversation = (format: 'json' | 'markdown' = 'json') => {
        if (!currentConversationId) return

        const conversation = conversations.find(c => c.id === currentConversationId)
        if (!conversation) return

        let content = ''
        let filename = ''
        let mimeType = ''

        if (format === 'json') {
            content = JSON.stringify(conversation, null, 2)
            filename = `${conversation.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`
            mimeType = 'application/json'
        } else if (format === 'markdown') {
            content = `# ${conversation.title}\n\n`
            content += `${t('conversation.export.created')}: ${conversation.createdAt.toLocaleString(i18n.language)}\n`
            content += `${t('conversation.export.updated')}: ${conversation.updatedAt.toLocaleString(i18n.language)}\n\n`
            content += `---\n\n`

            conversation.messages.forEach((message, index) => {
                const role = message.role === 'user' ? t('messages.user') : t('messages.assistant')
                content += `## ${role} (${message.timestamp.toLocaleString(i18n.language)})\n\n`
                content += `${message.content}\n\n`
                if (message.role === 'assistant' && message.thinking) {
                    content += `**${t('messages.thinking')}：**\n\n${message.thinking}\n\n`
                }
                if (index < conversation.messages.length - 1) {
                    content += `---\n\n`
                }
            })

            filename = `${conversation.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`
            mimeType = 'text/markdown'
        }

        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const sendStreamingMessage = async () => {
        if ((!input.trim() && attachedFiles.length === 0) || isLoading) return

        let messageContent = input.trim()
        if (attachedFiles.length > 0) {
            messageContent = messageContent + '\n\n[附加檔案: ' + attachedFiles.map(f => f.name).join(', ') + ']'
        }

        let hiddenContent = messageContent
        const images: string[] = []
        if (attachedFiles.length > 0) {
            try {
                const fileContents = await Promise.all(attachedFiles.map(async file => {
                    const content = await readFileContent(file)
                    if (file.type.startsWith('image/')) {
                        images.push(content)
                        return `--- Image: ${file.name} (Base64) ---`
                    }
                    return `--- File: ${file.name} ---\n${content}\n--- End of File ---`
                }))
                hiddenContent = messageContent + '\n\n' + fileContents.join('\n\n')
            } catch (error) {
                console.error('Error reading attached files:', error)
            }
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageContent,
            hiddenContent: hiddenContent !== messageContent ? hiddenContent : undefined,
            timestamp: new Date()
        }

        let conversationId = currentConversationId
        if (!conversationId) {
            const newConversation = createConversation({
                title: `對話 ${conversations.length + 1}`,
                messages: [userMessage]
            })
            addConversation(newConversation, true)
            conversationId = newConversation.id
        } else {
            appendMessage(conversationId, userMessage)
        }

        setInput('')
        setAttachedFiles([])
        setIsLoading(true)

        try {
            const baseConversation = conversations.find(c => c.id === conversationId)
            const historyMessages = [...(baseConversation?.messages || []), userMessage]

            let finalSettings = settings
            const hasImage = images.length > 0
            try {
                const adminSettings = localStorage.getItem('adminProviderSettings')
                if (adminSettings) {
                    const parsed = JSON.parse(adminSettings)
                    const selectedModel = (hasImage && parsed.visionModel) 
                        ? parsed.visionModel 
                        : (parsed.model || settings.model)

                    finalSettings = {
                        ...settings,
                        type: parsed.type || settings.type,
                        model: selectedModel,
                        apiUrl: parsed.baseUrl || settings.apiUrl,
                        apiKey: parsed.apiKey || settings.apiKey
                    }
                }
            } catch (e) {}

            const result = await streamChat({
                message: userMessage.hiddenContent || userMessage.content,
                settings: finalSettings,
                history: historyMessages.map(msg => ({
                    role: msg.role,
                    content: msg.hiddenContent || msg.content
                })),
                images: images.length > 0 ? images : undefined,
                language: i18n.language
            })

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.wasInterrupted ? result.content + '\n\n**' + t('messages.interrupted') + '**' : result.content,
                thinking: result.thinking || undefined,
                timestamp: new Date(),
                interrupted: result.wasInterrupted,
                tokenCount: result.tokenCount,
                tokensPerSecond: result.tokensPerSecond
            }

            appendMessage(conversationId, assistantMessage)

            if (baseConversation && baseConversation.messages.length === 0) {
                const title = userMessage.content.length > 20
                    ? userMessage.content.substring(0, 20) + '...'
                    : userMessage.content
                updateConversationTitle(conversationId, title)
            }
        } catch (error) {
            console.error('Error sending streaming message:', error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: t('messages.error'),
                timestamp: new Date()
            }
            appendMessage(conversationId, errorMessage)
        } finally {
            setIsLoading(false)
            setTimeout(() => {
                textareaRef.current?.focus()
            }, 100)
        }
    }

    useKeyboardShortcuts({
        showSettings,
        showConversations,
        setShowSettings,
        setShowConversations,
        onNewConversation: createNewConversation,
        onClearChat: clearChat
    })

    useOutsideClickClosePanels({ showConversations, showSettings, setShowConversations, setShowSettings })

    useEffect(() => {
        if (settings.apiUrl) {
            const timeoutId = setTimeout(() => {
                loadAvailableModels()
            }, 500)
            return () => clearTimeout(timeoutId)
        }
    }, [settings.apiUrl])

    useEffect(() => {
        return () => {
            if (inputTimeoutRef.current) {
                clearTimeout(inputTimeoutRef.current)
            }
        }
    }, [])

    const sendMessage = async () => {
        await sendStreamingMessage()
    }

    const handleSendClick = () => {
        if (isStreaming) {
            requestStop()
        } else {
            sendMessage()
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    function clearChat() {
        if (currentConversationId) {
            const confirmed = window.confirm(t('conversation.clear.confirm'))
            if (!confirmed) return

            if (isStreaming) {
                requestStop(true)
            }

            clearConversationMessages(currentConversationId)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">載入中...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex flex-col h-full transition-colors ${isFullscreen ? 'fullscreen-app' : ''} ${isMobileView && !isFullscreen ? 'pt-16' : ''}`}>
            <Header
                isDarkMode={isDarkMode}
                isFullscreen={isFullscreen}
                showSettings={showSettings}
                showConversations={showConversations}
                settings={settings}
                conversations={conversations}
                availableModels={availableModels}
                isLoadingModels={isLoadingModels}
                currentTheme={(userSettings.theme as 'auto' | 'light' | 'dark')}
                onToggleTheme={toggleTheme}
                onToggleFullscreen={toggleFullscreen}
                onToggleSettings={() => setShowSettings(!showSettings)}
                onToggleModelOnly={() => {
                    setShowModelOnly(!showModelOnly)
                    setShowSettings(false)
                }}
                onToggleConversations={() => setShowConversations(!showConversations)}
                onNewConversation={createNewConversation}
                onClearChat={clearChat}
                onExportConversation={exportConversation}
                onModelChange={(modelId: string) => {
                    const newPartialSettings = { model: modelId }
                    
                    setSettings(prev => ({ ...prev, ...newPartialSettings }))
                    setUserSettings(prev => ({ ...prev, ...newPartialSettings }))
                    
                    try {
                        const existing = localStorage.getItem('adminProviderSettings')
                        if (existing) {
                            const parsed = JSON.parse(existing)
                            parsed.model = modelId
                            localStorage.setItem('adminProviderSettings', JSON.stringify(parsed))
                            
                            if (parsed.type) {
                                setSettings(prev => ({ ...prev, type: parsed.type }))
                                setUserSettings(prev => ({ ...prev, type: parsed.type }))
                            }
                        }
                    } catch (e) {}
                    
                    saveUserSettingsToServer(newPartialSettings)
                }}
                onLogout={logout}
                user={user}
                isMobileView={isMobileView}
            />

            {/* Conversations Panel */}
            {showConversations && (
                <div data-panel="conversations" className={`border-b px-4 py-3 transition-colors ${isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                    }`}>
                    <div className="space-y-2">
                        <h3 className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                            {t('conversation.list')}
                        </h3>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                            {conversations.length === 0 ? (
                                <p className={`text-sm transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                    {t('conversation.empty')}
                                </p>
                            ) : (
                                conversations
                                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                                    .map((conversation) => (
                                        <div
                                            key={conversation.id}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${currentConversationId === conversation.id
                                                ? (isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')
                                                : (isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')
                                                }`}
                                            onClick={() => switchConversation(conversation.id)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {conversation.title}
                                                </p>
                                                <p className="text-xs opacity-70">
                                                    {conversation.messages.length} {t('conversation.messages')} · {conversation.updatedAt.toLocaleDateString(i18n.language)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    deleteConversation(conversation.id)
                                                }}
                                                className={`p-1 rounded transition-colors ${isDarkMode
                                                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600'
                                                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                                    }`}
                                                title={t('conversation.delete.button')}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Dropdown */}
            {(showSettings || showModelOnly) && (
                <div 
                    data-panel="settings" 
                    className={`absolute top-16 right-4 w-72 md:w-80 rounded-lg shadow-xl z-50 border overflow-hidden transition-all duration-200 ease-in-out ${isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                    }`}>
                    <div className="p-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">
                        {!showModelOnly && (
                            <>
                                <div className="space-y-4">
                                    <h3 className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                        }`}>
                                        {t('settings.panels.user')}
                                    </h3>

                                    <div>
                                        <label className={`block text-sm font-medium mb-1 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                            {t('settings.language.label')}
                                        </label>
                                        <select
                                            value={i18n.language}
                                            onChange={async (e) => {
                                                const newLanguage = e.target.value
                                                await updateAndSaveSettings('language', newLanguage)
                                                await i18n.changeLanguage(newLanguage)
                                                try { localStorage.setItem('llmchat_language', newLanguage) } catch {}
                                                const htmlElement = document.getElementById('html-root') as HTMLHtmlElement
                                                if (htmlElement) {
                                                    htmlElement.lang = newLanguage
                                                }
                                            }}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300'
                                                }`}
                                        >
                                            <option value="zh-TW">🇹🇼 繁體中文</option>
                                            <option value="zh-CN">🇨🇳 简体中文</option>
                                            <option value="en">🇺🇸 English</option>
                                            <option value="ja">🇯🇵 日本語</option>
                                            <option value="ko">🇰🇷 한국어</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-1 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                            {t('settings.theme.label')}
                                        </label>
                                        <select
                                            value={userSettings.theme}
                                            onChange={async (e) => {
                                                const newTheme = e.target.value
                                                await updateAndSaveSettings('theme', newTheme)
                                                if (newTheme === 'auto') {
                                                    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
                                                    setIsDarkMode(mediaQuery.matches)
                                                } else {
                                                    setIsDarkMode(newTheme === 'dark')
                                                }
                                            }}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300'
                                                }`}
                                        >
                                            <option value="auto">{t('settings.theme.auto')}</option>
                                            <option value="light">{t('settings.theme.light')}</option>
                                            <option value="dark">{t('settings.theme.dark')}</option>
                                        </select>
                                    </div>

                                    {/* AI 供應商配置按鈕 */}
                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4 space-y-3">
                                        <h4 className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {t('settings.aiProviderSettings')}
                                        </h4>
                                        <button
                                            onClick={() => {
                                                setShowProviderSettingsModal(true)
                                                setShowSettings(false)
                                            }}
                                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
                                        >
                                            <Settings className="w-4 h-4" />
                                            {t('settings.configureApiAndModel')}
                                        </button>
                                    </div>

                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                                        <label className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                            {t('settings.parameters.showTokenStats')}
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    updateAndSaveSettings('showTokenStats', !userSettings.showTokenStats)
                                                }}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${settings.showTokenStats
                                                    ? 'bg-blue-600'
                                                    : isDarkMode
                                                        ? 'bg-gray-600'
                                                        : 'bg-gray-200'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.showTokenStats ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                            <span className={`text-sm transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                }`}>
                                                {settings.showTokenStats ? t('settings.parameters.on') : t('settings.parameters.off')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chat-messages">
                {currentMessages.length === 0 ? (
                    <div className={`text-center mt-12 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                        <Bot className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-300'
                            }`} />
                        <p className="text-lg mb-2">{t('app.welcome.title')}</p>
                        <p className="text-sm">{t('app.welcome.subtitle')}</p>
                        <p className="text-sm">{t('app.welcome.fileHint')}</p>
                    </div>
                ) : (
                    currentMessages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex items-start space-x-3 group ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                                }`}
                        >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : isDarkMode
                                    ? 'bg-gray-700 text-gray-300'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                {message.role === 'user' ? (
                                    <User className="h-4 w-4" />
                                ) : (
                                    <Bot className="h-4 w-4" />
                                )}
                            </div>
                            <div className={`flex-1 max-w-[90%] ${message.role === 'user' ? 'text-right' : ''
                                }`}>
                                <div className={`inline-block px-4 py-2 rounded-lg transition-colors chat-message-content relative ${message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : `pr-8 ${isDarkMode
                                        ? 'bg-gray-800 text-gray-100 border border-gray-700'
                                        : 'bg-white text-gray-900 border border-gray-200'
                                    }`
                                    }`}>
                                    {(() => {
                                        const lines = message.content.split('\n')
                                        const fileLineIndex = lines.findIndex(line => line.startsWith('[附加檔案:'))
                                        const hasFiles = fileLineIndex !== -1

                                        const contentLines = hasFiles ? lines.slice(0, fileLineIndex) : lines
                                        const fileLines = hasFiles ? lines.slice(fileLineIndex) : []

                                        return (
                                            <>
                                                <MarkdownMessage
                                                    content={contentLines.join('\n')}
                                                    isDarkMode={isDarkMode}
                                                    isUser={message.role === 'user'}
                                                />

                                                {fileLines.map((line, index) => {
                                                    if (line.startsWith('[附加檔案:')) {
                                                        return (
                                                            <div key={index} className={`mt-3 border-t pt-3 ${message.role === 'user'
                                                                ? (isDarkMode ? 'border-blue-200' : 'border-blue-100')
                                                                : 'border-gray-200 dark:border-gray-600'
                                                                }`}>
                                                                <button
                                                                    onClick={() => toggleFiles(message.id)}
                                                                    className={`flex items-center space-x-2 text-sm font-medium transition-colors ${message.role === 'user'
                                                                        ? (isDarkMode ? 'text-blue-200 hover:text-blue-100' : 'text-blue-100 hover:text-white')
                                                                        : (isDarkMode
                                                                            ? 'text-gray-400 hover:text-gray-200'
                                                                            : 'text-gray-600 hover:text-gray-800')
                                                                        }`}
                                                                >
                                                                    <span>{t('messages.files')}</span>
                                                                    <svg
                                                                        className={`w-4 h-4 transition-transform ${expandedFiles.has(message.id) ? 'rotate-90' : ''}`}
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                </button>
                                                                {expandedFiles.has(message.id) && (
                                                                    <div className={`mt-2 p-3 rounded-md text-sm transition-colors ${isDarkMode
                                                                        ? 'bg-gray-700 text-gray-300 border border-gray-600'
                                                                        : 'bg-gray-100 text-gray-800 border border-gray-300'
                                                                        }`}>
                                                                        <pre className="whitespace-pre-wrap break-words font-mono text-xs">{line}</pre>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                })}
                                            </>
                                        )
                                    })()}
                                    {message.role === 'assistant' && (
                                        <>
                                            {message.thinking && (
                                                <div className="mt-3 border-t border-gray-200 dark:border-gray-600 pt-3">
                                                    <button
                                                        onClick={() => toggleThinking(message.id)}
                                                        className={`flex items-center space-x-2 text-sm font-medium transition-colors ${isDarkMode
                                                            ? 'text-gray-400 hover:text-gray-200'
                                                            : 'text-gray-600 hover:text-gray-800'
                                                            }`}
                                                    >
                                                        <span>{t('messages.thinking')}</span>
                                                        <svg
                                                            className={`w-4 h-4 transition-transform ${expandedThinking.has(message.id) ? 'rotate-90' : ''}`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                    {expandedThinking.has(message.id) && (
                                                        <div className={`mt-2 p-3 rounded-md text-sm transition-colors ${isDarkMode
                                                            ? 'bg-gray-700 text-gray-300 border border-gray-600'
                                                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                                                            }`}>
                                                            <pre className="whitespace-pre-wrap break-words font-mono text-xs">{message.thinking}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {message.role === 'assistant' && (
                                        <div className="absolute top-1 right-1 flex flex-col items-center space-y-1 z-10">
                                            <button
                                                key={`speech-btn-${message.id}`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleSpeechForMessage({ messageId: message.id, text: message.content })
                                                }}
                                                className={`p-1 rounded-full transition-colors shadow-sm ${(() => {
                                                    const { isPlayingThis, isGlobalPlaying, isInQueue } = getSpeechButtonState(message.id)

                                                    if (isPlayingThis) {
                                                        return 'bg-green-500 text-white hover:bg-green-600'
                                                    } else if (isInQueue) {
                                                        return 'bg-orange-500 text-white hover:bg-red-400'
                                                    } else if (isGlobalPlaying) {
                                                        return 'bg-red-500 text-white'
                                                    } else {
                                                        return isDarkMode
                                                            ? 'bg-gray-600 text-gray-300 hover:text-green-400 hover:bg-gray-500'
                                                            : 'bg-gray-200 text-gray-600 hover:text-green-600 hover:bg-gray-300'
                                                    }
                                                })()
                                                    }`}
                                                title={
                                                    isSpeaking && currentPlayingItemRef.current?.messageId === message.id
                                                        ? t('messages.voice.stop')
                                                        : globalSpeakingMessageId === message.id
                                                            ? t('messages.voice.otherTabPlaying')
                                                            : speechQueue.some(item => item.messageId === message.id)
                                                                ? t('messages.voice.removeFromQueue')
                                                                : t('messages.voice.play')
                                                }
                                                disabled={isSpeechButtonDisabled(message.id)}
                                                style={{ zIndex: 10, pointerEvents: 'auto' }}
                                            >
                                                <Volume2 className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteMessage(currentConversationId, message.id)
                                                }}
                                                className={`p-1 rounded-full transition-colors shadow-sm opacity-0 group-hover:opacity-100 ${isDarkMode
                                                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                                                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                                    }`}
                                                title={t('messages.delete.button')}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}

                                    {message.role === 'user' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteMessage(currentConversationId, message.id)
                                            }}
                                            className={`absolute top-1 right-1 p-1 rounded-full transition-colors shadow-sm opacity-0 group-hover:opacity-100 ${isDarkMode
                                                ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600'
                                                : 'text-gray-500 hover:text-red-600 hover:bg-gray-200'
                                                }`}
                                            title={t('messages.delete.button')}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}

                                    {message.role === 'assistant' && message.tokenCount !== undefined && settings.showTokenStats && (
                                        <div className="mt-2 text-xs font-mono transition-colors">
                                            <span className="inline-block px-2 py-1 rounded-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                {message.tokenCount} tokens | {(message.tokensPerSecond || 0).toFixed(2)} tokens/s
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <p className={`text-xs mt-1 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                    {message.timestamp.toLocaleTimeString(i18n.language)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                {isStreaming && (
                    <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-200 text-gray-600'
                            }`}>
                            <Bot className="h-4 w-4" />
                        </div>
                        <div className="flex-1 max-w-[90%] transition-colors">
                            <div className={`inline-block px-4 py-2 rounded-lg transition-colors ${isDarkMode
                                ? 'bg-gray-800 text-gray-100 border border-gray-700'
                                : 'bg-white text-gray-900 border border-gray-200'
                                }`}>
                                <MarkdownMessage
                                    content={streamingMessage || t('messages.generating')}
                                    isDarkMode={isDarkMode}
                                    isUser={false}
                                />
                                <div className="flex space-x-1 mt-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                {streamingThinking && (
                                    <div className="mt-3 border-t border-gray-200 dark:border-gray-600 pt-3">
                                        <button
                                            onClick={() => setShowStreamingThinking(!showStreamingThinking)}
                                            className={`flex items-center space-x-2 text-sm font-medium transition-colors ${isDarkMode
                                                ? 'text-gray-400 hover:text-gray-200'
                                                : 'text-gray-600 hover:text-gray-800'
                                                }`}
                                        >
                                            <span>{t('messages.thinking')}</span>
                                            <svg
                                                className={`w-4 h-4 transition-transform ${showStreamingThinking ? 'rotate-90' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                        {showStreamingThinking && (
                                            <div className={`mt-2 p-3 rounded-md text-sm transition-colors ${isDarkMode
                                                ? 'bg-gray-700 text-gray-300 border border-gray-600'
                                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                                                }`}>
                                                <pre className="whitespace-pre-wrap break-words font-mono text-xs">{streamingThinking}</pre>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {settings.showTokenStats && (
                                    <div className="mt-2 text-xs font-mono transition-colors">
                                        <span className="inline-block px-2 py-1 rounded-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                            {tokenCount} tokens | {tokensPerSecond.toFixed(2)} tokens/s
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={`border-t px-4 py-4 transition-colors ${isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
                }`}>
                {attachedFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {attachedFiles.map((file, index) => (
                            <div
                                key={index}
                                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-colors ${isDarkMode
                                    ? 'bg-gray-700 text-gray-300'
                                    : 'bg-gray-100 text-gray-700'
                                    }`}
                            >
                                <Paperclip className="h-3 w-3" />
                                <span className="truncate max-w-32">{file.name}</span>
                                <button
                                    onClick={() => removeFile(index)}
                                    className={`p-0.5 rounded-full transition-colors ${isDarkMode
                                        ? 'hover:bg-gray-600 text-gray-400 hover:text-red-400'
                                        : 'hover:bg-gray-200 text-gray-500 hover:text-red-600'
                                        }`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex items-end space-x-3">
                    <div className="flex-1 relative">
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInputDebounced(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={isMobileView ? (input ? '' : '輸入訊息...') : t('input.placeholder')}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[52px] max-h-32 transition-colors ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-300'
                                    }`}
                                rows={1}
                                disabled={isLoading}
                            />
                            {stopConfirmText && (
                                <div className={`absolute right-6 top-1/2 transform -translate-y-1/2 text-sm font-medium pointer-events-none transition-colors ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                    {t('buttons.stopConfirm')}
                                </div>
                            )}
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,text/*,.pdf,.json"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={startVoiceInput}
                        className={`p-3 rounded-lg transition-colors ${isRecording
                            ? 'bg-red-600 text-white animate-pulse'
                            : isDarkMode
                                ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                                : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                            }`}
                        title={isRecording ? t('input.voice.stop') : t('input.voice.start')}
                        disabled={isLoading}
                    >
                        {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                    {/* 網路搜尋開關按鈕 (純前端版暫停使用) */}
                    <button
                        type="button"
                        className={`p-3 rounded-lg transition-colors cursor-not-allowed ${isDarkMode
                            ? 'text-gray-600 hover:bg-gray-700/30'
                            : 'text-gray-300 hover:bg-gray-100/30'
                            }`}
                        title={t('input.webSearchUnsupported')}
                        disabled
                    >
                        <Globe className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3 rounded-lg transition-colors ${isDarkMode
                            ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                            : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                            }`}
                        title={t('input.files.button')}
                        disabled={isLoading}
                    >
                        <Paperclip className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleSendClick}
                        disabled={(!input.trim() && attachedFiles.length === 0) && !isStreaming || availableModels.length === 0}
                        className={`p-3 rounded-lg transition-colors ${(input.trim() || attachedFiles.length > 0 || isStreaming) && availableModels.length > 0
                            ? isStreaming
                                ? stopRequested
                                    ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                                    : 'bg-orange-600 text-white hover:bg-orange-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            : isDarkMode
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        title={isStreaming ? (stopRequested ? t('buttons.stopAction') : t('buttons.stop')) : t('buttons.send')}
                    >
                        {isStreaming ? (
                            stopRequested ? (
                                <span className="text-xs font-medium">{t('buttons.stopAction')}</span>
                            ) : (
                                <Square className="h-5 w-5" />
                            )
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Provider Configuration Modal */}
            {showProviderSettingsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div 
                        className={`w-full max-w-lg p-6 rounded-xl shadow-2xl border transition-all duration-200 transform scale-100 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                {t('settings.aiProviderSettings')}
                            </h3>
                            <button 
                                onClick={() => setShowProviderSettingsModal(false)}
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <ProviderSettings
                                currentProvider={{
                                    type: settings.type || 'ollama',
                                    baseUrl: settings.apiUrl || 'http://localhost:11434',
                                    model: settings.model || '',
                                    apiKey: settings.apiKey || '',
                                    temperature: settings.temperature ?? 0.7,
                                    maxTokens: settings.maxTokens ?? 2048,
                                    requiresApiKey: AVAILABLE_PROVIDERS.find(p => p.type === (settings.type || 'ollama'))?.requiresApiKey ?? true
                                }}
                                availableProviders={AVAILABLE_PROVIDERS}
                                onSave={handleSaveProviderSettings}
                                onClose={() => setShowProviderSettingsModal(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
