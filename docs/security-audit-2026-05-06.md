# 보안 점검 보고서 — 2026-05-06

- **대상**: taxback365 (연말정산 환급 SaaS, Next.js 15.5 + Supabase + NextAuth v5)
- **방법**: vibe-flow `/security` 스킬 + general-purpose 서브에이전트 OWASP Top 10 정밀 스캔
- **전체 판정**: **FAIL** (HIGH 7건)

> 시크릿 값은 평문 노출 방지를 위해 마스킹·식별자만 표기합니다.

## 결과 표

| 심각도 | 카테고리 | 파일·위치 | 설명 | 권장 조치 |
| --- | --- | --- | --- | --- |
| HIGH | A02 / A05 (S1) | `.env.local` (NEXTAUTH_SECRET, GOOGLE_CLIENT_SECRET=`GOCSPX-…`, MARKET_API_KEY, PHARMACY_API_KEY, Supabase 키) · `auth.ts:13-14` | 운영 시크릿이 워킹트리에 평문 존재. `NEXTAUTH_SECRET`은 32자 ASCII로 엔트로피 부족. `.gitignore`에 `*.local`이 있어 커밋 위험은 낮으나 디스크 노출은 즉시 위협. | 모든 노출 키 즉시 회전(특히 `GOCSPX-`, supabase JWT, data.go.kr 키), `NEXTAUTH_SECRET`을 `openssl rand -base64 32`로 재생성, Vercel 환경변수로만 관리 |
| HIGH | A02 (S2) | `.env.local` `SUPABASE_SERVICE_ROLE_KEY` | 값이 anon 키와 동일 (JWT payload `"role":"anon"`). 서비스 롤 자리에 anon 키가 들어가 권한 모델 가정이 깨져 있음. | Supabase 콘솔에서 진짜 service_role 키로 교체하거나, service_role 사용 코드 제거 |
| HIGH | A01 / A02 (S3) | `supabase/schema.sql:21-25, 51-65, 77-81` | 모든 테이블(`users`, `admin_data`, `tax_data`, `board_posts`)에 `RLS ENABLE` 후 `USING (true) WITH CHECK (true)` — anon 키로 모든 사용자 세금/회원/게시판 R/U/D 가능. anon 키는 클라 번들에 노출되는 공개 키. | RLS를 실제 정책으로 작성(예: `auth.uid() = user_id`) 또는 모든 DB 접근을 server-only `service_role`로 통일하고 anon 정책은 deny |
| HIGH | A01 (S4) | `app/admin/page.tsx`, `app/admin/layout.tsx`, `app/api/admin-data/route.ts:8-13, 43-48`, `middleware.ts` (부재) | 관리자 페이지에 서버 측 가드 없음. `isAdmin()` 헬퍼는 존재하나 미호출. `/api/admin-data`는 단순 로그인 세션만 검사(`session?.user?.email`)해 일반 사용자도 자기 user_id로 admin_data R/W 가능. | `app/admin/layout.tsx`를 server component화 + `auth()` + `isAdmin()`, 또는 루트에 `middleware.ts` 추가 |
| HIGH | A04 (S5) | `app/api/ai-advice/route.ts`, `app/api/ocr/route.ts`, `app/api/biz-check/route.ts`, `app/api/hospital/route.ts`, `app/api/market/route.ts`, `app/api/pharmacy/route.ts` | 외부 비용 발생/외부 호출 엔드포인트 6개 모두 인증 0, rate-limit 0. `/api/ai-advice`·`/api/ocr`은 Gemini 호출(과금), 나머지는 배치 PUT으로 N건 fan-out — 익명 공격자가 키 소진/요금 폭탄 가능. | `auth()` 추가, 사용자별 rate-limit(@upstash/ratelimit 등), 입력 배열 길이 상한, OCR 이미지 크기 제한 |
| HIGH | A07 (S6) | `app/dashboard/page.tsx:1018-1024` | LLM이 생성한 마크다운 텍스트(`aiAdvice`)를 단순 `replace`만 거쳐 `dangerouslySetInnerHTML`로 렌더링. Gemini 응답에 `<script>`/`<img onerror>`가 섞이면 그대로 실행. prompt-injection→XSS 경로. | DOMPurify로 sanitize 또는 `react-markdown` 같은 안전 렌더러 사용 |
| HIGH | A06 (S7) | `package.json` (next, postcss, xlsx) | `npm audit`: next < 15.5.15 (DoS, CVE high), postcss < 8.5.10 (XSS moderate), xlsx <0.20.2 (Prototype Pollution + ReDoS, high — **자동 fix 없음**). | `npm audit fix`로 next/postcss 업그레이드, xlsx는 ExcelJS 등 대체 패키지 검토 |
| MEDIUM | A01 (IDOR) | `app/api/admin-data/route.ts:13`, `app/api/tax-data/route.ts:13` | `userId = session.user.email` 사용. 이메일 변경/공유 가능 식별자 → DB의 stable id(uuid)와 어긋남. 사용자가 이메일 변경 시 데이터 분리 깨짐. | 세션에 `users.id`를 싣고 그 uuid로 R/W |
| MEDIUM | A03 | `app/api/board/route.ts:38-50` | `.or(\`is_public.eq.true,…,author_email.eq.${currentUserEmail}\`)`로 사용자 입력을 PostgREST `or` 필터 문자열에 직접 보간. 콤마/괄호 syntactic 의미 — 인젝션 가능. | `or()`에 사용자 입력 직접 보간 금지, `eq()` 분기 또는 두 쿼리로 분리 |
| MEDIUM | A04 | `app/api/ai-advice/route.ts:31-38`, `app/api/board/route.ts:91`, `app/api/admin-data/route.ts:50`, `app/api/tax-data/route.ts:43` | 모든 라우트가 `await request.json()` 후 zod 등 스키마 검증 없이 구조분해. `salary`/`year`/`data` 타입·범위·크기 미검증. JSONB에 임의 페이로드 저장 가능. | zod 스키마로 boundary 검증 도입 |
| MEDIUM | A05 | `next.config.mjs` | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy 등 보안 헤더 미설정. | `headers()` 콜백에 CSP(특히 dashboard XSS 대비) 및 X-Frame-Options DENY 추가 |
| MEDIUM | A07 | `components/seo/JsonLd.tsx:27, 75` | JSON-LD 출력에 `dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}` 사용. 정적 데이터지만 `</script>` 종료 시퀀스 이스케이프가 없어 향후 외부 데이터 혼입 시 script-breakout 가능. | `JSON.stringify(...).replace(/</g, '\\u003c')` 적용 |
| MEDIUM | A09 | 전 라우트 | 로그인 성공/실패, 게시글 삭제, admin 데이터 변경에 대한 감사 로그 부재. `console.error` 위주라 운영 분석 불가, PII가 stdout으로 누수 가능. | 구조화된 audit 테이블 또는 logging service 도입, PII 마스킹 |
| LOW | A05 | `app/opengraph-image.tsx:3` | `runtime = "edge"` — 빌드 경고("Using edge runtime on a page currently disables static generation")의 원인. | OG 이미지가 정적이면 `runtime` 제거 |
| LOW | A03 | `app/api/news/route.ts:35-44` | RSS XML을 정규식으로 파싱. 영향은 제한적이나 견고성 낮음. | `fast-xml-parser` 등 사용 |
| LOW | A05 | `app/**` (`console.log` 67건) | 운영 로그에 사용자 이메일·세금 데이터가 그대로 출력될 수 있음. | 프로덕션 빌드에서 console 제거(`compiler.removeConsole`) + eslint `no-console` |

## 요약

- **HIGH**: 7
- **MEDIUM**: 6
- **LOW**: 3
- **전체 판정**: **FAIL**

## 우선 조치 권고 (Top 5)

1. **노출된 시크릿 즉시 회전 + 재발급** (S1, S2): `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`(고엔트로피로 재생성), `MARKET_API_KEY`/`PHARMACY_API_KEY`, Supabase 키 모두 회전. service_role 자리에 anon 키가 들어간 것을 정상 service_role 키로 교체하거나 사용 코드를 제거.
2. **Supabase RLS를 실제 정책으로 다시 작성** (S3) — `USING(true)`는 RLS를 사실상 무력화. anon 키만으로 모든 사용자 데이터 변조 가능. 서버 전용 service_role + 사용자별 정책으로 전환.
3. **`/admin/**`과 `/api/admin-data`에 role 가드 추가** (S4): middleware.ts 또는 server component layout에서 `auth()` + `isAdmin()` 강제.
4. **외부 호출 엔드포인트 보호** (S5, `ai-advice`/`ocr`/`biz-check`/`hospital`/`market`/`pharmacy`): 인증 + 사용자별 rate limit + 입력 배열 길이 제한.
5. **`dashboard/page.tsx:1018`의 `dangerouslySetInnerHTML` sanitize 또는 `react-markdown` 교체** (S6), 입력 일반에 zod boundary 검증 도입.

## 부수 발견

- 빌드 경고("edge runtime ... disables static generation")의 원인은 `app/opengraph-image.tsx:3`의 `export const runtime = "edge"`이다.
- `app/admin/page.tsx`는 1900+ 라인의 클라이언트 컴포넌트로, 분리·서버화 리팩토링이 권한 가드 도입과 함께 검토되어야 한다.
- `lib_backup/` (이미 삭제됨), `tsconfig.tsbuildinfo` 같은 잡파일이 git에 추적되고 있던 흔적이 있었다.

## 처리 계획 (별도 plan 문서 예정)

- **Phase A**: RLS 정상화 (S3) — `supabase/migrations/` 신규 마이그레이션
- **Phase B**: 인증 가드 (S4) — `middleware.ts` + admin layout server component화 + `isAdmin()`
- **Phase C**: 외부 라우트 보호 (S5) — `auth()` + rate-limit + 입력 상한
- **Phase D**: dashboard XSS 차단 (S6) — `react-markdown`/DOMPurify
- **Phase E**: 보안 헤더 + zod boundary + 패키지 업그레이드(S7) + Medium/Low 일괄

각 Phase는 별도 PR/커밋으로 분리하고, A부터 순서대로 진행한다.
