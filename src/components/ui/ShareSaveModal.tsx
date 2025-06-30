'use client'

import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface ShareSaveModalProps {
  isOpen: boolean
  onClose: () => void
  roadmapData: {
    title: string
    content: string
    url: string
    userResponses: unknown
  }
}

export default function ShareSaveModal({ isOpen, onClose, roadmapData }: ShareSaveModalProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'save'>('share')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [showQR, setShowQR] = useState(false)

  if (!isOpen) return null

  const handleShareToTwitter = () => {
    const text = encodeURIComponent(`がん治療の情報を整理しました - ${roadmapData.title}`)
    const url = encodeURIComponent(roadmapData.url)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  const handleShareToLine = () => {
    const text = encodeURIComponent(`がん治療の情報を整理しました\n${roadmapData.title}`)
    const url = encodeURIComponent(roadmapData.url)
    window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, '_blank')
  }

  const handleShareToEmail = () => {
    const subject = encodeURIComponent(`${roadmapData.title} - Sottoriで作成`)
    const body = encodeURIComponent(`
がん治療の情報を整理しました。

${roadmapData.title}

内容を確認するには以下のリンクをクリックしてください：
${roadmapData.url}

※ この情報は参考用です。治療に関する判断は必ず主治医とご相談ください。

Sottori - 迷っても、頼ってもいい。次の一歩は、あなたのペースで。
    `)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roadmapData.url)
      alert('リンクをクリップボードにコピーしました')
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('コピーに失敗しました')
    }
  }

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      // PDF生成の実装（将来的にjsPDFやPuppeteerを使用）
      alert('PDF生成機能は開発中です。現在はブラウザの印刷機能をご利用ください。')
      window.print()
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('PDF生成に失敗しました')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleDownloadImage = async () => {
    try {
      // 画像形式での保存実装（将来的にhtml2canvasを使用）
      alert('画像保存機能は開発中です')
    } catch (error) {
      console.error('Image generation failed:', error)
      alert('画像生成に失敗しました')
    }
  }

  const handleSaveToBookmarks = () => {
    // ローカルストレージにブックマーク保存
    const bookmarks = JSON.parse(localStorage.getItem('sottori-bookmarks') || '[]')
    const newBookmark = {
      id: Date.now().toString(),
      title: roadmapData.title,
      url: roadmapData.url,
      createdAt: new Date().toISOString(),
      userResponses: roadmapData.userResponses
    }
    bookmarks.push(newBookmark)
    localStorage.setItem('sottori-bookmarks', JSON.stringify(bookmarks))
    alert('ブックマークに保存しました')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-medium text-deep-blue-700">共有・保存</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* タブ切り替え */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'share'
                ? 'text-deep-blue-600 border-b-2 border-deep-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📤 共有
          </button>
          <button
            onClick={() => setActiveTab('save')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'save'
                ? 'text-deep-blue-600 border-b-2 border-deep-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💾 保存
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {activeTab === 'share' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">家族や友人と共有</h3>
              
              {/* SNS共有 */}
              <div className="space-y-3">
                <button
                  onClick={handleShareToLine}
                  className="w-full flex items-center gap-3 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <span className="text-xl">💬</span>
                  <span>LINEで共有</span>
                </button>
                
                <button
                  onClick={handleShareToTwitter}
                  className="w-full flex items-center gap-3 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <span className="text-xl">🐦</span>
                  <span>Twitterで共有</span>
                </button>
                
                <button
                  onClick={handleShareToEmail}
                  className="w-full flex items-center gap-3 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <span className="text-xl">📧</span>
                  <span>メールで共有</span>
                </button>
              </div>

              {/* リンクコピー */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 p-3 bg-warm-coral-100 text-warm-coral-700 rounded-lg hover:bg-warm-coral-200 transition-colors"
                >
                  <span className="text-xl">🔗</span>
                  <span>リンクをコピー</span>
                </button>
              </div>

              {/* QRコード */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="w-full flex items-center justify-between p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📱</span>
                    <span>QRコードで共有</span>
                  </div>
                  <span className={`transform transition-transform ${showQR ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {showQR && (
                  <div className="mt-4 text-center">
                    <div className="bg-white p-4 rounded-lg border inline-block">
                      <QRCodeSVG value={roadmapData.url} size={128} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      スマートフォンのカメラでスキャンしてください
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'save' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">保存・ダウンロード</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="w-full flex items-center gap-3 p-3 bg-deep-blue-500 text-white rounded-lg hover:bg-deep-blue-600 transition-colors disabled:opacity-50"
                >
                  <span className="text-xl">📄</span>
                  <span>{isGeneratingPDF ? 'PDF作成中...' : 'PDFでダウンロード'}</span>
                </button>
                
                <button
                  onClick={handleDownloadImage}
                  className="w-full flex items-center gap-3 p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <span className="text-xl">🖼️</span>
                  <span>画像でダウンロード</span>
                </button>
                
                <button
                  onClick={handleSaveToBookmarks}
                  className="w-full flex items-center gap-3 p-3 bg-golden-yellow-500 text-white rounded-lg hover:bg-golden-yellow-600 transition-colors"
                >
                  <span className="text-xl">⭐</span>
                  <span>ブックマークに保存</span>
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="bg-soft-peach-50 border border-soft-peach-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-soft-peach-800 mb-2">💡 保存のヒント</h4>
                  <ul className="text-xs text-soft-peach-700 space-y-1">
                    <li>• PDFは印刷や長期保存に適しています</li>
                    <li>• 画像はSNSでの共有に便利です</li>
                    <li>• ブックマークは後で簡単にアクセスできます</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 