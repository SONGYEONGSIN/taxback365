---
plan_id: 2026-05-11-design-rebrand-dub
title: 디자인 리브랜드 — Neo-Brutalism → Dub Design System (Crisp Utility on White Canvas)
status: pending
hard_gate: full
priority: HIGH
created: 2026-05-11
revised: 2026-07-06
source: design-ref/DESIGN.md + design-ref/code.html + design-ref/screen.png
worktree: feat/redesign
total_tasks: 33
---

## ⚠️ 개정 이력 (2026-07-06)

초판(2026-05-11)은 **"1차 Modern Fintech 리브랜드가 이미 적용되어 공통 컴포넌트 5종이 존재한다"**를 전제로 33개 태스크를 전부 *"className만 재작성"*으로 기술했다. **이 전제는 거짓이다.** 코드베이스 실측 결과:

- 현재 디자인 정체성은 **Neo-Brutalism** (1차·2차 리브랜드 모두 코드에 착수된 적 없음)
- `components/ui/`에는 **Badge, Tooltip 2개뿐** — Button/Card/Input **부재**
- `cn` 유틸·`lib/utils.ts` **부재** (tailwind-merge는 설치됐으나 미사용, clsx만 사용)
- Neo-Brutalism 참조 **458회 / 17개 코드 파일** 인라인 밀집
- 브랜드명이 코드상 **"TAXAI"** (`package.json` name=`taxai`), logo는 **래스터 `logo.png`만** (벡터 없음)
- `lib/design-tokens.ts` 스키마가 협소 (radius `0px` 단일, shadow 2종, 흑백+4액센트)

따라서 본 개정판은 **"컴포넌트 신규 생성 + 인라인 클래스 흡수 + 토큰 스키마 확장"** 마이그레이션으로 전면 재설계한다. 비용은 초판 추정(20h)보다 크다 — 특히 calculator(2830줄)·admin(3105줄).

## Goal

현재 Neo-Brutalism 시각언어(각진 모서리 `radius:0` / 4~8px 하드 드롭섀도우 / 3px 검정 보더 / radial-dot 배경 / Lexend uppercase black 헤딩 / orange·yellow·cyan·pink 원색 블록)를, `design-ref/DESIGN.md`가 정의한 **Dub Design System — Crisp Utility on White Canvas** (Canvas White 캔버스 / Ink Black 텍스트 / Border Light 1px hairline / 부드러운 diffused shadow / 검정 pill 버튼 + outlined/raised 카드 / Montserrat(display)+Inter(body)+한글 system fallback / Blue·Green·Orange·Violet 4 기능 액센트를 소량만) 으로 교체 마이그레이션한다.

13개 라우트 + 6개 컴포넌트(3 신규 생성 + 2 재작성 + 2 레이아웃) + 메타/로고/OG를 교체하고 **행동/비즈니스 로직은 0 변경**한다. 표시 브랜드명은 **taxback365로 통일**(코드상 TAXAI 잔재 제거 — T29).

**성공 신호**:
1. 13 라우트 빌드/타입체크/lint 0 에러 + `npm run build` exit 0
2. Neo-Brutalism 잔재 grep 0건 (`neo-`, `border-[3px]`, `border-[4px]`, `shadow-[Npx...0px_#000`, radial-dot 배경, `.neo-*` 클래스, `bg-neo-*`)
3. `TAXAI` 표시 문자열 grep 0건
4. 사용자 dev 서버 시각 회귀 통과 ("Vercel/Linear/Dub 같은 명료한 화이트 캔버스 productivity 미감")
5. 계산기 회귀: 동일 입력 → 동일 환급액 (로직 무변경 증명)

## Approach

`design-ref/DESIGN.md`를 단일 진실원으로 두고 **bottom-up 마이그레이션**: 유틸(cn) → 토큰(globals.css + design-tokens.ts) → 컴포넌트 생성 → 레이아웃 → 페이지(가벼운 정적부터 무거운 동적 순) → 메타/로고. 인라인 neo 밀집 페이지는 "인라인 유틸 → 신규 컴포넌트 흡수 + 나머지 토큰 클래스 교체" 2중 작업이다.

- **방식 A (page-by-page 병행)**: 구·신 토큰을 페이지마다 병행 — grep 매트릭이 흐려지고 회귀 시점이 늦다. 폐기.
- **방식 B (bottom-up, 채택)**: 토큰·컴포넌트 인프라를 먼저 세우면 페이지 작업이 "컴포넌트 호출 + 토큰 클래스 교체"로 수렴한다. 인프라 구축 중 일부 페이지가 일시적으로 깨지지만 토큰 차원 단일 상태가 유지되어 검증이 명확.

**왜 B가 여기서 특히 유리한가**: 458개 인라인 참조 중 상당수가 `.neo-btn`/`.neo-input`/`.neo-card` 반복이다. 이를 `<Button>`/`<Input>`/`<Card>`로 흡수하면 페이지 라인 수와 잔재 grep이 동시에 급감한다. **컴포넌트 생성(Phase 2)이 최대 레버리지 지점**으로 이후 페이지 비용을 크게 낮춘다.

**worktree**: `feat/redesign` 신규 브랜치에서 격리 (main 무영향). 완료 시 squash merge (`feat(design): adopt Dub Design System rebrand`).

## Out of Scope

- 다크 모드 (DESIGN.md는 light 전용 — follow-up)
- 행동/비즈니스 로직 변경 (세금 계산 수식, 폼 검증, 인증 흐름, 어드민 CRUD, 세션 타임아웃 로직 무수정)
- 신규 기능/페이지/라우트 추가
- DB / 마이그레이션 / Server Action 시그니처 변경
- 차트 라이브러리 도입 (현재 미설치 — 인라인 SVG/수치 카드 유지)
- shadcn/cva 도입 (자체 `cn` + variant 맵으로 충분)
- i18n (한국어 카피 유지)
- `package.json` name 필드 변경 (선택 — T29 결정, 기본 보류)
- framer-motion 모션 재설계 (기존 사용처는 **시각만** Dub톤으로 완화, 애니메이션 로직 유지)

## 영향 파일 인벤토리

### 신규 생성 (부재 → 생성)

| 파일 | 설명 |
|------|------|
| `lib/utils.ts` | `cn = (...i) => twMerge(clsx(i))` — 전 컴포넌트 전제. tailwind-merge 기설치 활용 |
| `components/ui/Button.tsx` | variant(primary/secondary/ghost/danger) + size + asChild + forwardRef + cn. 인라인 neo 버튼/`.neo-btn` 흡수 |
| `components/ui/Card.tsx` | variant(outlined/raised/subtle) + padding + forwardRef. `.neo-card` 흡수 |
| `components/ui/Input.tsx` | label/error/help + currency 모드 + forwardRef. `.neo-input` 흡수 |
| `public/logo.svg`, `public/logo-icon.svg` | 벡터 로고 (현재 logo.png 래스터만) — T25 결정 게이트 |

### 토큰/인프라 재작성

| 파일 | 변경 |
|------|------|
| `app/globals.css` | `:root` Dub 토큰 전면 교체, `@theme inline` 재매핑, `@layer components`의 `.neo-*` 제거, body radial-dot 배경 제거, h1~6 `uppercase font-black` 규칙 완화. 폰트 `--font-head`(Lexend)→display(Montserrat), body(Inter+한글 fallback) |
| `lib/design-tokens.ts` | 스키마 확장(radius 스케일 5종 / soft shadow 7종 / gray 램프 / 4 액센트 / highlight 3종) + 값 교체. globals.css 동기화 |
| `app/layout.tsx` | 폰트 `Lexend`→`Montserrat`(display) 교체, `Inter` 유지, body className 갱신, `metadata.icons`(logo-icon.svg), 브랜드 텍스트 taxback365 |

### 재작성 (기존 → Dub 규약)

| 파일 | 변경 |
|------|------|
| `components/ui/Badge.tsx` | `type` 기반 → `variant`(success/warning/danger/info/neutral/outline) + cn + `className` 오버라이드. 기존 `type`(high/medium/low/new) 호환 매핑 유지 |
| `components/ui/Tooltip.tsx` | framer-motion 유지, 하드코딩 cyan hex → Dub 토큰(subtle shadow), 각진 보더 → hairline |
| `components/layout/Navigation.tsx` | `.neo-nav-item`/인라인 neo → Dub sticky 화이트 nav + 검정 pill CTA. 세션 타임아웃 카운트다운 로직 유지, logo.png→logo.svg |
| `components/layout/Footer.tsx` | 인라인 neo(원색 블록) → Dub hairline 푸터 |

### 페이지 (13 라우트) — neo 참조수 기준 정렬

| 파일 | neo수 | 줄수 | 성격 |
|------|------|------|------|
| `app/terms/page.tsx` | 12 | 140 | 약관 텍스트 (가벼움) |
| `app/privacy/page.tsx` | 14 | 194 | 약관 텍스트 |
| `app/board/[id]/page.tsx` | 10 | 195 | 글 상세(react-markdown) |
| `app/board/page.tsx` | 18 | 324 | 게시판 목록 |
| `app/board/write/page.tsx` | 14 | 224 | 글 작성(textarea) |
| `app/board/[id]/edit/page.tsx` | 15 | 282 | 글 수정 |
| `app/login/page.tsx` | 9 | 159 | OAuth 로그인(`.neo-card`) |
| `app/signup/page.tsx` | 11 | 243 | 회원가입(framer-motion) |
| `app/page.tsx` | 28 | 355 | 랜딩 — **구조 재설계** + framer-motion |
| `app/dashboard/page.tsx` | 56 | 1025 | KPI/추천 카드(Badge 사용) |
| `app/calculator/page.tsx` | 95 | **2830** | 세금 시뮬레이션 폼(Tooltip) — **최대 비용, 로직 가드 R1** |
| `app/admin/page.tsx` | 116 | **3105** | 기초자료 CRUD 그리드 — **최대 비용, 로직 가드 R2** |
| `app/admin/audit/page.tsx` | 2 | 182 | 감사 로그 표 |

### 메타/자산

| 파일 | 변경 |
|------|------|
| `app/opengraph-image.tsx` | Neo hex(#F5F0EB/#00D9FF/#FF6B35 + 하드섀도우) → Dub 톤 전면 재작성, "TAXAI"→taxback365 |

> **HARD-GATE 등급: 전체** — 26+ 파일 + 컴포넌트 신규 생성(모듈 인프라) + 토큰 1차 출처 교체 + 공개 시각 정체성 변경. 다중 상향 트리거.

## 설계 결정 (Decision Log)

1. **Primary CTA = 검정 pill** (`bg-ink-black text-canvas-white rounded-full`). DESIGN.md §Components는 "Primary=Accent Blue 8px"라 적었으나, 같은 문서의 Agent Prompt Guide("primary action #000 filled")·Similar Brands(Vercel/Linear/Dub)·pill 규칙이 검정 pill을 가리킴. Blue는 focus ring/보조 강조 전용.
2. **Input radius = 대칭 8px** (`rounded-md`). DESIGN.md는 비대칭 `0 6px 6px 0`을 명시하나 한국어 IME/라벨 UX와 충돌·일관성 저해 → 대칭 채택.
3. **radius 스케일 정규화**: DESIGN.md 내부 명명이 상충(`--radius-lg`가 8px·12px 중복 정의). `md=8px`(입력/소형) / `xl=12px`(outlined 카드) / `2xl=16px`(raised 카드) / `full=pill`로 정규화.
4. **폰트**: Satoshi→**Montserrat**(display, 500/600, ASCII), Inter(body, 400/500/600). GeistMono→**system mono**(추가 폰트 로드 회피). 한글은 `"Apple SD Gothic Neo","Malgun Gothic",system-ui` fallback chain(Inter/Montserrat는 한글 글리프 없음 — **한국어 앱이므로 필수**).
5. **모션**: framer-motion 사용처(landing/signup)는 rotate·하드섀도우 바운스 등 Neo 모션 제거, subtle fade/rise만 유지. 애니메이션 로직 자체는 보존.
6. **브랜드명**: 표시 문자열 `taxback365`로 통일(디렉토리·CLAUDE.md 일치). `package.json` name은 보류(빌드 무관) — T29 확인.

## 단계

### Phase 0 — cn 유틸 (T1)

**T1 · `lib/utils.ts` 생성** — `import { clsx, type ClassValue } from 'clsx'; import { twMerge } from 'tailwind-merge'; export const cn = (...i: ClassValue[]) => twMerge(clsx(i))`. 검증: `npx tsc --noEmit` 0. 의존: 없음.

### Phase 1 — 토큰 + 폰트 (T2~T4)

**T2 · `app/globals.css` Dub 토큰 전면 재작성** — `:root`를 DESIGN.md Quick Start로 교체(색 19+그라데이션 2 / 타입스케일 7 / spacing 16 / radius 5 / shadow 7 / 레이아웃 4). `@theme inline`을 Dub 클래스로 재노출. `@layer base` body에서 **radial-dot 배경 제거** → `bg-canvas-white text-ink-black`. h1~6의 `uppercase font-black tracking-tighter` → `font-display tracking-tight`(완화). `@layer components`의 `.neo-btn/.neo-card/.neo-input/.neo-badge/.neo-nav-item` **삭제**. Neo 토큰(`--accent-orange/yellow/cyan/pink`, `--shadow-hard/hover`, `--radius:0`, `--border-width:3px`) 완전 제거. 검증: `rg "neo-|radial-gradient|--accent-orange|shadow-hard" app/globals.css` 0건. 의존: 없음.

**T3 · `lib/design-tokens.ts` 스키마 확장 + 동기화** — `colors`(canvasWhite/inkBlack/thunderGray/shadowGray/steelGray/subtleAsh/borderLight/borderMuted + accent{blue,freshGreen,warmOrange,deepViolet,focusRingBlue} + highlight{green,violet,orange}), `radius{md:8,xl:12,'2xl':16,'2xl2':20,full:9999}`, `shadows{subtle,sm,subtle2,md,lg,subtle3}`, `borders{width:'1px'}`, `typography{fontDisplay:Montserrat, fontBody:Inter+한글fallback, fontMono:system}`. Neo 키 전부 제거. 검증: tsc 0 + `rg "neo|orange|cyan" lib/design-tokens.ts` 0건. 의존: T2.

**T4 · `app/layout.tsx` 폰트 교체** — `next/font/google`에서 `Lexend` 제거, `Montserrat`(weight 500,600) 추가, `Inter` 유지. body className `${inter.variable} ${montserrat.variable}`. 한글 fallback은 CSS chain 처리. 검증: dev tools로 Montserrat+Inter 로딩, 한글 Malgun Gothic 렌더. 의존: T2, T3.

### Phase 2 — 컴포넌트 생성/재작성 (T5~T9) — **최대 레버리지**

> 규약: 전부 `cn` + variant 맵 + `forwardRef` + `className` 오버라이드. 인라인 neo 사용처를 흡수하도록 설계.

**T5 · `components/ui/Button.tsx` 생성** — base `inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 disabled:opacity-50`. variant: primary=`bg-ink-black text-canvas-white hover:opacity-90 shadow-subtle`, secondary=`bg-canvas-white text-ink-black border border-border-light hover:bg-subtle-ash`, ghost=`bg-transparent text-ink-black hover:bg-subtle-ash`, danger=`bg-ink-black text-canvas-white hover:bg-warm-orange/10`. size sm/md/lg. asChild. 검증: tsc 0 + black pill 렌더. 의존: T1~T4.

**T6 · `components/ui/Card.tsx` 생성** — outlined(기본)=`bg-canvas-white border border-border-light rounded-xl`, raised=`bg-canvas-white rounded-2xl shadow-subtle-2 overflow-hidden`, subtle=`bg-subtle-ash rounded-2xl`. padding sm(p-4)/md(p-6)/lg(p-8). 검증: tsc 0 + raised halo. 의존: T1~T4.

**T7 · `components/ui/Input.tsx` 생성** — base `block w-full bg-canvas-white text-system-info border border-border-muted rounded-md px-3 py-2 text-body focus:ring-2 focus:ring-focus-ring-blue/30 focus:border-focus-ring-blue placeholder:text-steel-gray`. label/error/help slot. currency 모드(`font-mono tabular-nums text-right` + `원` suffix). forwardRef. 검증: tsc 0 + focus blue ring. 의존: T1~T4.

**T8 · `components/ui/Badge.tsx` 재작성** — `variant`(success=`bg-highlight-green/20 text-fresh-green` / warning=`bg-highlight-orange/30 text-warm-orange` / danger=`bg-highlight-orange/40 text-warm-orange` / info=`bg-highlight-violet/20 text-deep-violet` / neutral=`bg-subtle-ash text-shadow-gray` / outline=`border border-border-light text-ink-black`) + `rounded-full px-3 py-1 text-caption font-medium`. 기존 `type`(high→danger/medium→warning/low→neutral/new→info) **호환 어댑터 유지**(dashboard 무깨짐). cn + className. 검증: tsc 0 + dashboard 컴파일. 의존: T1~T4.

**T9 · `components/ui/Tooltip.tsx` 재작성** — framer-motion AnimatePresence 유지, 하드코딩 `bg-black ... shadow-[4px_4px_0px_0px_#00D9FF]` → `bg-ink-black text-canvas-white rounded-md shadow-md text-caption`. 검증: tsc 0 + calculator 호버. 의존: T1~T4.

### Phase 3 — 레이아웃 (T10~T11)

**T10 · `components/layout/Navigation.tsx`** — `bg-canvas-white border-b border-border-light sticky top-0 z-50 h-16`, max-w-1200. brand=인라인 SVG 심볼(ink-black)+`font-display font-semibold tracking-tight` taxback365. 데스크톱 링크 `text-thunder-gray hover:text-ink-black px-4 py-2`. 우측 로그인=ghost/회원가입=`<Button variant="primary">`. 모바일 하단탭 active=`bg-subtle-ash text-ink-black`. **세션 타임아웃 카운트다운 로직 무변경**, 경고색 `text-warm-orange`. logo.png→logo.svg. 검증: 잔재 grep 0 + 데스크톱/모바일. 의존: T5, T1~T4.

**T11 · `components/layout/Footer.tsx`** — `bg-canvas-white border-t border-border-light`, 워드마크+copyright `text-caption text-thunder-gray`, 링크(이용약관/개인정보처리방침) `hover:underline hover:text-ink-black`. 원색 블록 제거. 검증: 잔재 0. 의존: T1~T4.

### Phase 4 — 페이지 (T12~T24) — 가벼운 정적 → 무거운 동적

> 공통 검증: ① `npm run lint`+`tsc` 0 ② 해당 파일 `rg "neo-|border-\[[34]px\]|shadow-\[.*0px.*#000|bg-neo-"` 0건 ③ Dub 토큰 1+ ④ 로직/데이터 흐름 무변경(diff는 className·JSX 구조 한정).

**T12 · terms** / **T13 · privacy** — prose `max-w-[680px]`, 토큰 교체(`text-ink-black`/`text-shadow-gray`), h1 `font-display text-heading-lg`. 의존: T1~T4.

**T14 · board 목록** — `divide-y divide-border-light`, row `hover:bg-subtle-ash`, `<Badge variant>`, 작성 `<Button variant="primary">`. 의존: T5,T8.

**T15 · board 상세** — `max-w-[760px]`, react-markdown prose 토큰화, 댓글 폼 `<Input>`. 의존: T5,T7.

**T16 · board write** / **T17 · board edit** — `<Input>` + textarea 인라인(`bg-canvas-white border border-border-muted rounded-md min-h-[300px]`), 제출 `<Button>`. 의존: T5,T7.

**T18 · login** — 중앙정렬 `<Card variant="outlined" padding="lg" max-w-[400px]>`, Google OAuth `<Button variant="secondary" w-full>`. **signIn 호출 무변경**. `.neo-card` 제거. 의존: T5,T6.

**T19 · signup** — 동 패턴 + framer-motion subtle fade 완화(rotate/하드섀도우 제거). 폼 검증 로직 무변경. 의존: T5,T6,T7.

**T20 · 랜딩 `app/page.tsx` 구조 재설계** — Neo hero/원색 블록/rotate 모션 폐기 → Dub 중앙정렬: ① Hero(`flex-col items-center text-center py-24` + display 헤딩 + subheading + CTA 2개 primary/ghost) ② Product Preview(`<Card variant="raised">` + 대시보드 목업) ③ 3-col Feature Grid(`border border-border-light rounded-xl p-6` + 아이콘박스 + heading-sm + body — lucide 유지) ④ CTA band(`bg-subtle-ash border-y py-24`). framer-motion staggered subtle rise. 한국어 카피 유지/재배치. 검증: 모바일 stack + CLS<0.1. 의존: T5,T6.

**T21 · dashboard** — KPI 카드 `<Card>`, 라벨 `text-caption text-thunder-gray uppercase tracking-wide`, 숫자 `font-display tabular-nums`. Badge variant 재명시. 의존: T5,T6,T8.

**T22 · calculator (최대 비용, 2830줄)** — R1 가드: **직전 `git diff HEAD --stat` 베이스라인 + 계산 로직(state/useEffect/계산함수/검증) 무변경 선언**. 폼 input→`<Input currency>`, Tooltip 유지, 결과 카드 `<Card variant="raised">` + 환급액 `font-display text-display tabular-nums`(양수 `text-fresh-green`/음수 `text-warm-orange`). 95개 인라인 neo 흡수. **분할 커밋(섹션 단위)**. 검증: 공통 + T33 계산 회귀. 의존: T5,T6,T7,T9.

**T23 · admin (최대 비용, 3105줄)** — R2 가드: 동일 로직 무변경 선언. 표 `divide-y divide-border-light`, header `bg-subtle-ash text-caption uppercase`, 액션 `<Button variant="ghost" size="sm">`, 대량 input→`<Input>`, 엑셀 업로드 UI 토큰 교체. 116개 인라인 neo 흡수. **분할 커밋**. 의존: T5,T6,T7,T8.

**T24 · admin/audit** — 표 토큰 교체(neo 2건). 의존: T6.

### Phase 5 — 메타/브랜드/로고 (T25~T29)

**T25 · 로고 SVG 결정 게이트 + 생성** — (a)Claude 직접 벡터 워드마크[기본] / (b)디자이너 의뢰(중단) / (c)logo.png 유지+임시. 기본=(a): `public/logo.svg`(심볼+워드마크 락업, ink-black) + `public/logo-icon.svg`(심볼 32×32). 검증: 16/32/96/192px 가독. 의존: 없음(병행 가능).

**T26 · `app/opengraph-image.tsx` 재작성** — 배경 `#FFFFFF`(+우측 `#F5F5F5`), hairline `1px #E5E5E5`, 심볼+`taxback365`(Montserrat 500) + 부제 `한국 직장인의 연말정산 환급 SaaS`(steel-gray). Neo hex/하드섀도우/"TAXAI" 제거. 검증: `npm run build` + `/opengraph-image` 시각. 의존: T25.

**T27 · `app/layout.tsx` metadata.icons + 텍스트** — `icons={icon,shortcut,apple:'/logo-icon.svg'}`, title/description "TAXAI"→taxback365. 검증: favicon 탭. 의존: T25.

**T28 · Navigation/Footer 로고 SVG 동기화** — T10/T11 인라인 심볼이 T25 최종안과 일치하는지 확인·정정. 의존: T25,T10,T11.

**T29 · 브랜드 텍스트 전수 rename + 결정** — `rg -i "TAXAI"` 표시 문자열 전부 taxback365로. `package.json` name 변경 여부 사용자 확인(기본 보류). 검증: `rg "TAXAI"` 표시 문자열 0건. 의존: T27.

### Phase 6 — 검증 (T30~T33)

**T30 · 잔재 grep 0 + Dub 채택 카운트** — `rg "neo-|\.neo-|border-\[[34]px\]|shadow-\[.*0px.*#000|radial-gradient|bg-neo|--accent-(orange|cyan|yellow|pink)|Lexend|font-head|TAXAI" app/ components/ lib/` → 전부 0건. Dub 토큰(`bg-canvas-white|text-ink-black|border-border-light|rounded-full|shadow-subtle`) 카운트 50+. 의존: T1~T29.

**T31 · lint + typecheck** — `npm run lint` 0 / `npx tsc --noEmit` 0. 의존: T30.

**T32 · build** — `npm run build` exit 0, 13 라우트 프리렌더 성공. 의존: T31.

**T33 · 시각/기능 회귀 (사용자)** — dev 서버: ① 13 라우트 시각(화이트 캔버스 미감) ② **계산기 동일 입력→동일 환급액 1+ 케이스** ③ 로그인 OAuth 흐름 ④ 모바일 360px. 의존: T32.

## 리스크 가드

- **R1/R2 (calculator·admin 로직 보존)**: 최대 파일 2개는 className/JSX 구조 외 변경 금지. 태스크 직전 `git diff HEAD --stat` 베이스라인, 완료 후 로직 diff 0 확인. 분할 커밋으로 회귀 지점 추적.
- **R3 (한글 렌더)**: Inter/Montserrat는 한글 글리프 없음 → fallback chain 누락 시 한글 깨짐. T2 chain 명시 + T4 실렌더 확인. 심각 시 follow-up으로 pretendard 자가호스팅.
- **R4 (컴포넌트 호환)**: Badge `type` 어댑터 유지로 기존 호출처 무깨짐. Card/Input 신규는 명시 채택.
- **R5 (흑백 단조)**: 4 액센트를 badge/링크/상태에 소량 배치(환급 양수=green, 경고=orange, 콜아웃=violet, 링크=blue)해 밋밋함 방지.
- **R6 (범위 급증)**: calculator/admin이 물량 60%. 한 세션 무리 시 페이지 단위 분할 진행.

## 검증 전략 요약

Phase별 `lint`+`tsc` → 각 페이지 잔재 grep → Phase 6 전역 grep 0 → `build` exit 0 → 사용자 시각/계산 회귀(T33). Red-Green: 계산기 회귀는 리브랜드 전후 동일 입력 동일 출력으로 증명.

## 진행 추적

| Phase | 태스크 | 상태 |
|-------|--------|------|
| 0. cn 유틸 | T1 (1) | pending |
| 1. 토큰/폰트 | T2~T4 (3) | pending |
| 2. 컴포넌트 | T5~T9 (5) | pending |
| 3. 레이아웃 | T10~T11 (2) | pending |
| 4. 페이지 | T12~T24 (13) | pending |
| 5. 메타/로고 | T25~T29 (5) | pending |
| 6. 검증 | T30~T33 (4) | pending |

**임계 경로**: T1 → T2 → T3 → T5 → T20(랜딩) → T30 → T31 → T32 → T33

**규모**: 컴포넌트 3 신규 + 2 재작성 + 토큰 인프라 + 13 라우트(calculator 2830줄·admin 3105줄 포함) + 메타/로고. 순수 작업 다수 세션 규모. calculator/admin은 페이지 단위 분할 진행 권장.

### 재개 명령

```bash
git worktree add ../taxback365-feat-redesign feat/redesign   # 최초 1회
cd ../taxback365-feat-redesign
npx tsc --noEmit && npm run lint    # 베이스라인
```
