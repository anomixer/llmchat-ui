import { useCallback, useEffect, useRef, useState } from 'react'

export interface StreamChatInput {
    message: string
    settings: any
    history: Array<{ role: string; content: string }>
    language: string
    images?: string[]
    webSearch?: boolean
}

export interface StreamChatResult {
    content: string
    thinking: string
    wasInterrupted: boolean
    tokenCount: number
    tokensPerSecond: number
}

type ParserState = {
    inThinkTag: boolean
    accumulatedThinking: string
    accumulatedContent: string
    pendingBuffer: string
}

function createInitialParserState(): ParserState {
    return {
        inThinkTag: false,
        accumulatedThinking: '',
        accumulatedContent: '',
        pendingBuffer: ''
    }
}

export function useChatStreaming() {
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamingMessage, setStreamingMessage] = useState('')
    const [streamingThinking, setStreamingThinking] = useState('')
    const [stopRequested, setStopRequested] = useState(false)
    const [stopConfirmText, setStopConfirmText] = useState('')
    const [tokenCount, setTokenCount] = useState(0)
    const [tokensPerSecond, setTokensPerSecond] = useState(0)

    const shouldContinueRef = useRef(true)
    const abortControllerRef = useRef<AbortController | null>(null)
    const stopResetTimerRef = useRef<number | null>(null)

    const parserStateRef = useRef<ParserState>(createInitialParserState())
    const finalStateRef = useRef({ content: '', thinking: '' })

    const resetParser = useCallback(() => {
        parserStateRef.current = createInitialParserState()
    }, [])

    const processStreamChunk = useCallback((chunk: string) => {
        const state = parserStateRef.current
        state.pendingBuffer += chunk

        let continueProcessing = true
        while (continueProcessing && state.pendingBuffer.length > 0) {
            continueProcessing = false

            if (!state.inThinkTag) {
                const thinkStart = state.pendingBuffer.indexOf('<think>')

                if (thinkStart !== -1) {
                    const contentBeforeTag = state.pendingBuffer.substring(0, thinkStart)
                    state.accumulatedContent += contentBeforeTag
                    state.inThinkTag = true
                    state.pendingBuffer = state.pendingBuffer.substring(thinkStart + 7)
                    continueProcessing = true
                }
            } else {
                const thinkEnd = state.pendingBuffer.indexOf('</think>')

                if (thinkEnd !== -1) {
                    const thinkingContent = state.pendingBuffer.substring(0, thinkEnd)
                    state.accumulatedThinking += thinkingContent
                    state.inThinkTag = false
                    state.pendingBuffer = state.pendingBuffer.substring(thinkEnd + 8)
                    continueProcessing = true
                }
            }
        }

        if (state.pendingBuffer.length > 0) {
            if (state.inThinkTag) {
                state.accumulatedThinking += state.pendingBuffer
            } else {
                state.accumulatedContent += state.pendingBuffer
            }
            state.pendingBuffer = ''
        }

        return {
            thinking: state.accumulatedThinking,
            content: state.accumulatedContent
        }
    }, [])

    const clearStopTimer = useCallback(() => {
        if (stopResetTimerRef.current) {
            window.clearTimeout(stopResetTimerRef.current)
            stopResetTimerRef.current = null
        }
    }, [])

    const requestStop = useCallback((force = false) => {
        if (!isStreaming) return

        if (!stopRequested && !force) {
            setStopRequested(true)
            setStopConfirmText('再按一次停止生成')

            clearStopTimer()
            stopResetTimerRef.current = window.setTimeout(() => {
                setStopRequested(false)
                setStopConfirmText('')
            }, 5000)
            return
        }

        // second click or force
        shouldContinueRef.current = false
        setStopRequested(false)
        setStopConfirmText('')
        clearStopTimer()

        if (abortControllerRef.current) {
            try {
                abortControllerRef.current.abort()
            } catch (e) {
                // ignore
            }
            abortControllerRef.current = null
        }
    }, [clearStopTimer, isStreaming, stopRequested])

    const streamChat = useCallback(async (input: StreamChatInput): Promise<StreamChatResult> => {
        setIsStreaming(true)
        setStreamingMessage('')
        setStreamingThinking('')
        setStopRequested(false)
        setStopConfirmText('')
        setTokenCount(0)
        setTokensPerSecond(0)
        clearStopTimer()

        resetParser()
        finalStateRef.current = { content: '', thinking: '' }
        shouldContinueRef.current = true

        const controller = new AbortController()
        abortControllerRef.current = controller

        let pendingContentUpdate = ''
        let pendingThinkingUpdate = ''
        let currentTokenCount = 0
        const generationStartTime = Date.now()
        let lastUpdateTime = Date.now()
        const UPDATE_INTERVAL = 50

        try {
            const { settings, message, history, images } = input
            const providerType = settings.type || 'ollama'
            const apiUrl = settings.apiUrl || 'http://localhost:11434'
            const apiKey = settings.apiKey || ''

            let response: Response

            if (providerType === 'ollama' || providerType === 'ollama-cloud') {
                // Clean base64 prefixes from images if present
                const cleanBase64 = (dataUrl: string) => {
                    const commaIndex = dataUrl.indexOf(',')
                    return commaIndex !== -1 ? dataUrl.substring(commaIndex + 1) : dataUrl
                }
                const ollamaImages = images?.map(cleanBase64)

                const cleanApiUrl = apiUrl.replace(/\/v1\/?$/, '')
                const ollamaHeaders: Record<string, string> = {
                    'Content-Type': 'application/json'
                }
                if (apiKey) {
                    ollamaHeaders['Authorization'] = `Bearer ${apiKey}`
                }
                response = await fetch(`${cleanApiUrl}/api/chat`, {
                    method: 'POST',
                    headers: ollamaHeaders,
                    body: JSON.stringify({
                        model: settings.model || 'llama3',
                        messages: [
                            ...history.map(msg => ({
                                role: msg.role,
                                content: msg.content
                            })),
                            {
                                role: 'user',
                                content: message,
                                ...(ollamaImages && ollamaImages.length > 0 ? { images: ollamaImages } : {})
                            }
                        ],
                        options: {
                            temperature: settings.temperature ?? 0.7,
                            num_predict: settings.maxTokens ?? 2048
                        },
                        stream: true
                    }),
                    signal: controller.signal
                })
            } else if (providerType === 'anthropic' || providerType === 'synthetic') {
                // Anthropic format
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01',
                    'dangerously-allow-browser': 'true'
                }
                if (apiKey) {
                    headers['x-api-key'] = apiKey
                }

                const payload: any = {
                    model: settings.model,
                    messages: history.map(msg => ({
                        role: msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content
                    })).concat({ role: 'user', content: message }),
                    max_tokens: settings.maxTokens || 4096,
                    stream: true
                }

                const systemPrompt = settings.systemPrompt || 'You are a helpful AI assistant.'
                if (systemPrompt) {
                    payload.system = systemPrompt
                }

                const cleanApiUrl = apiUrl.replace(/\/v1\/?$/, '')
                response = await fetch(`${cleanApiUrl}/v1/messages`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload),
                    signal: controller.signal
                })
            } else {
                // OpenAI-compatible APIs (OpenAI, DeepSeek, Groq, Custom, etc.)
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                }
                if (apiKey) {
                    headers['Authorization'] = `Bearer ${apiKey}`
                }

                // OpenAI multimodal format
                let userMessageContent: any = message
                if (images && images.length > 0) {
                    userMessageContent = [
                        { type: 'text', text: message },
                        ...images.map(img => ({
                            type: 'image_url',
                            image_url: { url: img }
                        }))
                    ]
                }

                const payload: any = {
                    model: settings.model,
                    messages: [
                        ...history.map(msg => ({
                            role: msg.role,
                            content: msg.content
                        })),
                        {
                            role: 'user',
                            content: userMessageContent
                        }
                    ],
                    temperature: settings.temperature ?? 0.7,
                    stream: true
                }

                if (settings.maxTokens && settings.maxTokens > 0) {
                    payload.max_tokens = settings.maxTokens
                }

                const cleanApiUrl = apiUrl.replace(/\/v1\/?$/, '')
                response = await fetch(`${cleanApiUrl}/v1/chat/completions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload),
                    signal: controller.signal
                })
            }

            if (!response.ok) {
                const errText = await response.text().catch(() => '')
                throw new Error(`HTTP error! status: ${response.status}${errText ? ` - ${errText}` : ''}`)
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            let buffer = ''
            if (reader) {
                while (shouldContinueRef.current) {
                    const { done, value } = await reader.read()
                    if (done) {
                        break
                    }

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        const trimmed = line.trim()
                        if (!trimmed) continue

                        if (!shouldContinueRef.current) break

                        if (trimmed.startsWith('data:')) {
                            const dataStr = trimmed.substring(5).trim()
                            if (dataStr === '[DONE]') {
                                break
                            }
                            try {
                                const parsed = JSON.parse(dataStr)

                                // Anthropic format parsing
                                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                    const text = parsed.delta.text
                                    const { thinking, content } = processStreamChunk(text)
                                    pendingContentUpdate = content
                                    finalStateRef.current.content = content
                                    if (thinking) {
                                        pendingThinkingUpdate = thinking
                                        finalStateRef.current.thinking = thinking
                                    }
                                    currentTokenCount++
                                }

                                // OpenAI format parsing
                                const delta = parsed.choices?.[0]?.delta
                                if (delta) {
                                    // DeepSeek R1 reasoning_content
                                    if (delta.reasoning_content) {
                                        pendingThinkingUpdate = (pendingThinkingUpdate || finalStateRef.current.thinking) + delta.reasoning_content
                                        finalStateRef.current.thinking = pendingThinkingUpdate
                                        currentTokenCount++
                                    }
                                    if (delta.content) {
                                        const { thinking, content } = processStreamChunk(delta.content)
                                        pendingContentUpdate = content
                                        finalStateRef.current.content = content
                                        if (thinking) {
                                            pendingThinkingUpdate = thinking
                                            finalStateRef.current.thinking = thinking
                                        }
                                        currentTokenCount++
                                    }
                                }
                            } catch (e) {
                                // ignore
                            }
                        } else {
                            // Ollama format
                            try {
                                const parsed = JSON.parse(trimmed)
                                if (parsed.message?.content) {
                                    const { thinking, content } = processStreamChunk(parsed.message.content)
                                    pendingContentUpdate = content
                                    finalStateRef.current.content = content
                                    if (thinking) {
                                        pendingThinkingUpdate = thinking
                                        finalStateRef.current.thinking = thinking
                                    }
                                    currentTokenCount++
                                }
                                if (parsed.message?.thinking) {
                                    pendingThinkingUpdate = (pendingThinkingUpdate || finalStateRef.current.thinking) + parsed.message.thinking
                                    finalStateRef.current.thinking = pendingThinkingUpdate
                                    currentTokenCount++
                                }
                                if (parsed.done) {
                                    if (parsed.eval_count) {
                                        currentTokenCount = parsed.eval_count
                                    }
                                    break
                                }
                            } catch (e) {
                                // ignore
                            }
                        }
                    }

                    const now = Date.now()
                    if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                        if (pendingContentUpdate !== '') {
                            setStreamingMessage(pendingContentUpdate)
                        }
                        if (pendingThinkingUpdate !== '') {
                            setStreamingThinking(pendingThinkingUpdate)
                        }
                        setTokenCount(currentTokenCount)
                        const elapsedSeconds = (now - generationStartTime) / 1000
                        const speed = currentTokenCount / (elapsedSeconds || 1)
                        setTokensPerSecond(speed)
                        lastUpdateTime = now
                        pendingContentUpdate = ''
                        pendingThinkingUpdate = ''
                    }

                    if (!shouldContinueRef.current) {
                        break
                    }
                }

                if (pendingContentUpdate !== '') {
                    setStreamingMessage(pendingContentUpdate)
                }
                if (pendingThinkingUpdate !== '') {
                    setStreamingThinking(pendingThinkingUpdate)
                }
                setTokenCount(currentTokenCount)
                const elapsedSeconds = (Date.now() - generationStartTime) / 1000
                setTokensPerSecond(currentTokenCount / (elapsedSeconds || 1))
            }

            const finalContent = finalStateRef.current.content
            const finalThinking = finalStateRef.current.thinking

            return {
                content: finalContent,
                thinking: finalThinking,
                wasInterrupted: !shouldContinueRef.current,
                tokenCount: currentTokenCount,
                tokensPerSecond: currentTokenCount / ((Date.now() - generationStartTime) / 1000 || 1)
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                return {
                    content: finalStateRef.current.content,
                    thinking: finalStateRef.current.thinking,
                    wasInterrupted: true,
                    tokenCount: currentTokenCount,
                    tokensPerSecond: currentTokenCount / ((Date.now() - generationStartTime) / 1000 || 1)
                }
            }
            console.error('Error sending streaming message:', error)
            throw error
        } finally {
            abortControllerRef.current = null
            setIsStreaming(false)
            setStopRequested(false)
            setStopConfirmText('')
        }
    }, [clearStopTimer, processStreamChunk, resetParser])

    useEffect(() => {
        return () => {
            clearStopTimer()
            if (abortControllerRef.current) {
                try {
                    abortControllerRef.current.abort()
                } catch (e) {}
            }
        }
    }, [clearStopTimer])

    return {
        isStreaming,
        streamingMessage,
        streamingThinking,
        stopRequested,
        stopConfirmText,
        tokenCount,
        tokensPerSecond,
        requestStop,
        streamChat
    }
}
