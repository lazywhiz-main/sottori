import { NextRequest, NextResponse } from 'next/server';

// GET: お薦めアクティビティを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stepId = searchParams.get('stepId');

    if (!stepId) {
      return NextResponse.json(
        { error: 'stepIdパラメータが必要です' },
        { status: 400 }
      );
    }

    // テスト用のダミーお薦めデータ
    const dummyRecommendations = [
      {
        template: {
          id: '1',
          name: '初回診察',
          type: '診察',
          content: '初回診察を受ける',
          description: 'がんの診断のための初回診察です',
          roadmap_step_id: 1,
          cancer_type: ['乳がん', '肺がん', '大腸がん'],
          stage: ['早期', '進行期'],
          age_group: [],
          family_situation: [],
          priority: 10,
          is_ai_recommended: true,
          conditions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        relevance_score: 85,
        reason: '重要度が高い、あなたのがん種に適している',
        is_already_added: false
      },
      {
        template: {
          id: '2',
          name: '血液検査',
          type: '検査',
          content: '血液検査を受ける',
          description: 'がんの進行度や全身状態を確認する検査です',
          roadmap_step_id: 1,
          cancer_type: ['乳がん', '肺がん', '大腸がん'],
          stage: ['早期', '進行期'],
          age_group: [],
          family_situation: [],
          priority: 9,
          is_ai_recommended: true,
          conditions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        relevance_score: 75,
        reason: '一般的におすすめ',
        is_already_added: false
      },
      {
        template: {
          id: '3',
          name: 'セカンドオピニオン',
          type: '診察',
          content: 'セカンドオピニオンを受ける',
          description: '別の医師から治療方針について意見を聞く',
          roadmap_step_id: 2,
          cancer_type: ['乳がん', '肺がん', '大腸がん'],
          stage: ['早期', '進行期'],
          age_group: [],
          family_situation: [],
          priority: 10,
          is_ai_recommended: true,
          conditions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        relevance_score: 90,
        reason: '治療方針決定に重要',
        is_already_added: false
      },
      {
        template: {
          id: '4',
          name: '家族との相談',
          type: '家族相談',
          content: '家族と治療方針について話し合う',
          description: '家族と治療の選択肢について相談する',
          roadmap_step_id: 2,
          cancer_type: ['乳がん', '肺がん', '大腸がん'],
          stage: ['早期', '進行期'],
          age_group: [],
          family_situation: [],
          priority: 8,
          is_ai_recommended: true,
          conditions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        relevance_score: 80,
        reason: '家族の理解とサポートが重要',
        is_already_added: false
      },
      {
        template: {
          id: '5',
          name: '手術の詳細確認',
          type: '診察',
          content: '手術の詳細について主治医に確認する',
          description: '手術の方法、リスク、術後のケアについて詳しく聞く',
          roadmap_step_id: 3,
          cancer_type: ['乳がん', '肺がん', '大腸がん'],
          stage: ['早期', '進行期'],
          age_group: [],
          family_situation: [],
          priority: 9,
          is_ai_recommended: true,
          conditions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        relevance_score: 85,
        reason: '手術前の準備として重要',
        is_already_added: false
      },
      {
        template: {
          id: '6',
          name: '術前検査',
          type: '検査',
          content: '術前検査（血液検査・心電図）を受ける',
          description: '手術に必要な全身状態の確認',
          roadmap_step_id: 3,
          cancer_type: ['乳がん', '肺がん', '大腸がん'],
          stage: ['早期', '進行期'],
          age_group: [],
          family_situation: [],
          priority: 8,
          is_ai_recommended: true,
          conditions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        relevance_score: 75,
        reason: '手術の安全性確認のため',
        is_already_added: false
      },
      {
        template: {
          id: '7',
          name: '術後ケアの確認',
          type: '診察',
          content: '術後のケアについて看護師に相談する',
          description: '術後の痛み管理や生活上の注意点を確認',
          roadmap_step_id: 4,
          cancer_type: ['乳がん', '肺がん', '大腸がん'],
          stage: ['早期', '進行期'],
          age_group: [],
          family_situation: [],
          priority: 8,
          is_ai_recommended: true,
          conditions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        relevance_score: 80,
        reason: '術後の回復を助ける',
        is_already_added: false
      },
      {
        template: {
          id: '8',
          name: '定期検査のスケジュール',
          type: '準備',
          content: '定期検査のスケジュールを確認する',
          description: '術後の定期検査の予定を確認',
          roadmap_step_id: 5,
          cancer_type: ['乳がん', '肺がん', '大腸がん'],
          stage: ['早期', '進行期'],
          age_group: [],
          family_situation: [],
          priority: 7,
          is_ai_recommended: true,
          conditions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        relevance_score: 70,
        reason: '再発予防のため重要',
        is_already_added: false
      }
    ];

    const recommendations = dummyRecommendations.filter(rec => rec.template.roadmap_step_id === parseInt(stepId));

    return NextResponse.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'お薦めアクティビティの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: テンプレートからアクティビティを追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, stepId } = body;

    if (!templateId || !stepId) {
      return NextResponse.json(
        { error: 'templateIdとstepIdが必要です' },
        { status: 400 }
      );
    }

    // テスト用のダミーアクティビティ
    const newActivity = {
      id: Date.now().toString(),
      user_id: 'test-user-id',
      roadmap_step_id: stepId,
      type: '診察',
      content: 'テンプレートから追加されたアクティビティ',
      description: 'テンプレートから追加された説明',
      scheduled_date: null,
      completed_date: null,
      status: 'planned',
      priority: 'normal',
      is_ai_recommended: true,
      source: 'template',
      tags: [`template:${templateId}`],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: newActivity });
  } catch (error) {
    console.error('Error adding from template:', error);
    return NextResponse.json(
      { error: 'テンプレートからの追加に失敗しました' },
      { status: 500 }
    );
  }
} 