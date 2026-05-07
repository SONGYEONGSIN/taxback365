-- =============================================
-- taxback365 Supabase Schema
-- Supabase SQL Editor에서 실행하세요
--
-- RLS 정책: anon deny (no policy). service_role bypasses.
-- 모든 서버 라우트는 lib/supabase.ts의 supabaseAdmin (service_role)을 사용한다.
-- 신규 환경 부트스트랩 시 본 파일을 실행하면 운영 상태(2026-05-06 lockdown 적용 후)와 동일.
-- =============================================

-- =============================================
-- 회원 관리 (Users)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  image TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  provider TEXT DEFAULT 'google',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE users IS 'RLS: anon deny (no policy). service_role bypasses. Server routes use supabaseAdmin.';

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Admin 데이터 (연도별 세금 기초자료)
CREATE TABLE IF NOT EXISTS admin_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year)
);

-- Tax 계산 결과 데이터
CREATE TABLE IF NOT EXISTS tax_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS (Row Level Security): anon에 대해 deny. server route가 service_role 통해 우회.
ALTER TABLE admin_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_data ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE admin_data IS 'RLS: anon deny. Server-only via service_role.';
COMMENT ON TABLE tax_data IS 'RLS: anon deny. Server-only via service_role.';

-- =============================================
-- 게시판 (Board)
-- =============================================
CREATE TABLE IF NOT EXISTS board_posts (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT '일반' CHECK (category IN ('일반', '질문', 'Q&A', '공지')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE board_posts IS 'RLS: anon deny. Server-only via service_role (read/write all flow through API routes).';

-- 인덱스 (빠른 조회)
CREATE INDEX IF NOT EXISTS idx_admin_data_user_year ON admin_data(user_id, year);
CREATE INDEX IF NOT EXISTS idx_tax_data_user ON tax_data(user_id);
CREATE INDEX IF NOT EXISTS idx_board_posts_created ON board_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_posts_pinned ON board_posts(is_pinned, created_at DESC);

-- =============================================
-- 감사 로그 (Audit Logs) — A09 보강
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  target TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE audit_logs IS 'RLS: anon deny (no policy). service_role bypasses. All inserts via lib/audit.ts (server-only).';
