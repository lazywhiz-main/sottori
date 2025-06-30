import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue-50 via-white to-soft-peach-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-4">
            迷っても、<span className="font-normal text-deep-blue-500">頼ってもいい。</span>
          </h1>
          <p className="text-xl text-gray-600 font-light">
            次の一歩は、あなたのペースで。
          </p>
        </header>

        {/* カラーパレットテスト */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Sottori カラーパレット
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {/* Deep Blue */}
            <div className="text-center">
              <div className="w-20 h-20 bg-deep-blue-500 rounded-2xl mx-auto mb-3 shadow-lg"></div>
              <p className="font-medium text-gray-900">#556AAB</p>
              <p className="text-sm text-gray-600">Deep Blue</p>
            </div>
            
            {/* Warm Coral */}
            <div className="text-center">
              <div className="w-20 h-20 bg-warm-coral-400 rounded-2xl mx-auto mb-3 shadow-lg"></div>
              <p className="font-medium text-gray-900">#E69974</p>
              <p className="text-sm text-gray-600">Warm Coral</p>
            </div>
            
            {/* Soft Peach */}
            <div className="text-center">
              <div className="w-20 h-20 bg-soft-peach-400 rounded-2xl mx-auto mb-3 shadow-lg"></div>
              <p className="font-medium text-gray-900">#FAD8C5</p>
              <p className="text-sm text-gray-600">Soft Peach</p>
            </div>
            
            {/* Golden Yellow */}
            <div className="text-center">
              <div className="w-20 h-20 bg-golden-yellow-400 rounded-2xl mx-auto mb-3 shadow-lg"></div>
              <p className="font-medium text-gray-900">#F4CB88</p>
              <p className="text-sm text-gray-600">Golden Yellow</p>
            </div>
          </div>
        </section>

        {/* ボタンテスト */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            ボタンコンポーネント
          </h2>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/auth">
              <Button variant="primary" size="lg">
                無料で始める
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                ダッシュボード
              </Button>
            </Link>
            <Button variant="outline" size="md">
              資料ダウンロード
            </Button>
            <Button variant="ghost" size="sm">
              お問い合わせ
            </Button>
          </div>
        </section>

        {/* カードテスト */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            カードコンポーネント
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle>情報を整理</CardTitle>
              </CardHeader>
              <CardContent>
                診断内容、治療選択肢、医療機関情報など、散らばりがちな情報を一箇所にまとめて管理。
              </CardContent>
            </Card>
            
            <Card variant="outlined">
              <CardHeader>
                <CardTitle>専門家とつながる</CardTitle>
              </CardHeader>
              <CardContent>
                医師、看護師、相談員など、信頼できる専門家とのつながりをサポート。
              </CardContent>
            </Card>
            
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>あなたのペースで</CardTitle>
              </CardHeader>
              <CardContent>
                急かされることなく、あなたのペースで情報収集や意思決定ができる環境を提供。
              </CardContent>
            </Card>
            
            <Card variant="elevated" className="md:col-span-3">
              <CardHeader>
                <CardTitle className="text-warm-coral-400">🤝 かんたん共有・保存</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  作成したあなた専用ガイドを家族や友人と簡単に共有できます。
                </p>
                <ul className="text-sm text-gray-600 space-y-2 mb-4">
                  <li>📱 <strong>LINE・Twitter・メール</strong>で瞬時に共有</li>
                  <li>📱 <strong>QRコード</strong>でスマホから簡単アクセス</li>
                  <li>📄 <strong>PDF</strong>で印刷・長期保存</li>
                  <li>🖼️ <strong>画像</strong>でSNS投稿用に保存</li>
                  <li>⭐ <strong>ブックマーク</strong>でいつでも見返し</li>
                </ul>
                <div className="text-center">
                  <Link href="/auth">
                    <Button variant="secondary" size="md">
                      📤 共有・保存機能を試す
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* フローティングアニメーションテスト */}
        <section className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">
            アニメーションテスト
          </h2>
          
          <div className="relative">
            <div className="w-16 h-16 bg-deep-blue-500 rounded-full mx-auto floating-gentle opacity-80"></div>
            <div className="w-12 h-12 bg-warm-coral-400 rounded-full mx-auto mt-4 floating-gentle opacity-70" style={{animationDelay: '-2s'}}></div>
            <div className="w-8 h-8 bg-golden-yellow-400 rounded-full mx-auto mt-4 floating-gentle opacity-60" style={{animationDelay: '-4s'}}></div>
          </div>
        </section>
      </div>
    </div>
  )
}
