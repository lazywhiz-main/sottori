// がん種の日本語ラベル
export const CANCER_TYPE_LABELS: Record<string, string> = {
  'breast_cancer': '乳がん',
  'lung_cancer': '肺がん',
  'stomach_cancer': '胃がん',
  'colorectal_cancer': '大腸がん',
  'prostate_cancer': '前立腺がん',
  'liver_cancer': '肝臓がん',
  'pancreatic_cancer': '膵臓がん',
  'esophageal_cancer': '食道がん',
  'all': 'すべてのがん種'
}

// ステージの日本語ラベル
export const STAGE_LABELS: Record<string, string> = {
  'stage_1': 'ステージ1',
  'stage_2': 'ステージ2',
  'stage_3': 'ステージ3',
  'stage_4': 'ステージ4',
  'all': 'すべてのステージ'
}

// 年齢層の日本語ラベル
export const AGE_GROUP_LABELS: Record<string, string> = {
  '20s': '20代',
  '30s': '30代',
  '40s': '40代',
  '50s': '50代',
  '60s': '60代',
  '70s': '70代',
  'all': 'すべての年齢層'
}

// 地域の日本語ラベル
export const REGION_LABELS: Record<string, string> = {
  'tokyo': '東京',
  'osaka': '大阪',
  'kanto': '関東',
  'kansai': '関西',
  'all': '全国'
}

// カテゴリの日本語ラベル
export const CATEGORY_LABELS: Record<string, string> = {
  'treatment_options': '治療法',
  'diagnosis': '診断',
  'support_resources': 'サポート情報',
  'lifestyle': '生活',
  'research_news': '研究ニュース'
}

// エビデンスレベルの日本語ラベル
export const EVIDENCE_LEVEL_LABELS: Record<string, string> = {
  'A': 'レベルA - 最も信頼性の高い研究結果',
  'B': 'レベルB - 信頼性の高い研究結果',
  'C': 'レベルC - 限定的な研究結果',
  'D': 'レベルD - 専門家の意見・経験',
  'unknown': '不明'
} 