import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: 'ジョブIDが必要です' },
      { status: 400 }
    )
  }

  try {
    // メモリキャッシュから結果を取得
    const globalCache = global as any
    const cachedResult = globalCache.roadmapJobCache?.get(jobId)

    if (cachedResult) {
      return NextResponse.json({
        success: true,
        status: 'completed',
        result: cachedResult
      })
    }

    // Supabaseから結果を取得を試行
    try {
      if (typeof window === 'undefined') {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        const { data, error } = await supabase
          .from('roadmap_jobs')
          .select('*')
          .eq('job_id', jobId)
          .single()

        if (!error && data) {
          return NextResponse.json({
            success: true,
            status: 'completed',
            result: data.result
          })
        }
      }
    } catch (supabaseError) {
      console.error('Supabase fetch error:', supabaseError)
    }

    // ジョブが見つからない場合
    return NextResponse.json({
      success: true,
      status: 'processing',
      message: '処理中です...'
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { success: false, error: 'ステータス確認に失敗しました' },
      { status: 500 }
    )
  }
} 