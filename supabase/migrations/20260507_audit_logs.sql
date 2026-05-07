-- =============================================
-- Audit Logs — 2026-05-07
-- =============================================
-- OWASP A09 (Security Logging and Monitoring Failures) MEDIUM 해결.
-- 인증/관리/삭제 이벤트를 영구 기록한다.
--
-- RLS: anon deny (no policy). service_role만 INSERT/SELECT.
-- 모든 기록은 lib/audit.ts의 supabaseAdmin을 통해 server-side에서만 발생.
--
-- 적용 후 검증:
--   1) anon 키로 `select * from audit_logs` → 0 rows / 401
--   2) service_role로 INSERT → 성공
--   3) Google 로그인 1회 → row 1개 (action='login.success')
--
-- 적용 위치: Supabase Dashboard → SQL Editor → Run
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    target TEXT,
    metadata JSONB,
    ip_address TEXT,         -- INET 대신 TEXT — IPv4·IPv6·proxy chain (콤마 구분) 모두 수용
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE audit_logs IS 'RLS: anon deny (no policy). service_role bypasses. All inserts via lib/audit.ts (server-only).';

-- 검증 쿼리 (선택 실행)
-- SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
-- SELECT action, COUNT(*) FROM audit_logs GROUP BY action ORDER BY count DESC;

-- =============================================
-- 롤백 (긴급 시)
-- =============================================
-- DROP TABLE IF EXISTS audit_logs CASCADE;
