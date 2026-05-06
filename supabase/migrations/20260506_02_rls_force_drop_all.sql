-- =============================================
-- RLS Lockdown 보완 — 2026-05-06 (T5 검증 발견사항)
-- =============================================
-- 1차 lockdown(20260506_rls_lockdown.sql) 적용 후 검증 결과
-- board_posts 테이블이 여전히 anon 키로 R/U/D/INSERT 모두 가능했다.
-- 원인: 1차 SQL은 정확히 "Allow all operations for anon" 이름의 정책만 DROP했는데,
--       해당 테이블에 다른 이름의 정책이 추가로 남아 있었거나 RLS가 활성화 안 된 상태였음.
--
-- 본 패치는 4개 테이블의 모든 정책을 동적으로 제거하고 RLS를 명시적으로 활성화한다.
-- board_posts의 client-side 직접 SDK 조회는 0건(모든 접근이 /api/board 서버 라우트 경유)이므로
-- anon deny 강제가 게시판 페이지 동작에 영향을 주지 않음을 확인했다.
--
-- 적용 후 검증: anon 키로 4개 테이블 모두 SELECT/INSERT/UPDATE/DELETE → HTTP 401/403 또는 0 rows.
-- =============================================

DO $$
DECLARE
    t text;
    pol record;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY['users', 'admin_data', 'tax_data', 'board_posts'])
    LOOP
        -- RLS 활성화 (이미 활성화됐으면 no-op)
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        -- 해당 테이블의 모든 정책 제거 (anon이든 authenticated든 전부)
        FOR pol IN
            SELECT policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename = t
        LOOP
            EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
        END LOOP;
    END LOOP;
END $$;

-- 적용 후 정책 상태 확인용 — Supabase Studio에서 별도 실행 추천
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname='public' ORDER BY tablename;
-- 기대 결과: 위 4 테이블에 대해 0 rows.

-- =============================================
-- 롤백 (긴급 시 — 보안 취약점 재노출됨)
-- =============================================
-- 1차 lockdown의 롤백 SQL을 실행하면 anon "Allow all operations" 정책이 복원된다.
-- 다른 이름의 정책 복원이 필요하면 기존 마이그레이션 또는 schema.sql 참조.
