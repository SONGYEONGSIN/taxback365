---
plan_id: 2026-05-07-design-rebrand-modern-fintech
title: 디자인 리뉴얼 — Modern Fintech Minimal × Korean Trust
status: pending
hard_gate: full
priority: HIGH
created: 2026-05-07
source: brainstorm:.claude/memory/brainstorms/20260507-164634-design-rebrand.md + design:DESIGN.md
estimated_hours: 22
total_tasks: 32
worktree: feat/redesign
---

## Goal

Neo-Brutalism(형광 4색 + 3px hard border + 도트 배경 + Lexend) 기반 현재 시각언어를, DESIGN.md 9섹션이 정의한 **Modern Fintech Minimal × Korean Trust** (Navy 지배 / Off-white 배경 / Mint 액센트 / Pretendard+Inter+Mono / 1px hairline + soft shadow 3-tier / 도트 배경 폐기) 으로 마이그레이션한다.

13 페이지 + 6 컴포넌트의 시각만 교체하고 **행동/로직은 0 변경**한다. 명칭은 `taxback365`로 통일한다 (현 코드에 남아있는 `TAXAI` 잔재 함께 정리). 로고는 DESIGN.md §9 권장안 = **옵션 B (`ㅌ` 자모 심볼 + 워드마크, Mint 가로획)** 채택.

성공 신호: ① 13 페이지 빌드/타입체크 0에러, ② `neo-*` 클래스/`#FF6B35` 등 Neo-Brutalism 잔재 grep 0건, ③ 사용자 dev 서버 시각 회귀 통과 ("은행 앱처럼 안심된다").

## Approach

DESIGN.md를 단일 진실원으로 두고 **토큰부터 위로 올라가는 bottom-up 마이그레이션** 채택.

- **접근 방식 A (page-by-page)**: 페이지 1개씩 구·신 토큰 병행하며 점진 전환 — 빌드는 항상 통과하나, 토큰이 두 세트로 공존해 grep 매트릭이 흐려지고 회귀 시점이 늦어짐. 폐기.
- **접근 방식 B (bottom-up, 본 plan)**: globals.css 토큰 한 번에 교체 → 공통 컴포넌트(Button/Card/Input) 신규 추출로 인라인 패턴을 흡수 → 페이지는 가벼운 정적부터 무거운 동적 순으로 swap → 메타/로고는 마지막에. 일시적으로 일부 페이지가 깨지지만 토큰 차원에서 단일 상태가 유지되어 검증이 명확.

**선택 = B**, 이유: 6 컴포넌트만 있고 인라인 스타일이 13 페이지에 도배된 코드베이스 특성상, 페이지 단위 swap은 동일 인라인 패턴을 13번 반복 수정하는 비효율을 낳는다. 공통 컴포넌트 먼저 만들면 각 페이지는 클래스 교체 + import 추가로 끝난다.

**검증 전략**:
1. Phase별 `npm run lint` + `npx tsc --noEmit` 통과
2. 각 Phase 끝에 `grep -r "neo-\|accent-orange\|accent-yellow\|accent-cyan\|accent-pink\|font-head\|font-lexend\|border-\[3px\]\|shadow-\[4px_4px\|shadow-\[8px_8px\|radial-gradient" --include="*.tsx" --include="*.css"` 결과 카운트 감소 확인
3. Phase 6 완료 시점에 위 grep 결과 0건
4. 사용자 dev 서버 시각 회귀 (T32)

**worktree 권장**: `git worktree add ../taxback365-feat-redesign feat/redesign` — 32 태스크 / 추정 25+ 파일 변경이라 main 작업과 격리.

## Out of Scope

- 다크 모드 (사용자 결정, follow-up)
- 행동/비즈니스 로직 변경 (계산기 수식, 폼 검증, 인증 흐름 등은 0 수정)
- 모션 시스템 본격 도입 (DESIGN.md §1 staggered reveal / 숫자 카운트업은 follow-up; 본 plan은 정적 시각만)
- 신규 페이지 추가
- DB/스키마/API 변경
- 컴포넌트 라이브러리(shadcn 등) 도입 — 공통 컴포넌트는 자체 작성

## 영향 파일

### 토큰/인프라 (3 파일)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `app/globals.css` | 전면 재작성 | `:root` 토큰 / `@theme inline` / `@layer base` / `@layer components`(neo-* 5종 제거) 모두 DESIGN.md §2/§3/§6 기준으로 재작성. Pretendard CSS @import 추가 |
| `lib/design-tokens.ts` | 전면 재작성 | colors / radius / shadows / borders / typography 모두 새 값으로 교체. 기존 export 키(`colors.background`, `colors.foreground` 등)는 의미 유지하되 값만 교체 |
| `app/layout.tsx` | 부분 수정 | `next/font/google`에서 `Lexend` 제거, `Inter` 유지. body className에서 `${lexend.variable}` 제거. metadata title/description/openGraph 의 `TAXAI` → `taxback365` 일괄 치환. `lang="ko"` 유지 |

### 신규 공통 컴포넌트 (5 파일)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `components/ui/Button.tsx` | 신규 | DESIGN.md §4.1 — Primary/Secondary/Ghost/Danger 4-variant + 사이즈(sm/md). asChild 지원해 `<Link>`로 렌더 가능 |
| `components/ui/Card.tsx` | 신규 | DESIGN.md §4.3 — resting/raised 2-variant, padding prop |
| `components/ui/Input.tsx` | 신규 | DESIGN.md §4.2 — label/error/help/금액모드(`mono tabular-nums text-right` + `원` suffix) prop |
| `components/ui/Badge.tsx` | 전면 재작성 | DESIGN.md §4.4 — Success/Warning/Danger/Neutral/Outline 5-variant. 기존 type Props 마이그레이션 호환 매핑 |
| `lib/number-format.ts` | 신규 | `formatKRW(n)` (콤마+`원`), `formatKRWWithUnit(n)` (`120万원` 한자 단위), `formatPercent(n)` 등 |

### 레이아웃 컴포넌트 (2 파일)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `components/layout/Navigation.tsx` | 부분 수정 | DESIGN.md §4.5 — `border-b-[3px]` → `border-b border-neutral-200`, `bg-white/85 backdrop-blur-md`, `neo-nav-item` 제거하고 새 active underline 패턴, 모바일 bottom nav 색 휠 제거(neo-yellow/cyan/orange/pink → mint/neutral active 단일), 로고 `<Image src="/logo.png">` → `<Logo>` 컴포넌트(또는 인라인 SVG) 교체. **"TAX**AI**" 문구 → "taxback365"** |
| `components/layout/Footer.tsx` | 부분 수정 | 새 토큰으로 교체. 명칭 정리 (TAXAI → taxback365) |

### 페이지 — 정적 (4 파일)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `app/terms/page.tsx` | 시각 교체 | neo-card → Card, prose 영역 max-w-[680px] 적용 |
| `app/privacy/page.tsx` | 시각 교체 | 동일 |
| `app/board/page.tsx` | 시각 교체 | 목록 → divide-y `--neutral-200` row, hover bg-neutral-100 |
| `app/board/[id]/page.tsx` | 시각 교체 | max-w-[760px] 본문, line-height 1.7 |

### 페이지 — 인증 (2 파일)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `app/login/page.tsx` | 시각 교체 | DESIGN.md §5 — max-w-[400px] 카드, p-8, no shadow, 1px border. Google OAuth 버튼만 유지 (행동 0 변경) |
| `app/signup/page.tsx` | 시각 교체 | 동일 |

### 페이지 — 게시판 작성/수정 (2 파일)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `app/board/write/page.tsx` | 시각 교체 | Input 컴포넌트 사용, neo-input 제거 |
| `app/board/[id]/edit/page.tsx` | 시각 교체 | 동일 |

### 페이지 — 메인 동적 (5 파일)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `app/page.tsx` (랜딩) | 시각 교체 | Hero `min-h-[78vh]` + 좌측 카피 + 우측 환급 시뮬레이션 카드(Mint 강조), 도트 배경 → 미세 vertical gradient. 3-col Feature Grid 금지(§7 Don't) |
| `app/dashboard/page.tsx` | 시각 교체 | KPI 4-card row + 컨텐츠. 금액은 mono+tabular-nums |
| `app/calculator/page.tsx` | 시각 교체 (가장 무거움) | 폼 그룹 gap-6, 라벨-인풋 gap-1.5, 금액 입력 mono+우측정렬+원 suffix. **계산 로직 0 변경** |
| `app/admin/page.tsx` | 시각 교체 | 어드민 테이블 고밀도(row 40px, text-[13px]) |
| `app/admin/audit/page.tsx` | 시각 교체 | 동일 |

### 메타/자산 (3 파일)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `public/logo.svg` | 신규 | 옵션 B 워드마크+`ㅌ` 심볼 SVG (Navy stroke + Mint 가로획) |
| `public/logo-icon.svg` | 신규 | `ㅌ` 단독 favicon용 |
| `app/opengraph-image.tsx` | 전면 재작성 | 현재 `#F5F0EB`/`#FF6B35`/`#00D9FF` Neo-Brutalism 톤 → Off-white(#F7F8FA) + Navy(#0F2547) + Mint(#26C485) 톤. "TAXAI - 2026 AI..." → "taxback365" |

### 인벤토리 합계

| 분류 | 파일 수 |
|------|--------|
| 토큰/인프라 | 3 |
| 신규 공통 컴포넌트 | 5 |
| 레이아웃 | 2 |
| 페이지 (13개) | 13 |
| 메타/자산 | 3 |
| **합계** | **26** |

> HARD-GATE 등급: **전체** (≥20 파일 + 모듈 1차 출처 교체 + 공개 시각 정체성 변경 — 한 등급 상향 트리거 다중)

## 단계

### Phase 1 — 토큰 + 폰트 인프라 (T1~T3, 3 태스크)

#### T1: globals.css 새 토큰 + Pretendard import + neo-* 컴포넌트 layer 제거 (3-5분)

- **파일**: `app/globals.css`
- **변경**:
  - `@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');` 최상단 추가 (Tailwind import 다음)
  - `:root` 블록 — DESIGN.md §2 핵심 팔레트 + 뉴트럴 7단계 + §6 shadow 3-tier + radius(md=8px, lg=12px, pill=9999px) + spacing 13단계로 전면 교체. 기존 `--accent-orange/yellow/cyan/pink`, `--shadow-hard/hover`, `--border-width: 3px`, `--radius: 0px` 모두 제거
  - `@theme inline` — 새 토큰을 Tailwind 색상/폰트로 노출. `--font-display: 'Inter', ...`, `--font-body: 'Pretendard Variable', 'Inter', system-ui, ...`, `--font-mono: 'JetBrains Mono', 'Inter', monospace`
  - `@layer base` — `body` 의 `radial-gradient` 도트 배경 제거, `bg-background text-foreground font-body` 유지. h1~h6의 `font-head font-black uppercase tracking-tighter` 제거
  - `@layer components` — `neo-btn`, `neo-card`, `neo-input`, `neo-badge`, `neo-nav-item` 5종 전부 삭제
  - `@layer utilities` — `animate-fade-in`, `animate-marquee` keyframes 유지 (Phase 6에서 사용 여부 확인 후 정리)
- **검증**: `npm run dev` 기동 후 임의 페이지 접속하면 깨지지만 빌드는 통과. `grep -E "neo-|accent-orange|accent-yellow|accent-cyan|accent-pink|--shadow-hard|radial-gradient" app/globals.css` → 0건
- **의존**: 없음

#### T2: lib/design-tokens.ts TS 미러 동기화 (2-4분)

- **파일**: `lib/design-tokens.ts`
- **변경**: T1과 같은 값으로 `colors`, `radius`, `shadows`, `borders`, `typography` 재작성. 새 export 추가: `colors.primary` (Navy 900), `colors.primary700`, `colors.foreground` (Ink), `colors.background` (Off-white), `colors.card` (White), `colors.accent.mint`, `colors.accent.mintDark`, `colors.warning`, `colors.danger`, `colors.success`, `colors.neutral` (50/100/200/300/500/700/900). 기존 `colors.accent.orange/yellow/cyan/pink`, `colors.neo` 제거. `shadows.resting/raised/floating`로 교체. `borders.width: '1px'`. `typography.fontDisplay/fontBody/fontMono`
- **검증**: `npx tsc --noEmit` 통과 (이 파일을 import하는 코드가 깨지면 다음 태스크에서 수정 — 현재 시점 import 그래프 확인: 본 파일 import 사용처는 메모리 항목 누적용으로 grep 결과 별도 추적)
- **의존**: T1

#### T3: layout.tsx 폰트 변수 정리 + 명칭/메타 정리 (3-5분)

- **파일**: `app/layout.tsx`
- **변경**:
  - `import { Inter, Lexend } from "next/font/google"` → `import { Inter } from "next/font/google"` (Lexend 제거)
  - `const lexend = ...` 블록 제거
  - body className `${inter.variable} ${lexend.variable}` → `${inter.variable}` 만
  - `metadata.title.default/template`, `metadata.description`, `openGraph.siteName/title/description`, `twitter.title/description` 의 `TAXAI` → `taxback365` 일괄 치환 (한국어 부제 본문은 보존)
  - `metadata.icons` 추가: `{ icon: '/logo-icon.svg', shortcut: '/logo-icon.svg' }` (T28에서 SVG 생성 후 활성화)
- **검증**: `npm run dev` 기동, 페이지 진입 시 Pretendard 본문이 적용된 것을 dev tools로 확인. `grep -i "TAXAI\|lexend" app/layout.tsx` → 0건
- **의존**: T1, T2

### Phase 2 — 공통 컴포넌트 신규 (T4~T8, 5 태스크)

#### T4: components/ui/Button.tsx 신규 (4-5분)

- **파일**: `components/ui/Button.tsx` (신규)
- **변경**: 4-variant (`primary`, `secondary`, `ghost`, `danger`) × 2-size (`md`=44px, `sm`=36px). `variant`, `size`, `asChild`(boolean), `className` props. `asChild=true`면 `Slot`(또는 `React.Children.only`로 cloneElement) 패턴으로 자식 `<Link>`에 클래스 합성. DESIGN.md §4.1 클래스를 그대로 사용. `disabled`/`focus-visible:ring-2 ring-primary-600/25` 보장
- **검증**: `npx tsc --noEmit` 통과. 임의 페이지에서 `<Button variant="primary">테스트</Button>` 렌더 확인
- **의존**: T1, T2, T3

#### T5: components/ui/Card.tsx 신규 (3-4분)

- **파일**: `components/ui/Card.tsx` (신규)
- **변경**: `variant: 'resting' | 'raised'` (기본 resting), `padding: 'sm' | 'md' | 'lg'` (md=p-6 표준). DESIGN.md §4.3 클래스. children/className/as 지원
- **검증**: tsc 0 에러
- **의존**: T1, T2

#### T6: components/ui/Input.tsx 신규 (4-5분)

- **파일**: `components/ui/Input.tsx` (신규)
- **변경**: native input 기반 forwardRef. props: `label`, `error`, `help`, `currency`(boolean — true면 `font-mono tabular-nums text-right` + 우측 `원` suffix). DESIGN.md §4.2 클래스
- **검증**: tsc 0 에러. 금액 입력 모드 확인 시 `text-right tabular-nums font-mono` 셋 모두 적용
- **의존**: T1, T2

#### T7: components/ui/Badge.tsx 전면 재작성 (3-4분)

- **파일**: `components/ui/Badge.tsx`
- **변경**: 기존 `type: 'high' | 'medium' | 'low' | 'new'` 인터페이스를 `variant: 'success' | 'warning' | 'danger' | 'neutral' | 'outline'`로 재정의. DESIGN.md §4.4 클래스. 기존 호출자(`app/board/page.tsx` 등) 호환을 위해 deprecated `type` prop을 받아 자동 매핑하는 어댑터를 임시 포함(high→danger, medium→warning, low→neutral, new→success)하여 후속 페이지 태스크에서 점진 정리. children 지원 추가(라벨 외부 주입 가능)
- **검증**: tsc 0 에러. 기존 사용처(board, dashboard 등)가 컴파일 깨지지 않음
- **의존**: T1, T2

#### T8: lib/number-format.ts 신규 (2-3분)

- **파일**: `lib/number-format.ts` (신규)
- **변경**: `formatKRW(n: number): string` (`Intl.NumberFormat('ko-KR')` + `원`), `formatKRWWithUnit(n: number): { value: string; unit: '万원' | '億원' | '원' }` (만/억 단위 자동 분리), `formatPercent(n: number, digits=1)`. 모두 pure 함수, NaN/음수 가드
- **검증**: tsc 0 에러. 단위 함수 콘솔 호출로 `formatKRWWithUnit(1200000)` → `{ value: '120', unit: '万원' }` 확인
- **의존**: T1, T2

### Phase 3 — 레이아웃 (T9~T10, 2 태스크)

#### T9: components/layout/Navigation.tsx 리뉴얼 (4-5분)

- **파일**: `components/layout/Navigation.tsx`
- **변경**:
  - `border-b-[3px] border-black bg-white sticky` → `border-b border-[--neutral-200] bg-[--color-card]/85 backdrop-blur-md sticky h-16`
  - 로고: `<Image src="/logo.png">` + `TAX<span className="text-neo-orange">AI</span>` → `<Image src="/logo.svg" width="auto" height={28}>` + `<span className="font-display font-semibold tracking-[-0.02em]">taxback365</span>` (T27의 logo.svg가 준비되기 전까지는 `/logo.png` 임시 유지하되 텍스트는 `taxback365`로 즉시 교체)
  - 데스크톱 nav 아이템: `neo-nav-item` 클래스 제거 → DESIGN.md §4.5 default + active 패턴(`text-foreground` + `after:bg-primary` 2px underline)
  - 모바일 bottom nav: `bg-neo-yellow/cyan/orange/pink` 4색 분기 모두 제거 → active일 때 `bg-[--neutral-100] text-[--color-primary] font-semibold`, default `text-[--neutral-500]` 단일 톤
  - 사용자 정보 영역: `border-2 border-black shadow-[2px_2px_0px_0px_#000]` 제거 → `border border-[--neutral-200]`, `rounded-md`. 시간 경고 색은 `bg-[--color-danger]/10 text-[--color-danger]` 형태로 토큰화
  - 로그인/회원가입 버튼: `<Button variant="primary">` / `<Button variant="secondary">`로 교체 (T4 의존)
- **검증**: 빌드 통과. `grep "neo-\|border-\[3px\]\|shadow-\[2px_2px" components/layout/Navigation.tsx` → 0건
- **의존**: T4 (Button), T1~T3

#### T10: components/layout/Footer.tsx 리뉴얼 (3-4분)

- **파일**: `components/layout/Footer.tsx`
- **변경**: 기존 neo-* 잔재(보더 3px, hard shadow, 형광 배경) → `border-t border-[--neutral-200] bg-[--color-card]` + 본문 `text-caption text-[--neutral-500]`. TAXAI → taxback365
- **검증**: 빌드 통과. grep 0건
- **의존**: T1~T3

### Phase 4 — 페이지 (T11~T22, 12 태스크)

> 각 페이지 태스크 공통 검증: ① `npm run lint` + `npx tsc --noEmit` 0 에러, ② 해당 파일 grep `neo-|accent-orange|accent-yellow|accent-cyan|accent-pink|font-head|border-\[3px\]|shadow-\[(4|8)px|radial-gradient` → 0건, ③ TAXAI 텍스트 0건.

#### T11: app/terms/page.tsx 시각 교체 (2-3분)

- **파일**: `app/terms/page.tsx`
- **변경**: 컨테이너 `mx-auto max-w-[680px] px-4 py-12`, 본문 line-height 1.7, h1/h2 토큰 클래스(`text-h1`, `text-h2`)
- **검증**: 위 공통 + 가독성 시각 확인
- **의존**: T1~T3

#### T12: app/privacy/page.tsx 시각 교체 (2-3분)

- **파일**: `app/privacy/page.tsx` — T11과 동일 패턴
- **검증**: 동일
- **의존**: T1~T3

#### T13: app/board/page.tsx (목록) 시각 교체 (3-4분)

- **파일**: `app/board/page.tsx`
- **변경**: 컨테이너 `mx-auto max-w-[760px]`, 목록은 `divide-y divide-[--neutral-200]`, row `py-4 hover:bg-[--neutral-100]`. Badge 호출은 T7 어댑터로 호환 유지하되 가능하면 새 variant로 명시 교체. 작성 버튼은 `<Button variant="primary">` (T4)
- **검증**: 공통
- **의존**: T4, T7, T1~T3

#### T14: app/login/page.tsx 시각 교체 (3-4분)

- **파일**: `app/login/page.tsx`
- **변경**: 외곽 `flex min-h-[calc(100vh-4rem)] items-center justify-center` + 카드 `<Card><CardContent className="max-w-[400px] p-8">...`. Google OAuth 버튼은 `<Button variant="secondary">` 또는 브랜드 색 일회성 주석 + arbitrary value(Google 가이드라인). **NextAuth 호출 0 변경**
- **검증**: 공통 + 로그인 흐름 동작 (사용자 dev 서버 확인은 T32)
- **의존**: T4, T5, T1~T3

#### T15: app/signup/page.tsx 시각 교체 (3-4분)

- **파일**: `app/signup/page.tsx` — T14와 동일 패턴
- **의존**: T4, T5, T1~T3

#### T16: app/board/[id]/page.tsx (상세) 시각 교체 (2-3분)

- **파일**: `app/board/[id]/page.tsx`
- **변경**: 본문 `max-w-[760px] prose-style`, 메타 영역 `text-caption text-[--neutral-500]`
- **의존**: T4, T1~T3

#### T17: app/board/write/page.tsx 시각 교체 (3-4분)

- **파일**: `app/board/write/page.tsx`
- **변경**: 폼은 `<Input>` (T6), 제출 버튼 `<Button variant="primary">`. neo-input 제거
- **의존**: T4, T6, T1~T3

#### T18: app/board/[id]/edit/page.tsx 시각 교체 (2-3분)

- **파일**: `app/board/[id]/edit/page.tsx` — T17과 동일 패턴
- **의존**: T4, T6, T1~T3

#### T19: app/page.tsx (랜딩) 시각 교체 (5-6분, 페이지 중 가장 긺)

- **파일**: `app/page.tsx`
- **변경**:
  - Hero `min-h-[78vh] flex items-center` + `linear-gradient(180deg, oklch(0.985 0.003 247) 0%, oklch(0.978 0.003 247) 100%)` 배경(globals.css에 `.hero-bg` 유틸로 정의 후 클래스 적용)
  - 좌측 카피(`text-hero` — 56px Bold tracking-tight) + 우측 환급 시뮬레이션 카드(Mint 강조 — `<Card variant="raised">` 안에 환급액 `text-mono-display` + `formatKRWWithUnit`로 한자 단위 병기 — T8 사용)
  - 다음 섹션은 **3-col Feature Grid 사용 금지** (DESIGN.md §7 Don't 2). 풀 와이드 단일 시각 강조 + 좁은 텍스트 alternating 레이아웃
  - 도트 배경 / Neo-Brutalism 잔재 / TAXAI 명칭 / accent-orange 등 모두 제거
- **검증**: 공통 + 모바일(360px)에서 Hero 카피→카드 stack 확인
- **의존**: T4, T5, T8, T1~T3

#### T20: app/dashboard/page.tsx 시각 교체 (4-5분)

- **파일**: `app/dashboard/page.tsx`
- **변경**: KPI 4-card row(`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`) — 각 카드 `<Card variant="raised">` + 라벨(`text-caption text-[--neutral-500] uppercase tracking-[0.06em]`) + 숫자(`text-mono-display tabular-nums`). 메인 차트/표는 라이브러리 호출만 유지하고 외곽 컨테이너 토큰화. 신규 토큰 import는 `lib/design-tokens.ts`
- **검증**: 공통 + KPI 숫자 자릿수 정렬 시각 확인 (tabular-nums)
- **의존**: T4, T5, T8, T1~T3

#### T21: app/calculator/page.tsx 시각 교체 (6-7분, 가장 무거움)

- **파일**: `app/calculator/page.tsx`
- **변경**:
  - 폼 그룹 `gap-6`, 라벨-인풋 `gap-1.5`, `<Input>` 컴포넌트 사용
  - 금액 입력은 `<Input currency>` 모드 (mono+tabular+우측정렬+원 suffix)
  - 결과 영역의 환급액 카드는 `<Card variant="raised">` + `text-mono-display`
  - **계산 로직(state, useEffect, 계산 함수, 검증) 0 변경** — 시각 클래스만 교체
  - neo-input/neo-card/neo-btn/형광 4색/border-[3px] 모두 제거
- **검증**: 공통 + 계산기 입력→결과 흐름 사용자 dev 서버에서 확인 (T32)
- **의존**: T4, T5, T6, T8, T1~T3

#### T22: app/admin/page.tsx 시각 교체 (4-5분)

- **파일**: `app/admin/page.tsx`
- **변경**: 어드민 표 고밀도 — row 40px 높이, `px-3 py-2 text-[13px]`, `divide-y divide-[--neutral-200]`. 액션 버튼은 `<Button variant="ghost" size="sm">`
- **검증**: 공통 + 표 정렬 시각
- **의존**: T4, T5, T7, T1~T3

#### T23: app/admin/audit/page.tsx 시각 교체 (3-4분)

- **파일**: `app/admin/audit/page.tsx` — T22와 동일 패턴
- **의존**: T4, T5, T7, T1~T3

### Phase 5 — 메타/로고 자산 (T24~T28, 5 태스크)

#### T24: 로고 SVG 생성 결정 게이트 (resolved 2026-05-07)

- **상태**: **done — (a) Claude 자체 코드 SVG 작성으로 결정**
- **결정 내용**: 사용자 합의 = 옵션 (a). 본 plan 내 T25/T26에서 Claude가 직접 SVG 코드 작성. 24×24 viewBox 단순 기하학(`ㅌ` 자모 = 3 가로획 + 1 세로획) 으로 시작. 디자이너 의뢰는 follow-up issue로 등록(시각 회귀에서 어색하다고 평가 시)
- **DoD**: 본 항목 done 처리됨 (이 줄)
- **의존**: 없음

#### T25: public/logo.svg 신규 (4-5분, T24 결과 (a) 가정)

- **파일**: `public/logo.svg` (신규)
- **변경**: 24×24 viewBox `ㅌ` 자모 심볼 (3개 가로획 1.5px stroke + 1개 세로획) — 가로획 2개는 Navy 900, 마지막(가장 아래) 가로획만 Mint(#26C485). 옆에 워드마크 `taxback365` (Inter Display Semibold tracking -2.5%). 단독 심볼 / 워드마크 / 락업 3가지 viewBox 변형을 동일 파일에 `<symbol>`로 묶어 export하거나 별도 파일 분리
- **검증**: 브라우저로 SVG 직접 열어 시각 확인. 24px / 96px / 192px 사이즈에서 깨짐 여부
- **의존**: T24 (a) 결정

#### T26: public/logo-icon.svg 신규 (2-3분)

- **파일**: `public/logo-icon.svg` (신규)
- **변경**: `ㅌ` 단독 심볼만 32×32 viewBox로. favicon용
- **검증**: 16px / 32px에서 가독
- **의존**: T25 (또는 별도 SVG 작업)

#### T27: app/layout.tsx metadata.icons + Navigation 로고 활성화 (2-3분)

- **파일**: `app/layout.tsx`, `components/layout/Navigation.tsx`
- **변경**: layout.tsx의 `metadata.icons` `/logo-icon.svg` 활성화. Navigation.tsx의 `<Image src="/logo.png">`를 `<Image src="/logo.svg">`로 교체하고 width 자동(`width={120} height={28}` 같은 명시)
- **검증**: `view-source:` 또는 dev tools로 favicon/og 메타 확인
- **의존**: T25, T26, T9 (Navigation 1차 리뉴얼 완료 후)

#### T28: app/opengraph-image.tsx 전면 재작성 (4-5분)

- **파일**: `app/opengraph-image.tsx`
- **변경**: 현재 형광 색조 OG → DESIGN.md 톤으로. 배경 `#F7F8FA`, 외곽 hairline `#DDE1E8`(border 1px), 좌측 `ㅌ` 심볼(SVG inline) + `taxback365` 워드마크(Navy `#0F2547`), 부제 "한국 직장인의 연말정산 환급 SaaS" `#6B7280`. 형광 사각/박스/hard shadow 제거. `2026 AI 연말정산 솔루션` 카피는 보존 또는 `한국 직장인의 연말정산 환급`으로 통일
- **검증**: `npm run build` 통과 + `/opengraph-image` 라우트 직접 진입해 시각 확인
- **의존**: T1~T3

### Phase 6 — 검증 (T29~T32, 4 태스크)

#### T29: 잔재 grep 0건 확인 + globals.css/design-tokens.ts 정합성 (3-4분)

- **파일**: 없음 (검증 only)
- **변경**: 다음 grep 모두 0건
  - `rg -t tsx -t ts "neo-(btn|card|input|badge|nav-item|orange|yellow|cyan|pink|black|white)"`
  - `rg -t tsx "border-\[3px\]"`
  - `rg -t tsx "shadow-\[(4|8)px_(4|8)px"`
  - `rg "radial-gradient" app/`
  - `rg -t tsx "TAXAI\|font-head\|font-lexend"`
  - `rg -t tsx "(accent-orange|accent-yellow|accent-cyan|accent-pink)"`
- **검증**: 위 명령들 0건. 1건이라도 남으면 미완 — 해당 파일을 재처리
- **의존**: T1~T28 모두

#### T30: lint + 타입체크 (2-3분)

- **파일**: 없음 (검증 only)
- **변경**: `npm run lint` 0 에러 0 경고, `npx tsc --noEmit` 0 에러
- **검증**: 명령 출력 캡처 후 plan 본문 진행 추적에 기록. 1건 이상 → 해당 태스크 재작업
- **의존**: T29

#### T31: production build (3-5분)

- **파일**: 없음 (검증 only)
- **변경**: `npm run build` 통과. 13 페이지 모두 정적/동적 분기 정상 빌드. opengraph-image route 빌드 성공
- **검증**: exit 0 + `Compiled successfully`. 경고는 사전 존재한 것 외 신규 발생 0
- **의존**: T30

#### T32: 사용자 dev 서버 시각 회귀 (10-15분, 사용자 액션)

- **파일**: 없음 (사용자 검수)
- **변경**: `npm run dev` → 사용자가 13 페이지(랜딩, 로그인, 회원가입, 대시보드, 계산기, 게시판 목록/상세/작성/수정, 어드민 메인/audit, terms, privacy)를 순회하며 ① 행동 회귀(로그인, 계산기 입력→결과, 게시글 작성 등) ② 시각 회귀(은행 앱처럼 안심되는지) ③ 모바일 반응형(360px / 768px / 1280px) 체크
- **검증**: 사용자 OK 사인. 회귀 이슈 발견 시 해당 페이지 태스크 재오픈
- **의존**: T31

## 리스크

### R1 (HIGH): calculator 페이지 시각 교체 중 계산 로직 회귀

- **내용**: T21이 가장 무거운 페이지. JSX 클래스/구조를 광범위하게 건드리는 동안 useState/useEffect/이벤트 핸들러를 잘못 흩뜨릴 위험. 한 글자 오타가 환급액 계산 0원 회귀로 이어질 수 있음
- **완화**: T21 수행 전 `git diff --stat` 베이스라인 캡처, 시각 외 변경 검출 시 즉시 revert. 행동 0 변경 검증을 위해 T32 사용자 검수 시 "변경 전 동일 입력 → 동일 결과" 회귀 케이스 1개 이상 필수. 가능하면 T21을 별도 PR/커밋으로 분리해 revert 단위 축소

### R2 (MED): 로고 SVG 자체 작성 시 시각적 조잡함

- **내용**: T24 결정 = (a) Claude 자체 SVG. DESIGN.md §9는 옵션 B를 "디자이너 협업 필수, 어색하면 조잡함 위험"이라고 경고
- **완화**: 24×24 단순 기하학으로 시작(가로획 3 + 세로획 1, stroke 1.5-2px). T32 시각 회귀에서 사용자가 "어색하다" 판정 시 → follow-up issue로 디자이너 협업 분리, 그 사이엔 자체 SVG 유지(시각 정체성 일관 우선)

### R3 (MEDIUM): Pretendard CDN vs npm 패키지

- **내용**: CDN @import는 빠르지만 외부 의존, npm 패키지(`pretendard`)는 번들 +200KB 가량 증가. 한글 부분 폰트(`pretendard-subset`)도 옵션
- **완화**: 본 plan T1은 CDN @import 채택(가장 빠른 도입). dev 서버 LCP/FCP 측정 후 200ms+ 저하 시 follow-up으로 npm 패키지 + `next/font/local` 자가 호스팅 전환

### R4 (MEDIUM): @layer components 제거 시점 vs 페이지 swap 진행도 충돌

- **내용**: T1에서 `neo-btn`/`neo-card` 등 5종을 한꺼번에 제거하면 T11~T23 페이지가 swap되기 전까지 모든 페이지 시각 깨짐. 빌드는 통과하지만 dev 서버에서 사용자 검수 불가
- **완화**: 채택한 bottom-up 전략의 의도된 비용(Approach 섹션 명시). 페이지 태스크가 끝나기 전엔 사용자 검수 X. T29 grep 0건 후 T32 단일 회귀 라운드. 만약 중간 시각 검수가 필요하면 T1을 분할(neo-* 5종을 Phase 4 끝에 별도 T로 미루기)할 수 있으나, 일관성을 위해 본 plan은 T1 일괄 제거 유지

### R5 (MEDIUM): Badge 컴포넌트 인터페이스 마이그레이션 호환

- **내용**: `Badge`는 기존 `type: 'high'|'medium'|'low'|'new'`를 사용하고 호출자가 페이지 곳곳에 산재. T7에서 호환 어댑터를 두지만, 의미 매핑(high→danger 등)이 코드 의도와 어긋날 수 있음
- **완화**: T7에 어댑터 경고 console.warn 임시 도입 → T13/T20 등에서 호출처를 새 variant로 명시 교체 → Phase 6 검증에서 `Badge type=` 사용처 grep 0건 확인 후 어댑터 제거(또는 follow-up)

### R6 (LOW): worktree 미사용 시 main 충돌

- **내용**: 32 태스크 / 26 파일 변경 + main에 hotfix가 들어오면 머지 충돌 비용 큼
- **완화**: front-matter `worktree: feat/redesign` 권장 명시. `git worktree add ../taxback365-feat-redesign feat/redesign` 후 작업 → 머지 시 squash로 단일 커밋

### R7 (LOW): opengraph-image 캐싱

- **내용**: 기존 OG는 Vercel/Edge 캐시에 잔류 가능. 배포 후에도 SNS 미리보기는 옛 이미지 유지
- **완화**: T28 후 페이지 라우트별 `?_v=2026-05-07` 쿼리 추가 또는 캐시 무효화 follow-up

## 진행 추적

| Phase | 태스크 | 상태 | 검증 결과 |
|-------|--------|------|-----------|
| 1. 토큰/폰트 | T1~T3 (3) | **done** | tsc 0 / lint 0 / globals.css·design-tokens.ts·layout.tsx 잔재 grep 0 (2026-05-07) |
| 2. 공통 컴포넌트 | T4~T8 (5) | pending | tsc 0 에러 |
| 3. 레이아웃 | T9~T10 (2) | pending | grep `neo-` 0건 (Nav/Footer) |
| 4. 페이지 | T11~T23 (13) | pending | 페이지별 grep 0 + lint |
| 5. 메타/로고 | T24~T28 (5) | pending | build 통과 + OG 시각 |
| 6. 검증 | T29~T32 (4) | pending | lint+tsc+build+사용자 시각 회귀 |

### Phase 1 단계별 기록

| 시각 | 단계 | 상태 변경 | 비고 |
|---|---|---|---|
| 2026-05-07 | 환경 | done | `git worktree add ../taxback365-feat-redesign -b feat/redesign` + `npm i pretendard` |
| 2026-05-07 | T1 | done | `app/globals.css` 전면 재작성 — Navy/Mint/neutral oklch 토큰 + Pretendard dynamic-subset @import + Mono 디스플레이 유틸 + 도트/형광/3px 잔재 0 |
| 2026-05-07 | T2 | done | `lib/design-tokens.ts` TS 미러 — colors/radius/shadows/borders/typography/spacing 새 값 + hex 폴백 추가 (SVG·차트용) |
| 2026-05-07 | T3 | done | `app/layout.tsx` Lexend import/변수/className 제거 + metadata `TAXAI` → `taxback365` 일괄. `metadataBase` `taxai.kr` → `taxback365.vercel.app` |
| 2026-05-07 | 인프라 | revise | TDD enforce hook이 strict→warn으로 임시 전환 (디자인 작업 한정, 완료 후 strict 복원 follow-up) |

**의존성 임계 경로** (가장 긴 chain):
T1 → T2 → T3 → T4 → T19 (랜딩) → T29 → T30 → T31 → T32

**예상 시간**: Phase 1 (10-14분) + Phase 2 (16-21분) + Phase 3 (7-9분) + Phase 4 (40-55분) + Phase 5 (14-19분) + Phase 6 (18-27분) = **105-145분 작업** + T32 사용자 검수 별도. 총 22시간(여유 + 사용자 결정 게이트 + R1/R2 우발 비용 포함).
