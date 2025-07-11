/**
 * 統合情報プールサービス（テーブル分離対応版）
 * バックグラウンド収集されたデータの高速検索・取得を担当
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'
import { InfoCategory } from './infoCollection'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// サービスロールキーを使用（データベース直接アクセス用）
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

export interface InformationPoolItem {
  id: string
  title: string
  summary?: string
  content: string
  category: InfoCategory
  cancer_types: string[]
  stages: string[]
  regions: string[]
  age_groups: string[]
  source_type: 'official' | 'medical' | 'academic' | 'community' | 'ai_generated'
  source_name: string
  source_url?: string
  original_publish_date?: Date
  reliability_score: number
  evidence_level?: string
  peer_reviewed: boolean
  collected_at: Date
  last_validated_at?: Date
  expires_at?: Date
  is_active: boolean
  metadata: any
  tags: string[]
  view_count: number
  usefulness_score: number
  usefulness_votes: number
}

export interface SearchFilters {
  cancerTypes?: string[]
  stages?: string[]
  regions?: string[]
  ageGroups?: string[]
  categories?: InfoCategory[]
  sourceTypes?: string[]
  minReliabilityScore?: number
  evidenceLevels?: string[]
  onlyPeerReviewed?: boolean
}

export interface SearchOptions {
  limit?: number
  offset?: number
  sortBy?: 'relevance' | 'reliability' | 'date' | 'usefulness'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult {
  items: InformationPoolItem[]
  totalCount: number
  hasMore: boolean
  searchTime: number
}

export class InformationPoolService {
  
  /**
   * 高速情報検索（フィルタ + 全文検索）
   */
  async searchInformation(
    query?: string, 
    filters?: SearchFilters, 
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now()
    
    try {
      const {
        limit = 20,
        offset = 0,
        sortBy = 'reliability',
        sortOrder = 'desc'
      } = options

      // 新しいテーブル分離設計に対応
      let dbQuery = supabase
        .from('structured_content_pool')
        .select(`
          *,
          raw_content_pool!inner(
            source_url,
            source_name,
            source_type,
            collected_at
          )
        `, { count: 'exact' })
        .eq('is_active', true)

      // 期限切れチェック
      dbQuery = dbQuery.or('expires_at.is.null,expires_at.gt.now()')

      // フィルタ適用
      if (filters) {
        if (filters.cancerTypes?.length) {
          dbQuery = dbQuery.overlaps('cancer_types', filters.cancerTypes)
        }
        if (filters.stages?.length) {
          dbQuery = dbQuery.overlaps('stages', filters.stages)
        }
        if (filters.regions?.length) {
          dbQuery = dbQuery.overlaps('regions', filters.regions)
        }
        if (filters.ageGroups?.length) {
          dbQuery = dbQuery.overlaps('age_groups', filters.ageGroups)
        }
        if (filters.categories?.length) {
          dbQuery = dbQuery.in('category', filters.categories)
        }
        if (filters.sourceTypes?.length) {
          dbQuery = dbQuery.in('raw_content_pool.source_type', filters.sourceTypes)
        }
        if (filters.minReliabilityScore !== undefined) {
          dbQuery = dbQuery.gte('reliability_score', filters.minReliabilityScore)
        }
        if (filters.evidenceLevels?.length) {
          dbQuery = dbQuery.in('evidence_level', filters.evidenceLevels)
        }
        if (filters.onlyPeerReviewed) {
          dbQuery = dbQuery.eq('peer_reviewed', true)
        }
      }

      // 全文検索
      if (query) {
        dbQuery = dbQuery.textSearch('search_vector', query, {
          type: 'websearch',
          config: 'japanese'
        })
      }

      // ソート
      switch (sortBy) {
        case 'reliability':
          dbQuery = dbQuery.order('reliability_score', { ascending: sortOrder === 'asc' })
          break
        case 'date':
          dbQuery = dbQuery.order('raw_content_pool.collected_at', { ascending: sortOrder === 'asc' })
          break
        case 'usefulness':
          dbQuery = dbQuery.order('usefulness_score', { ascending: sortOrder === 'asc' })
          break
        case 'relevance':
        default:
          // 全文検索の場合はrelevanceでソート、そうでなければreliability_score
          if (query) {
            // PostgreSQLのts_rank関数を使用したい場合は、RPCまたはrawクエリが必要
            dbQuery = dbQuery.order('reliability_score', { ascending: false })
          } else {
            dbQuery = dbQuery.order('reliability_score', { ascending: false })
          }
          break
      }

      // ページネーション
      dbQuery = dbQuery.range(offset, offset + limit - 1)

      const { data, count, error } = await dbQuery

      if (error) {
        console.error('情報プール検索エラー:', error)
        throw error
      }

      const searchTime = Date.now() - startTime
      
      console.log(`🔍 情報プール検索完了: ${data?.length || 0}件 (${searchTime}ms)`)

      // データ形式を統一
      const items = (data || []).map(item => this.normalizeItem(item))

      return {
        items,
        totalCount: count || 0,
        hasMore: (count || 0) > offset + limit,
        searchTime
      }

    } catch (error) {
      console.error('情報プール検索失敗:', error)
      throw error
    }
  }

  /**
   * データ形式を統一
   */
  private normalizeItem(item: any): InformationPoolItem {
    return {
      id: item.id,
      title: item.title,
      summary: item.summary,
      content: item.content,
      category: item.category,
      cancer_types: item.cancer_types || [],
      stages: item.stages || [],
      regions: item.regions || [],
      age_groups: item.age_groups || [],
      source_type: item.raw_content_pool?.source_type || 'unknown',
      source_name: item.raw_content_pool?.source_name || '不明なソース',
      source_url: item.raw_content_pool?.source_url,
      original_publish_date: item.original_publish_date,
      reliability_score: item.reliability_score,
      evidence_level: item.evidence_level,
      peer_reviewed: item.peer_reviewed || false,
      collected_at: item.raw_content_pool?.collected_at || item.created_at,
      last_validated_at: item.last_validated_at,
      expires_at: item.expires_at,
      is_active: item.is_active,
      metadata: item.structured_data || {},
      tags: item.tags || [],
      view_count: item.view_count || 0,
      usefulness_score: item.usefulness_score || 0,
      usefulness_votes: item.usefulness_votes || 0
    }
  }

  /**
   * カテゴリ別情報取得
   */
  async getByCategory(
    category: InfoCategory, 
    filters?: SearchFilters, 
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const categoryFilters = { ...filters, categories: [category] }
    return this.searchInformation(undefined, categoryFilters, options)
  }

  /**
   * 人気の情報を取得（usefulness_scoreベース）
   */
  async getPopularInformation(
    filters?: SearchFilters, 
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const popularOptions = { ...options, sortBy: 'usefulness' as const, sortOrder: 'desc' as const }
    return this.searchInformation(undefined, filters, popularOptions)
  }

  /**
   * 最新情報を取得
   */
  async getLatestInformation(
    filters?: SearchFilters, 
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const latestOptions = { ...options, sortBy: 'date' as const, sortOrder: 'desc' as const }
    return this.searchInformation(undefined, filters, latestOptions)
  }

  /**
   * 高品質情報を取得（信頼度4以上）
   */
  async getHighQualityInformation(
    filters?: SearchFilters, 
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const qualityFilters = { ...filters, minReliabilityScore: 4 }
    return this.searchInformation(undefined, qualityFilters, options)
  }

  /**
   * 個別情報の詳細取得
   */
  async getById(id: string): Promise<InformationPoolItem | null> {
    try {
      const { data, error } = await supabase
        .from('structured_content_pool')
        .select(`
          *,
          raw_content_pool!inner(
            source_url,
            source_name,
            source_type,
            collected_at
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('情報詳細取得エラー:', error)
        return null
      }

      // アクセスカウント増加
      await this.incrementViewCount(id)

      return this.normalizeItem(data)

    } catch (error) {
      console.error('情報詳細取得失敗:', error)
      return null
    }
  }

  /**
   * バックグラウンド収集データの保存（新しいテーブル分離設計対応）
   */
  async saveCollectedItems(items: any[]): Promise<{
    saved: number
    skipped: number
    errors: string[]
  }> {
    console.log(`💾 情報プールに保存開始: ${items.length}件`)
    
    let saved = 0
    let skipped = 0
    const errors: string[] = []

    for (const item of items) {
      try {
        // 重複チェック（URL・タイトルベース）
        const existing = await this.findDuplicate(item)
        
        if (existing) {
          console.log(`⚠️  重複データをスキップ: ${item.title}`)
          skipped++
          continue
        }

        // ローデータを保存
        const rawContentId = await this.saveRawContent(item)
        if (!rawContentId) {
          errors.push(`${item.title}: ローデータ保存失敗`)
          continue
        }

        // 構造化データを保存
        const structuredData = this.convertToStructuredFormat(item, rawContentId)
        
        console.log(`🔧 構造化データ保存前:`, {
          title: structuredData.title,
          category: structuredData.category,
          reliability_score: structuredData.reliability_score,
          relevance_score: structuredData.relevance_score,
          evidence_level: structuredData.evidence_level,
          tags: structuredData.tags
        })
        
        const { data: structuredDataResult, error } = await supabase
          .from('structured_content_pool')
          .insert(structuredData)
          .select('id')
          .single()

        if (error) {
          console.error(`❌ 構造化データ保存エラー: ${item.title}`, error)
          errors.push(`${item.title}: ${error.message}`)
        } else {
          saved++
          console.log(`✅ 構造化データ保存成功: ${item.title}`)
          
          // ユーザー固有の情報がある場合は、ユーザー状態テーブルにも保存
          if (item.userId && structuredDataResult?.id) {
            await this.saveUserSpecificInfo(item.userId, structuredDataResult.id, item)
          }
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '不明なエラー'
        errors.push(`${item.title}: ${errorMsg}`)
        console.error(`❌ 処理エラー: ${item.title}`, error)
      }
    }

    console.log(`💾 情報プール保存完了: 成功${saved}件、スキップ${skipped}件、エラー${errors.length}件`)
    
    return { saved, skipped, errors }
  }

  /**
   * ユーザー固有の情報を保存
   */
  private async saveUserSpecificInfo(userId: string, structuredContentId: string, item: any): Promise<void> {
    try {
      // ユーザー状態テーブルに保存
      const { error: stateError } = await supabase
        .from('user_structured_content_states')
        .insert({
          user_id: userId,
          structured_content_id: structuredContentId,
          is_read: false,
          is_saved: false,
          view_count: 0
        })

      if (stateError) {
        console.error(`❌ ユーザー状態保存エラー: ${item.title}`, stateError)
      }

      // 関連度スコアテーブルに保存
      const { error: relevanceError } = await supabase
        .from('structured_content_relevance_scores')
        .insert({
          user_id: userId,
          structured_content_id: structuredContentId,
          medical_match_score: item.reliabilityScore * 20, // 信頼性スコアを変換
          situational_relevance_score: item.relevanceScore,
          personal_interest_score: 50, // デフォルト値
          urgency_importance_score: this.calculateUrgencyScore(item),
          final_relevance_score: item.relevanceScore,
          relevance_explanation: 'ユーザー固有の情報収集により生成'
        })

      if (relevanceError) {
        console.error(`❌ 関連度スコア保存エラー: ${item.title}`, relevanceError)
      }

      console.log(`✅ ユーザー固有情報保存成功: ${item.title} (ユーザー: ${userId})`)

    } catch (error) {
      console.error(`❌ ユーザー固有情報保存例外: ${item.title}`, error)
    }
  }

  /**
   * 緊急度スコアを計算
   */
  private calculateUrgencyScore(item: any): number {
    // カテゴリに基づく緊急度スコア
    const urgencyMap: Record<string, number> = {
      'treatment_options': 90,
      'side_effects': 85,
      'clinical_trials': 80,
      'support_resources': 70,
      'financial_assistance': 75,
      'doctors': 80
    }
    
    return urgencyMap[item.category] || 50
  }

  /**
   * ローデータを保存
   */
  private async saveRawContent(item: any): Promise<string | null> {
    try {
      const rawContent = item.rawContent || item.content || ''
      const rawData = {
        source_url: item.sourceUrl,
        source_name: this.extractSourceName(item.sourceUrl),
        source_type: item.sourceType,
        content_type: 'html',
        raw_content: rawContent, // 元のHTMLコンテンツ
        content_hash: this.generateContentHash(item.content),
        content_length: rawContent.length,
        processing_status: 'completed',
        is_cached: false,
        cache_expires_at: null
      }

      const { data, error } = await supabase
        .from('raw_content_pool')
        .insert(rawData)
        .select('id')
        .single()

      if (error) {
        console.error('❌ ローデータ保存エラー:', error)
        return null
      }

      console.log(`✅ ローデータ保存成功: ${data.id} (${rawContent.length}文字)`)
      return data.id

    } catch (error) {
      console.error('❌ ローデータ保存例外:', error)
      return null
    }
  }

  /**
   * 構造化データ形式に変換
   */
  private convertToStructuredFormat(item: any, rawContentId: string): any {
    return {
      raw_content_id: rawContentId,
      title: item.title,
      summary: item.summary,
      content: item.content,
      category: item.category,
      reliability_score: item.reliabilityScore,
      relevance_score: item.relevanceScore || 50,
      evidence_level: this.determineEvidenceLevel(item),
      // 新しく追加されたカラム
      cancer_types: item.cancer_types || this.determineCancerTypes(item),
      stages: item.stages || this.determineStages(item),
      age_groups: item.age_groups || ['all'],
      regions: item.regions || this.determineRegions(item),
      structured_data: {
        original_item: item,
        processing_metadata: {
          processed_at: new Date().toISOString(),
          processor_version: '1.0'
        }
      },
      tags: this.extractTags(item),
      expires_at: item.expiresAt
    }
  }

  /**
   * 重複チェック（新しいテーブル構造対応）
   */
  private async findDuplicate(item: any): Promise<boolean> {
    const contentHash = this.generateContentHash(item.content)
    console.log(`🔍 重複チェック: ${item.sourceUrl} (ハッシュ: ${contentHash})`)
    
    // URLとハッシュの両方で重複チェック
    const { data: urlMatch } = await supabase
      .from('raw_content_pool')
      .select('id, source_url, content_hash, created_at')
      .eq('source_url', item.sourceUrl)
      .eq('processing_status', 'completed')
      .limit(1)
    
    const { data: hashMatch } = await supabase
      .from('raw_content_pool')
      .select('id, source_url, content_hash, created_at')
      .eq('content_hash', contentHash)
      .eq('processing_status', 'completed')
      .limit(1)
    
    // タイトルベースの重複チェックも追加
    const { data: titleMatch } = await supabase
      .from('structured_content_pool')
      .select('id, title, source_url, created_at')
      .eq('title', item.title)
      .limit(1)
    
    const isDuplicate = (urlMatch?.length || 0) > 0 || (hashMatch?.length || 0) > 0 || (titleMatch?.length || 0) > 0
    
    if (isDuplicate) {
      if (urlMatch?.length) {
        console.log(`⚠️  URL重複発見: ${item.sourceUrl} - 既存ID: ${urlMatch[0]?.id} (${urlMatch[0]?.created_at})`)
      }
      if (hashMatch?.length) {
        console.log(`⚠️  ハッシュ重複発見: ${item.sourceUrl} - 既存ID: ${hashMatch[0]?.id} (${hashMatch[0]?.created_at})`)
      }
      if (titleMatch?.length) {
        console.log(`⚠️  タイトル重複発見: ${item.title} - 既存ID: ${titleMatch[0]?.id} (${titleMatch[0]?.created_at})`)
      }
    } else {
      console.log(`✅ 重複なし: ${item.sourceUrl}`)
    }
    
    return isDuplicate
  }

  /**
   * コンテンツハッシュ生成
   */
  private generateContentHash(content: string): string {
    // 簡易ハッシュ生成（本格的な実装ではcrypto-js等を使用）
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32bit整数に変換
    }
    return hash.toString(16)
  }

  /**
   * タグ抽出
   */
  private extractTags(item: any): string[] {
    const tags = []
    if (item.category) tags.push(item.category)
    if (item.sourceType) tags.push(item.sourceType)
    return tags
  }

  private determineCancerTypes(item: any): string[] {
    // タイトル・コンテンツから がん種を推定
    const content = (item.title + ' ' + item.content).toLowerCase()
    const types = []
    
    if (content.includes('乳がん') || content.includes('breast')) types.push('breast_cancer')
    if (content.includes('肺がん') || content.includes('lung')) types.push('lung_cancer')
    if (content.includes('胃がん') || content.includes('stomach')) types.push('stomach_cancer')
    if (content.includes('大腸がん') || content.includes('colorectal')) types.push('colorectal_cancer')
    
    return types.length > 0 ? types : ['all']
  }

  private determineStages(item: any): string[] {
    const content = (item.title + ' ' + item.content).toLowerCase()
    const stages = []
    
    if (content.includes('ステージ1') || content.includes('stage 1')) stages.push('stage_1')
    if (content.includes('ステージ2') || content.includes('stage 2')) stages.push('stage_2')
    if (content.includes('ステージ3') || content.includes('stage 3')) stages.push('stage_3')
    if (content.includes('ステージ4') || content.includes('stage 4')) stages.push('stage_4')
    
    return stages.length > 0 ? stages : ['all']
  }

  private determineRegions(item: any): string[] {
    // 将来的に地域情報を推定する場合はここで実装
    return ['all']
  }

  private determineEvidenceLevel(item: any): string {
    // ソースタイプに基づくエビデンスレベルの推定
    switch (item.sourceType) {
      case 'official': return 'A'
      case 'medical': return 'B'
      case 'academic': return 'B'
      default: return 'unknown'
    }
  }

  private extractSourceName(url?: string): string {
    if (!url) return '不明なソース'
    
    if (url.includes('ganjoho.jp')) return 'がん情報サービス'
    if (url.includes('ncc.go.jp')) return '国立がん研究センター'
    if (url.includes('jcog.jp')) return '日本臨床腫瘍研究グループ'
    
    try {
      const domain = new URL(url).hostname
      return domain
    } catch {
      return '不明なソース'
    }
  }

  /**
   * アクセスカウント増加（新しいテーブル構造対応）
   */
  private async incrementViewCount(id: string): Promise<void> {
    try {
      // 新しいテーブル構造では直接カウントを更新
      await supabase
        .from('structured_content_pool')
        .update({ 
          view_count: supabase.rpc('increment', { value: 1 }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
    } catch (error) {
      console.error('アクセスカウント更新エラー:', error)
      // エラーでも処理は継続
    }
  }

  /**
   * 情報の有用性評価（新しいテーブル構造対応）
   */
  async rateInformation(
    id: string, 
    userId: string, 
    rating: number, 
    feedback?: string
  ): Promise<boolean> {
    try {
      // ユーザーアクセスログに記録
      await supabase
        .from('user_info_access_log')
        .insert({
          user_id: userId,
          structured_content_id: id, // 新しいテーブル構造に対応
          access_type: 'rate',
          usefulness_rating: rating,
          user_feedback: feedback
        })

      // 評価スコアの再計算
      await this.updateUsefulnessScore(id, rating)
      
      console.log(`⭐ 評価記録: ${id} - ${rating}点`)
      return true

    } catch (error) {
      console.error('評価記録エラー:', error)
      return false
    }
  }

  /**
   * 有用性スコア更新
   */
  private async updateUsefulnessScore(id: string, newRating: number): Promise<void> {
    try {
      // 現在のスコアを取得
      const { data: current } = await supabase
        .from('structured_content_pool')
        .select('usefulness_score, usefulness_votes')
        .eq('id', id)
        .single()

      if (!current) return

      // 新しいスコアを計算
      const currentScore = current.usefulness_score || 0
      const currentVotes = current.usefulness_votes || 0
      const newVotes = currentVotes + 1
      const newScore = ((currentScore * currentVotes) + newRating) / newVotes

      // スコアを更新
      await supabase
        .from('structured_content_pool')
        .update({
          usefulness_score: newScore,
          usefulness_votes: newVotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

    } catch (error) {
      console.error('有用性スコア更新エラー:', error)
    }
  }

  /**
   * 構造化失敗したローデータのみを対象としたリトライ機能
   * スクレイピングは行わず、既存ローデータから構造化のみ実行
   */
  async retryStructuredProcessing(): Promise<{
    retried: number
    success: number
    errors: string[]
  }> {
    console.log('🔄 構造化専用リトライ開始')
    
    try {
      // 構造化失敗したローデータを取得
      const { data: failedRawItems, error } = await supabase
        .from('raw_content_pool')
        .select('*')
        .eq('processing_status', 'failed')
        .lt('processing_attempts', 3) // 最大3回までリトライ

      if (error) {
        console.error('❌ 失敗ローデータ取得エラー:', error)
        return { retried: 0, success: 0, errors: [error.message] }
      }

      if (!failedRawItems || failedRawItems.length === 0) {
        console.log('📝 リトライ対象の失敗ローデータなし')
        return { retried: 0, success: 0, errors: [] }
      }

      console.log(`🔄 リトライ対象: ${failedRawItems.length}件`)

      let retried = 0
      let success = 0
      const errors: string[] = []

      for (const rawItem of failedRawItems) {
        try {
          retried++
          console.log(`🔄 リトライ処理中: ${rawItem.id} (${retried}/${failedRawItems.length})`)

          // 既存の構造化データがあるかチェック
          const { data: existingStructured } = await supabase
            .from('structured_content_pool')
            .select('id')
            .eq('raw_content_id', rawItem.id)
            .single()

          if (existingStructured) {
            console.log(`⏭️ 既に構造化済み: ${rawItem.id}`)
            // ローデータの状態を更新
            await supabase
              .from('raw_content_pool')
              .update({ 
                processing_status: 'completed',
                processing_attempts: (rawItem.processing_attempts || 0) + 1
              })
              .eq('id', rawItem.id)
            success++
            continue
          }

          // ローデータから構造化データを生成
          const structuredData = this.convertRawToStructured(rawItem)
          
          console.log(`🔧 構造化データ生成:`, {
            title: structuredData.title,
            category: structuredData.category,
            reliability_score: structuredData.reliability_score,
            relevance_score: structuredData.relevance_score
          })

          // 構造化データを保存
          const { error: insertError } = await supabase
            .from('structured_content_pool')
            .insert(structuredData)

          if (insertError) {
            console.error(`❌ 構造化データ保存エラー: ${rawItem.id}`, insertError)
            errors.push(`${rawItem.id}: ${insertError.message}`)
            
            // 処理回数を更新
            await supabase
              .from('raw_content_pool')
              .update({ 
                processing_attempts: (rawItem.processing_attempts || 0) + 1,
                last_processing_error: insertError.message
              })
              .eq('id', rawItem.id)
          } else {
            console.log(`✅ 構造化データ保存成功: ${rawItem.id}`)
            success++
            
            // ローデータの状態を更新
            await supabase
              .from('raw_content_pool')
              .update({ 
                processing_status: 'completed',
                processing_attempts: (rawItem.processing_attempts || 0) + 1
              })
              .eq('id', rawItem.id)
          }

        } catch (itemError) {
          console.error(`❌ リトライ処理エラー: ${rawItem.id}`, itemError)
          errors.push(`${rawItem.id}: ${itemError instanceof Error ? itemError.message : String(itemError)}`)
        }
      }

      console.log(`🔄 構造化リトライ完了: 対象${retried}件, 成功${success}件, エラー${errors.length}件`)
      return { retried, success, errors }

    } catch (error) {
      console.error('❌ 構造化リトライ全体エラー:', error)
      return { retried: 0, success: 0, errors: [error instanceof Error ? error.message : String(error)] }
    }
  }

  /**
   * ローデータから構造化データを生成
   */
  private convertRawToStructured(rawItem: any): any {
    // ローデータの内容から基本的な情報を抽出
    const title = this.extractTitleFromRaw(rawItem.raw_content)
    const summary = this.extractSummaryFromRaw(rawItem.raw_content)
    
    return {
      raw_content_id: rawItem.id,
      title: title || '再処理されたコンテンツ',
      summary: summary || 'ローデータから再構築された情報',
      content: rawItem.raw_content.substring(0, 2000), // 長すぎる場合は切り詰め
      category: 'support_resources', // デフォルトカテゴリ
      reliability_score: 3, // デフォルト信頼度
      relevance_score: 50, // デフォルト関連度
      evidence_level: 'C', // デフォルトエビデンスレベル
      structured_data: {
        original_raw_item: rawItem,
        processing_metadata: {
          processed_at: new Date().toISOString(),
          processor_version: '1.0',
          retry_processed: true
        }
      },
      tags: ['再処理', 'ローデータ'],
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30日後
    }
  }

  /**
   * ローデータからタイトルを抽出
   */
  private extractTitleFromRaw(rawContent: string): string {
    if (!rawContent) return ''
    
    // HTMLタグを除去
    const cleanContent = rawContent.replace(/<[^>]*>/g, '')
    
    // 最初の100文字をタイトルとして使用
    return cleanContent.substring(0, 100).trim()
  }

  /**
   * ローデータからサマリーを抽出
   */
  private extractSummaryFromRaw(rawContent: string): string {
    if (!rawContent) return ''
    
    // HTMLタグを除去
    const cleanContent = rawContent.replace(/<[^>]*>/g, '')
    
    // 最初の200文字をサマリーとして使用
    return cleanContent.substring(0, 200).trim()
  }
} 