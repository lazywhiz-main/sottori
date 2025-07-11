import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AI_CONFIG, isAIFeatureEnabled, logAIUsage } from '../../../../lib/config/ai'
import { roadmapService } from '../../../../lib/services/roadmapService'
import { UserResponses, RoadmapSection } from '../../../../lib/types/roadmap'

// OpenAI クライアントの初期化
const openai = AI_CONFIG.OPENAI.API_KEY ? new OpenAI({
  apiKey: AI_CONFIG.OPENAI.API_KEY,
}) : null

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // ユーザー認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { responses, mode = 'async' }: { responses: UserResponses; mode?: 'sync' | 'async' } = await request.json()

    // リクエスト検証
    if (!responses || Object.keys(responses).length === 0) {
      return NextResponse.json(
        { success: false, error: '回答データが必要です' },
        { status: 400 }
      )
    }

    // 非同期モードの場合は即座にジョブIDを返す
    if (mode === 'async') {
      // 同一ユーザーの進行中ジョブをチェック
      const userId = authHeader?.replace('Bearer ', '') || 'anonymous'
      const existingJobId = await checkExistingJob(userId)
      
      if (existingJobId) {
        return NextResponse.json({
          success: true,
          jobId: existingJobId,
          mode: 'async',
          message: '既に処理中のジョブがあります。そちらの結果をお待ちください。',
          estimatedTime: '1-2分',
          isExisting: true
        })
      }
      
      const jobId = generateJobId()
      
      // ジョブの開始をマーク
      await markJobAsStarted(userId, jobId)
      
      // バックグラウンドでAI生成を開始（エラーをキャッチ）
      processRoadmapAsync(jobId, responses, startTime, authHeader).catch(error => {
        console.error(`❌ 非同期処理でエラーが発生: ${jobId}`, error)
        markJobAsCompleted(userId, jobId).catch(console.error)
      })
      
      return NextResponse.json({
        success: true,
        jobId,
        mode: 'async',
        message: 'ロードマップ生成を開始しました。結果は後ほど確認できます。',
        estimatedTime: '1-2分'
      })
    }

    // 同期モード（既存の処理）
    let roadmapSections: RoadmapSection[]
    let aiGenerated = false
    
    if (isAIFeatureEnabled('ROADMAP_GENERATION') && openai) {
      try {
        roadmapSections = await generateRoadmapWithAI(responses)
        aiGenerated = true
        
        logAIUsage({
          feature: 'roadmap_generation',
          success: true,
          responseTime: Date.now() - startTime,
          timestamp: new Date()
        })
      } catch (aiError) {
        console.error('AI generation failed, falling back to legacy:', aiError)
        
        logAIUsage({
          feature: 'roadmap_generation',
          success: false,
          responseTime: Date.now() - startTime,
          timestamp: new Date()
        })
        
        if (AI_CONFIG.FALLBACK.USE_LEGACY_LOGIC) {
          roadmapSections = generateRoadmapLegacy(responses)
        } else {
          throw aiError
        }
      }
    } else {
      roadmapSections = generateRoadmapLegacy(responses)
    }

    // データベースにロードマップを保存
    try {
      const userId = authHeader?.replace('Bearer ', '') || 'anonymous'
      // const roadmap = await roadmapService.createRoadmapFromAIResponse(
      //   userId,
      //   responses,
      //   roadmapSections,
      //   aiGenerated
      // )
      // 仮実装: ダミーのロードマップIDを返す
      const roadmap = { id: `roadmap_${Date.now()}` }

      if (roadmap) {
        return NextResponse.json({
          success: true,
          roadmapId: roadmap.id,
          sections: roadmapSections,
          generatedAt: new Date().toISOString(),
          aiGenerated,
          fallbackUsed: !aiGenerated,
          mode: 'sync'
        })
      }
    } catch (dbError) {
      console.error('Failed to save roadmap to database:', dbError)
      // データベース保存に失敗しても、生成結果は返す
    }

    return NextResponse.json({
      success: true,
      sections: roadmapSections,
      generatedAt: new Date().toISOString(),
      aiGenerated,
      fallbackUsed: !aiGenerated,
      mode: 'sync'
    })

  } catch (error) {
    console.error('Roadmap generation error:', error)
    return NextResponse.json(
      { success: false, error: 'ロードマップの生成に失敗しました' },
      { status: 500 }
    )
  }
}

// ジョブID生成
function generateJobId(): string {
  return `roadmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 進行中ジョブのチェック（メモリベース）
async function checkExistingJob(userId: string): Promise<string | null> {
  try {
    const globalCache = global as any
    const userJobs = globalCache.userActiveJobs || new Map()
    
    const userActiveJobs = userJobs.get(userId)
    if (userActiveJobs && userActiveJobs.length > 0) {
      // 最後のジョブを返す
      const lastJob = userActiveJobs[userActiveJobs.length - 1]
      const elapsed = Date.now() - lastJob.startTime
      
      // 5分以内なら継続中とみなす
      if (elapsed < 5 * 60 * 1000) {
        console.log(`🔄 進行中ジョブ発見: ${lastJob.jobId} (${userId})`)
        return lastJob.jobId
      } else {
        // 古いジョブを削除
        userJobs.delete(userId)
      }
    }
    
    return null
  } catch (error) {
    console.error('進行中ジョブチェックエラー:', error)
    return null
  }
}

// ジョブ開始をマーク
async function markJobAsStarted(userId: string, jobId: string): Promise<void> {
  try {
    const globalCache = global as any
    if (!globalCache.userActiveJobs) {
      globalCache.userActiveJobs = new Map()
    }
    
    const userJobs = globalCache.userActiveJobs.get(userId) || []
    userJobs.push({
      jobId,
      startTime: Date.now()
    })
    globalCache.userActiveJobs.set(userId, userJobs)
    
    console.log(`📝 ジョブ開始マーク: ${jobId} (${userId})`)
  } catch (error) {
    console.error('ジョブ開始マークエラー:', error)
  }
}

// ジョブ完了をマーク
async function markJobAsCompleted(userId: string, jobId: string): Promise<void> {
  try {
    const globalCache = global as any
    const userJobs = globalCache.userActiveJobs?.get(userId) || []
    
    // 完了したジョブを削除
    const filteredJobs = userJobs.filter((job: any) => job.jobId !== jobId)
    if (filteredJobs.length > 0) {
      globalCache.userActiveJobs.set(userId, filteredJobs)
    } else {
      globalCache.userActiveJobs?.delete(userId)
    }
    
    console.log(`✅ ジョブ完了マーク: ${jobId} (${userId})`)
  } catch (error) {
    console.error('ジョブ完了マークエラー:', error)
  }
}

// 非同期処理（バックグラウンド実行）
async function processRoadmapAsync(jobId: string, responses: UserResponses, startTime: number, authHeader: string | null) {
  try {
    console.log(`🚀 非同期ロードマップ生成開始: ${jobId}`)
    
    let roadmapSections: RoadmapSection[]
    let aiGenerated = false
    
    if (isAIFeatureEnabled('ROADMAP_GENERATION') && openai) {
      try {
        roadmapSections = await generateRoadmapWithAI(responses)
        aiGenerated = true
        console.log(`✅ AI生成完了: ${jobId}`)
      } catch (aiError) {
        console.error(`⚠️ AI生成失敗、フォールバック: ${jobId}`, aiError)
        roadmapSections = generateRoadmapLegacy(responses)
      }
    } else {
      roadmapSections = generateRoadmapLegacy(responses)
    }
    
    // 結果をデータベースまたはキャッシュに保存
    const result = {
      jobId,
      success: true,
      sections: roadmapSections,
      generatedAt: new Date().toISOString(),
      aiGenerated,
      mode: 'async',
      responseTime: Date.now() - startTime
    }
    
    await saveJobResult(jobId, result, authHeader)
    
    logAIUsage({
      feature: 'roadmap_generation',
      success: true,
      responseTime: Date.now() - startTime,
      timestamp: new Date()
    })
    
    console.log(`🎉 非同期処理完了: ${jobId} (${Date.now() - startTime}ms)`)
    
    // ジョブ完了をマーク
    const userId = authHeader?.replace('Bearer ', '') || 'anonymous'
    await markJobAsCompleted(userId, jobId)
    
  } catch (error) {
    console.error(`❌ 非同期処理エラー: ${jobId}`, error)
    
    const errorResult = {
      jobId,
      success: false,
      error: 'ロードマップの生成に失敗しました',
      generatedAt: new Date().toISOString(),
      mode: 'async'
    }
    
    await saveJobResult(jobId, errorResult, authHeader)
  }
}

// ジョブ結果の保存（実装例）
async function saveJobResult(jobId: string, result: any, authHeader?: string | null) {
  // 実装案1: メモリキャッシュ（即座に動作）
  try {
    // グローバルキャッシュに保存
    const globalCache = global as any
    if (!globalCache.roadmapJobCache) {
      globalCache.roadmapJobCache = new Map()
    }
    globalCache.roadmapJobCache.set(jobId, result)
    console.log(`💾 メモリキャッシュに保存: ${jobId}`)
    
    // TTL設定（5分後に削除）
    setTimeout(() => {
      globalCache.roadmapJobCache?.delete(jobId)
      console.log(`🗑️ キャッシュ削除: ${jobId}`)
    }, 5 * 60 * 1000)
  } catch (error) {
    console.error('メモリキャッシュ保存エラー:', error)
  }

  // 実装案2: Supabaseに保存（オプション）
  try {
    if (typeof window === 'undefined') {
      // サーバーサイドでのみ実行
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // サービスロールキー
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      // ユーザーIDの取得（認証ヘッダーから）
      let userId = null
      if (authHeader) {
        try {
          // JWTトークンからユーザーIDを抽出（簡易版）
          const token = authHeader.replace('Bearer ', '')
          const payload = JSON.parse(atob(token.split('.')[1]))
          userId = payload.sub
        } catch (error) {
          console.error('Failed to extract user ID from token:', error)
        }
      }
      
      await supabase
        .from('roadmap_jobs')
        .upsert({
          job_id: jobId,
          result: result,
          user_id: userId,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24時間後に期限切れ
        })
    }
  } catch (error) {
    console.error('Failed to save job result:', error)
  }
  
  // 実装案2: メモリキャッシュ（簡易版）
  const globalCache = global as any
  if (!globalCache.roadmapJobCache) {
    globalCache.roadmapJobCache = new Map()
  }
  
  globalCache.roadmapJobCache.set(jobId, {
    ...result,
    timestamp: Date.now()
  })
  
  // 1時間後に自動削除
  setTimeout(() => {
    globalCache.roadmapJobCache?.delete(jobId)
  }, 60 * 60 * 1000)
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
    frequency_penalty: 0.1,
    presence_penalty: 0.1,
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

  return `患者情報: ${situation}, ${cancerType}, ${region}地域
興味: ${interests}
感情: ${emotions}

安心感を重視し、3つのセクションで情報整理ガイドを作成。各セクション5段落、最後は必ず「※詳細は主治医にご相談ください。」

JSON形式:
{
  "sections": [
    {
      "id": "info_1",
      "title": "情報整理",
      "icon": "📚",
      "priority": 1,
      "content": ["段落1", "段落2", "段落3", "段落4", "※詳細は主治医にご相談ください。"]
    }
  ]
}`
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