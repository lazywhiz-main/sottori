'use client'

import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    // スクロールアニメーション
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
    
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0')
          entry.target.classList.remove('opacity-0', 'translate-y-8')
        }
      })
    }, observerOptions)
    
    // アニメーション対象要素を監視
    document.querySelectorAll('.scroll-reveal').forEach(el => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-soft-peach-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* ロゴ */}
            <div className="text-2xl font-medium text-deep-blue-500">sottori</div>
            
            {/* デスクトップナビゲーション */}
            <div className="hidden md:flex items-center space-x-6">
              {/* メインナビ */}
              <nav className="flex space-x-6">
                <a href="#about" className="text-gray-600 hover:text-deep-blue-500 transition-colors">運営者について</a>
                <a href="#faq" className="text-gray-600 hover:text-deep-blue-500 transition-colors">よくある質問</a>
                <a href="#contact" className="text-gray-600 hover:text-deep-blue-500 transition-colors">お問い合わせ</a>
              </nav>
              
              {/* 認証ボタン */}
              <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-gray-200">
                <Link href="/auth">
                  <button className="text-gray-600 hover:text-deep-blue-500 transition-colors font-medium">
                    ログイン
                  </button>
                </Link>
                <Link href="/auth">
                  <Button variant="primary" size="sm" className="px-4 py-2">
                    はじめる
                  </Button>
                </Link>
              </div>
            </div>

            {/* モバイルメニューボタン */}
            <button className="md:hidden text-gray-600 hover:text-deep-blue-500 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="pt-24 pb-20 relative overflow-hidden bg-soft-peach-50">
        {/* SVG背景 */}
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="/hero-visual.svg" 
            alt=""
            className="w-full h-full object-cover object-center opacity-60"
            style={{ minHeight: '100%', minWidth: '100%' }}
          />
        </div>
        
        {/* コンテンツエリア */}
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="min-h-[600px] flex items-center">
            <div className="max-w-2xl">
              <p className={`text-gray-700 mb-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                がん治療の情報整理サービス
              </p>
              <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-semibold text-gray-900 mb-8 leading-tight transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <span className="whitespace-nowrap text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm">迷っても、<span className="text-deep-blue-500 font-bold">頼ってもいい。</span></span><br />
                <span className="whitespace-nowrap text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm mt-2 inline-block">次の一歩は、あなたのペースで。</span>
              </h1>
              <p className={`text-lg md:text-xl text-gray-700 font-medium mb-12 leading-relaxed transition-all duration-1000 delay-400 bg-white/85 backdrop-blur-sm px-4 py-3 rounded-lg shadow-sm ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                がんの情報、一緒に整理してみませんか？<br />
                完璧な答えは求めません。<br />
                わからないことは、わからないままで大丈夫です。
              </p>
              <div className={`transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <Link href="/yukkuri-check">
                  <Button variant="primary" size="lg" className="mb-6 px-10 py-4 text-lg">
                    🌸 情報を整理してみる
                  </Button>
                </Link>
                <p className="text-sm text-gray-500">無料 • 匿名OK • いつでも中断できます</p>
              </div>
            </div>
          </div>
        </div>

        {/* 微細なオーバーレイ効果 */}
        <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
      </section>

      {/* 安心感セクション */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light text-center text-gray-900 mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-800">
            あなたらしいペースで、大丈夫
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card variant="elevated" className="scroll-reveal opacity-0 translate-y-8 transition-all duration-800 delay-100 gentle-hover">
              <CardContent className="text-center p-6">
                <div className="w-20 h-20 bg-deep-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl text-white">
                  🤲
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-4">「わからない」も立派な回答</h3>
                <p className="text-gray-600 leading-relaxed">
                  医療用語が難しい、検査結果がまだ出ていない。
                  そんな状況でも、一緒に整理していきましょう。
                </p>
              </CardContent>
            </Card>
            
            <Card variant="elevated" className="scroll-reveal opacity-0 translate-y-8 transition-all duration-800 delay-200 gentle-hover">
              <CardContent className="text-center p-6">
                <div className="w-20 h-20 bg-warm-coral-400 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl text-white">
                  💾
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-4">途中で保存、後日続きから</h3>
                <p className="text-gray-600 leading-relaxed">
                  疲れたら休憩してください。
                  あなたの回答は保存され、いつでも続きから始められます。
                </p>
              </CardContent>
            </Card>
            
            <Card variant="elevated" className="scroll-reveal opacity-0 translate-y-8 transition-all duration-800 delay-300 gentle-hover">
              <CardContent className="text-center p-6">
                <div className="w-20 h-20 bg-golden-yellow-400 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl text-white">
                  🕰️
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-4">今日決めなくても大丈夫</h3>
                <p className="text-gray-600 leading-relaxed">
                  情報は相談材料として。
                  家族や主治医と話し合ってから、また来てください。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ステップセクション */}
      <section className="py-20 bg-soft-peach-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light text-center text-gray-900 mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-800">
            3つのステップで、ゆっくりと
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card variant="default" className="scroll-reveal opacity-0 translate-y-8 transition-all duration-800 delay-100 relative gentle-hover">
              <div className="absolute -top-6 left-8 w-12 h-12 bg-deep-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                1
              </div>
              <CardContent className="pt-12 p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-4">眺める</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  どんな情報があるか、まず見てみましょう。
                  いくつかの質問にお答えいただくだけです。
                </p>
                <div className="bg-soft-peach-100 border-l-4 border-deep-blue-400 p-4 rounded-r-lg">
                  <p className="text-sm text-gray-600">
                    💡 わからない項目は「わからない」を選択できます
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card variant="default" className="scroll-reveal opacity-0 translate-y-8 transition-all duration-800 delay-200 relative gentle-hover">
              <div className="absolute -top-6 left-8 w-12 h-12 bg-warm-coral-400 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                2
              </div>
              <CardContent className="pt-12 p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-4">整理する</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  あなたの状況に合わせて、治療選択肢やお金の話など、
                  必要な情報を整理してお見せします。
                </p>
                <div className="bg-soft-peach-100 border-l-4 border-warm-coral-400 p-4 rounded-r-lg">
                  <p className="text-sm text-gray-600">
                    💡 すべて参考情報です。治療判断は主治医と相談してください
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card variant="default" className="scroll-reveal opacity-0 translate-y-8 transition-all duration-800 delay-300 relative gentle-hover">
              <div className="absolute -top-6 left-8 w-12 h-12 bg-golden-yellow-500 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                3
              </div>
              <CardContent className="pt-12 p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-4">相談する</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  家族や主治医との相談材料として活用してください。
                  簡単に共有できる機能もあります。
                </p>
                <div className="bg-soft-peach-100 border-l-4 border-golden-yellow-400 p-4 rounded-r-lg">
                  <p className="text-sm text-gray-600">
                    💡 やさしい日本語版で、ご家族にも分かりやすく
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 運営者セクション */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light text-center text-gray-900 mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-800">
            運営者について
          </h2>
          
          <div className="grid md:grid-cols-5 gap-12 items-center scroll-reveal opacity-0 translate-y-8 transition-all duration-800">
            <div className="md:col-span-2 text-center">
                              <div className="w-48 h-48 bg-deep-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center text-6xl shadow-xl text-white">
                👨‍💻
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">そな</h3>
              <p className="text-gray-600">医療×デジタル事業開発 / がんサバイバー</p>
            </div>
            
            <div className="md:col-span-3">
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                運営者自身も10年前にがんの告知を受け、その時に「次に何をすればいいのか」で途方に暮れた経験があります。
                医療業界でのデジタル事業開発経験を活かし、同じ想いをする方の力になりたいと思い、
                一人でこのサービスを運営しています。
              </p>
              
              <Card variant="outlined" className="border-l-4 border-l-deep-blue-500">
                <CardContent className="p-6">
                  <h4 className="font-medium text-deep-blue-500 mb-3 flex items-center">
                    🛡️ 信頼性について
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    著名医学雑誌の文献とガイドラインを中心にAI技術で収集・整理していますが、
                    <strong className="text-gray-900">医療行為ではありません</strong>。あくまで参考情報として活用いただき、
                    治療に関する重要な判断は必ず主治医の先生と相談してください。
                    一人運営のため至らない点もありますが、可能な限り正確で有用な情報提供に努めています。
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ セクション */}
      <section id="faq" className="py-20 bg-soft-peach-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light text-center text-gray-900 mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-800">
            よくある不安にお答えします
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card variant="default" className="scroll-reveal opacity-0 translate-y-8 transition-all duration-800 delay-100 border-l-4 border-l-deep-blue-400 gentle-hover">
              <CardContent className="p-5">
                <h3 className="font-medium text-gray-900 mb-3">🔒 個人情報は大丈夫？</h3>
                <p className="text-gray-600 leading-relaxed">
                  匿名での利用が可能です。名前やメールアドレスの入力は任意で、
                  入力いただいた情報は暗号化して安全に管理します。
                </p>
              </CardContent>
            </Card>
            
            <Card variant="default" className="scroll-reveal opacity-0 translate-y-8 transition-all duration-800 delay-200 border-l-4 border-l-warm-coral-400 gentle-hover">
              <CardContent className="p-5">
                <h3 className="font-medium text-gray-900 mb-3">💰 お金はかかりますか？</h3>
                <p className="text-gray-600 leading-relaxed">
                  完全無料でご利用いただけます。
                  将来的にも基本機能は無料で提供し続けますが、一部機能は有料会員限定となる予定です。
                </p>
              </CardContent>
            </Card>
            
            <Card variant="default" className="scroll-reveal opacity-0 translate-y-8 transition-all duration-800 delay-300 border-l-4 border-l-golden-yellow-400 gentle-hover">
              <CardContent className="p-5">
                <h3 className="font-medium text-gray-900 mb-3">📚 情報は信頼できる？</h3>
                <p className="text-gray-600 leading-relaxed">
                  NEJM、Lancet等の著名医学雑誌とガイドラインが出典です。
                  ただし、治療判断は必ず主治医と相談してください。
                </p>
              </CardContent>
            </Card>
            
            <Card variant="default" className="scroll-reveal opacity-0 translate-y-8 transition-all duration-800 delay-400 border-l-4 border-l-soft-peach-400 gentle-hover">
              <CardContent className="p-5">
                <h3 className="font-medium text-gray-900 mb-3">⏸️ 途中でやめても大丈夫？</h3>
                <p className="text-gray-600 leading-relaxed">
                  いつでも中断・再開できます。
                  回答は自動保存され、お時間のある時に続きから始められます。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 最終CTA */}
      <section className="py-20 bg-deep-blue-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 floating-gentle">
          <div className="w-full h-full bg-white/5"></div>
        </div>
        
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-light mb-6 scroll-reveal opacity-0 translate-y-8 transition-all duration-800">
            一人で抱え込まず、<br className="sm:hidden" />一緒に整理してみませんか？
          </h2>
          <p className="text-xl mb-10 opacity-90 scroll-reveal opacity-0 translate-y-8 transition-all duration-800 delay-200">
            あなたのペースで、大丈夫です。
          </p>
          <div className="scroll-reveal opacity-0 translate-y-8 transition-all duration-800 delay-400">
            <Link href="/yukkuri-check">
              <Button variant="secondary" size="lg" className="bg-white text-deep-blue-500 hover:bg-gray-50 px-10 py-4 text-lg">
                🌸 情報を整理してみる
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">利用規約</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">プライバシーポリシー</Link>
            <a href="#contact" className="text-gray-400 hover:text-white transition-colors">お問い合わせ</a>
            <a href="#about" className="text-gray-400 hover:text-white transition-colors">運営者について</a>
          </div>
          <p className="text-sm text-gray-500">
            ※ このサービスは医療行為ではありません。治療に関する判断は必ず医療従事者にご相談ください。
          </p>
        </div>
      </footer>
    </div>
  )
}
