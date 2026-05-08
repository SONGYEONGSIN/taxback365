---
plan_id: 2026-05-08-followup-design-calculator-admin
title: 디자인 리뉴얼 follow-up — calculator + admin 시각 교체
status: pending
hard_gate: full
priority: HIGH
created: 2026-05-08
parent_plan: 2026-05-07-design-rebrand-modern-fintech
estimated_hours: 6
total_tasks: 6
worktree: feat/redesign (이어서)
---

## Goal

부모 plan(`2026-05-07-design-rebrand-modern-fintech`)에서 R1 HIGH(계산 로직 회귀 위험)로 분리된 2개 페이지의 시각만 교체한다. **행동/계산 로직 0 변경**.

- `app/calculator/page.tsx` (2830줄) — 환급 계산기. 입력 폼 다수, 금액 mono+tabular, 결과 카드(Mint 강조)
- `app/admin/page.tsx` (3105줄) — 관리자 화면. 엑셀 업로드 + 카드 분류 + admin 데이터 CRUD

성공 신호:
1. neo-* / accent-orange|yellow|cyan|pink / border-[3px] / shadow-[2px_2px|4px_4px|8px_8px / radial-gradient grep 0건 (`app/calculator/`, `app/admin/`)
2. tsc 0 / lint 0 / 컴파일 성공
3. 사용자 회귀 검수: ① 환급 계산 입력→결과가 변경 전과 **동일**, ② 어드민 CRUD 정상, ③ 시각이 본 디자인 시스템과 일관

## Approach

부모 plan에서 도입한 토큰/공통 컴포넌트(`Button`, `Card`, `Input`, `Badge`, `formatKRW`)를 그대로 사용. 인라인 클래스만 교체.

R1 완화 전략:
- T1 시작 전 `git diff --stat` 베이스라인 캡처
- 계산 로직(useState/useEffect/이벤트 핸들러/계산 함수)은 **읽기 전용** 처리
- 한 페이지 완료 = 한 커밋 단위. 회귀 발견 시 단일 revert로 격리
- T6 사용자 검수에 "변경 전·후 동일 입력 → 동일 환급액" 회귀 케이스 1개 이상 필수

## Out of Scope

- 행동/계산 로직 변경
- 새 컴포넌트 추출 (부모 plan 결과물 재사용만)
- prod build prerender 이슈(`<Html> outside _document`) — 이건 별도 issue로 분리 (Next.js 15.5.15 / 라이브러리 트랜시티브)

## 영향 파일

| 파일 | 변경 유형 | 줄 수 | 설명 |
|------|-----------|-------|------|
| `app/calculator/page.tsx` | 시각 교체 | 2830 | 폼 그룹 gap-6, `<Input currency>`, 결과 `<Card variant="raised">` + `text-mono-display` |
| `app/admin/page.tsx` | 시각 교체 | 3105 | 엑셀 업로드 박스/표/액션 버튼/탭 UI 새 토큰화. Badge `type` deprecated 어댑터 → 새 variant 명시 교체 |

## 단계

### T1: calculator 베이스라인 캡처 + 시각 교체 1차 (20-30분)

- **파일**: `app/calculator/page.tsx`
- **변경**: 아우터 `bg-background` + 컨테이너 `max-w-3xl mx-auto px-4 py-8`. 헤더 `text-h1 text-foreground` + 서브 `text-body-sm text-neutral-500`. 폼 섹션은 `<Card variant="resting" padding="lg">` 묶음. 라벨 `text-caption font-semibold text-neutral-500 uppercase tracking-[0.06em]`. 금액 입력은 `<Input currency>`. 일반 인풋 `<Input>`. 버튼 `<Button>`
- **R1 가드**: 변경 전 `git diff --stat HEAD~1 HEAD -- app/calculator/page.tsx` 캡처. 계산 함수/state hook/`useEffect`/이벤트 핸들러 영역 표시 — 그 영역은 **읽기 전용**
- **검증**: tsc 0 / lint 0 / 페이지 로드 정상 / `grep "neo-\|accent-orange\|accent-yellow\|accent-cyan\|accent-pink\|border-\[3px\]\|shadow-\[(2|4|8)px" app/calculator/page.tsx` 0건
- **의존**: 부모 plan T1~T8 (토큰/컴포넌트)

### T2: calculator 결과 카드 + 환급액 강조 (10-15분)

- **파일**: `app/calculator/page.tsx`
- **변경**: 환급액 표시 카드는 `<Card variant="raised">` + 환급액 `text-mono-display tabular-nums text-success` (또는 Mint dark). `formatKRWWithUnit`로 `120万원` 한자 단위 보조. neo-card / 형광 강조 모두 제거
- **검증**: tsc 0 / lint 0 / 사용자 동일 입력 → 동일 결과 (콘솔/dev 서버에서 표시 값 직접 비교)
- **의존**: T1

### T3: calculator 단독 커밋 + 회귀 1차 검증 (5분)

- **파일**: 없음 (커밋 only)
- **변경**: `git add app/calculator/page.tsx && git commit -m "feat(design): calculator 시각 교체 (T21 follow-up)"`
- **검증**: 단일 커밋 단위로 격리되어 revert 안전성 확보. 사용자가 dev 서버에서 입력→결과 회귀 1라운드
- **의존**: T2

### T4: admin 시각 교체 (25-35분)

- **파일**: `app/admin/page.tsx`
- **변경**:
  - 컨테이너 `max-w-7xl mx-auto px-4 py-8` + `bg-background`
  - 엑셀 업로드 박스: 점선 `border-2 border-dashed border-neutral-200 rounded-lg`, 호버 `border-primary` (neo-card+형광 강조 제거)
  - 카드 분류 탭: `<Button variant="ghost">` + active 시 `border-b-2 border-primary`
  - 데이터 표: `rounded-lg border border-neutral-200 overflow-x-auto`, `bg-neutral-50` 헤더 + `text-caption font-semibold text-neutral-500 uppercase tracking-[0.06em]`, 행 `border-b border-neutral-200 last:border-b-0 hover:bg-neutral-50`, 셀 `py-2 px-3 text-body-sm` (또는 mono+tabular for 숫자)
  - 액션 버튼: `<Button variant="ghost" size="sm">` 또는 `danger` for 삭제
  - Badge: `type=` deprecated 호출은 `variant=` 명시로 교체 (high→danger, medium→warning, low→neutral, new→success)
- **검증**: tsc 0 / lint 0 / `grep "neo-\|accent-orange\|accent-yellow\|accent-cyan\|accent-pink\|border-\[3px\]\|shadow-\[(2|4|8)px" app/admin/page.tsx` 0건
- **의존**: T3

### T5: admin 단독 커밋 + 회귀 검증 (5분)

- **파일**: 없음
- **변경**: `git add app/admin/page.tsx && git commit -m "feat(design): admin 시각 교체 (T22 follow-up)"`
- **검증**: dev 서버 어드민 진입 → 엑셀 업로드 / 카드 분류 / CRUD 동작 회귀 검수
- **의존**: T4

### T6: 전체 잔재 grep 0건 + 사용자 시각 회귀 게이트 (15-20분)

- **파일**: 없음 (검증 + 사용자 액션)
- **변경**: 다음 grep 모두 0건
  - `grep -rn "neo-\(btn\|card\|input\|badge\|nav-item\|orange\|yellow\|cyan\|pink\)" --include="*.tsx" --include="*.ts" --include="*.css" app components lib`
  - `grep -rEn "border-\[3px\]" --include="*.tsx" --include="*.ts" --include="*.css" app components lib`
  - `grep -rEn "shadow-\[(2|4|8)px_(2|4|8)px" --include="*.tsx" --include="*.ts" --include="*.css" app components lib`
  - `grep -rn "TAXAI\|font-head\|font-lexend\|radial-gradient" --include="*.tsx" --include="*.ts" --include="*.css" app components lib`
- **사용자 검수**: 13페이지 순회 + 모바일(360/768/1280) 반응형 + "은행 앱처럼 안심된다" 시각 평가
- **검증**: 사용자 OK 사인. 회귀 발견 시 해당 페이지 단독 fix 커밋
- **의존**: T5

## 리스크

### R1 (HIGH): calculator 계산 로직 회귀
- **완화**: T1에서 계산 영역을 읽기 전용으로 표시. 단일 커밋 격리(T3). 사용자가 변경 전·후 동일 입력 → 동일 환급액 검증 1회 이상

### R2 (MED): admin Badge `type=` 어댑터 의미 매핑 오류
- **완화**: T4에서 어댑터 호출 모두 새 variant로 명시 교체. 매핑(high→danger 등)이 의도와 어긋나면 revert 후 사용자 합의

### R3 (LOW): admin 페이지 3105줄 작업 중 무관 코드 우발 변경
- **완화**: T4 작업 단위를 섹션별(업로드/탭/표/액션)로 분할 가능. 작업 전 `git diff --stat` 캡처

## 진행 추적

| 단계 | 상태 | 검증 결과 |
|------|------|-----------|
| T1 calculator 시각 교체 | pending | tsc 0 / lint 0 / grep 0 |
| T2 결과 카드 강조 | pending | 동일 입력 → 동일 환급액 |
| T3 calculator 커밋 | pending | 단일 커밋 격리 |
| T4 admin 시각 교체 | pending | tsc 0 / lint 0 / grep 0 |
| T5 admin 커밋 | pending | dev 서버 CRUD 회귀 |
| T6 전체 잔재 + 시각 회귀 | pending | grep 0건 + 사용자 OK |

**예상 시간**: 80-110분 작업 + 사용자 검수 별도. 총 6시간(R1/R2/R3 우발 비용 포함).

**병행 권장 follow-up** (별도 plan):
- prod build prerender 이슈 (`<Html> outside _document`, Next 15.5.15) — main 브랜치에도 존재
- TDD enforce hook strict 복원 (디자인 작업 한정 warn → strict 되돌림)
- (옵션) 디자이너 협업 로고 SVG 재작업 — DESIGN.md §9 옵션 B 의뢰
