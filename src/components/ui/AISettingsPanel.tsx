import React, { useState, useEffect } from 'react'

interface AISettings {
  roadmapEnabled: boolean
  analysisEnabled: boolean
  chatEnabled: boolean
  personalizationEnabled: boolean
}

export default function AISettingsPanel() {
  const [settings, setSettings] = useState<AISettings>({
    roadmapEnabled: false,
    analysisEnabled: false,
    chatEnabled: false,
    personalizationEnabled: false
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 現在の設定を取得
    loadSettings()
  }, [])

  const loadSettings = () => {
    // 環境変数から現在の設定を読み込み
    setSettings({
      roadmapEnabled: process.env.NEXT_PUBLIC_AI_ROADMAP_ENABLED === 'true',
      analysisEnabled: process.env.NEXT_PUBLIC_AI_ANALYSIS_ENABLED === 'true',
      chatEnabled: process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === 'true',
      personalizationEnabled: process.env.NEXT_PUBLIC_AI_PERSONALIZATION_ENABLED === 'true'
    })
    setIsLoading(false)
  }

  const handleToggle = (feature: keyof AISettings) => {
    setSettings(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }))
    
    // 実際の環境では、設定をサーバーに保存する処理が必要
    console.log(`AI機能「${feature}」を${settings[feature] ? '無効' : '有効'}にしました`)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">AI機能設定</h3>
      
      <div className="space-y-4">
        <SettingToggle
          title="ロードマップ生成"
          description="個別化されたロードマップをAIで生成"
          enabled={settings.roadmapEnabled}
          onToggle={() => handleToggle('roadmapEnabled')}
        />
        
        <SettingToggle
          title="回答分析"
          description="ユーザーの回答をAIで詳細分析"
          enabled={settings.analysisEnabled}
          onToggle={() => handleToggle('analysisEnabled')}
        />
        
        <SettingToggle
          title="チャット支援"
          description="会話をAIで支援（将来実装予定）"
          enabled={settings.chatEnabled}
          onToggle={() => handleToggle('chatEnabled')}
          disabled={true}
        />
        
        <SettingToggle
          title="コンテンツ個別化"
          description="コンテンツをAIで個別化（将来実装予定）"
          enabled={settings.personalizationEnabled}
          onToggle={() => handleToggle('personalizationEnabled')}
          disabled={true}
        />
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          ⚠️ <strong>注意</strong>: AI機能を使用するにはOpenAI APIキーの設定が必要です。
          環境変数 <code className="bg-amber-100 px-1 rounded">OPENAI_API_KEY</code> を設定してください。
        </p>
      </div>
    </div>
  )
}

interface SettingToggleProps {
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
  disabled?: boolean
}

function SettingToggle({ title, description, enabled, onToggle, disabled = false }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div className="flex-1">
        <h4 className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
          {title}
        </h4>
        <p className={`text-sm ${disabled ? 'text-gray-300' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>
      
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          disabled 
            ? 'bg-gray-200 cursor-not-allowed' 
            : enabled 
              ? 'bg-blue-600' 
              : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
} 