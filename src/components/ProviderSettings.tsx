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
    const [apiKey, setApiKey] = useState('')
    const [model, setModel] = useState(currentProvider.model)
    const [temperature, setTemperature] = useState(0.7)
    const [maxTokens, setMaxTokens] = useState(2048)
    const [isChecking, setIsChecking] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle')
    const [connectionMessage, setConnectionMessage] = useState('')

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
            if (selectedProvider.type === 'ollama' || selectedProvider.type === 'ollama-cloud') {
                const response = await fetch(`${cleanBaseUrl}/api/tags`)
                if (response.ok) {
                    setConnectionStatus('success')
                    setConnectionMessage('✅ 連接成功')
                } else {
                    setConnectionStatus('error')
                    setConnectionMessage(`❌ 連接失敗：伺服器回應狀態碼 ${response.status}`)
                }
            } else {
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                }
                if (selectedProvider.type === 'anthropic' || selectedProvider.type === 'synthetic') {
                    headers['anthropic-version'] = '2023-06-01'
                    headers['dangerously-allow-browser'] = 'true'
                    if (apiKey) {
                        headers['x-api-key'] = apiKey
                    }
                } else {
                    if (apiKey) {
                        headers['Authorization'] = `Bearer ${apiKey}`
                    }
                }
                const response = await fetch(`${cleanBaseUrl}/v1/models`, {
                    method: 'GET',
                    headers
                })
                if (response.ok) {
                    setConnectionStatus('success')
                    setConnectionMessage('✅ 連接成功')
                } else if (response.status === 401) {
                    setConnectionStatus('error')
                    setConnectionMessage('❌ 連接失敗：API Key 無效或授權錯誤 (401)')
                } else {
                    setConnectionStatus('error')
                    setConnectionMessage(`❌ 連接失敗：伺服器回應狀態碼 ${response.status}`)
                }
            }
        } catch (error: any) {
            console.error('Connection check error:', error)
            setConnectionStatus('error')
            setConnectionMessage('❌ 連接失敗。請確認 API URL 是否正確、伺服器已啟動，並已開啟 CORS 跨來源連線（例如 Ollama 需設定 OLLAMA_ORIGINS=*）。')
        } finally {
            setIsChecking(false)
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
            <h2 className="text-xl font-semibold mb-4">🔧 Provider 設置</h2>

            {/* Provider 選擇 */}
            <div>
                <label className="block text-sm font-medium mb-2">選擇 Provider</label>
                <select
                    value={selectedProvider?.type || ''}
                    onChange={(e) => {
                        const provider = availableProviders.find(p => p.type === e.target.value)
                        if (provider) {
                            setSelectedProvider(provider)
                            setBaseUrl(provider.baseUrl)
                        }
                    }}
                    className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {availableProviders.map(provider => (
                        <option key={provider.type} value={provider.type}>
                            {provider.name} {provider.requiresApiKey ? '🔑' : '🏠'}
                        </option>
                    ))}
                </select>
                {selectedProvider && (
                    <p className="text-sm text-gray-400 mt-1">{selectedProvider.description}</p>
                )}
            </div>

            {/* API URL */}
            <div>
                <label className="block text-sm font-medium mb-2">API URL</label>
                <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* API Key */}
            {selectedProvider?.requiresApiKey && (
                <div>
                    <label className="block text-sm font-medium mb-2">API Key 🔑</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        此密鑰將儲存在您本地瀏覽器 (localStorage) 中，請小心保管
                    </p>
                </div>
            )}

            {/* Model */}
            <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="llama3"
                    className="w-full px-3 py-2 border rounded-md bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
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
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
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
                            檢查中...
                        </>
                    ) : (
                        <>
                            <Check className="w-4 h-4" />
                            檢查連接
                        </>
                    )}
                </button>
                <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium transition-colors"
                >
                    保存設置
                </button>
            </div>

            {/* Connection Message */}
            {connectionStatus !== 'idle' && (
                <div className={`p-3 rounded-md flex items-start gap-2 text-sm ${
                    connectionStatus === 'success' ? 'bg-green-900/60 text-green-200 border border-green-700' :
                    connectionStatus === 'error' ? 'bg-red-900/60 text-red-200 border border-red-700' :
                    'bg-gray-700 text-gray-200'
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
