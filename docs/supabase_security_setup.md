# Supabase セキュリティ設定ガイド

医療情報を扱うSottoriサービスでのSupabaseセキュリティ実装ガイド

## 🔒 1. Row Level Security (RLS) の実装

### 基本方針
すべてのテーブルでRLSを有効化し、ユーザーは自分のデータのみアクセス可能とする。

### 実装例

```sql
-- ユーザープロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  date_of_birth DATE,
  phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ポリシー作成
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 医療記録テーブル
CREATE TABLE medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  record_type TEXT NOT NULL,
  date DATE NOT NULL,
  hospital_name TEXT,
  doctor_name TEXT,
  treatment_details TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own medical records" ON medical_records
  FOR ALL USING (auth.uid() = user_id);
```

## 🛡️ 2. 暗号化とデータ保護

### データベース暗号化
- Supabaseは保存時・転送時ともに自動暗号化
- 機密性の高いデータは追加暗号化を検討

### 実装例

```typescript
// 機密データの暗号化（クライアント側）
import CryptoJS from 'crypto-js'

const encryptSensitiveData = (data: string, userKey: string): string => {
  return CryptoJS.AES.encrypt(data, userKey).toString()
}

const decryptSensitiveData = (encryptedData: string, userKey: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, userKey)
  return bytes.toString(CryptoJS.enc.Utf8)
}
```

## 🔐 3. 認証とアクセス制御

### 多要素認証の実装

```typescript
// MFA有効化
const enableMFA = async () => {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Sottori MFA'
  })
  return { data, error }
}

// MFA確認
const verifyMFA = async (code: string, factorId: string) => {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: 'challenge_id',
    code
  })
  return { data, error }
}
```

### セッション管理

```typescript
// セッション設定
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// セッション監視
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || !session) {
    // セッション終了時のクリーンアップ
    localStorage.clear()
    sessionStorage.clear()
  }
})
```

## 📊 4. ログ監視とアクセス記録

### アクセスログテーブル

```sql
CREATE TABLE access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみアクセス可能
CREATE POLICY "Admin only access logs" ON access_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

### ログ記録関数

```typescript
const logAccess = async (action: string, resource: string) => {
  const { data: session } = await supabase.auth.getSession()
  
  if (session?.session?.user) {
    await supabase.from('access_logs').insert({
      user_id: session.session.user.id,
      action,
      resource,
      ip_address: await getClientIP(),
      user_agent: navigator.userAgent
    })
  }
}
```

## 🔒 5. データバックアップと復旧

### 定期バックアップ設定

```sql
-- バックアップ用関数（管理者用）
CREATE OR REPLACE FUNCTION backup_user_data(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'profile', (SELECT row_to_json(profiles.*) FROM profiles WHERE id = target_user_id),
    'medical_records', (SELECT json_agg(row_to_json(medical_records.*)) FROM medical_records WHERE user_id = target_user_id),
    'backup_date', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🚨 6. インシデント対応

### データ侵害対応手順

1. **即座の対応**
   - 影響範囲の特定
   - アクセスの停止
   - ログの保全

2. **通知**
   - 関係当局への報告（72時間以内）
   - 利用者への通知（必要に応じて）

3. **復旧**
   - セキュリティ脆弱性の修正
   - システムの復旧
   - 再発防止策の実装

### 実装例

```typescript
// 緊急時のデータアクセス停止
const emergencyLockdown = async () => {
  // 一時的にすべてのRLSポリシーを制限
  await supabase.rpc('emergency_lockdown')
  
  // 管理者への通知
  await notifyAdministrators('Emergency lockdown activated')
}
```

## 📋 7. コンプライアンス対応

### 個人情報保護法対応

```typescript
// データ削除（忘れられる権利）
const deleteUserData = async (userId: string) => {
  // 関連データの論理削除
  await supabase.from('profiles').update({ 
    deleted_at: new Date().toISOString(),
    full_name: null,
    phone: null 
  }).eq('id', userId)
  
  await supabase.from('medical_records').update({ 
    deleted_at: new Date().toISOString() 
  }).eq('user_id', userId)
  
  // 30日後に物理削除（スケジューラーで実行）
}

// データエクスポート（開示請求対応）
const exportUserData = async (userId: string) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
    
  const { data: records } = await supabase
    .from('medical_records')
    .select('*')
    .eq('user_id', userId)
    
  return {
    profile,
    medical_records: records,
    export_date: new Date().toISOString()
  }
}
```

## 🔧 8. 開発・運用での注意点

### 環境変数の管理

```env
# 本番環境
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # サーバーサイドのみ

# 暗号化キー
ENCRYPTION_KEY=your-encryption-key # 32文字以上の強固なキー
```

### コード審査チェックリスト

- [ ] すべてのテーブルでRLS有効化
- [ ] 適切なポリシー設定
- [ ] 機密データの暗号化
- [ ] アクセスログの記録
- [ ] エラーハンドリング
- [ ] SQL injection対策
- [ ] 権限の最小化原則

### 定期監査項目

- [ ] アクセス権限の見直し
- [ ] 使用されていないデータの削除
- [ ] セキュリティパッチの適用
- [ ] バックアップの検証
- [ ] ログの分析
- [ ] 脆弱性スキャン

## 📞 9. 緊急連絡先

```typescript
// 緊急時連絡先設定
const EMERGENCY_CONTACTS = {
  technical: 'tech-emergency@sottori.example',
  legal: 'legal@sottori.example',
  privacy_officer: 'privacy@sottori.example'
}

const notifyEmergency = async (incident: string, details: any) => {
  // 緊急時通知システム
  await sendAlert({
    to: EMERGENCY_CONTACTS.technical,
    subject: `[EMERGENCY] ${incident}`,
    body: JSON.stringify(details, null, 2)
  })
}
```

---

## ⚠️ 重要な注意事項

1. **医療情報ガイドライン準拠**: 厚生労働省の「医療情報システムの安全管理に関するガイドライン」に準拠
2. **定期的な見直し**: セキュリティ設定は3ヶ月ごとに見直し
3. **スタッフ教育**: 個人情報保護に関する定期研修の実施
4. **委託先管理**: Supabaseとの契約書で個人情報保護条項を確認
5. **インシデント対応**: 年1回以上のインシデント対応訓練を実施

このガイドに従って実装することで、医療情報を安全に管理し、利用者の信頼を確保できます。 