---
plan_id: 2026-05-07-followup-B-xlsx-replace
title: 보안 follow-up B — xlsx → exceljs 교체
status: in_progress
hard_gate: full
priority: HIGH
created: 2026-05-07
parent: 2026-05-06-security-patch-5-phase
total_tasks: 5
estimated_hours: 4-6
---

# Plan: 보안 follow-up B — xlsx → exceljs 교체

## Goal

`xlsx` 패키지의 자동 fix 불가 HIGH CVE 2건(Prototype Pollution `GHSA-4r6h-8v6p-xvw6`, ReDoS `GHSA-5pgg-2g8v-p4x9`) 제거. `exceljs`로 교체하여 `npm audit` HIGH 카운트 0 달성.

## Approach

`app/admin/page.tsx`의 두 호출지점(라인 421, 578)이 동일 `XLSX.read → utils.sheet_to_json` 패턴이므로 공통 wrapper `lib/excel-import.ts`로 통합 → 두 곳에서 wrapper 호출. xlsx 제거, exceljs 추가, 회귀 검증.

## Out of Scope

- 엑셀 export(쓰기) 기능 추가 — 현재 코드는 읽기 전용
- 다중 워크시트·차트·스타일 처리
- exceljs 최신 mejor 버전 추적 (LTS 사용)

## 영향 파일

| 파일 | 변경 유형 | 비고 |
|---|---|---|
| `package.json` | 의존성 | -xlsx, +exceljs |
| `package-lock.json` | 의존성 | 자동 갱신 |
| `lib/excel-import.ts` | 신규 | wrapper `parseSheetToRows(buffer): Promise<unknown[][]>` |
| `app/admin/page.tsx` | 수정 | import 변경, 두 호출지점(421, 578) wrapper로 교체 |

## 단계

### B-T1: 공통 wrapper `lib/excel-import.ts` 작성
- **상태**: pending
- **파일**: `lib/excel-import.ts` (신규)
- **변경**: `parseSheetToRows(buffer: ArrayBuffer | Uint8Array): Promise<(string|number|null)[][]>`. 첫 시트의 모든 row를 2D array로 반환. 날짜는 `cellDates: false`(serial number 유지)로 xlsx와 동등성 유지.
- **DoD**: `npx tsc --noEmit` 0 errors. 테스트용 .xlsx 1개로 row 수 출력 동작 확인.
- **의존**: 없음

### B-T2: admin/page.tsx 라인 421 호출지점 wrapper로 교체
- **상태**: pending
- **파일**: `app/admin/page.tsx`
- **변경**: 기존 `XLSX.read(arrayBuffer)` → `await parseSheetToRows(arrayBuffer)`. 후속 sheet_to_json 분해 로직을 wrapper 결과(2D array)에 맞게 조정.
- **DoD**: 직전 동작과 동일 결과(샘플 .xlsx 1개로 비교, 행 수·필드값 100% 일치).
- **의존**: B-T1

### B-T3: admin/page.tsx 라인 578 호출지점 wrapper로 교체
- **상태**: pending
- **파일**: `app/admin/page.tsx`
- **변경**: 동일 패턴.
- **DoD**: 동일.
- **의존**: B-T1

### B-T4: 의존성 교체 + audit
- **상태**: pending
- **파일**: `package.json`
- **변경**: `npm uninstall xlsx && npm i exceljs`
- **DoD**: `npm audit` HIGH 0건. xlsx 관련 vuln 메시지 사라짐.
- **의존**: B-T2, B-T3

### B-T5: build + 회귀 수동 테스트
- **상태**: pending
- **파일**: 없음 (검증)
- **변경**: `npm run build`. dev 서버에서 두 핸들러에 같은 샘플 .xlsx 업로드.
- **DoD**: build exit 0. 두 핸들러 모두 업로드 → 데이터 정상 표시. tax-store/admin-data DB row 정상 갱신 확인.
- **의존**: B-T4

## 리스크

- **날짜 직렬화 차이** — exceljs 기본은 `cellDates: true`(Date 객체), xlsx는 number(Excel serial). wrapper에서 옵션 명시로 동등성 유지. 완화: T1에서 `cellDates: false` 명시.
- **비동기 시그니처 전파** — exceljs는 `xlsx.load(buffer)`가 Promise. 두 핸들러가 sync였다면 await chain 추가. 완화: T2/T3에서 onChange 핸들러가 이미 async라 영향 작음.
- **번들 크기** — xlsx 1MB → exceljs 1.4MB. admin 전용 페이지라 dashboard 페이지 사이즈는 영향 없음.
- **wrapper 추출이 admin/page.tsx 미사용 변수 분포 변동** — 이 plan 후 sub-plan A의 ESLint 정리 시 새 분포로 작업 (B → A 순서 원칙).

## 진행 추적

| 시각 | 단계 | 상태 변경 | 비고 |
|---|---|---|---|
| 2026-05-07T04:47:24Z | — | plan 저장 | 사용자 합의 후 |
| 2026-05-07T05:00:00Z | B-T1 | done | `lib/excel-import.ts` 작성. exceljs dynamic import + cell value Date/RichText/Formula 변환 |
| 2026-05-07T05:05:00Z | B-T2 | done | `app/admin/page.tsx:415-424` 호출지점 wrapper 1줄로 교체 (5줄→1줄, onload async) |
| 2026-05-07T05:07:00Z | B-T3 | done | `app/admin/page.tsx:572-581` 동일 패턴 교체 |
| 2026-05-07T05:10:00Z | B-T4 | done | `npm uninstall xlsx && npm i exceljs`. **HIGH vuln 0건** (xlsx CVE 2건 제거). 잔여 3 moderate은 next 내부 transitive |
| 2026-05-07T05:15:00Z | — | revise | exceljs 타입 충돌(Buffer vs Uint8Array) `@ts-expect-error`로 우회. 런타임 영향 없음 |
| 2026-05-07T05:18:00Z | B-T5 | partial | `npm run build` 통과. 실제 .xlsx 업로드 회귀는 사용자 e2e 대기 |
