-- ============================================
-- Supabase Setup SQL
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. API Keys 테이블 (사용자 API 키 관리)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key TEXT,
    secret_key TEXT,
    api_key_encrypted TEXT,
    secret_key_encrypted TEXT,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 키만 조회/수정 가능
CREATE POLICY "Users can view own api_keys"
    ON api_keys FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api_keys"
    ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api_keys"
    ON api_keys FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 2. Positions 테이블 (포지션 기록)
-- ============================================
CREATE TABLE IF NOT EXISTS positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
    entry_price DECIMAL(20, 8) NOT NULL,
    current_price DECIMAL(20, 8),
    exit_price DECIMAL(20, 8),
    quantity DECIMAL(20, 8),
    leverage DECIMAL(5, 2) DEFAULT 1,
    sl_price DECIMAL(20, 8),
    tp_price DECIMAL(20, 8),
    be_active BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    profit_pct DECIMAL(10, 4),
    profit_amount DECIMAL(20, 8),
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_time TIMESTAMP WITH TIME ZONE,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own positions"
    ON positions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions"
    ON positions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions"
    ON positions FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 3. Trading Logs 테이블 (거래 기록)
-- ============================================
CREATE TABLE IF NOT EXISTS trading_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL', 'LONG', 'SHORT')),
    action TEXT NOT NULL CHECK (action IN ('ENTRY', 'EXIT', 'SL', 'TP', 'BE', 'TRAILING')),
    price DECIMAL(20, 8) NOT NULL,
    quantity DECIMAL(20, 8),
    leverage DECIMAL(5, 2) DEFAULT 1,
    profit_pct DECIMAL(10, 4),
    profit_amount DECIMAL(20, 8),
    fee DECIMAL(20, 8) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE trading_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trading_logs"
    ON trading_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading_logs"
    ON trading_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. User Settings 테이블 (봇 설정)
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    leverage DECIMAL(5, 2) DEFAULT 20,
    trade_pct DECIMAL(5, 2) DEFAULT 10,
    sl_roi DECIMAL(5, 2) DEFAULT 2.0,
    tp_roi DECIMAL(5, 2) DEFAULT 5.0,
    sl_mode TEXT DEFAULT 'atr' CHECK (sl_mode IN ('atr', 'trailing', 'roi')),
    max_positions INTEGER DEFAULT 5,
    is_order_enabled BOOLEAN DEFAULT false,
    selected_symbols TEXT[] DEFAULT ARRAY['BTCUSDT'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
    ON user_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own settings"
    ON user_settings FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 5. 인덱스 생성 (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trading_logs_user_id ON trading_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_logs_created ON trading_logs(created_at DESC);

-- ============================================
-- 6. updated_at 트리거 함수
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Auth Users 자동 설정 트리거
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 새 사용자용 기본 설정 생성
    INSERT INTO user_settings (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
