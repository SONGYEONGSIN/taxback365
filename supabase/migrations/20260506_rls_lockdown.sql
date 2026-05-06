-- =============================================
-- RLS Lockdown — 2026-05-06
-- =============================================
-- 보안 점검(docs/security-audit-2026-05-06.md, S3) 후속 조치.
--
-- 변경 전: 모든 테이블에 `Allow all operations for anon` USING(true) WITH CHECK(true)
--           → anon 키만으로 모든 사용자의 세금/회원/게시판 R/U/D 가능
-- 변경 후: anon용 정책 전체 제거 → "정책 부재 = anon은 deny" (Postgres RLS 동작)
--           service_role은 Supabase에서 자동으로 RLS를 우회하므로 별도 정책 불필요.
--           모든 서버 라우트는 lib/supabase.ts의 supabaseAdmin (service_role)을 사용.
--
-- 적용 후 검증:
--   1) anon 키로 `select * from tax_data` → 0 rows
--   2) service_role 키로 동일 쿼리 → 정상 데이터
--   3) Google 로그인 → users 테이블 row 생성 확인
--
-- 적용 위치: Supabase Dashboard → SQL Editor → Run
-- =============================================

DROP POLICY IF EXISTS "Allow all operations for anon" ON users;
DROP POLICY IF EXISTS "Allow all operations for anon" ON admin_data;
DROP POLICY IF EXISTS "Allow all operations for anon" ON tax_data;
DROP POLICY IF EXISTS "Allow all operations for anon" ON board_posts;

-- 의도 명시 — 코드 리뷰 시 RLS 상태를 한 눈에 확인 가능
COMMENT ON TABLE users IS 'RLS: anon deny (no policy). service_role bypasses. Server routes use supabaseAdmin.';
COMMENT ON TABLE admin_data IS 'RLS: anon deny. Server-only via service_role.';
COMMENT ON TABLE tax_data IS 'RLS: anon deny. Server-only via service_role.';
COMMENT ON TABLE board_posts IS 'RLS: anon deny. Server-only via service_role (read/write all flow through API routes).';

-- =============================================
-- 롤백 (긴급 시에만 — 보안 취약점 재노출됨)
-- =============================================
-- CREATE POLICY "Allow all operations for anon" ON users        FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations for anon" ON admin_data   FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations for anon" ON tax_data     FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations for anon" ON board_posts  FOR ALL USING (true) WITH CHECK (true);
