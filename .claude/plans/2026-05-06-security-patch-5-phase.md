---
plan_id: 2026-05-06-security-patch-5-phase
title: 보안 패치 5단계 (RLS / Admin / Rate-limit / XSS / 헤더)
status: in_progress
created: 2026-05-06
hard_gate: full
phases: 5
total_tasks: 34
estimated_hours: 8-12
source: docs/security-audit-2026-05-06.md
related: docs/security-audit-2026-05-06.md
---

# Plan: 보안 패치 5단계

## Goal

`docs/security-audit-2026-05-06.md`의 HIGH 7건 + MEDIUM 6건 + LOW 3건 중 보안 영향이 큰 항목을 5개 PR로 분리해 점진 적용한다.

## Approach

A → B → C → D → E 순차 진행. 각 Phase 완료 시 별도 PR/배포/검증. 이전 Phase 미완료 상태에서 다음 Phase 시작 금지 (의존성 강함).

- A는 service_role 분리가 B의 admin 라우트 작업 토대.
- B의 admin 가드 + auth helper가 C의 외부 라우트 보호 패턴 입력.
- D는 독립적이지만 빌드 통과 보장 위해 순차.
- E는 잔여 일괄 정리.

## Out of Scope

- Supabase Auth 마이그레이션 (NextAuth 유지)
- xlsx 대체 (별도 follow-up issue로만 등록)
- 감사 로그 테이블 (별도 follow-up)
- console.log 67건 일괄 제거 (E의 `removeConsole`로 빌드 시 제거로 대체)

## 영향 파일

**신규**: `middleware.ts`, `lib/rate-limit.ts`, `lib/api-guard.ts`, `supabase/migrations/20260506_rls_lockdown.sql`

**수정**: `auth.ts`, `lib/supabase.ts`, `lib/admin.ts`, `app/admin/layout.tsx`, `app/api/{admin-data,tax-data,board,ai-advice,ocr,biz-check,hospital,market,pharmacy,news}/route.ts`, `app/dashboard/page.tsx`, `components/seo/JsonLd.tsx`, `app/opengraph-image.tsx`, `next.config.mjs`, `package.json`, `supabase/schema.sql`, `.env.example` (또는 `.env.local` 가이드)

## 단계 (총 34 태스크)

### Phase A — RLS 정상화 (T1~T6)

- **T1**: `lib/supabase.ts`에 `supabaseAdmin` (service_role) 추가, anon 클라이언트 사용처 정리. **DoD**: `npx tsc --noEmit` 0 errors.
- **T2**: `auth.ts:31` signIn upsert를 `supabaseAdmin`으로 교체. **DoD**: 로컬 dev에서 Google 로그인 시 `users` 테이블 row 생성 확인 (Supabase Studio 조회).
- **T3**: `app/api/{admin-data,tax-data,board}/route.ts` 3개를 `supabaseAdmin`으로 전환. **DoD**: `npm run build` 통과.
- **T4**: `supabase/migrations/20260506_rls_lockdown.sql` 작성 — anon 정책 DROP + service_role 전용 정책 + 롤백 SQL 동봉. **DoD**: 파일 review 완료.
- **T5**: Supabase Studio에서 마이그레이션 적용 + anon 키 검증 쿼리 (`select * from tax_data` → 0 rows). **DoD**: 검증 결과 진행 추적 표에 기록.
- **T6**: `supabase/schema.sql`을 새 정책으로 갱신 (신규 환경 부트스트랩용). **DoD**: schema.sql == 마이그레이션 적용 후 상태.

### Phase B — Admin 가드 (T7~T11)

- **T7**: `lib/admin.ts`에 `requireAdmin(email)` 및 `assertAdmin()` 헬퍼 추가. **DoD**: 단위 테스트 또는 타입 체크 통과.
- **T8**: 루트 `middleware.ts` 신규 — NextAuth v5 `auth` export 패턴, `config.matcher`에 `/admin/:path*`, `/api/admin-data/:path*`. 비로그인 → `/login`, 비관리자 → `/`. **DoD**: 비로그인 브라우저에서 `/admin` 접속 시 `/login` 리다이렉트.
- **T9**: `app/admin/layout.tsx`를 async server component로 변경 — `auth()` + `isAdmin()` 실패 시 `redirect('/')`. **DoD**: 일반 계정 로그인 후 `/admin` 접속 시 홈 리다이렉트.
- **T10**: `app/api/admin-data/route.ts` GET/POST 시작부에 `if (!isAdmin(session.user.email)) return 403`. **DoD**: 일반 사용자 토큰으로 `curl /api/admin-data?year=2026` → 403.
- **T11**: 관리자/비관리자 e2e 수동 시나리오 1쌍 실행 결과 캡처. **DoD**: 두 시나리오 모두 기대대로 동작.

### Phase C — 외부 라우트 보호 (T12~T18)

- **T12**: `npm i @upstash/ratelimit @upstash/redis zod`. **DoD**: lockfile 갱신, `npm run build` 통과.
- **T13**: `lib/rate-limit.ts` — `createLimiter(prefix, perMinute)` factory + 환경변수 부재 시 `null` 반환 graceful fallback. **DoD**: 단위 테스트 (mock) 통과.
- **T14**: `lib/api-guard.ts` — `withApiGuard(handler, {limiter, schema})` HOF. **DoD**: 타입 체크 통과.
- **T15**: `/api/ai-advice` — auth + limiter(10/min/user) + zod schema. **DoD**: 로그인 없이 `curl` → 401, 11회 연속 → 429.
- **T16**: `/api/ocr` — limiter(5/min/user) + 이미지 배열 ≤10, 각 base64 ≤4MB. **DoD**: 11번째 호출 429, 큰 페이로드 413.
- **T17**: `/api/biz-check`, `/api/hospital`, `/api/market`, `/api/pharmacy` 4개 일괄 (낮은 limiter 30/min/user). **DoD**: 4개 라우트 401/429 동작.
- **T18**: `.env.example` 또는 README에 새 변수 (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) 문서화. **DoD**: 파일 갱신.

### Phase D — Dashboard XSS (T19~T22)

- **T19**: `npm i react-markdown remark-gfm rehype-sanitize`. **DoD**: build 통과.
- **T20**: `app/dashboard/page.tsx:1015~1026` → `<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={...}>` 교체. h3/h4/strong/p 컴포넌트는 기존 Tailwind 매핑. **DoD**: 마크다운 정상 렌더 + `<script>` 페이로드 무력화 수동 확인.
- **T21**: `components/seo/JsonLd.tsx` 두 곳의 `JSON.stringify(jsonLd)` → `.replace(/</g, '\\u003c')` 적용. **DoD**: 두 스크립트 태그 모두 패치, `npm run build` 통과.
- **T22**: 빌드 + 대시보드 페이지 1회 로드해 AI 조언 모달이 시각적으로 동등한지 회귀 확인. **DoD**: 시각 회귀 텍스트 기록.

### Phase E — 헤더/zod/패키지/edge (T23~T34)

- **T23**: `next.config.mjs`에 `async headers()` 추가 — CSP, HSTS(`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. CSP는 1차 report-only, 후 enforce. **DoD**: `curl -I` 5종 헤더 확인.
- **T24**: `compiler.removeConsole` (production, exclude error). **DoD**: 프로덕션 빌드에서 console.log 제거 확인.
- **T25**: `app/opengraph-image.tsx` `export const runtime = "edge"` 제거. **DoD**: `npm run build` 시 edge 경고 사라짐.
- **T26**: `app/api/tax-data/route.ts` POST에 zod schema. **DoD**: 잘못된 페이로드 → 400.
- **T27**: `app/api/admin-data/route.ts` POST에 zod (`{ year: z.number().int().min(2020).max(2030), data: z.unknown() }`). **DoD**: year=999 → 400.
- **T28**: `app/api/board/route.ts` POST zod (`{ title, content, category, is_public? }`). **DoD**: 빈 title → 400.
- **T29**: `app/api/board/route.ts` GET `or()` 보간 제거 — `.filter('author_email', 'eq', value)` 패턴 또는 두 쿼리 분리. **DoD**: 콤마/괄호 fuzz 입력 정상 처리.
- **T30**: `npm audit fix` (next, postcss). xlsx 제외. **DoD**: `npm audit` HIGH 카운트 감소 보고서 첨부.
- **T31**: `app/api/news/route.ts` `fast-xml-parser` 도입 (LOW, 선택). **DoD**: 기존 RSS 응답과 동등 결과.
- **T32**: xlsx 대체 (ExcelJS) follow-up issue 등록 — 코드 변경 없음. **DoD**: GitHub issue 또는 plan에 follow-up 섹션.
- **T33**: 전체 회귀 — 로그인 → 대시보드 → admin → 게시판 → AI 조언 → OCR. **DoD**: 5개 시나리오 OK.
- **T34**: 최종 `npm run build` + `npm run lint` 0 errors. **DoD**: 출력 캡처.

## 리스크

- **A**: service_role 키 누락 시 server route 500. → T2 직전 env 체크.
- **A**: 마이그레이션 비가역 → 롤백 SQL 동봉 (anon 정책 복원본).
- **B**: NextAuth v5 middleware edge runtime 제약 → `auth.config.ts` 분리로 대응.
- **C**: Upstash 미설정 build 실패 → T13 fallback (env 부재 시 limiter null).
- **D**: react-markdown 컴포넌트 매핑 누락 시 스타일 깨짐 → T20에서 h3/h4/strong/p 매핑 필수.
- **E**: CSP 과도 → 1차 report-only, 추후 enforce.

## 진행 추적

| 시각 | Phase | 태스크 | 상태 변경 | 메모 |
|---|---|---|---|---|
| 2026-05-06T11:30:00Z | — | plan 저장 | created → in_progress | 사용자 합의 후 plan 파일 저장 |
