import { useCallback, useEffect, useMemo, useState } from 'react'

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    thinking?: string
    timestamp: Date
    expandedFiles?: boolean

    interrupted?: boolean
    hiddenContent?: string
    tokenCount?: number
    tokensPerSecond?: number
}

export interface Conversation {
    id: string
    title: string
    messages: Message[]
    createdAt: Date
    updatedAt: Date
}

type UseConversationsArgs = {
    getDefaultConversationTitle: (index: number) => string
}

function reviveConversationDates(raw: any): Conversation {
    return {
        ...raw,
        createdAt: new Date(raw.createdAt),
        updatedAt: new Date(raw.updatedAt),
        messages: (raw.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
        }))
    }
}

export function useConversations(args: UseConversationsArgs) {
    const { getDefaultConversationTitle } = args

    const initialConversation = useMemo<Conversation>(() => {
        const now = new Date()
        return {
            id: Date.now().toString(),
            title: getDefaultConversationTitle(1),
            messages: [],
            createdAt: now,
            updatedAt: now
        }
    }, [getDefaultConversationTitle])

    // 從 localStorage 恢復對話列表
    const [conversations, setConversations] = useState<Conversation[]>(() => {
        try {
            const saved = localStorage.getItem('llmchat_conversations')
            if (saved) {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map(reviveConversationDates)
                }
            }
        } catch (error) {
            console.error('Error loading conversations from localStorage:', error)
        }
        return [initialConversation]
    })

    const [currentConversationId, setCurrentConversationId] = useState<string>(() => {
        try {
            return localStorage.getItem('currentConversationId') || ''
        } catch {
            return ''
        }
    })

    // 當 conversations 變更時，儲存至 localStorage
    useEffect(() => {
        try {
            localStorage.setItem('llmchat_conversations', JSON.stringify(conversations))
        } catch (error) {
            console.error('Error saving conversations to localStorage:', error)
        }
    }, [conversations])

    // 當 currentConversationId 變更時，儲存至 localStorage
    useEffect(() => {
        try {
            localStorage.setItem('currentConversationId', currentConversationId)
        } catch {
            // ignore
        }
    }, [currentConversationId])

    // 確保 currentConversationId 始終有效
    useEffect(() => {
        if (conversations.length === 0) return

        const exists = currentConversationId && conversations.some(c => c.id === currentConversationId)
        if (!exists) {
            setCurrentConversationId(conversations[0].id)
        }
    }, [conversations, currentConversationId])

    const createConversation = useCallback(
        (args: { title: string; messages?: Message[] }) => {
            const now = new Date()
            const messages = args.messages ?? []
            return {
                id: Date.now().toString(),
                title: args.title,
                messages,
                createdAt: now,
                updatedAt: now
            } satisfies Conversation
        },
        []
    )

    const addConversation = useCallback((conversation: Conversation, makeCurrent = true) => {
        setConversations(prev => [...prev, conversation])
        if (makeCurrent) {
            setCurrentConversationId(conversation.id)
        }
    }, [])

    const createNewConversation = useCallback(() => {
        const index = (conversations?.length || 0) + 1
        const conversation = createConversation({ title: getDefaultConversationTitle(index) })
        addConversation(conversation, true)
        return conversation
    }, [addConversation, conversations?.length, createConversation, getDefaultConversationTitle])

    const removeConversation = useCallback(
        (conversationId: string) => {
            setConversations(prev => prev.filter(c => c.id !== conversationId))
            if (currentConversationId === conversationId) {
                const remaining = conversations.filter(c => c.id !== conversationId)
                setCurrentConversationId(remaining.length > 0 ? remaining[0].id : '')
            }
        },
        [conversations, currentConversationId]
    )

    const updateConversationTitle = useCallback((conversationId: string, title: string) => {
        setConversations(prev =>
            prev.map(c => (c.id === conversationId ? { ...c, title, updatedAt: new Date() } : c))
        )
    }, [])

    const clearConversationMessages = useCallback((conversationId: string) => {
        setConversations(prev =>
            prev.map(c => (c.id === conversationId ? { ...c, messages: [], updatedAt: new Date() } : c))
        )
    }, [])

    const appendMessage = useCallback((conversationId: string, message: Message) => {
        setConversations(prev =>
            prev.map(c =>
                c.id === conversationId ? { ...c, messages: [...c.messages, message], updatedAt: new Date() } : c
            )
        )
    }, [])

    const deleteMessage = useCallback((conversationId: string, messageId: string) => {
        setConversations(prev =>
            prev.map(c =>
                c.id === conversationId
                    ? { ...c, messages: c.messages.filter(msg => msg.id !== messageId), updatedAt: new Date() }
                    : c
            )
        )
    }, [])

    return {
        conversations,
        conversationsLoaded: true, // 純前端同步載入，永遠為 true
        currentConversationId,
        setCurrentConversationId,
        setConversations,
        createConversation,
        addConversation,
        createNewConversation,
        removeConversation,
        updateConversationTitle,
        clearConversationMessages,
        appendMessage,
        deleteMessage
    }
}
