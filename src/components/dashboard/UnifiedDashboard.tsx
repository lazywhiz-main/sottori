'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import WelcomeMessage from './WelcomeMessage'

export default function UnifiedDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true)

  // ボタンクリックハンドラー
  const handleStatusUpdate = () => {
    router.push('/status-update')
  }

  const handleRoadmapDetail = () => {
    router.push('/roadmap-detail')
  }

  const handleInfoUpdates = () => {
    router.push('/info-updates')
  }

  // ユーザー名の取得（フォールバック付き）
  const getUserName = () => {
    if (loading) return '読み込み中...'
    if (!user) return 'ゲスト'
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'ユーザー'
  }

  // アバター文字の取得
  const getAvatarText = () => {
    const name = getUserName()
    if (name === '読み込み中...' || name === 'ゲスト' || name === 'ユーザー') {
      return '?'
    }
    return name.charAt(0)
  }

  // 治療ステータスの取得（仮実装）
  const getTreatmentStatus = () => {
    if (loading) return '確認中...'
    if (!user) return '未設定'
    return '治療中' // 後でuser_treatment_phasesテーブルから取得
  }

  return (
    <div className="dashboard-container h-full">
      {/* Welcome Message */}
      {showWelcomeMessage && (
        <WelcomeMessage onDismiss={() => setShowWelcomeMessage(false)} />
      )}
      
      {/* Sidebar */}
      <aside className="sidebar h-full">
        {/* Profile Section */}
        <div className="profile-section">
          <div className="profile-header">
            <div className="profile-avatar">{getAvatarText()}</div>
            <div className="profile-info">
              <h1>{getUserName()}</h1>
              <p>{getTreatmentStatus()}</p>
            </div>
          </div>
        </div>

        {/* Status Check Section */}
        <div className="status-section">
          <div className="status-card">
            <div className="status-header">
              <div className="status-icon">👩‍⚕️</div>
              <div className="status-title">今日の調子</div>
            </div>
            <p className="status-message">前回の更新から3日経ちました。体調に変化はありませんか？</p>
            <button 
              className="status-button"
              onClick={handleStatusUpdate}
              disabled={loading}
            >
              {loading ? '読み込み中...' : '状況を更新'}
            </button>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="profile-summary">
          <h3 className="summary-title">プロフィール概要</h3>
          <div className="summary-item">
            <span className="summary-label">治療段階</span>
            <span className="summary-value">{getTreatmentStatus()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">最終更新</span>
            <span className="summary-value">3日前</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">ロードマップ</span>
            <span className="summary-value">作成済み</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">関連情報</span>
            <span className="summary-value">5件</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content h-full overflow-y-auto">
        {/* Content Header */}
        <div className="content-header">
          <h1 className="content-title">ダッシュボード</h1>
          <p className="content-subtitle">あなたの治療と情報を管理します</p>
        </div>

        {/* Main Grid */}
        <div className="main-grid">
          {/* Treatment Overview Card */}
          <div className="card treatment-card">
            <div className="card-header">
              <div className="card-icon">📋</div>
              <div>
                <h2 className="card-title">治療ロードマップ</h2>
                <p className="card-subtitle">あなた専用のガイド</p>
              </div>
            </div>
            
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-label">進捗</span>
                <span className="progress-percentage">65%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
            
            <div className="treatment-info">
              <div className="info-row">
                <div className="info-dot current"></div>
                <div className="info-content">
                  <div className="info-label">現在の段階</div>
                  <div className="info-value">治療中</div>
                </div>
              </div>
              <div className="info-row">
                <div className="info-dot next"></div>
                <div className="info-content">
                  <div className="info-label">次のマイルストーン</div>
                  <div className="info-value">次の診察</div>
                </div>
              </div>
            </div>
            
            <div className="card-actions">
              <p className="card-description">詳細な治療計画をご確認いただけます</p>
              <button 
                className="card-button"
                onClick={handleRoadmapDetail}
                disabled={loading}
              >
                {loading ? '読み込み中...' : '詳しく見る'}
              </button>
            </div>
          </div>

          {/* Personalized Info Card */}
          <div className="card info-card">
            <div className="card-header">
              <div className="card-icon">🔍</div>
              <div>
                <h2 className="card-title">関連情報</h2>
                <p className="card-subtitle">今のあなたに関係がありそうな情報</p>
              </div>
            </div>
            
            <div className="update-list">
              <div className="update-item urgent">
                <div className="update-header">
                  <span className="update-icon">⚠️</span>
                  <span className="update-title">治療中の副作用対策</span>
                  <span className="priority-badge high">重要</span>
                </div>
                <p className="update-summary">治療開始前に知っておくべき副作用とその対処法について詳しく解説します。</p>
              </div>
              
              <div className="update-item relevant">
                <div className="update-header">
                  <span className="update-icon">📚</span>
                  <span className="update-title">がん専門医の見つけ方</span>
                  <span className="priority-badge medium">中程度</span>
                </div>
                <p className="update-summary">お住まいの地域でがん専門医を見つける方法と、病院選びのポイントをご紹介します。</p>
              </div>
            </div>
            
            <div className="card-actions">
              <p className="card-description">お時間のある時にご確認ください</p>
              <button 
                className="card-button"
                onClick={handleInfoUpdates}
                disabled={loading}
              >
                {loading ? '読み込み中...' : 'すべて見る'}
              </button>
            </div>
          </div>

          {/* Next Actions Card */}
          <div className="card actions-card">
            <div className="card-header">
              <div className="card-icon">🎯</div>
              <div>
                <h2 className="card-title">次のアクション</h2>
                <p className="card-subtitle">おすすめの次のステップ</p>
              </div>
            </div>
            
            <div className="actions-list">
              <div className="action-item">
                <div className="action-header">
                  <div className="action-icon">🌸</div>
                  <span className="action-category">治療関連</span>
                </div>
                <p className="action-description">副作用の確認と対処について主治医と相談しましょう</p>
              </div>
              
              <div className="action-item">
                <div className="action-header">
                  <div className="action-icon">📚</div>
                  <span className="action-category">情報関連</span>
                </div>
                <p className="action-description">緊急情報の確認をお勧めします</p>
              </div>
            </div>
            
            <div className="status-indicator">
              <div className="indicator-dot"></div>
              <span className="indicator-text">サポート中</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 