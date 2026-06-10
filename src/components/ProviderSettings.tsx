import React, { useState, useEffect } from 'react'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Provider {
    name: string
    type: string
    baseUrl: string
    description: string
    requiresApiKey: boolean
}

interface ProviderSettingsProps {
    currentProvider: {
        type: string
        baseUrl: string
        model: string
        apiKey: string
        temperature: number
        maxTokens: number
        requiresApiKey: boolean
    }
    availableProviders: Provider[]
    onSave: (provider: {
        type: string
        baseUrl: string
        apiKey: string
        model: string
        temperature: number
        maxTokens: number
    }) => Promise<void>
    onClose: () => void
}

export const ProviderSettings: React.FC<ProviderSettingsProps> = ({
    currentProvider,
    availableProviders,
    onSave,
    onClose
}) => {
    const { t } = useTranslation()
    const [selectedProvider, setSelectedProvider] = useState(
        availableProviders.find(p => p.type === currentProvider.type) || availableProviders[0]
    )
    const [baseUrl, setBaseUrl] = useState(currentProvider.baseUrl)
    const [apiKey, setApiKey] = useState(currentProvider.apiKey || '')
    const [model, setModel] = useState(currentProvider.model)
    const [temperature, setTemperature] = useState(currentProvider.temperature ?? 0.7)
    const [maxTokens, setMaxTokens] = useState(currentProvider.maxTokens ?? 2048)
    const [isChecking, setIsChecking] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle')
    const [connectionMessage, setConnectionMessage] = useState('')
    const [fetchedModels, setFetchedModels] = useState<string[]>([])
    const [isFetchingModels, setIsFetchingModels] = useState(false)
    const [fetchError, setFetchError] = useState('')
    const [isManualInput, setIsManualInput] = useState(true)

    // 當選擇不同 provider 時，更新預設值
    useEffect(() => {
        if (selectedProvider) {
            if (connectionStatus === 'idle') {
                setBaseUrl(selectedProvider.baseUrl)
            }
        }
    }, [selectedProvider, connectionStatus])

    // 檢查連接
    const checkConnection = async () => {
        setIsChecking(true)
        setConnectionStatus('checking')
        setConnectionMessage('')

        try {
            const cleanBaseUrl = baseUrl.replace(/\/v1\/?$/, '')
            const isOllama = selectedProvider.type === 'ollama' || selectedProvider.type === 'ollama-cloud'
            const isOllamaNative = isOllama && !baseUrl.includes('/v1')

            if (isOllamaNative) {
                const headers: Record<string, string> = {}
                if (apiKey) {
                    headers['Authorization'] = `Bearer ${apiKey}`
                } else {
                    headers['X-Requested-With'] = 'XMLHttpRequest'
                }
                const response = await fetch(`${cleanBaseUrl}/api/tags`, {
                    method: 'GET',
                    headers
                })
                if (response.ok) {
                    setConnectionStatus('success')
                    setConnectionMessage(t('admin.llm.testSuccess'))
                } else {
                    setConnectionStatus('error')
                    setConnectionMessage(`${t('admin.llm.testFailed')}：${t('admin.llm.statusCodeHint', { status: response.status })}`)
                }
            } else {
                const headers: Record<string, string> = {}
                if (selectedProvider.type === 'anthropic' || selectedProvider.type === 'synthetic') {
                    headers['anthropic-version'] = '2023-06-01'
                    headers['dangerously-allow-browser'] = 'true'
                    if (apiKey) {
                        headers['x-api-key'] = apiKey
                    }
                } else {
                    if (apiKey) {
                        headers['Authorization'] = `Bearer ${apiKey}`
                    } else {
                        headers['X-Requested-With'] = 'XMLHttpRequest'
                    }
                }
                const response = await fetch(`${cleanBaseUrl}/v1/models`, {
                    method: 'GET',
                    headers
                })
                if (response.ok) {
                    setConnectionStatus('success')
                    setConnectionMessage(t('admin.llm.testSuccess'))
                } else if (response.status === 401) {
                    setConnectionStatus('error')
                    setConnectionMessage(`${t('admin.llm.testFailed')}：${t('admin.llm.unauthorizedHint')}`)
                } else {
                    setConnectionStatus('error')
                    setConnectionMessage(`${t('admin.llm.testFailed')}：${t('admin.llm.statusCodeHint', { status: response.status })}`)
                }
            }
        } catch (error: any) {
            console.error('Connection check error:', error)
            setConnectionStatus('error')
            setConnectionMessage(`${t('admin.llm.testFailed')}。${t('admin.llm.corsHint')}`)
        } finally {
            setIsChecking(false)
        }
    }

    // 獲取可用模型列表
    const fetchAvailableModels = async () => {
        setIsFetchingModels(true)
        setFetchError('')
        try {
            const cleanApiUrl = baseUrl.replace(/\/v1\/?$/, '')
            let modelsList: string[] = []
            const isOllama = selectedProvider.type === 'ollama' || selectedProvider.type === 'ollama-cloud'
            const isOllamaNative = isOllama && !baseUrl.includes('/v1')

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
                    modelsList = (data.models || []).map((m: any) => m.name)
                } else {
                    throw new Error(`Status ${response.status}`)
                }
            } else if (selectedProvider.type === 'anthropic' || selectedProvider.type === 'synthetic') {
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
                    modelsList = (data.data || []).map((m: any) => m.id)
                } else {
                    throw new Error(`Status ${response.status}`)
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
                    modelsList = (data.data || []).map((m: any) => m.id)
                } else {
                    throw new Error(`Status ${response.status}`)
                }
            }

            if (modelsList.length > 0) {
                setFetchedModels(modelsList)
                setIsManualInput(false)
                // If current model is empty or not in the list, set it to the first fetched model
                if (!model || !modelsList.includes(model)) {
                    setModel(modelsList[0])
                }
            } else {
                setFetchError('⚠️ 未能取得任何可用模型')
            }
        } catch (error: any) {
            console.error('Fetch models error:', error)
            setFetchError(`❌ ${t('admin.llm.fetchModels')}失敗，請檢查 API 設定與 CORS 限制。`)
        } finally {
            setIsFetchingModels(false)
        }
    }

    // 保存設置
    const handleSave = async () => {
        try {
            await onSave({
                type: selectedProvider.type,
                baseUrl,
                apiKey,
                model,
                temperature,
                maxTokens
            })
            onClose()
        } catch (error) {
            console.error('保存失敗:', error)
            alert('保存失敗：' + (error as any).message)
        }
    }

    return (
        <div className="space-y-6">
            {/* Provider 選擇 */}
            <div>
                <label className="block text-sm font-medium mb-2">{t('admin.llm.selectProvider')}</label>
                <select
                    value={selectedProvider?.type || ''}
                    onChange={(e) => {
                        const provider = availableProviders.find(p => p.type === e.target.value)
                        if (provider) {
                            setSelectedProvider(provider)
                            setBaseUrl(provider.baseUrl)
                        }
                    }}
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {availableProviders.map(provider => (
                        <option key={provider.type} value={provider.type} className="text-gray-900 dark:text-white">
                            {provider.name} {provider.requiresApiKey ? '🔑' : '🏠'}
                        </option>
                    ))}
                </select>
                {selectedProvider && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedProvider.description}</p>
                )}
            </div>

            {/* API URL */}
            <div>
                <label className="block text-sm font-medium mb-2">{t('admin.llm.baseUrl')}</label>
                <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                />
            </div>

            {/* API Key */}
            {selectedProvider?.requiresApiKey && (
                <div>
                    <label className="block text-sm font-medium mb-2">{t('admin.llm.apiKey')} 🔑</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('settings.apiKeyLocalHint')}
                    </p>
                </div>
            )}

            {/* Model */}
            <div>
                <label className="block text-sm font-medium mb-2">{t('admin.llm.modelName')}</label>
                <div className="flex gap-2">
                    {!isManualInput && fetchedModels.length > 0 ? (
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {fetchedModels.map(modelName => (
                                <option key={modelName} value={modelName} className="text-gray-900 dark:text-white">
                                    {modelName}
                                </option>
                            ))}
                            {!fetchedModels.includes(model) && model && (
                                <option value={model} className="text-gray-900 dark:text-white">
                                    {model} ({t('admin.llm.current')})
                                </option>
                            )}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="llama3"
                            className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    )}

                    {fetchedModels.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setIsManualInput(!isManualInput)}
                            className="px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-white rounded-md text-sm transition-colors"
                            title={isManualInput ? t('admin.llm.selectProvider') : t('admin.llm.modelName')}
                        >
                            {isManualInput ? '📋' : '✏️'}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={fetchAvailableModels}
                        disabled={isFetchingModels}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex-shrink-0 text-sm"
                    >
                        {isFetchingModels ? '...' : t('admin.llm.fetchModels')}
                    </button>
                </div>
                {fetchError && (
                    <p className="text-xs text-red-400 mt-1">{fetchError}</p>
                )}
            </div>

            {/* Temperature */}
            <div>
                <label className="block text-sm font-medium mb-2">{t('admin.llm.temperature', 'Temperature')}: {temperature}</label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            {/* Context Size */}
            <div>
                <label className="block text-sm font-medium mb-2">{t('admin.llm.contextSize', 'Context Size')}: {maxTokens}</label>
                <input
                    type="range"
                    min="256"
                    max="8192"
                    step="256"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            {/* Connection Status */}
            <div className="flex gap-2">
                <button
                    onClick={checkConnection}
                    disabled={isChecking}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center justify-center gap-2 text-white font-medium transition-colors"
                >
                    {isChecking ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('admin.llm.testing')}
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4" />
                            {t('admin.llm.testConnection')}
                        </>
                    )}
                </button>
                <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium transition-colors"
                >
                    {t('admin.llm.saveSettings')}
                </button>
            </div>

            {/* Connection Message */}
            {connectionStatus !== 'idle' && (
                <div className={`p-3 rounded-md flex items-start gap-2 text-sm border ${
                    connectionStatus === 'success' ? 'bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' :
                    connectionStatus === 'error' ? 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                }`}>
                    {connectionStatus === 'success' ? (
                        <Check className="w-5 h-5 flex-shrink-0" />
                    ) : connectionStatus === 'error' ? (
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    ) : null}
                    <span className="break-all">{connectionMessage}</span>
                </div>
            )}
        </div>
    )
}
