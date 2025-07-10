'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'

export default function PrivacyPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-soft-peach-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-soft-peach-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-medium text-deep-blue-500 hover:text-deep-blue-600 transition-colors">
            sottori
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className={`transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-8">そっとり プライバシーポリシー</h1>
          
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-600 mb-8">
                  最終更新日：2025-06-26
                </p>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">１．基本方針</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    当社は、ユーザーの個人情報および要配慮個人情報（医療関連情報）の保護を最優先事項とし、個人情報保護法および医療情報システム安全管理ガイドライン等に準拠した適切な管理を実施します。
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">２．取得情報</h2>
                  
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">区分</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">具体項目</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">取得方法</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">個人情報</td>
                          <td className="px-6 py-4 text-sm text-gray-700">メールアドレス（任意）、電話番号（任意）等</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">ユーザー入力</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">医療情報</td>
                          <td className="px-6 py-4 text-sm text-gray-700">がん種・病期、治療履歴、医療機関情報 等</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">ユーザー入力</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">技術情報</td>
                          <td className="px-6 py-4 text-sm text-gray-700">IP アドレス、ブラウザ情報、利用ログ 等</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">自動取得</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">３．利用目的</h2>
                  <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-4">
                    <li>本サービスの提供・運営</li>
                    <li>個人用ロードマップ生成および通知配信</li>
                    <li>サービス改善のための統計分析（匿名化後）</li>
                    <li>問い合わせ対応・重要通知</li>
                    <li>不正利用の防止・セキュリティ確保</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">４．安全管理措置</h2>
                  
                  <div className="bg-deep-blue-50 border border-deep-blue-200 p-6 mb-6 rounded-lg">
                    <ul className="list-disc pl-6 text-gray-700 leading-relaxed">
                      <li><strong>暗号化</strong>：保存時／転送時ともに AES-256・TLS1.3 以上</li>
                      <li><strong>アクセス制御</strong>：Row Level Security（RLS）</li>
                      <li><strong>多要素認証</strong>：管理者コンソール</li>
                      <li><strong>監査ログ</strong>：全アクセスを 365 日保管</li>
                      <li><strong>バックアップ</strong>：毎日差分、30 日保持</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">５．第三者提供・委託</h2>
                  <div className="bg-warm-coral-50 border-l-4 border-warm-coral-400 p-6 mb-4">
                    <p className="text-gray-900 font-medium mb-2">基本方針</p>
                    <p className="text-gray-700 leading-relaxed">
                      法令に基づく場合を除き、ユーザー同意なく第三者提供しません。
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      1. 法令に基づく場合を除き、ユーザー同意なく第三者提供しません。
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      2. クラウド事業者（Supabase Inc. 等）へ委託する際は機密保持契約を締結し監督します。
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      3. 製薬企業・CRO へは匿名統計情報のみ提供します。
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">６．保存期間</h2>
                  <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-4">
                    <li>アカウント削除後、個人情報は 30 日で自動消去</li>
                    <li>セキュリティ目的のログは 1 年保存後に削除</li>
                    <li>匿名化統計データは保存期間の制限なし</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">７．ユーザーの権利</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    開示・訂正・削除・利用停止等の請求はお問い合わせフォームより受付けます。本人確認の上、法定期間内に対応します。
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">８．国外移転</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    サーバ所在地が国外となる場合、十分な保護水準を満たす事業者を選定し、契約により保護措置を担保します（APPI 28 条）。
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">９．Cookie・解析ツール</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Cookie と Google Analytics（IP 匿名化設定）を使用します。ブラウザ設定で無効化可能ですが、一部機能が制限される場合があります。
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">10．ポリシー変更</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    法令改正・サービス変更等に伴い本ポリシーを改定する際は、ウェブサイト掲示またはメール通知により周知します。
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">11．お問い合わせ</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    個人情報に関するお問い合わせ：当社お問い合わせフォーム
                  </p>
                </section>

                <div className="bg-deep-blue-50 border border-deep-blue-200 p-6 rounded-lg">
                  <p className="text-gray-900 font-medium mb-2">認定・準拠状況</p>
                  <ul className="list-disc pl-6 text-gray-700 leading-relaxed">
                    <li>個人情報保護法準拠</li>
                    <li>医療情報システムの安全管理に関するガイドライン準拠</li>
                    <li>GDPR対応（EU居住者向け）</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/" className="inline-flex items-center text-deep-blue-500 hover:text-deep-blue-600 transition-colors">
              ← トップページに戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
} 