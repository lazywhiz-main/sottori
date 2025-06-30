import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AI_CONFIG, isAIFeatureEnabled, getAIErrorMessage, logAIUsage } from '@/lib/config/ai'

interface UserResponses {
  step1?: { value: string; label: string }
  step2?: { value: string; label: string }
  step3?: { value: string; label: string }
  step4?: { value: string; label: string }[]
  step5?: { value: string; label: string }[]
}

interface AnalysisResult {
  insights: string[]
  recommendedNextSteps: string[]
  emotionalSupport: string[]
  additionalQuestions?: string[]
  riskFactors?: string[]
  strengthFactors?: string[]
}

// OpenAI クライアントの初期化
const openai = AI_CONFIG.OPENAI.API_KEY ? new OpenAI({
  apiKey: AI_CONFIG.OPENAI.API_KEY,
}) : null

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { responses }: { responses: UserResponses } = await request.json()

    // AI機能が有効かチェック
    if (isAIFeatureEnabled('RESPONSE_ANALYSIS') && openai) {
      try {
        const analysis = await analyzeResponsesWithAI(responses)
        
        // 使用統計をログ
        logAIUsage({
          feature: 'response_analysis',
          success: true,
          responseTime: Date.now() - startTime,
          timestamp: new Date()
        })

        return NextResponse.json({
          success: true,
          analysis,
          analyzedAt: new Date().toISOString(),
          aiGenerated: true
        })
      } catch (aiError) {
        console.error('AI analysis failed, falling back to legacy:', aiError)
        
        // 使用統計をログ
        logAIUsage({
          feature: 'response_analysis',
          success: false,
          responseTime: Date.now() - startTime,
          timestamp: new Date()
        })
        
        // フォールバック処理
        if (AI_CONFIG.FALLBACK.USE_LEGACY_LOGIC) {
          const analysis = analyzeResponsesLegacy(responses)
          return NextResponse.json({
            success: true,
            analysis,
            analyzedAt: new Date().toISOString(),
            aiGenerated: false,
            fallbackUsed: true
          })
        }
      }
    }

    // AI機能が無効またはAPIキーが未設定の場合は既存ロジックを使用
    const analysis = analyzeResponsesLegacy(responses)
    return NextResponse.json({
      success: true,
      analysis,
      analyzedAt: new Date().toISOString(),
      aiGenerated: false
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { success: false, error: '分析に失敗しました' },
      { status: 500 }
    )
  }
}

async function analyzeResponsesWithAI(responses: UserResponses): Promise<AnalysisResult> {
  if (!openai) {
    throw new Error('OpenAI client not initialized')
  }

  const prompt = buildAnalysisPrompt(responses)
  
  const completion = await openai.chat.completions.create({
    model: AI_CONFIG.OPENAI.MODEL,
    messages: [
      { 
        role: "system", 
        content: AI_CONFIG.PROMPTS.SYSTEM_ROLE 
      },
      { 
        role: "user", 
        content: prompt 
      }
    ],
    temperature: 0.3, // 分析は一貫性重視
    max_tokens: AI_CONFIG.OPENAI.MAX_TOKENS,
  })

  const aiResponse = completion.choices[0]?.message?.content
  if (!aiResponse) {
    throw new Error('No response from AI')
  }

  try {
    const parsedResponse = JSON.parse(aiResponse)
    return {
      insights: parsedResponse.insights || [],
      recommendedNextSteps: parsedResponse.recommendedNextSteps || [],
      emotionalSupport: parsedResponse.emotionalSupport || [],
      additionalQuestions: parsedResponse.additionalQuestions || [],
      riskFactors: parsedResponse.riskFactors || [],
      strengthFactors: parsedResponse.strengthFactors || []
    }
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError)
    throw new Error('Invalid AI response format')
  }
}

function buildAnalysisPrompt(responses: UserResponses): string {
  const responseText = JSON.stringify(responses, null, 2)
  
  return `
【患者の回答】
${responseText}

【分析観点】
1. 現在の心理状態と情報処理能力
2. サポートが必要な領域の特定
3. 患者の強みと活用可能なリソース
4. 潜在的なリスク要因
5. 適切な次のステップの提案

【重要な配慮事項】
- 患者の自律性を尊重する
- 急かさず、プレッシャーを与えない
- 希望を失わせない表現を使う
- 具体的だが実行可能な提案をする
- 医療行為ではない範囲での情報提供
- 「今すぐ決めなくても大丈夫」という安心感を提供

この患者さんの回答を分析し、個別化された洞察とサポートを提供してください。

【出力形式】
以下のJSON形式で回答してください：
{
  "insights": ["洞察1", "洞察2", "洞察3"],
  "recommendedNextSteps": ["推奨ステップ1", "推奨ステップ2", "推奨ステップ3"],
  "emotionalSupport": ["サポートメッセージ1", "サポートメッセージ2", "サポートメッセージ3"],
  "additionalQuestions": ["追加質問1", "追加質問2"],
  "riskFactors": ["リスク要因1", "リスク要因2"],
  "strengthFactors": ["強み要因1", "強み要因2"]
}

各配列には2-4個の要素を含めてください。
  `.trim()
}

// 既存のレガシー実装（フォールバック用）
function analyzeResponsesLegacy(responses: UserResponses): AnalysisResult {
  const insights: string[] = []
  const recommendedNextSteps: string[] = []
  const emotionalSupport: string[] = []
  const additionalQuestions: string[] = []

  // Step1分析：現在の状況
  if (responses.step1) {
    switch (responses.step1.value) {
      case 'diagnosed_recently':
        insights.push('診断されたばかりの時期は、情報収集が重要です。')
        recommendedNextSteps.push('まずは病気について基本的な理解を深めましょう。')
        emotionalSupport.push('混乱や不安を感じるのは自然なことです。')
        break
      case 'detailed_examination':
        insights.push('詳しい検査中は、結果待ちの不安が大きい時期です。')
        recommendedNextSteps.push('検査結果が出るまで、信頼できる情報源を確認しておきましょう。')
        emotionalSupport.push('結果を待つ間の不安は誰もが経験することです。')
        break
      case 'not_sure':
        insights.push('現在の状況が不明確な場合、まずは整理から始めましょう。')
        recommendedNextSteps.push('主治医に現在の状況を確認してみてください。')
        additionalQuestions.push('最後に病院で説明を受けたのはいつですか？')
        break
    }
  }

  // Step5分析：感情状態
  const emotions = responses.step5?.map(r => r.value) || []
  if (emotions.includes('anxious')) {
    emotionalSupport.push('不安を感じるのは当然です。一人で抱え込まないでください。')
    recommendedNextSteps.push('信頼できる人に話を聞いてもらうことをお勧めします。')
  }
  if (emotions.includes('want_information')) {
    insights.push('情報収集への意欲は、治療に向き合う良いサインです。')
    recommendedNextSteps.push('信頼できる医療情報源から段階的に学んでいきましょう。')
  }
  if (emotions.includes('tired')) {
    emotionalSupport.push('疲れを感じているときは、無理をしないことが大切です。')
    recommendedNextSteps.push('今日は休息を取り、体調を整えることを優先してください。')
  }

  // 複合分析
  if (responses.step4 && responses.step4.length > 3) {
    insights.push('多くのことを知りたいお気持ちは理解できます。')
    recommendedNextSteps.push('情報は一度にすべて理解する必要はありません。優先順位をつけて少しずつ進めましょう。')
  }

  return {
    insights,
    recommendedNextSteps,
    emotionalSupport,
    additionalQuestions,
    riskFactors: identifyRiskFactors(responses),
    strengthFactors: identifyStrengthFactors(responses)
  }
}

function identifyRiskFactors(responses: UserResponses): string[] {
  const risks: string[] = []
  
  const emotions = responses.step5?.map(r => r.value) || []
  if (emotions.includes('anxious') && emotions.includes('tired')) {
    risks.push('不安と疲労が重なっている状態')
  }
  if (responses.step1?.value === 'not_sure' && emotions.includes('confused')) {
    risks.push('状況理解が困難な状態')
  }
  
  return risks
}

function identifyStrengthFactors(responses: UserResponses): string[] {
  const strengths: string[] = []
  
  const emotions = responses.step5?.map(r => r.value) || []
  if (emotions.includes('want_information')) {
    strengths.push('積極的な情報収集意欲')
  }
  if (emotions.includes('want_family_support')) {
    strengths.push('家族との連携意識')
  }
  if (emotions.includes('positive')) {
    strengths.push('前向きな治療意欲')
  }
  
  return strengths
}

export { analyzeResponsesWithAI } 