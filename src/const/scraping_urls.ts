/**
 * スクレイピング対象URL設定ファイル
 * 
 * このファイルでスクレイピング対象のURLを一元管理します。
 * 新しいURLの追加や既存URLの修正は、このファイルを編集してください。
 */

// =============================================================================
// テスト用URLリスト（安定して取得できるページ）
// =============================================================================

export const TEST_SCRAPING_URLS = [
  // JSON形式のテストデータ
  'https://httpbin.org/json',
  'https://jsonplaceholder.typicode.com/posts/1',
  
  // HTML形式のテストデータ
  'https://www.example.com/',
  'https://www.rfc-editor.org/rfc/rfc2616.txt',
  'https://www.iana.org/domains/example',
  
  // 追加の安定したテストサイト
  'https://httpbin.org/html',
  'https://jsonplaceholder.typicode.com/comments/1',
  'https://www.w3.org/TR/html52/',
  'https://www.w3schools.com/html/html_examples.asp', // HTMLサンプル集
  'https://developer.mozilla.org/en-US/docs/Web/HTML', // MDN HTML解説
  'https://www.wikipedia.org/', // Wikipediaトップ
  'https://www.gnu.org/licenses/gpl-3.0.txt', // GPLテキスト
  'https://www.ietf.org/standards/rfcs/' // RFC一覧
]

// =============================================================================
// 実データ用URLリスト（厚生労働省がん情報サービス）
// =============================================================================

export const MHLW_SCRAPING_URLS = {
  // 基本URL
  base: 'https://ganjoho.jp/public',
  
  // がん種別URL（実際のサイト構造に基づく）
  cancerTypes: {
    breast_cancer: 'breast',
    lung_cancer: 'lung', 
    stomach_cancer: 'stomach',
    colorectal_cancer: 'colon', // 実際は 'colon'
    prostate_cancer: 'prostate',
    liver_cancer: 'liver',
    pancreas_cancer: 'pancreas',
    esophagus_cancer: 'esophagus',
    ovary_cancer: 'ovary',
    cervix_cancer: 'cervix_uteri', // 実際は 'cervix_uteri'
    bladder_cancer: 'bladder',
    kidney_cancer: 'renal_cell', // 実際は 'renal_cell' (腎細胞がん)
  },
  
  // 実際のURLパターン（サイト構造に基づく）
  patterns: {
    treatment: '/cancer/{type}/treatment.html',
    diagnosis: '/cancer/{type}/diagnosis.html', 
    prevention_screening: '/cancer/{type}/prevention_screening.html', // 実際は統合ページ
    index: '/cancer/{type}/index.html',
    // 共通の診断・治療ページ
    dia_tre: {
      diagnosis: '/public/dia_tre/dia_tre_diagnosis/index.html',
      multidisciplinary_treatment: '/public/dia_tre/treatment/multidisciplinary_treatment.html',
      operation: '/public/dia_tre/treatment/operation/index.html',
      drug_therapy: '/public/dia_tre/treatment/drug_therapy/index.html',
      radiotherapy: '/public/dia_tre/treatment/radiotherapy/index.html',
      endoscopy: '/public/dia_tre/treatment/endoscopy.html',
      HSCT: '/public/dia_tre/treatment/HSCT/index.html'
    },
    // 検診関連
    screening: {
      about: '/public/pre_scr/screening/about_scr01.html',
      stomach: '/public/pre_scr/screening/stomach.html',
      cervix_uteri: '/public/pre_scr/screening/cervix_uteri.html',
      lung: '/public/pre_scr/screening/lung.html',
      breast: '/public/pre_scr/screening/breast.html',
      colon: '/public/pre_scr/screening/colon.html'
    }
  },
  
  // 実際の共通ページ
  common: [
    'https://ganjoho.jp/public/cancer/index.html',
    'https://ganjoho.jp/public/index.html',
    'https://ganjoho.jp/public/dia_tre/index.html',
    'https://ganjoho.jp/public/pre_scr/index.html',
    
    // 手動追加URL（テスト用）
    'https://ganjoho.jp/public/cancer/colon/index.html',
    'https://ganjoho.jp/public/cancer/colon/diagnosis.html',
    'https://ganjoho.jp/public/cancer/colon/treatment.html',
    'https://ganjoho.jp/public/cancer/colon/prevention_screening.html'
  ]
}

// =============================================================================
// 医学会ガイドラインURLリスト
// =============================================================================

export const MEDICAL_SOCIETY_URLS = [
  {
    name: '日本癌学会',
    baseUrl: 'https://www.jca.gr.jp',
    guidelineType: 'official' as const,
    riskLevel: 'low' as const,
    cancerTypes: ['all']
  },
  {
    name: '日本乳癌学会', 
    baseUrl: 'https://jbcs.xsrv.jp',
    guidelineType: 'clinical' as const,
    riskLevel: 'low' as const,
    cancerTypes: ['breast_cancer']
  },
  {
    name: '日本肺癌学会',
    baseUrl: 'https://www.haigan.gr.jp', 
    guidelineType: 'clinical' as const,
    riskLevel: 'low' as const,
    cancerTypes: ['lung_cancer']
  },
  {
    name: '日本胃癌学会',
    baseUrl: 'https://www.jgca.jp',
    guidelineType: 'clinical' as const, 
    riskLevel: 'low' as const,
    cancerTypes: ['stomach_cancer']
  },
  {
    name: '大腸癌研究会',
    baseUrl: 'https://jsccr.jp',
    guidelineType: 'clinical' as const,
    riskLevel: 'low' as const, 
    cancerTypes: ['colorectal_cancer']
  }
]

// =============================================================================
// 地域がん診療連携拠点病院URLリスト
// =============================================================================

export const REGIONAL_HOSPITAL_URLS = [
  // 厚労省の地域がん診療連携拠点病院一覧
  'https://ganjoho.jp/public/cancer/medical_institution/index.html',
  
  // 各都道府県の医療機関情報（例）
  'https://www.pref.tokyo.lg.jp/smph/iryo/iryo_hoken/gan_center.html', // 東京都
  'https://www.pref.osaka.lg.jp/iryo/gancenter/', // 大阪府
  'https://www.pref.kyoto.lg.jp/iryo/gancenter/', // 京都府
]

// =============================================================================
// 手動追加URLリスト（テスト・デバッグ用）
// =============================================================================

export const MANUAL_ADDITIONAL_URLS = [
  // 大腸がん関連（動作確認済み）
  'https://ganjoho.jp/public/cancer/colon/index.html',
  'https://ganjoho.jp/public/cancer/colon/diagnosis.html',
  'https://ganjoho.jp/public/cancer/colon/treatment.html',
  'https://ganjoho.jp/public/cancer/colon/prevention_screening.html',
  
  // 胃がん関連（動作確認済み）
  'https://ganjoho.jp/public/cancer/stomach/index.html',
  'https://ganjoho.jp/public/cancer/stomach/diagnosis.html',
  'https://ganjoho.jp/public/cancer/stomach/treatment.html',
  
  // 肺がん関連（動作確認済み）
  'https://ganjoho.jp/public/cancer/lung/index.html',
  'https://ganjoho.jp/public/cancer/lung/diagnosis.html',
  'https://ganjoho.jp/public/cancer/lung/treatment_nsclc.html',
  'https://ganjoho.jp/public/cancer/lung/treatment_sclc.html',
  
  // 乳がん関連（動作確認済み）
  'https://ganjoho.jp/public/cancer/breast/index.html',
  'https://ganjoho.jp/public/cancer/breast/diagnosis.html',
  'https://ganjoho.jp/public/cancer/breast/treatment.html',
  
  // 前立腺がん関連（動作確認済み）
  'https://ganjoho.jp/public/cancer/prostate/index.html',
  'https://ganjoho.jp/public/cancer/prostate/diagnosis.html',
  'https://ganjoho.jp/public/cancer/prostate/treatment.html',
  
  // 肝臓がん関連（動作確認済み）
  'https://ganjoho.jp/public/cancer/liver/index.html',
  'https://ganjoho.jp/public/cancer/liver/diagnosis.html',
  'https://ganjoho.jp/public/cancer/liver/treatment.html',
  
  // 膵臓がん関連（動作確認済み）
  'https://ganjoho.jp/public/cancer/pancreas/index.html',
  'https://ganjoho.jp/public/cancer/pancreas/diagnosis.html',
  'https://ganjoho.jp/public/cancer/pancreas/treatment.html',
  
  // 卵巣がん関連（動作確認済み）
  'https://ganjoho.jp/public/cancer/ovary/index.html',
  'https://ganjoho.jp/public/cancer/ovary/diagnosis.html',
  'https://ganjoho.jp/public/cancer/ovary/treatment.html',
  
  // 子宮頸がん関連（動作確認済み）
  'https://ganjoho.jp/public/cancer/cervix_uteri/index.html',
  'https://ganjoho.jp/public/cancer/cervix_uteri/diagnosis.html',
  'https://ganjoho.jp/public/cancer/cervix_uteri/treatment.html',
  
  // 膀胱がん関連（動作確認済み）
  'https://ganjoho.jp/public/cancer/bladder/index.html',
  'https://ganjoho.jp/public/cancer/bladder/diagnosis.html',
  'https://ganjoho.jp/public/cancer/bladder/treatment.html',
  
  // 腎臓がん関連（動作確認済み・修正済み）
  'https://ganjoho.jp/public/cancer/renal_cell/index.html',
  'https://ganjoho.jp/public/cancer/renal_cell/diagnosis.html',
  'https://ganjoho.jp/public/cancer/renal_cell/treatment.html',
]

// =============================================================================
// 非推奨・404エラーが発生しているURL（コメントアウト）
// =============================================================================

export const DEPRECATED_URLS = [
  // 404エラーが発生しているURL
  // 'https://example-deprecated.com/page1',
  // 'https://old-site.com/info',
  
  // アクセス制限があるURL
  // 'https://restricted-site.com/data',
  
  // 更新頻度が低いURL
  // 'https://low-update-site.com/old-info',
]

// =============================================================================
// URL生成ヘルパー関数
// =============================================================================

/**
 * がん種別の厚労省URLを生成
 */
export function generateMHLWUrls(cancerType: string): string[] {
  const cancerTypeKey = cancerType as keyof typeof MHLW_SCRAPING_URLS.cancerTypes
  const typePath = MHLW_SCRAPING_URLS.cancerTypes[cancerTypeKey]
  
  if (!typePath) {
    console.warn(`未対応のがん種別: ${cancerType}`)
    return [...MHLW_SCRAPING_URLS.common]
  }
  
  const baseUrl = MHLW_SCRAPING_URLS.base
  const patterns = MHLW_SCRAPING_URLS.patterns
  
  const urls = [
    // がん種別固有ページ（実際のサイト構造に基づく）
    `${baseUrl}${patterns.diagnosis.replace('{type}', typePath)}`,
    `${baseUrl}${patterns.prevention_screening.replace('{type}', typePath)}`,
    `${baseUrl}${patterns.index.replace('{type}', typePath)}`,
  ]
  
  // 肺がんの場合は特殊な治療ページを追加
  if (cancerType === 'lung_cancer') {
    urls.push(
      `${baseUrl}/cancer/lung/treatment_nsclc.html`, // 非小細胞肺がん
      `${baseUrl}/cancer/lung/treatment_sclc.html`   // 小細胞肺がん
    )
  } else {
    // その他のがん種別は通常の治療ページ
    urls.push(`${baseUrl}${patterns.treatment.replace('{type}', typePath)}`)
  }
  
  // 共通の診断・治療ページ
  urls.push(
    `${baseUrl}${patterns.dia_tre.diagnosis}`,
    `${baseUrl}${patterns.dia_tre.multidisciplinary_treatment}`,
    `${baseUrl}${patterns.dia_tre.operation}`,
    `${baseUrl}${patterns.dia_tre.drug_therapy}`,
    `${baseUrl}${patterns.dia_tre.radiotherapy}`,
    `${baseUrl}${patterns.dia_tre.endoscopy}`,
    `${baseUrl}${patterns.dia_tre.HSCT}`
  )
  
  // 検診関連ページ
  urls.push(
    `${baseUrl}${patterns.screening.about}`,
    `${baseUrl}${patterns.screening.stomach}`,
    `${baseUrl}${patterns.screening.cervix_uteri}`,
    `${baseUrl}${patterns.screening.lung}`,
    `${baseUrl}${patterns.screening.breast}`,
    `${baseUrl}${patterns.screening.colon}`
  )
  
  // 基本ページを追加
  urls.push(...MHLW_SCRAPING_URLS.common)
  
  return urls
}

/**
 * がん種別の医学会URLを取得
 */
export function getMedicalSocietyUrls(cancerType: string) {
  return MEDICAL_SOCIETY_URLS.filter(society => 
    society.cancerTypes.includes('all') || 
    society.cancerTypes.includes(cancerType)
  )
}

// =============================================================================
// 型定義
// =============================================================================

export type CancerType = keyof typeof MHLW_SCRAPING_URLS.cancerTypes
export type MedicalSociety = typeof MEDICAL_SOCIETY_URLS[number]
export type TestUrl = typeof TEST_SCRAPING_URLS[number] 