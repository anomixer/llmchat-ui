import React, { useState, useEffect } from 'react'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { resolveEndpoints } from '../utils/url'

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
        visionModel: string
        apiKey: string
        temperature: number
        maxTokens: number
        topP: number
        topK: number
        requiresApiKey: boolean
    }
    availableProviders: Provider[]
    onSave: (provider: {
        type: string
        baseUrl: string
        apiKey: string
        model: string
        visionModel: string
        temperature: number
        maxTokens: number
        topP: number
        topK: number
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
    const [visionModel, setVisionModel] = useState(currentProvider.visionModel || '')
    const [temperature, setTemperature] = useState(currentProvider.temperature ?? 0.7)
    const [maxTokens, setMaxTokens] = useState(currentProvider.maxTokens ?? 8192)
    const [topP, setTopP] = useState(currentProvider.topP ?? 0.9)
    const [topK, setTopK] = useState(currentProvider.topK ?? 40)
    const [isChecking, setIsChecking] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle')
    const [connectionMessage, setConnectionMessage] = useState('')
    const [fetchedModels, setFetchedModels] = useState<string[]>([])
    const [isFetchingModels, setIsFetchingModels] = useState(false)
    const [fetchError, setFetchError] = useState('')
    const [isManualInput, setIsManualInput] = useState(true)
    const [clientId, setClientId] = useState(() => localStorage.getItem('github_oauth_client_id_preset') || '')

    // 處理 GitHub OAuth (PKCE) 登入流程
    const handleGithubLogin = () => {
        if (!clientId.trim()) {
            alert(t('admin.llm.githubOauthMissingId', '請先輸入 GitHub OAuth App 的 Client ID！'))
            return
        }

        const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        
        const generateCodeChallenge = async (verifier: string) => {
            const encoder = new TextEncoder()
            const data = encoder.encode(verifier)
            const digest = await window.crypto.subtle.digest('SHA-256', data)
            const base64Url = btoa(String.fromCharCode(...new Uint8Array(digest)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '')
            return base64Url
        }

        const runFlow = async () => {
            try {
                const verifier = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                const challenge = await generateCodeChallenge(verifier)

                localStorage.setItem('github_oauth_state', state)
                localStorage.setItem('github_oauth_verifier', verifier)
                localStorage.setItem('github_oauth_client_id', clientId.trim())
                localStorage.setItem('github_oauth_client_id_preset', clientId.trim())
                localStorage.setItem('github_oauth_provider_type', selectedProvider.type)

                const redirectUri = window.location.origin
                const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId.trim()}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user,repo&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`
                
                window.location.href = authUrl
            } catch (err: any) {
                console.error('Failed to generate challenge:', err)
                alert(t('admin.llm.githubOauthInitFailed', '初始化 OAuth 流程失敗，請再試一次。'))
            }
        }
        
        runFlow()
    }

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
            const { modelsUrl, isOllamaNative } = resolveEndpoints(selectedProvider.type, baseUrl)

            if (isOllamaNative) {
                const headers: Record<string, string> = {}
                if (apiKey) {
                    headers['Authorization'] = `Bearer ${apiKey}`
                } else {
                    headers['X-Requested-With'] = 'XMLHttpRequest'
                }
                const response = await fetch(modelsUrl, {
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
                const response = await fetch(modelsUrl, {
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
            const { modelsUrl, isOllamaNative } = resolveEndpoints(selectedProvider.type, baseUrl)
            let modelsList: string[] = []

            if (isOllamaNative) {
                const headers: Record<string, string> = {}
                if (apiKey) {
                    headers['Authorization'] = `Bearer ${apiKey}`
                } else {
                    headers['X-Requested-With'] = 'XMLHttpRequest'
                }
                const response = await fetch(modelsUrl, {
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
                const response = await fetch(modelsUrl, {
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
                const response = await fetch(modelsUrl, {
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
                if (!model || !modelsList.includes(model)) {
                    setModel(modelsList[0])
                }
            } else {
                setFetchError('⚠️ ' + t('admin.llm.fetchModelsEmpty', '未能取得任何可用模型'))
            }
        } catch (error: any) {
            console.error('Fetch models error:', error)
            setFetchError(`❌ ${t('admin.llm.fetchModelsFailed', '獲取模型失敗，請檢查 API 設定與 CORS 限制。')}`)
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
                visionModel,
                temperature,
                maxTokens,
                topP,
                topK
            })
            onClose()
        } catch (error) {
            console.error('保存失敗:', error)
            alert(`${t('admin.llm.saveError')}：` + (error as any).message)
        }
    }

    const visionModels = fetchedModels.filter(m => {
        const lower = m.toLowerCase()
        return lower.includes('vision') || lower.includes('vl') || lower.includes('llava') || lower.includes('gemini') || lower.includes('claude') || lower.includes('gpt-4o') || lower.includes('pixtral')
    })

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                {t('providers.' + provider.type + '.name', provider.name)} {provider.requiresApiKey ? '🔑' : '🏠'}
                            </option>
                        ))}
                    </select>
                    {selectedProvider && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('providers.' + selectedProvider.type + '.description', selectedProvider.description)}</p>
                    )}
                </div>

                {/* API Key */}
                {selectedProvider?.requiresApiKey ? (
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
                            {t('settings.apiKeyLocalHint', '您的 API Key 僅儲存於本機瀏覽器，不會上傳至任何伺服器。')}
                        </p>
                    </div>
                ) : (
                    <div className="hidden md:block"></div>
                )}

                {/* API URL */}
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium mb-2">{t('admin.llm.baseUrl')}</label>
                    <input
                        type="text"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="http://localhost:11434"
                        className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>

                {/* GitHub OAuth 區塊 */}
                {selectedProvider?.type === 'github-models' && (
                    <div className="col-span-1 md:col-span-2 p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 rounded-md space-y-3">
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                            <span>🐙 {t('admin.llm.githubOauthTitle', 'GitHub OAuth 快速登入')}</span>
                        </h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                            {t('admin.llm.githubOauthDesc1', '您可以透過自己註冊的 GitHub OAuth App 進行登入以自動取得 Token（回調網址需設定為')} <code>{window.location.origin}</code>{t('admin.llm.githubOauthDesc2', '，且不需設定 Client Secret）。')}
                        </p>
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">GitHub Client ID</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={clientId}
                                    onChange={(e) => {
                                        setClientId(e.target.value)
                                        localStorage.setItem('github_oauth_client_id_preset', e.target.value)
                                    }}
                                    placeholder={t('admin.llm.githubOauthIdPlaceholder', '例如: Ov23wx...')}
                                    className="flex-1 px-3 py-1 text-sm border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={handleGithubLogin}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                                >
                                    {t('admin.llm.githubOauthLogin', '登入授權')}
                                </button>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-blue-100 dark:border-blue-900/60 pt-2 mt-1">
                            <strong>{t('admin.llm.githubManualTitle', '手動建立方式：')}</strong>{t('admin.llm.githubManualDesc', '您可以至 GitHub 帳號設定的 Developer Settings -> Personal Access Tokens 建立一個 classic 權杖，並至少勾選 ')}<code>read:packages</code>{t('admin.llm.githubManualDesc2', ' 權限，然後直接在上方 API Key 欄位貼上該 ghp_... 權杖即可。')}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* Vision Model */}
                <div>
                    <label className="block text-sm font-medium mb-2">{t('admin.llm.visionModel', 'Vision 模型 (可選)')}</label>
                    <div className="flex gap-2">
                        {visionModels.length > 0 ? (
                            <select
                                value={visionModel}
                                onChange={(e) => setVisionModel(e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('admin.llm.visionModelSameAsText', '同上方文字模型 (若支援多模態)')}</option>
                                {visionModels.map(modelName => (
                                    <option key={modelName} value={modelName} className="text-gray-900 dark:text-white">
                                        {modelName}
                                    </option>
                                ))}
                                {!visionModels.includes(visionModel) && visionModel && (
                                    <option value={visionModel} className="text-gray-900 dark:text-white">
                                        {visionModel} ({t('admin.llm.current')})
                                    </option>
                                )}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={visionModel}
                                onChange={(e) => setVisionModel(e.target.value)}
                                placeholder={t('admin.llm.visionModelPlaceholder', '若需專用模型請輸入，否則留空')}
                                className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        )}
                        {fetchedModels.length === 0 && (
                            <button
                                type="button"
                                onClick={fetchAvailableModels}
                                disabled={isFetchingModels}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex-shrink-0 text-sm"
                            >
                                {isFetchingModels ? '...' : t('admin.llm.fetchModels')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6 mt-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    {t('admin.llm.advancedParams', '進階參數')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Temperature */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.llm.temperature', 'Temperature')}: {temperature}</label>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Top P */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.llm.topP', 'Top P')}: {topP}</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={topP}
                            onChange={(e) => setTopP(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Top K */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.llm.topK', 'Top K')}: {topK}</label>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            value={topK}
                            onChange={(e) => setTopK(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Context Size */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('admin.llm.contextSize', 'Max Tokens')}: {maxTokens}</label>
                        <input
                            type="number"
                            min="256"
                            max="262144"
                            step="256"
                            value={maxTokens}
                            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
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
