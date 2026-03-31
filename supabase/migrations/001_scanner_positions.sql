-- scanner_positions 테이블: 스캐너 시그널 기반 가상 포지션 저장
CREATE TABLE IF NOT EXISTS scanner_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT,
    timeframe TEXT NOT NULL CHECK (timeframe IN ('5m', '30m', '1h', '1d')),
    side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
    entry_price DECIMAL(20, 8) NOT NULL,
    current_price DECIMAL(20, 8),
    sl_price DECIMAL(20, 8) NOT NULL,
    tp_price DECIMAL(20, 8) NOT NULL,
    be_active BOOLEAN DEFAULT FALSE,
    unrealized_pnl DECIMAL(10, 2),
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_time TIMESTAMP WITH TIME ZONE,
    exit_price DECIMAL(20, 8),
    realized_pnl DECIMAL(10, 2),
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED')),
    close_reason TEXT CHECK (close_reason IN ('SL', 'TP', 'MANUAL', 'SIGNAL_FLIP')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_scanner_positions_symbol ON scanner_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_scanner_positions_timeframe ON scanner_positions(timeframe);
CREATE INDEX IF NOT EXISTS idx_scanner_positions_status ON scanner_positions(status);
CREATE INDEX IF NOT EXISTS idx_scanner_positions_active ON scanner_positions(timeframe, status) WHERE status = 'ACTIVE';

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_scanner_positions_updated_at ON scanner_positions;
CREATE TRIGGER update_scanner_positions_updated_at
    BEFORE UPDATE ON scanner_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- scanner_signals_history 테이블: 모든 시그널 기록 저장
CREATE TABLE IF NOT EXISTS scanner_signals_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT,
    timeframe TEXT NOT NULL,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('LONG', 'SHORT', 'WAIT')),
    price DECIMAL(20, 8) NOT NULL,
    score DECIMAL(10, 2),
    ci DECIMAL(10, 2),
    z_score DECIMAL(10, 4),
    regime TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signals_symbol ON scanner_signals_history(symbol);
CREATE INDEX IF NOT EXISTS idx_signals_timeframe ON scanner_signals_history(timeframe);
CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON scanner_signals_history(timestamp);

-- 성과 통계 뷰
CREATE OR REPLACE VIEW scanner_performance AS
SELECT 
    timeframe,
    side,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE realized_pnl > 0) as win_count,
    COUNT(*) FILTER (WHERE realized_pnl < 0) as loss_count,
    ROUND(COUNT(*) FILTER (WHERE realized_pnl > 0) * 100.0 / COUNT(*), 2) as win_rate,
    ROUND(AVG(realized_pnl), 2) as avg_pnl,
    ROUND(SUM(realized_pnl), 2) as total_pnl,
    ROUND(MAX(realized_pnl), 2) as best_trade,
    ROUND(MIN(realized_pnl), 2) as worst_trade,
    ROUND(AVG(EXTRACT(EPOCH FROM (exit_time - entry_time))/3600), 2) as avg_hold_hours
FROM scanner_positions
WHERE status = 'CLOSED'
GROUP BY timeframe, side;
