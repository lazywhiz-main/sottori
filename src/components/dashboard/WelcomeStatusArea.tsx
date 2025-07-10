import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface DailyStatus {
  date: string
  mood_score?: number
  energy_level?: number
  notes?: string
}

export default function WelcomeStatusArea() {
  const [todaysStatus, setTodaysStatus] = useState<DailyStatus | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [moodScore, setMoodScore] = useState<number>(3)
  const [energyLevel, setEnergyLevel] = useState<number>(3)
  const [lastCheckDays, setLastCheckDays] = useState<number | null>(null)

  useEffect(() => {
    loadTodaysStatus()
    calculateLastCheckDays()
  }, [])

  const loadTodaysStatus = async () => {
    // TODO: SupabaseからLOAD
    // 仮のデータ
    const today = new Date().toISOString().split('T')[0]
    setTodaysStatus({
      date: today,
      mood_score: undefined,
      energy_level: undefined
    })
  }

  const calculateLastCheckDays = () => {
    // TODO: 最後のゆっくりチェックからの日数を計算
    // 仮のデータ
    setLastCheckDays(3)
  }

  const handleQuickStatusRecord = async () => {
    setIsRecording(true)
    
    try {
      // TODO: Supabaseに保存
      const newStatus: DailyStatus = {
        date: new Date().toISOString().split('T')[0],
        mood_score: moodScore,
        energy_level: energyLevel
      }
      
      setTodaysStatus(newStatus)
      console.log('Status recorded:', newStatus)
      
      // 保存完了後にUIをリセット
      setTimeout(() => {
        setIsRecording(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to record status:', error)
      setIsRecording(false)
    }
  }

  const getMoodEmoji = (score: number) => {
    const emojis = ['😔', '😟', '😐', '🙂', '😊']
    return emojis[score - 1] || '😐'
  }

  const getEnergyEmoji = (level: number) => {
    const emojis = ['🔋⚪⚪⚪⚪', '🔋🟢⚪⚪⚪', '🔋🟢🟢⚪⚪', '🔋🟢🟢🟢⚪', '🔋🟢🟢🟢🟢']
    return emojis[level - 1] || '🔋🟢🟢⚪⚪'
  }

  const getCurrentGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'おはようございます'
    if (hour < 17) return 'こんにちは'
    return 'お疲れさまです'
  }

  return (
    <Card variant="elevated" className="h-full">
      <CardHeader>
        <CardTitle className="text-deep-blue-500 flex items-center">
          <span className="mr-2">🌅</span>
          今日の確認
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 挨拶メッセージ */}
        <div className="text-lg text-gray-700">
          {getCurrentGreeting()}！
        </div>

        {/* 今日の状態記録 */}
        {todaysStatus?.mood_score ? (
          <div className="bg-soft-peach-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">今日の調子</div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl mb-1">{getMoodEmoji(todaysStatus.mood_score)}</div>
                <div className="text-xs text-gray-500">気分</div>
              </div>
              <div className="text-center">
                <div className="text-lg mb-1">{getEnergyEmoji(todaysStatus.energy_level || 3)}</div>
                <div className="text-xs text-gray-500">エネルギー</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">今日の調子はいかがですか？</div>
            
            {!isRecording ? (
              <div className="space-y-3">
                {/* 気分スコア */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">気分</label>
                  <div className="flex justify-between items-center">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setMoodScore(score)}
                        className={`text-2xl transition-all ${
                          moodScore === score ? 'scale-125' : 'opacity-50 hover:opacity-75'
                        }`}
                      >
                        {getMoodEmoji(score)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* エネルギーレベル */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">エネルギー</label>
                  <div className="flex justify-between items-center">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => setEnergyLevel(level)}
                        className={`text-lg transition-all ${
                          energyLevel === level ? 'scale-110' : 'opacity-50 hover:opacity-75'
                        }`}
                      >
                        {getEnergyEmoji(level)}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleQuickStatusRecord}
                  className="w-full"
                >
                  記録する
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-deep-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <div className="text-sm text-gray-600">記録中...</div>
              </div>
            )}
          </div>
        )}

        {/* 前回のチェックからの経過 */}
        {lastCheckDays !== null && (
          <div className="border-t pt-4">
            <div className="text-sm text-gray-600">
              前回のゆっくりチェックから
              <span className="font-medium text-warm-coral-500 mx-1">
                {lastCheckDays}日
              </span>
              経過しています
            </div>
            {lastCheckDays > 7 && (
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/yukkuri-check'}
                >
                  新しいチェックを行う
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 