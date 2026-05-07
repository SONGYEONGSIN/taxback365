---
plan_id: 2026-05-07-followup-A-lint-and-cleanup
title: 보안 follow-up A — Lint 정리 + Schema/News/CSP
status: pending
hard_gate: full
priority: MEDIUM
created: 2026-05-07
parent: 2026-05-06-security-patch-5-phase
depends_on: 2026-05-07-followup-B-xlsx-replace
total_tasks: 9
estimated_hours: 3-4
---

# Plan: 보안 follow-up A — Lint 정리 + Schema/News/CSP

## Goal

빌드 시 ESLint 검사 재활성화 (`next.config.mjs`의 `eslint.ignoreDuringBuilds: true` 제거). 잔여 26 errors + 3 warnings 0으로 만들면서 schema.sql 정합성·news 라우트 견고성·CSP 운영 모니터링까지 일괄 정리.

## Approach

prefer-const 자동 수정 → calculator 변수 7건 비즈니스 검증 → 잔여 unused-vars 일괄 삭제 → next/image 전환 → ignoreDuringBuilds 제거 → schema.sql 1줄 패치 → fast-xml-parser 도입 → CSP 30분 운영 관찰. Sub-plan B의 admin/page.tsx 변경 후 시작 (분포 안정화).

## Out of Scope

- xlsx 교체 (sub-plan B에서 처리)
- audit_logs (sub-plan C)
- calculator 환급 로직 자체 리팩터 (누락 변수 발견 시 별도 이슈 등록)
- ESLint 규칙 추가/완화

## 영향 파일

| 파일 | 변경 유형 | 비고 |
|---|---|---|
| `app/admin/page.tsx` | 수정 | prefer-const 4, unused-vars 4, no-img-element 1, eslint-disable 제거 1 |
| `app/api/hospital/route.ts` | 수정 | unused-vars 1 |
| `app/api/news/route.ts` | 수정 | unused-vars 1 + fast-xml-parser 적용 |
| `app/api/pharmacy/route.ts` | 수정 | unused-vars 1 |
| `app/board/[id]/edit/page.tsx` | 수정 | unused-vars 1 |
| `app/board/write/page.tsx` | 수정 | unused-vars 1 |
| `app/calculator/page.tsx` | 수정 | unused-vars 7 — **로직 검증 필수** |
| `app/dashboard/page.tsx` | 수정 | unused-vars 2 |
| `app/layout.tsx` | 수정 | unused-vars 1 |
| `lib/ai-recommendation.ts` | 수정 | unused-vars 3 |
| `lib/tax-store.ts` | 수정 | unused-vars 2 |
| `components/layout/Navigation.tsx` | 수정 | no-img-element 1 |
| `next.config.mjs` | 수정 | `eslint.ignoreDuringBuilds` 제거 + (필요 시) `images.remotePatterns` 도메인 추가 |
| `supabase/schema.sql` | 수정 | line ~61 `'FAQ'` → `'Q&A'` |
| `package.json` | 의존성 | +`fast-xml-parser` |
| `.claude/plans/...` | 메모 | CSP 위반 보고 수집 결과 기록 |

## 단계

### A-T1: prefer-const 4건 자동 수정
- **상태**: pending
- **파일**: `app/admin/page.tsx`
- **변경**: `npx eslint app/admin/page.tsx --fix` 또는 라인별 수동 `let → const`
- **DoD**: `npm run lint` `prefer-const` 규칙 매치 0건
- **의존**: 없음

### A-T2: calculator 변수 7건 분석 (CRITICAL)
- **상태**: pending
- **파일**: `app/calculator/page.tsx`
- **변경**: 각 변수(`totalUsed` 1384, `transportExcess` 1519, `marketExcess` 1520, `cultureExcess` 1521, `totalDeduction` 1672, `hometownTotal` 2273, `totalDeduction` 2311)에 대해: (a) 환급 계산 로직 누락 → 사용 추가, (b) 진짜 미사용 → 삭제. git blame + 주변 코드 의도 분석.
- **DoD**: 각 변수별 결정(사용/삭제) 코멘트 + 처리. `npm run lint` 해당 7건 0.
- **의존**: 없음

### A-T3: 잔여 unused-vars 일괄 삭제
- **상태**: pending
- **파일**: `app/admin/page.tsx`(4), `app/api/{hospital,news,pharmacy}/route.ts`(3), `app/board/{[id]/edit,write}/page.tsx`(2), `app/dashboard/page.tsx`(2), `app/layout.tsx`(1), `lib/{ai-recommendation,tax-store}.ts`(5)
- **변경**: 각 변수 진짜 미사용인지 확인 후 삭제 (의도된 destructure rest는 `_prefix` 또는 `// eslint-disable-next-line`).
- **DoD**: `npm run lint` `no-unused-vars` 0건. tsc 0 errors.
- **의존**: A-T2 (calculator 결정 후 같은 파일 안 충돌 회피)

### A-T4: `<img>` → `next/image` 2건
- **상태**: pending
- **파일**: `app/admin/page.tsx:1929`, `components/layout/Navigation.tsx:141`
- **변경**: `<img src={url}>` → `<Image src={url} width={..} height={..} alt={..} />`. 외부 도메인이면 `next.config.mjs.images.remotePatterns`에 추가.
- **DoD**: `no-img-element` 0건. 시각 회귀 없음(스샷 1회).
- **의존**: 없음

### A-T5: 미사용 eslint-disable 1건 제거
- **상태**: pending
- **파일**: `app/admin/page.tsx:273`
- **변경**: 해당 라인 `eslint-disable` 코멘트 제거.
- **DoD**: 해당 warning 사라짐.
- **의존**: 없음

### A-T6: `ignoreDuringBuilds` 제거 + build 검증
- **상태**: pending
- **파일**: `next.config.mjs`
- **변경**: `eslint: { ignoreDuringBuilds: true }` 옵션 삭제 (또는 false).
- **DoD**: `npm run build` 통과 (lint·typecheck 모두 0 errors).
- **의존**: A-T1, A-T2, A-T3, A-T4, A-T5

### A-T7: schema.sql `Q&A` 동기화
- **상태**: pending
- **파일**: `supabase/schema.sql`
- **변경**: line ~61 `CHECK (category IN ('일반', '질문', 'FAQ', '공지'))` → `('일반', '질문', 'Q&A', '공지')`
- **DoD**: `grep "'Q&A'" supabase/schema.sql` 1 hit, `grep "'FAQ'"` 0 hit.
- **의존**: 없음

### A-T8: `fast-xml-parser` 도입 (news 라우트)
- **상태**: pending
- **파일**: `app/api/news/route.ts`, `package.json`
- **변경**: `npm i fast-xml-parser`. 정규식 파싱 코드(라인 35~44) → `XMLParser`로 교체. `<item>` 추출 후 title·link·pubDate·source 매핑.
- **DoD**: 동일 RSS URL 입력 → 이전 정규식 결과와 신규 파서 결과의 title·url 100% 일치 (샘플 10건). build 통과.
- **의존**: 없음

### A-T9: CSP 위반 모니터링 30분 세션
- **상태**: pending
- **파일**: 없음 (관찰)
- **변경**: 운영 도메인(`taxback365.vercel.app`)을 시크릿 창으로 로그인부터 게시판·대시보드·계산기 전 페이지 순회. DevTools Console에 `Refused to load`/`Refused to connect`/`Content Security Policy` 위반 발생 시 도메인 기록 → `next.config.mjs`의 CSP `connect-src`/`script-src` 화이트리스트에 추가 → 배포.
- **DoD**: 30분 세션 종료 후 위반 보고 0건 또는 화이트리스트 패치 PR 머지.
- **의존**: 없음 (백그라운드 가능)

## 리스크

- **calculator 변수 오삭제** → 환급 결과 오류. 완화: A-T2에서 git blame · 주변 코드 의도 분석 강제.
- **next/image 외부 도메인 누락** → 이미지 로드 실패. 완화: A-T4에서 `images.remotePatterns` 검토.
- **fast-xml-parser CDATA 처리 차이** → 일부 RSS 항목 누락 가능. 완화: A-T8 동등성 테스트.
- **CSP 위반 화이트리스트 추가가 보안 약화** → 추가하는 도메인이 정당한지 확인. 의심 도메인은 추가 거부.

## 진행 추적

| 시각 | 단계 | 상태 변경 | 비고 |
|---|---|---|---|
| 2026-05-07T... | — | plan 저장 | depends_on B 완료 후 시작 |
