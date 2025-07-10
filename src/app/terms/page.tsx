'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'

export default function TermsPage() {
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
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-8">そっとり 利用規約</h1>
          
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-600 mb-8">
                  最終更新日：2025-06-26
                </p>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">第１条（総則）</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    本利用規約（以下「本規約」）は、がん治療情報ガイド「そっとり」（以下「本サービス」）の利用条件を定めるものです。利用者（以下「ユーザー」）は、本サービスの利用をもって本規約に同意したものとみなします。
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">第２条（サービス概要）</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    1. 本サービスは、がん治療に関する<strong>情報整理・管理支援</strong>を目的としたオンラインサービスであり、医療行為ではありません。
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-2">2. 主な機能</p>
                  <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-4">
                    <li>30 秒セルフチェック</li>
                    <li>3 分ロードマップ（治験・標準治療・専門医・補助金リスト）</li>
                    <li>治療情報の記録・整理</li>
                    <li>LINE／メールでの自動アップデート通知</li>
                    <li>その他、当社が追加開発する関連機能</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">第３条（医療行為に該当しない旨）</h2>
                  <div className="bg-warm-coral-50 border-l-4 border-warm-coral-400 p-6 mb-4">
                    <p className="text-gray-900 font-medium mb-2">重要事項</p>
                    <p className="text-gray-700 leading-relaxed">
                      本サービスは診断・治療・予防などの医療行為を行うものではありません。治療に関する最終判断は必ず医師等の医療従事者と相談してください。
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">第４条（ユーザーの義務）</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">ユーザーは次の事項を遵守するものとします。</p>
                  <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-4">
                    <li>正確かつ最新の情報を入力・更新すること</li>
                    <li>アカウント情報を適切に管理し、第三者に使用させないこと</li>
                    <li>本サービスの情報を<strong>参考情報</strong>として扱い、医療判断は医療従事者と行うこと</li>
                    <li>他のユーザー・第三者の権利を侵害しないこと</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">第５条（禁止事項）</h2>
                  <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-4">
                    <li>虚偽情報の入力・投稿</li>
                    <li>他人の個人情報の不正取得・不正利用</li>
                    <li>本サービスを医療行為として誤認させる使用</li>
                    <li>システムの不正アクセス・妨害行為</li>
                    <li>知的財産権侵害、公序良俗に反する行為</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">第６条（個人情報の取扱い）</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    個人情報の取扱いは別途定める
                    <Link href="/privacy" className="text-deep-blue-500 hover:text-deep-blue-600 underline font-medium">
                      プライバシーポリシー
                    </Link>
                    によります。
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">第７条（免責）</h2>
                  <div className="bg-gray-50 border border-gray-200 p-6 mb-4">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      <strong>1. 医療責任の免責</strong><br />
                      当社は、本サービス利用により生じた健康被害・診療遅延その他損害について責任を負いません。
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      <strong>2. 情報の正確性</strong><br />
                      情報の正確性・完全性・有用性について保証いたしません。
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      <strong>3. システム障害</strong><br />
                      システム障害・データ消失等による損害について責任を負いません。
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>4. 損害賠償の上限</strong><br />
                      当社の責任は、当社に故意または重過失がある場合を除き、直近１年間にユーザーが支払った利用料金を上限とします。
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">第８条（知的財産権）</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    本サービスに係る著作権その他一切の知的財産権は当社又は正当な権利者に帰属します。
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">第９条（サービスの変更・停止）</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    当社は、事前通知の上で本サービスの内容を変更・一時停止・終了できます。これにより生じた損害について責任を負いません。
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">第10条（規約の変更）</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    当社は、本規約を変更する場合、ウェブサイトへの掲示その他当社所定の方法で周知します。変更後にユーザーが本サービスを利用した場合、変更に同意したものとみなします。
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">第11条（準拠法・裁判管轄）</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    本規約は日本法に準拠し、本サービスに関する紛争は<strong>東京地方裁判所</strong>を第一審の専属的合意管轄裁判所とします。
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">第12条（お問い合わせ）</h2>
                  <p className="text-gray-700 leading-relaxed">
                    規約に関するお問い合わせは、当社お問い合わせフォームよりご連絡ください。
                  </p>
                </section>
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