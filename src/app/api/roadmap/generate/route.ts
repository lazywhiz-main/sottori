import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AI_CONFIG, isAIFeatureEnabled, logAIUsage } from '@/lib/config/ai'

interface UserResponses {
  step1?: { value: string; label: string }
  step2?: { value: string; label: string }
  step3?: { value: string; label: string }
  step4?: { value: string; label: string }[]
  step5?: { value: string; label: string }[]
}

interface RoadmapSection {
  id: string
  title: string
  icon: string
  content: string[]
  priority: number
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
    if (isAIFeatureEnabled('ROADMAP_GENERATION') && openai) {
      try {
        const roadmapSections = await generateRoadmapWithAI(responses)
        
        // 使用統計をログ
        logAIUsage({
          feature: 'roadmap_generation',
          success: true,
          responseTime: Date.now() - startTime,
          timestamp: new Date()
        })

        return NextResponse.json({
          success: true,
          sections: roadmapSections,
          generatedAt: new Date().toISOString(),
          aiGenerated: true
        })
      } catch (aiError) {
        console.error('AI generation failed, falling back to legacy:', aiError)
        
        // 使用統計をログ
        logAIUsage({
          feature: 'roadmap_generation',
          success: false,
          responseTime: Date.now() - startTime,
          timestamp: new Date()
        })
        
        // フォールバック処理
        if (AI_CONFIG.FALLBACK.USE_LEGACY_LOGIC) {
          const roadmapSections = generateRoadmapLegacy(responses)
          return NextResponse.json({
            success: true,
            sections: roadmapSections,
            generatedAt: new Date().toISOString(),
            aiGenerated: false,
            fallbackUsed: true
          })
        }
      }
    }

    // AI機能が無効またはAPIキーが未設定の場合は既存ロジックを使用
    const roadmapSections = generateRoadmapLegacy(responses)
    return NextResponse.json({
      success: true,
      sections: roadmapSections,
      generatedAt: new Date().toISOString(),
      aiGenerated: false
    })

  } catch (error) {
    console.error('Roadmap generation error:', error)
    return NextResponse.json(
      { success: false, error: 'ロードマップの生成に失敗しました' },
      { status: 500 }
    )
  }
}

async function generateRoadmapWithAI(responses: UserResponses): Promise<RoadmapSection[]> {
  if (!openai) {
    throw new Error('OpenAI client not initialized')
  }

  const prompt = buildPromptFromResponses(responses)
  
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
    temperature: AI_CONFIG.OPENAI.TEMPERATURE,
    max_tokens: AI_CONFIG.OPENAI.MAX_TOKENS,
  })

  const aiResponse = completion.choices[0]?.message?.content
  if (!aiResponse) {
    throw new Error('No response from AI')
  }

  try {
    const parsedResponse = JSON.parse(aiResponse)
    return parsedResponse.sections || []
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError)
    throw new Error('Invalid AI response format')
  }
}

function buildPromptFromResponses(responses: UserResponses): string {
  const situation = responses.step1?.label || '不明'
  const cancerType = responses.step2?.label || '不明'
  const region = responses.step3?.label || '不明'
  const interests = responses.step4?.map(i => i.label).join(', ') || '不明'
  const emotions = responses.step5?.map(e => e.label).join(', ') || '不明'

  return `
【患者情報】
- 現在の状況: ${situation}
- がんの種類: ${cancerType}
- お住まいの地域: ${region}
- 知りたいこと: ${interests}
- 現在の気持ち: ${emotions}

【重要な方針】
1. 「今すぐ決めなくても大丈夫」という安心感を提供
2. 医療行為ではなく「参考情報」として位置づけ
3. 必ず主治医との相談を促す
4. 患者の感情状態に配慮した表現を使用
5. 具体的だが急かさない情報提供
6. 希望を失わせない、前向きな表現を心がける

この患者さんに最適化された3分ロードマップを作成してください。
各セクションは読みやすく、実行可能な内容にしてください。

【出力形式】
以下のJSON形式で回答してください：
{
  "sections": [
    {
      "id": "unique_id",
      "title": "セクション名",
      "icon": "📚",
      "priority": 1,
      "content": ["段落1", "段落2", "段落3", "段落4", "段落5"]
    }
  ]
}

重要：content配列には必ず5つの段落を含めてください。最後の段落は必ず「※ これは一般的な情報です。詳細は必ず主治医にご相談ください。」で終わってください。
  `.trim()
}

// 既存のレガシー実装（フォールバック用）
function generateRoadmapLegacy(responses: UserResponses): RoadmapSection[] {
  const emotionalState = responses.step5?.map(r => r.value) || []
  const isAnxious = emotionalState.includes('anxious')

  const sections: RoadmapSection[] = []

  if (responses.step4) {
    responses.step4.forEach(interest => {
      const section = createSectionLegacy(interest.value, responses, isAnxious)
      if (section) {
        sections.push(section)
      }
    })
  }

  sections.sort((a, b) => a.priority - b.priority)
  return sections
}

function createSectionLegacy(
  interestType: string, 
  responses: UserResponses, 
  isAnxious: boolean
): RoadmapSection | null {
  const cancerType = responses.step2?.label || 'がん'
  const region = responses.step3?.label || 'お住まいの地域'

  switch (interestType) {
    case 'treatment_flow':
      return {
        id: 'treatment',
        title: '治療の流れ',
        icon: '📚',
        priority: 1,
        content: [
          `${cancerType}の標準的な治療の流れをご説明します。`,
          '診断確定 → 病期（ステージ）診断 → 治療方針決定 → 治療開始',
          isAnxious 
            ? '一つずつ段階を踏んで進みますので、焦る必要はありません。'
            : '各段階で主治医と十分に相談しながら進めていきます。',
          '治療期間は個人差がありますが、多くの場合は数ヶ月から1年程度です。',
          '※ これは一般的な情報です。詳細は必ず主治医にご相談ください。'
        ]
      }

    case 'money':
      return {
        id: 'money',
        title: 'お金のこと',
        icon: '💰',
        priority: 2,
        content: [
          `${cancerType}の治療にかかる費用の概算をお示しします。`,
          '高額療養費制度により、月の医療費負担には上限があります。',
          '年収約370万円以下の方：月額約57,600円、年収約770万円以下の方：月額約80,100円',
          '医療費控除も活用できます（年間10万円超の医療費）。',
          '※ これは一般的な情報です。詳細は必ず主治医にご相談ください。'
        ]
      }

    case 'hospital_selection':
      return {
        id: 'hospital',
        title: '病院選び',
        icon: '🏥',
        priority: 3,
        content: [
          `${cancerType}の治療に適した医療機関の選び方をご説明します。`,
          'がん診療連携拠点病院や専門病院を中心に検討しましょう。',
          `${region}内の主要な医療機関の特徴を調べてみましょう。`,
          'セカンドオピニオンの活用も検討できます。',
          '※ これは一般的な情報です。詳細は必ず主治医にご相談ください。'
        ]
      }

    case 'family_support':
      return {
        id: 'family',
        title: '家族のサポート',
        icon: '👨‍👩‍👧‍👦',
        priority: 4,
        content: [
          '家族との連携は治療において重要な要素です。',
          '家族会議を開いて、役割分担を決めましょう。',
          '家族の心理的負担も考慮することが大切です。',
          '患者会や家族会への参加も検討してみてください。',
          '※ これは一般的な情報です。詳細は必ず主治医にご相談ください。'
        ]
      }

    case 'clinical_trials':
      return {
        id: 'trials',
        title: '治験・臨床試験',
        icon: '🔬',
        priority: 5,
        content: [
          '治験や臨床試験は新しい治療選択肢の一つです。',
          '参加には厳格な条件があり、十分な説明を受けられます。',
          '参加は任意であり、いつでも中止できます。',
          '主治医と相談して、適切な治験があるか確認しましょう。',
          '※ これは一般的な情報です。詳細は必ず主治医にご相談ください。'
        ]
      }

    case 'work_balance':
      return {
        id: 'work',
        title: '仕事との両立',
        icon: '💼',
        priority: 6,
        content: [
          '治療と仕事の両立は多くの患者さんが直面する課題です。',
          '職場への説明や配慮の依頼を検討しましょう。',
          '傷病手当金などの制度も活用できます。',
          '無理をせず、体調を最優先に考えてください。',
          '※ これは一般的な情報です。詳細は必ず主治医にご相談ください。'
        ]
      }

    default:
      return null
  }
}

// export { generateRoadmapWithAI } // 現在は未使用 