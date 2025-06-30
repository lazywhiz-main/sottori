// AI機能の設定管理
export const AI_CONFIG = {
  // AI機能の有効/無効フラグ
  ENABLED: {
    ROADMAP_GENERATION: process.env.NEXT_PUBLIC_AI_ROADMAP_ENABLED === 'true',
    RESPONSE_ANALYSIS: process.env.NEXT_PUBLIC_AI_ANALYSIS_ENABLED === 'true',
    CHAT_ENHANCEMENT: process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === 'true',
    CONTENT_PERSONALIZATION: process.env.NEXT_PUBLIC_AI_PERSONALIZATION_ENABLED === 'true',
  },
  
  // OpenAI設定
  OPENAI: {
    API_KEY: process.env.OPENAI_API_KEY,
    MODEL: process.env.OPENAI_MODEL || 'gpt-4',
    MAX_TOKENS: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
    TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  },
  
  // AI Prompt設定
  PROMPTS: {
    SYSTEM_ROLE: `あなたは経験豊富ながん患者サポート専門家です。
    医療の専門知識と心理的サポートの両方に精通しており、
    患者の不安を和らげ、適切な情報提供を行うことができます。
    
    重要な原則：
    1. 医療行為は行わず、あくまで情報提供とサポートに徹する
    2. 「今すぐ決めなくても大丈夫」という安心感を提供
    3. 必ず主治医との相談を促す
    4. 患者の感情状態に配慮した表現を使用
    5. 希望を失わせない、前向きな表現を心がける`,
    
    SAFETY_GUIDELINES: [
      '医療診断や治療の推奨は行わない',
      '緊急性を要する症状については医療機関への相談を促す',
      '個人の医療情報の保存や記録は行わない',
      '薬剤や治療法の具体的な推奨は避ける',
      '心理的な危機状態の場合は専門機関への相談を促す'
    ]
  },
  
  // フォールバック設定
  FALLBACK: {
    USE_LEGACY_LOGIC: true, // AI失敗時は既存ロジックを使用
    ERROR_MESSAGES: {
      GENERATION_FAILED: 'AI生成に失敗しました。基本的な情報を表示します。',
      API_UNAVAILABLE: 'AI機能が一時的に利用できません。',
      RATE_LIMIT: 'AI機能の利用上限に達しました。しばらく後にお試しください。'
    }
  },
  
  // 段階的導入設定
  ROLLOUT: {
    PERCENTAGE: parseInt(process.env.AI_ROLLOUT_PERCENTAGE || '100'), // 0-100%
    FEATURE_FLAGS: {
      BETA_USERS_ONLY: process.env.AI_BETA_ONLY === 'true',
      A_B_TEST_ENABLED: process.env.AI_AB_TEST_ENABLED === 'true',
    }
  }
}

// AI機能が利用可能かチェック
export function isAIFeatureEnabled(feature: keyof typeof AI_CONFIG.ENABLED): boolean {
  // デバッグログ
  if (process.env.NODE_ENV === 'development') {
    console.log(`AI機能チェック [${feature}]:`, {
      featureEnabled: AI_CONFIG.ENABLED[feature],
      hasApiKey: !!AI_CONFIG.OPENAI.API_KEY,
      rolloutPercentage: AI_CONFIG.ROLLOUT.PERCENTAGE,
      envVars: {
        [`NEXT_PUBLIC_AI_${feature.replace('_', '_').toUpperCase()}_ENABLED`]: process.env[`NEXT_PUBLIC_AI_${feature.replace('_', '_').toUpperCase()}_ENABLED`],
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY
      }
    })
  }
  
  // 基本的な有効性チェック
  if (!AI_CONFIG.ENABLED[feature]) {
    console.log(`AI機能が無効: ${feature}`)
    return false
  }
  
  // API Key存在チェック
  if (!AI_CONFIG.OPENAI.API_KEY) {
    console.log('OpenAI API Keyが設定されていません')
    return false
  }
  
  // ロールアウト率チェック
  if (AI_CONFIG.ROLLOUT.PERCENTAGE < 100) {
    const randomValue = Math.random() * 100
    if (randomValue > AI_CONFIG.ROLLOUT.PERCENTAGE) {
      console.log(`ロールアウト率チェック失敗: ${randomValue} > ${AI_CONFIG.ROLLOUT.PERCENTAGE}`)
      return false
    }
  }
  
  console.log(`AI機能が有効: ${feature}`)
  return true
}

// エラーハンドリング用のユーティリティ
export function getAIErrorMessage(errorType: 'GENERATION_FAILED' | 'API_UNAVAILABLE' | 'RATE_LIMIT'): string {
  return AI_CONFIG.FALLBACK.ERROR_MESSAGES[errorType]
}

// AI使用統計（将来的な改善のため）
export interface AIUsageStats {
  feature: string
  success: boolean
  responseTime: number
  timestamp: Date
  userHash?: string // 匿名化されたユーザー識別子
}

export function logAIUsage(stats: AIUsageStats) {
  // 将来的にはAnalyticsに送信
  if (process.env.NODE_ENV === 'development') {
    console.log('AI Usage:', stats)
  }
} 