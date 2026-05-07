# taxback365 — DESIGN.md

> **Single source of truth for taxback365 visual identity (Phase 0).**
> 본 문서는 [Google Stitch DESIGN.md 9섹션 표준](https://stitch.withgoogle.com/docs/design-md/overview/) 포맷을 따른다. 코드 토큰(`app/globals.css`, `lib/design-tokens.ts`)은 이 문서를 우선 소스로 한다.

---

## §1 Visual Theme & Atmosphere

### 비전

taxback365는 한국 직장인이 매년 치르는 연말정산이라는 **불투명한 연례 의식**을, 데이터로 분명히 보이는 **개인 자산 관리 시간**으로 바꾸는 SaaS다. 시각 언어는 그 변환을 1초 안에 전달해야 한다.

### 톤

**Modern Fintech Minimal × Korean Trust** — Wise/Wealthsimple/Mercury의 정돈된 핀테크 톤을 베이스로, 한국 직장인이 "이 서비스에 내 소득 정보를 입력해도 된다"고 느낄 만한 **차분한 신뢰감**을 더한다. 채도를 절제한 Navy 지배색 위에, 환급(돌려받음)이라는 긍정 신호를 담는 Mint 액센트 1종을 배치하고, 경고/주의에는 Amber, Danger에는 채도를 낮춘 Coral을 사용한다.

### 핵심 인상 (한 문장)

"은행 앱처럼 안심되지만, 세무사 사무실처럼 답답하지 않다."

### 탈템플릿 결정 2개 (Wise 톤 카탈로그 의도적 이탈)

1. **Tabular Numerals + Mono 숫자 시스템** — 모든 금액·비율·날짜 숫자는 `font-variant-numeric: tabular-nums`를 강제하고, 강조 숫자(예: 환급 예상액, 절세액)는 Inter Mono(또는 JetBrains Mono 폴백)로 표기한다. 이유: 연말정산은 **숫자 정렬이 곧 신뢰**다. 세 자리 콤마와 소수점이 흔들리면 사용자는 즉시 의심한다. Wise/Mercury도 Tabular는 쓰지만, 우리는 한 단계 더 나아가 디스플레이 숫자를 Mono로 분리해 "계산 결과는 손으로 만진 것이 아니다"는 시각적 약속을 만든다.

2. **한자 단위 보조 표기 (萬/億)** — Hero 영역 핵심 숫자 바로 옆에 `万`/`億` 같은 한자 단위를 마이크로 사이즈(text-[10px])·뉴트럴-400 컬러로 병기한다(예: `1,200,000원 万`). 이유: 한국 직장인의 숫자 인지 모드는 "120만원"이지 "1.2 million KRW"가 아니다. Wise는 글로벌 통화를 `1.2M`로 처리하지만, taxback365는 한국 사용자 한정이므로 한국식 단위 인지를 시각 시스템에 내재화한다. 동시에 한자 1글자는 한글/영문이 아닌 시각적 흔적으로서 **이 서비스의 한국적 맥락**을 신호한다(과한 한국 모티프 없이).

<!--
## Phase 0 자기검증

### 템플릿 테스트 (Wise/Mercury와의 차별점)
- Wise/Mercury 톤: Navy + Mint, Inter, soft shadow, 1px hairline → 그대로 따라하면 핀테크 클론
- taxback365 차별점: (1) Mono 숫자 디스플레이 시스템 + Tabular 강제, (2) 한자 단위 보조 표기, (3) 한글 본문 Pretendard 우선 (Wise는 영문 우위)
- 결론: 로고/카피 가렸을 때 "Wise로 보이는가" → 숫자 표기와 한자 미세 활용으로 구별 가능

### 톤 믹싱 (Modern Fintech × 어떤 한국적 요소)
- Modern Fintech Minimal × **한국 공문서 정밀성** — 한국 세무서·국세청 양식의 "표 정렬·숫자 우측 정렬·단위 명시" 관습을 핀테크 톤으로 흡수. 결과: 차가운 핀테크가 아닌, "잘 정돈된 한국 세무 다이어리"

### 반전 테스트 (Brutalist 또는 Playful로 갔으면 안 되는 이유)
- Brutalist (현재): 형광색·hard shadow는 "내 소득 정보를 안심하고 맡길 곳"의 기본 신호와 정면 충돌. 사용자 피드백에서 명시적 거부
- Playful: 연말정산은 1년에 수개월 집중 사용 + 금액 오인식이 즉각적 손실로 이어지는 도메인. 가벼운 톤은 "이걸로 환급 계산이 되겠어?"라는 의심 유발
- 결론: Modern Fintech Minimal이 도메인 적합도 최상

### 디폴트 감지기 (5개 항목 점검)
| 항목 | 카탈로그 디폴트 | 본 프로젝트 결정 | 도출 근거 |
|---|---|---|---|
| 타이포 | Inter 단독 (Wise 표준) | Inter + Pretendard + Inter Mono(숫자) 하이브리드 | 한글/영숫자 페이지 혼재 + Mono 숫자 시스템 차별화 |
| 색상 | Navy + Mint (핀테크 정공) | Navy 지배 + Mint(긍정) + Amber(주의) 균형 | 환급(긍정)/세무신고(주의) 양면 도메인 반영 |
| 공간 | 표준 8px grid | 4px base + 표(세무 양식) 영역만 고밀도 | 계산기/대시보드는 표 중심 → 고밀도 필요 |
| 배경 | Off-white 단색 (핀테크 디폴트) | Off-white + 미세 vertical gradient (Hero/랜딩에 한정) | 도트 배경 제거 후 평면감 보완. 내부 페이지는 단색 유지 |
| 모션 | 마이크로 호버 + 페이지 전환 페이드 (디폴트) | Staggered reveal 1세트 (랜딩 Hero 진입 시) + 숫자 카운트업 (환급액 표시) | "환급액이 살아 움직이는" 핵심 순간에 모션 집중. 나머지는 정적 |

**평가**: 5개 중 3개(타이포·공간·모션)가 프로젝트 도메인에서 도출된 비표준 결정. 2개(색상·배경)는 핀테크 카탈로그를 따르되 도메인 균형을 위해 미세 조정. → 디폴트 의존 없음.
-->

---

## §2 Color Palette & Roles

> Tailwind v4는 oklch를 권장한다. 본 표는 hex(디자인 협업용)와 oklch(코드 토큰용)를 함께 표기한다. **Navy가 약 70%를 점유하고**, Off-white 배경, Mint 액센트, 뉴트럴 6단계로 위계를 만든다.

### 핵심 팔레트

| 토큰 이름 | Hex | OKLCH | 역할 (사용 비중) |
|---|---|---|---|
| `--color-primary` (Navy 900) | `#0F2547` | `oklch(0.235 0.058 262)` | 지배색. 헤더·CTA 배경·로고. **약 50% 사용** |
| `--color-primary-700` (Navy 700) | `#1E3A66` | `oklch(0.345 0.073 262)` | Primary hover, focus ring 베이스 |
| `--color-primary-600` (Navy 600) | `#2C4F84` | `oklch(0.435 0.080 262)` | 보조 강조, link |
| `--color-foreground` (Ink) | `#0B1A33` | `oklch(0.180 0.040 262)` | 본문 텍스트, 가장 강한 명도 대비. Navy 900보다 살짝 더 어둡게 |
| `--color-background` (Off-white) | `#F7F8FA` | `oklch(0.978 0.003 247)` | 페이지 배경. 순백 대신 미세하게 차가운 회백. **약 25% 사용** |
| `--color-card` | `#FFFFFF` | `oklch(1 0 0)` | 카드/입력 컨테이너 배경. 배경 대비 1단계 표면 |
| `--color-accent-mint` | `#26C485` | `oklch(0.745 0.155 158)` | **유일한 강조색**. 환급액·성공·Primary 액션의 보조 강조. **약 8% 사용** |
| `--color-accent-mint-dark` | `#159B65` | `oklch(0.605 0.145 158)` | Mint hover/active |
| `--color-warning` (Amber) | `#D08A1E` | `oklch(0.640 0.135 70)` | 주의·검토 필요. 채도 절제한 황토. **약 3% 사용** |
| `--color-danger` (Coral) | `#C8483D` | `oklch(0.555 0.165 28)` | 오류·삭제. 형광 적색이 아닌 절제된 코랄. **약 2% 사용** |
| `--color-success` | `#159B65` | `oklch(0.605 0.145 158)` | 저장 완료 등 (Mint dark 재활용) |

### 뉴트럴 스케일 (Slate 계열, 미세 차가운 회색)

| 토큰 | Hex | OKLCH | 용도 |
|---|---|---|---|
| `--neutral-50` | `#F7F8FA` | `oklch(0.978 0.003 247)` | = background |
| `--neutral-100` | `#EEF0F4` | `oklch(0.943 0.006 247)` | hover, divider 배경 |
| `--neutral-200` | `#DDE1E8` | `oklch(0.890 0.010 247)` | input border default, hairline |
| `--neutral-300` | `#BCC2CD` | `oklch(0.785 0.013 247)` | 비활성 텍스트, placeholder |
| `--neutral-500` | `#6B7280` | `oklch(0.555 0.018 247)` | 보조 텍스트 (caption) |
| `--neutral-700` | `#3A4252` | `oklch(0.355 0.020 247)` | 본문 보조 |
| `--neutral-900` | `#0B1A33` | `oklch(0.180 0.040 262)` | = foreground (Ink) |

### 세만틱 매핑 (역할 → 토큰)

| UI 역할 | 색상 토큰 |
|---|---|
| 페이지 배경 | `--color-background` (Off-white) |
| 카드/모달 배경 | `--color-card` (White) |
| 본문 텍스트 | `--color-foreground` (Ink) |
| 보조 텍스트 | `--neutral-500` |
| 비활성/placeholder | `--neutral-300` |
| 1px hairline (구분선·input border) | `--neutral-200` |
| Primary 버튼 | `--color-primary` 배경 + `--color-card` 텍스트 |
| Primary 버튼 hover | `--color-primary-700` |
| Secondary 버튼 | `--color-card` 배경 + `--neutral-200` border + `--color-foreground` 텍스트 |
| Ghost 버튼 | transparent 배경 + `--color-foreground` 텍스트 + hover `--neutral-100` |
| Mint 강조 (환급액·CTA 보조 라인) | `--color-accent-mint` |
| Focus ring | `--color-primary-600` 30% 또는 `--color-accent-mint` |
| Success 뱃지 | `--color-accent-mint` 15% 배경 + `--color-accent-mint-dark` 텍스트 |
| Warning 뱃지 | `--color-warning` 15% 배경 + `--color-warning` 텍스트 |
| Danger 뱃지/버튼 | `--color-danger` 배경 + `--color-card` 텍스트 |

### 따뜻함과 차가움의 균형 의도

- 차가움(Navy + Slate 뉴트럴): 신뢰·안정·진지함 → 도메인 핵심 톤
- 따뜻함(Mint·Amber): 환급 = 받는 것 = 긍정. 차가운 매스 위에 의도적으로 8% 비중의 따뜻한 강조를 배치해 "차갑기만 한 핀테크"를 회피한다.

---

## §3 Typography Rules

### 페어링

| 역할 | 패밀리 | 용도 |
|---|---|---|
| `--font-display` | **Inter** (영문/숫자 디스플레이) | Hero 타이틀, 영문 라벨, 숫자 강조 (한글 디스플레이는 Pretendard) |
| `--font-body` | **Pretendard** (한글 본문) | 모든 한글 텍스트, 본문, UI 라벨. 한글 가독성 최상 |
| `--font-mono` | **Inter Mono** (또는 JetBrains Mono fallback) | 금액·비율·날짜 등 모든 디스플레이 숫자, 코드 영역 |

> **언어 분기**: CSS `font-family` 스택을 `Pretendard, Inter, system-ui`로 두고, 한글 글리프는 Pretendard가, 영문/숫자는 Inter가 자동 처리한다. 디스플레이 숫자는 명시적으로 `font-mono` 클래스로 구분한다.

### 타입 스케일

| 토큰 | 클래스 | size / line-height / weight / tracking | 용도 |
|---|---|---|---|
| `text-hero` | `text-[56px] leading-[1.05] font-bold tracking-[-0.03em]` | 56px / 1.05 / 700 / -3% | 랜딩 Hero (모바일 `text-[40px] leading-[1.1]`) |
| `text-h1` | `text-[36px] leading-[1.15] font-bold tracking-[-0.025em]` | 36px / 1.15 / 700 / -2.5% | 페이지 타이틀 |
| `text-h2` | `text-[28px] leading-[1.25] font-semibold tracking-[-0.02em]` | 28px / 1.25 / 600 / -2% | 섹션 헤더 |
| `text-h3` | `text-[20px] leading-[1.35] font-semibold tracking-[-0.01em]` | 20px / 1.35 / 600 / -1% | 카드 타이틀, 폼 그룹 헤더 |
| `text-body` | `text-[15px] leading-[1.6] font-normal` | 15px / 1.6 / 400 / 0 | 본문 (한글 가독성 우선) |
| `text-body-sm` | `text-[14px] leading-[1.55] font-normal` | 14px / 1.55 / 400 | UI 라벨, 폼 라벨 |
| `text-caption` | `text-[12px] leading-[1.5] font-medium` | 12px / 1.5 / 500 / +1% | 보조 텍스트, 메타 정보 (`tracking-[0.01em]`) |
| `text-mono-display` | `font-mono text-[40px] leading-[1.1] font-semibold tracking-[-0.02em] tabular-nums` | 40px / Mono / 600 | 환급액 등 핵심 숫자 디스플레이 |
| `text-mono-body` | `font-mono text-[15px] tabular-nums` | 15px / Mono / 400 | 표 안의 금액·비율 |

### 숫자 표기 규칙

- **모든 숫자는 `font-variant-numeric: tabular-nums` 강제** (CSS 글로벌 또는 Tailwind 유틸 `tabular-nums`)
- 디스플레이 숫자(Hero·대시보드 KPI)는 `font-mono` 클래스 강제
- 한자 단위 병기 형식: `<span class="text-mono-display">1,200,000</span><span class="text-caption text-neutral-400 ml-1">万원</span>`

### 한글 가독성 가이드

- 본문 line-height 최소 1.55, 모바일은 1.6
- 한글 + 영숫자 혼용 시 line-height는 한글 기준에 맞춤
- letter-spacing은 한글 본문에서 0 또는 +0.5%, 영문 디스플레이에서 -1~-3%

---

## §4 Component Stylings

> 모든 컴포넌트는 `radius-md = 8px`, `radius-lg = 12px`, `radius-pill = 9999px` 중 선택. **3px hard border 폐기**, 1px hairline 표준.

### 4.1 버튼 (4종)

#### Primary

```tsx
className="
  inline-flex items-center justify-center gap-2
  h-11 px-5 rounded-md
  bg-[--color-primary] text-[--color-card]
  text-body-sm font-semibold
  transition-colors duration-150
  hover:bg-[--color-primary-700]
  focus:outline-none focus:ring-2 focus:ring-[--color-primary-600] focus:ring-offset-2
  disabled:bg-[--neutral-300] disabled:cursor-not-allowed
"
```

- 강조 변형 (Hero CTA): Mint 액센트 underline 1px (`relative after:absolute after:bottom-1 after:left-5 after:right-5 after:h-px after:bg-[--color-accent-mint]`)

#### Secondary

```tsx
className="
  inline-flex items-center justify-center gap-2
  h-11 px-5 rounded-md
  bg-[--color-card] text-[--color-foreground]
  border border-[--neutral-200]
  text-body-sm font-medium
  transition-colors duration-150
  hover:bg-[--neutral-100] hover:border-[--neutral-300]
  focus:outline-none focus:ring-2 focus:ring-[--color-primary-600] focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
"
```

#### Ghost

```tsx
className="
  inline-flex items-center justify-center gap-2
  h-10 px-4 rounded-md
  text-[--color-foreground] text-body-sm font-medium
  transition-colors duration-150
  hover:bg-[--neutral-100]
  focus:outline-none focus:ring-2 focus:ring-[--color-primary-600]
  disabled:opacity-50
"
```

#### Danger

```tsx
className="
  inline-flex items-center justify-center gap-2
  h-11 px-5 rounded-md
  bg-[--color-danger] text-[--color-card]
  text-body-sm font-semibold
  transition-colors duration-150
  hover:brightness-90
  focus:outline-none focus:ring-2 focus:ring-[--color-danger] focus:ring-offset-2
  disabled:opacity-50
"
```

### 4.2 인풋

```tsx
// default
className="
  w-full h-11 px-3.5 rounded-md
  bg-[--color-card] text-[--color-foreground]
  border border-[--neutral-200]
  text-body placeholder:text-[--neutral-300]
  transition-colors duration-150
  hover:border-[--neutral-300]
  focus:outline-none focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary-600]/25
  disabled:bg-[--neutral-100] disabled:text-[--neutral-300] disabled:cursor-not-allowed
  invalid:border-[--color-danger]
"
```

- 라벨: `text-body-sm font-medium text-[--color-foreground] mb-1.5`
- 도움말: `text-caption text-[--neutral-500] mt-1.5`
- 에러: `text-caption text-[--color-danger] mt-1.5`
- 금액 입력은 `font-mono tabular-nums text-right` 강제 + 우측 단위 suffix(`원`) `text-[--neutral-500]`

### 4.3 카드

```tsx
// resting
className="
  bg-[--color-card] rounded-lg
  border border-[--neutral-200]
  p-6
  transition-shadow duration-200
  hover:shadow-[0_1px_3px_0_rgb(15_37_71_/_0.06),_0_1px_2px_-1px_rgb(15_37_71_/_0.04)]
"
// raised (대시보드 KPI 카드)
className="
  bg-[--color-card] rounded-lg
  border border-[--neutral-200]
  shadow-[0_1px_2px_0_rgb(15_37_71_/_0.04)]
  p-6
"
```

- KPI 카드 내부: 라벨(`text-caption text-neutral-500 uppercase tracking-[0.06em]`) + 숫자(`text-mono-display`) + 변화(`text-caption text-accent-mint`)

### 4.4 뱃지

| 종류 | 클래스 |
|---|---|
| Success | `inline-flex items-center px-2 py-0.5 rounded-pill text-caption font-medium bg-[--color-accent-mint]/15 text-[--color-accent-mint-dark]` |
| Warning | `... bg-[--color-warning]/15 text-[--color-warning]` |
| Danger | `... bg-[--color-danger]/15 text-[--color-danger]` |
| Neutral | `... bg-[--neutral-100] text-[--neutral-700]` |
| Outline | `... border border-[--neutral-200] bg-transparent text-[--neutral-700]` |

### 4.5 내비게이션

#### Top nav (랜딩/로그인 상태)

```tsx
className="
  sticky top-0 z-40
  h-16 px-6
  bg-[--color-card]/85 backdrop-blur-md
  border-b border-[--neutral-200]
  flex items-center justify-between
"
// 메뉴 아이템 default
className="
  px-3 py-2 rounded-md
  text-body-sm font-medium text-[--neutral-700]
  hover:text-[--color-foreground] hover:bg-[--neutral-100]
  transition-colors duration-150
"
// active
className="text-[--color-foreground] relative after:absolute after:bottom-[-1.05rem] after:left-3 after:right-3 after:h-[2px] after:bg-[--color-primary]"
```

#### Side nav (대시보드/관리자)

```tsx
className="
  w-60 h-screen sticky top-0
  bg-[--color-card]
  border-r border-[--neutral-200]
  py-6 px-3
"
// 아이템 default
className="flex items-center gap-3 px-3 py-2.5 rounded-md text-body-sm text-[--neutral-700] hover:bg-[--neutral-100]"
// active
className="bg-[--color-primary]/8 text-[--color-primary] font-semibold"
```

### 4.6 상태 매트릭스

| 상태 | 시각 처리 |
|---|---|
| default | 위 명시 |
| hover | 배경 1단계 어둡게 / 또는 border 1단계 어둡게 |
| focus | 2px ring (`--color-primary-600` 25% alpha), ring-offset 2px on light bg |
| active | hover보다 배경 1단계 더 어둡게 또는 scale-[0.98] |
| disabled | opacity-50 또는 `--neutral-300` 배경, cursor-not-allowed |
| loading | 자식 텍스트 opacity-0 + 중앙 spinner (`--color-primary` 1.25px stroke) |

---

## §5 Layout Principles

### 그리드 & max-width

| 페이지 유형 | container | 그리드 |
|---|---|---|
| 랜딩 (Hero/Marketing) | `mx-auto max-w-[1200px] px-6` | 12-col, gap-8 |
| 대시보드 / 계산기 | `mx-auto max-w-[1280px] px-6` | 12-col, gap-6 (사이드바 240px 제외 후) |
| 폼 (로그인/회원가입) | `mx-auto max-w-[400px] px-4` | 단일 컬럼, gap-5 |
| 어드민 | `w-full px-6` (사이드바 240px 제외 후 풀 와이드) | 12-col, gap-4 (고밀도 표) |
| 게시판/콘텐츠 | `mx-auto max-w-[760px] px-4` | 단일 컬럼, prose-style |
| 약관/개인정보 | `mx-auto max-w-[680px] px-4` | 단일 컬럼, prose-style |

### Spacing 스케일 (4px base)

```
--space-1: 4px   (0.25rem)
--space-2: 8px   (0.5rem)
--space-3: 12px  (0.75rem)
--space-4: 16px  (1rem)
--space-5: 20px  (1.25rem)
--space-6: 24px  (1.5rem)   ← 카드 padding 표준
--space-8: 32px  (2rem)     ← 섹션 내 그룹 간격
--space-10: 40px (2.5rem)
--space-12: 48px (3rem)
--space-16: 64px (4rem)     ← 랜딩 섹션 간 표준
--space-24: 96px (6rem)     ← Hero ↔ 다음 섹션
```

### 정보 밀도 결정 (페이지 유형별)

| 유형 | 밀도 | 적용 |
|---|---|---|
| 랜딩 | **저밀도** | section py-24, card padding p-8, 큰 타이포 |
| 대시보드 | **표준** | section py-8, card padding p-6, 12-col 그리드 |
| 계산기 (입력 폼) | **표준** | 폼 그룹 간 gap-6, 라벨-인풋 gap-1.5 |
| 어드민 (테이블) | **고밀도** | 표 row 높이 40px, padding px-3 py-2, text-[13px] |
| 게시판 목록 | **표준** | divide-y `--neutral-200`, row py-4 |
| 게시글 본문 | **저밀도** | 본문 line-height 1.7, 단락 간 `mb-6` |

### 페이지 패턴

#### 랜딩 (`app/page.tsx`)

- Hero: `min-h-[78vh] flex items-center` + Off-white에서 카드 영역으로 미세 vertical gradient
- Hero 내부: 좌측 카피(`text-hero`) + 우측 환급액 시뮬레이션 카드 (Mint 강조)
- 다음 섹션: 3-col Feature Grid 사용 **금지** (쿠키커터). 대신 풀 와이드 단일 시각 강조 + 좁은 텍스트 배치 alternating

#### 대시보드 / 계산기

- 좌측 사이드바 (240px) + 우측 메인
- 메인 상단: KPI 4-card row → 메인 컨텐츠 (표 또는 폼)
- 모바일: 사이드바 → bottom tab bar (4 탭)

#### 인증 (로그인/회원가입)

- `flex min-h-screen items-center justify-center bg-[--color-background]`
- 카드 max-w-[400px], padding p-8, border `--neutral-200`, no shadow

---

## §6 Depth & Elevation

> **도트 배경 폐기.** **3px hard shadow 폐기.** 깊이는 1px hairline + soft shadow 3-tier로만 표현한다.

### Shadow 시스템

```css
--shadow-resting:  0 1px 2px 0 rgb(15 37 71 / 0.04);
--shadow-raised:   0 1px 3px 0 rgb(15 37 71 / 0.06), 0 1px 2px -1px rgb(15 37 71 / 0.04);
--shadow-floating: 0 10px 15px -3px rgb(15 37 71 / 0.08), 0 4px 6px -4px rgb(15 37 71 / 0.05);
```

| 토큰 | 용도 |
|---|---|
| `--shadow-resting` | 카드 default (선택적, 보통 hairline border만으로 충분) |
| `--shadow-raised` | 카드 hover, KPI 카드 default, dropdown trigger 활성 |
| `--shadow-floating` | 모달, 드롭다운 메뉴, 토스트, 사이드 패널 |

### Border 활용 전략

- **1px hairline 표준** (`border --neutral-200`): 카드, 인풋, 표 행 구분, 사이드바
- **2px focus ring**: 키보드 포커스 시각화 (`--color-primary-600` 25% alpha)
- **0.5px sub-hairline 금지** (Retina 외에서 사라짐). 항상 1px

### 표면 위계

```
Layer 0: --color-background (Off-white)         z-index 기준
Layer 1: --color-card (White) + 1px border      카드, 사이드바
Layer 2: --color-card + raised shadow           hover된 카드, 활성 KPI
Layer 3: --color-card + floating shadow         모달, 드롭다운
```

### 도트 배경 대안 (랜딩 Hero에 한정)

```css
/* 매우 미세한 vertical gradient. 그 외 페이지는 모두 단색 background */
background: linear-gradient(
  180deg,
  oklch(0.985 0.003 247) 0%,
  oklch(0.978 0.003 247) 100%
);
```

- 패턴/도트/노이즈 텍스처 사용 금지 (도메인 신뢰감 저해)

---

## §7 Do's and Don'ts

> `.claude/rules/design.md`의 6대 쿠키커터 패턴 위에 taxback365 고유 체크리스트를 더한다.

### Do's (반드시)

1. **모든 숫자에 `tabular-nums`** — 표·KPI·인풋·뱃지 어디서든 숫자가 있다면 무조건 tabular. 비-tabular 숫자는 코드 리뷰에서 거부.
2. **금액은 우측 정렬 + Mono** — 표/리스트 안의 모든 금액은 `text-right font-mono tabular-nums`. 좌측 정렬 금액 금지.
3. **Mint는 환급/긍정/Primary 강조에만** — 일반 hover, 구분선, 장식에 Mint 사용 금지. 강조의 희소성으로 의미를 만든다.
4. **focus ring 명시적 노출** — 모든 인터랙티브 요소에 키보드 포커스 시 2px ring 보장. `outline-none` 단독 사용 금지.
5. **한글 본문 line-height ≥ 1.55** — 한글 가독성 최소선.
6. **폼 라벨은 인풋 위에** — placeholder를 라벨로 대체 금지(접근성·세무 도메인 입력 신뢰성).

### Don'ts (절대 금지)

1. **Neo-Brutalism 잔재 금지** — `border-[3px]`, `shadow-[4px_4px_0px_0px_#000]`, `bg-radial-gradient(#000 1px, transparent 1px)`(도트 배경) 모두 마이그레이션 후 코드에 남기지 않는다. 발견 시 즉시 제거.
2. **3-col Feature Grid + Hero CTA 템플릿 금지** — 랜딩에서 "이미지/텍스트 3개 카드" 구조는 SaaS 보일러플레이트. 대신 alternating full-width 강조 사용.
3. **`shadow-sm` 카드 + `divide-y` 리스트 + `rounded-full` 아바타 조합 금지** — 그대로 쓰면 Vercel/Linear 클론으로 인식.
4. **Mint를 본문/링크 컬러로 사용 금지** — 링크는 Navy 600, Mint는 강조 한정.
5. **순백(`#FFFFFF`) 배경 페이지 금지** — 페이지 배경은 항상 Off-white. 카드만 White.
6. **금액 색상 변동 금지** — "양수는 mint, 음수는 red" 같은 자동 색상 분기 금지. 모든 금액은 본문색. 변화는 `↑/↓` 아이콘 + caption에서만 표현. 도메인 특성상 색상 분기는 오해 유발.
7. **숫자에 디스플레이 폰트 적용 금지** — 디스플레이 숫자는 항상 Mono. Inter/Pretendard로 큰 숫자 표기 금지.
8. **emoji 아이콘 금지** — UI 아이콘은 lucide-react 또는 heroicons 1.5px stroke 통일. emoji는 도메인 신뢰감 저해.
9. **Hard color border 금지** — 카드/인풋 border는 항상 `--neutral-200`. 색상 border는 focus/danger/active 한정.
10. **이중 강조 금지** — 한 화면에 Primary CTA는 1개. 두 번째 행위는 Secondary 또는 Ghost.

---

## §8 Responsive Behavior

### 브레이크포인트

| 토큰 | 최소 너비 | 디바이스 |
|---|---|---|
| (default) | 0 | 모바일 (360-639px 가정) |
| `sm:` | 640px | 큰 모바일 / 작은 태블릿 |
| `md:` | 768px | 태블릿 |
| `lg:` | 1024px | 데스크톱 |
| `xl:` | 1280px | 와이드 데스크톱 |

### 모바일 우선

- 한국 사용자 모바일 비중 ≥ 60% 가정 (연말정산 기간 모바일 입력 시나리오 다수)
- 기본 스타일은 모바일, `md:`/`lg:`에서 확장
- 모바일 페이지 좌우 패딩 `px-4`, 태블릿 이상 `px-6`

### 터치 타깃

- 모든 인터랙티브 요소 **최소 44×44px** (iOS HIG 준수)
- 버튼 기본 높이 44px (`h-11`), 인풋 44px, 사이드바 nav 아이템 44px
- 표 안의 작은 액션 아이콘은 44px 히트 영역으로 감싸되 시각은 20px 아이콘만

### 페이지별 모바일 전략

| 페이지 | 데스크톱 | 모바일 |
|---|---|---|
| 랜딩 Hero | 좌측 카피 + 우측 시뮬레이션 카드 (2-col) | 카피 → 카드 (세로 stack), Hero 높이 `min-h-[80vh]` |
| 대시보드 | 사이드바 240px + 메인 | 사이드바 → bottom tab bar (4 탭, 64px 높이) |
| 계산기 폼 | 단일 컬럼 max-w-[640px] | 풀 와이드 px-4, 입력 간 gap-5 |
| 어드민 표 | 풀 와이드 표 | 표 → 카드 list (각 row를 카드로 변환) |
| 게시판 | max-w-[760px] | 풀 와이드, 메타 정보는 `text-caption`로 축소 |

### 한국 사용자 모바일 고려

- 한국 모바일 키보드 점유 시 인풋이 가려지지 않도록 폼은 `scroll-margin-bottom: 40vh`
- iOS Safari Safe Area 대응 (`env(safe-area-inset-bottom)`)
- 본문 폰트 모바일 최소 15px (한글 작은 폰트 가독성 저하 방지)

### 접힘 전략

- Top nav: 모바일에서 햄버거 → 풀스크린 오버레이 (드롭다운 X — 한 손 조작 고려)
- 표 헤더: 모바일에서 표 → 카드 변환 (수평 스크롤보다 우선)
- 사이드바: 모바일에서 bottom tab bar로 변환 (드로어 X — 직관성)

---

## §9 Agent Prompt Guide

### 빠른 색상 참조 (복붙용)

```
Primary (Navy 900):    #0F2547  oklch(0.235 0.058 262)
Primary 700:           #1E3A66  oklch(0.345 0.073 262)
Foreground (Ink):      #0B1A33  oklch(0.180 0.040 262)
Background (Off-white):#F7F8FA  oklch(0.978 0.003 247)
Card (White):          #FFFFFF  oklch(1 0 0)
Accent Mint:           #26C485  oklch(0.745 0.155 158)
Mint Dark:             #159B65  oklch(0.605 0.145 158)
Warning Amber:         #D08A1E  oklch(0.640 0.135 70)
Danger Coral:          #C8483D  oklch(0.555 0.165 28)
Neutral 200 (hairline):#DDE1E8  oklch(0.890 0.010 247)
Neutral 500 (caption): #6B7280  oklch(0.555 0.018 247)
```

### 프롬프트 템플릿 (taxback365 톤으로 디자인할 때)

> "한국 직장인의 연말정산 환급을 위한 SaaS, taxback365의 [페이지명]을 디자인한다. 톤은 Modern Fintech Minimal × Korean Trust — Wise/Wealthsimple의 정돈된 핀테크 베이스 위에 한국 세무 양식의 정밀성을 더한 차분한 신뢰감. Navy(#0F2547) 지배색에 Off-white(#F7F8FA) 배경, Mint(#26C485) 강조 1종을 8% 비중으로만 사용한다. 모든 숫자는 Inter Mono + tabular-nums로 표기하고, 강조 숫자(환급액 등)는 한자 단위(`万`)를 마이크로 사이즈로 병기한다. 한글 본문은 Pretendard, 영문/숫자는 Inter, 디스플레이 숫자는 Inter Mono. 카드는 1px `#DDE1E8` hairline + 12px radius, hard shadow 금지(soft 3-tier만), 도트 배경 금지, Neo-Brutalism 잔재 금지. 모바일 우선(터치 44px), 터치 타깃 최소 44px. 한 화면 Primary CTA 1개, Mint는 환급/성공 한정. 금액은 우측 정렬 Mono."

### 로고 컨셉 옵션 3안

#### 옵션 A — 워드마크 only

`taxback365`를 단일 워드마크로. Inter Display Bold로 `taxback`을 Navy 900, `365`를 Inter Mono Semibold로 분리해 동일 크기 유지. baseline 정렬은 동일하나 `365`만 미세하게 tabular-nums 인상을 주는 폭으로 처리. tracking은 -2.5%. 유일한 장식은 `tax`와 `back` 사이의 거의 보이지 않는 1px Mint vertical hairline (높이 0.6em).

- **인상**: 가장 핀테크답고 깨끗함. Wise/Mercury 동급. 가장 보수적이고 안전.
- **장점**: 모든 사이즈에서 가독성 보장. favicon은 `t365` 또는 `t` 단일 글자 추출 용이. 구현 1일.
- **단점**: 차별화 약함. "또 하나의 깔끔한 핀테크 워드마크"로 묻힐 위험. 사용자가 5초 후 로고를 기억하기 어려움.
- **구현 난이도**: ★☆☆ (낮음)

#### 옵션 B — 한글 자모 심볼 + 워드마크

`ㅌ` 자모를 기하학적으로 단순화한 심볼(가로 3획을 동일 두께 1.5px stroke로 정렬, 정사각형 24×24 viewBox, Navy 900 stroke + 마지막 가로획만 Mint)을 워드마크 좌측에 배치. `ㅌ`은 `taxback`의 음운적/시각적 닻이며, 한국 사용자에게 즉시 "한국 서비스"를 신호한다. 워드마크는 옵션 A와 동일하되 Mint hairline 제거.

- **인상**: 가장 차별화. taxback365만의 시각적 흔적이 강함. 한국 핀테크 정체성 명확. 토스 카피캣 회피.
- **장점**: favicon이 `ㅌ` 심볼 단독으로 가능 (한자 풍 인상도 줄 수 있음). 마케팅 공간(앱 아이콘, OG 이미지)에서 강한 시각 시그니처. 차별화 ★★★★.
- **단점**: 한국어 모르는 사용자에게는 의미 불명. 자모 디자인이 어색하면 "조잡함" 위험 — 그래픽 디자이너 협업 필수. 구현 3-5일.
- **구현 난이도**: ★★★ (중간-높음)

#### 옵션 C — 기하학 심볼 (받는 화살표)

위→아래로 향하는 단순화된 화살표(또는 환급을 상징하는 "안으로 들어오는" 모티프) 심볼을 워드마크 좌측에 배치. 24×24 viewBox, Navy 900 면적 + 화살표 끝 Mint 점. "환급 = 받음 = 안으로 들어옴"의 도메인 메타포. 자모 사용 없이 보편 기호로만 표현.

- **인상**: 글로벌 핀테크 디자인 언어와 자연스럽게 어울림. 도메인 의미(환급)가 직접 시각화됨. 깔끔.
- **장점**: 의미 전달 즉각적("뭔가 받는 서비스"). 한국어 비의존이라 OG 이미지·해외 SEO에서도 동일 효과. 구현 2-3일.
- **단점**: "화살표 + 워드마크"는 핀테크에서 흔한 모티프(특히 환전·송금) — 차별화 ★★. taxback365의 한국적 맥락이 시각에 드러나지 않음. §1 탈템플릿 결정과 일부 충돌(한자 단위 표기 시스템과 시각적 일관성을 떨어뜨릴 수 있음).
- **구현 난이도**: ★★☆ (중간)

---

### 권장 (Phase 0 디자이너 의견)

**옵션 B (한글 자모 심볼 + 워드마크) 권장.** §1 탈템플릿 결정(한자 단위 표기 시스템)과 시각적으로 일관되며, "토스 카피캣" 우려를 회피하는 가장 직접적 차별화 수단이다. 옵션 A는 안전하지만 사용자가 명시한 "리뉴얼" 가치를 절반만 실현. 옵션 C는 보편적이지만 도메인 정체성(한국 직장인 세무) 신호가 약하다. 최종 결정은 다음 단계(`/plan`)에서 로고 디자이너 협업 여부와 함께 확정.

---

> **Phase 0 종료.** 다음 단계: `/plan from-design DESIGN.md` — 13 페이지 + 6 컴포넌트 마이그레이션 태스크 분해, HARD-GATE 전체 등급, `feat/redesign` worktree 권장.
