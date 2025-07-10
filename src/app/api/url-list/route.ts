import { NextRequest, NextResponse } from 'next/server'
import {
  TEST_SCRAPING_URLS,
  MHLW_SCRAPING_URLS,
  MANUAL_ADDITIONAL_URLS,
  generateMHLWUrls
} from '@/const/scraping_urls'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'all'
  const cancerType = searchParams.get('cancerType') || 'breast_cancer'
  const maxUrls = Number(searchParams.get('maxUrls')) || 50

  let urls: string[] = []

  if (mode === 'test') {
    urls = TEST_SCRAPING_URLS
  } else if (mode === 'mhlw') {
    urls = generateMHLWUrls(cancerType)
  } else if (mode === 'manual') {
    urls = MANUAL_ADDITIONAL_URLS
  } else {
    // all
    urls = [
      ...TEST_SCRAPING_URLS,
      ...generateMHLWUrls(cancerType),
      ...MANUAL_ADDITIONAL_URLS
    ]
  }

  // 件数制限
  urls = urls.slice(0, maxUrls)

  return NextResponse.json({
    success: true,
    mode,
    cancerType,
    count: urls.length,
    urls
  })
} 