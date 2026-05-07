/**
 * Design tokens — taxback365 (Modern Fintech Minimal × Korean Trust)
 *
 * 1차 출처는 app/globals.css의 :root CSS 변수 + @theme inline 블록 (Tailwind v4).
 * 본 파일은 동일 값을 TS `as const`로 미러링한다.
 *
 * 변경 시 globals.css와 함께 동기화 필수. DESIGN.md §2/§3/§6가 단일 진실원.
 * 컴포넌트는 가능하면 Tailwind 클래스(`bg-background`, `text-primary`, `text-mono-display` 등)를 우선 사용하고,
 * 직접 색 참조가 필요한 경우(인라인 스타일·차트 라이브러리·SVG 등)에만 본 토큰을 import한다.
 */

export const colors = {
    background: 'oklch(0.978 0.003 247)',
    foreground: 'oklch(0.180 0.040 262)',
    card: 'oklch(1 0 0)',
    cardForeground: 'oklch(0.180 0.040 262)',
    popover: 'oklch(1 0 0)',
    popoverForeground: 'oklch(0.180 0.040 262)',

    primary: 'oklch(0.235 0.058 262)',
    primaryForeground: 'oklch(1 0 0)',
    primary700: 'oklch(0.345 0.073 262)',
    primary600: 'oklch(0.435 0.080 262)',

    secondary: 'oklch(1 0 0)',
    secondaryForeground: 'oklch(0.180 0.040 262)',

    accent: {
        mint: 'oklch(0.745 0.155 158)',
        mintDark: 'oklch(0.605 0.145 158)',
    },

    warning: 'oklch(0.640 0.135 70)',
    danger: 'oklch(0.555 0.165 28)',
    success: 'oklch(0.605 0.145 158)',

    destructive: 'oklch(0.555 0.165 28)',
    destructiveForeground: 'oklch(1 0 0)',

    muted: 'oklch(0.943 0.006 247)',
    mutedForeground: 'oklch(0.555 0.018 247)',

    border: 'oklch(0.890 0.010 247)',
    input: 'oklch(1 0 0)',
    ring: 'oklch(0.435 0.080 262)',

    neutral: {
        50: 'oklch(0.978 0.003 247)',
        100: 'oklch(0.943 0.006 247)',
        200: 'oklch(0.890 0.010 247)',
        300: 'oklch(0.785 0.013 247)',
        500: 'oklch(0.555 0.018 247)',
        700: 'oklch(0.355 0.020 247)',
        900: 'oklch(0.180 0.040 262)',
    },

    /**
     * 16진수 폴백 — 차트 라이브러리·SVG·OG 이미지 생성 등 oklch 미지원 환경용.
     * DESIGN.md §2 hex 컬럼과 동기화.
     */
    hex: {
        background: '#F7F8FA',
        foreground: '#0B1A33',
        card: '#FFFFFF',
        primary: '#0F2547',
        primary700: '#1E3A66',
        primary600: '#2C4F84',
        mint: '#26C485',
        mintDark: '#159B65',
        warning: '#D08A1E',
        danger: '#C8483D',
        neutral200: '#DDE1E8',
        neutral500: '#6B7280',
    },
} as const;

export const radius = {
    sm: '6px',
    md: '8px',
    lg: '12px',
    pill: '9999px',
    DEFAULT: '8px',
} as const;

export const shadows = {
    resting: '0 1px 2px 0 rgb(15 37 71 / 0.04)',
    raised: '0 1px 3px 0 rgb(15 37 71 / 0.06), 0 1px 2px -1px rgb(15 37 71 / 0.04)',
    floating: '0 10px 15px -3px rgb(15 37 71 / 0.08), 0 4px 6px -4px rgb(15 37 71 / 0.05)',
} as const;

export const borders = {
    width: '1px',
    hairline: '1px',
} as const;

export const typography = {
    baseFontSize: '15px',
    fontDisplay: 'var(--font-inter), "Pretendard Variable", Pretendard, system-ui, sans-serif',
    fontBody: '"Pretendard Variable", Pretendard, var(--font-inter), system-ui, sans-serif',
    fontMono: 'var(--font-inter), "JetBrains Mono", "SF Mono", ui-monospace, monospace',
} as const;

/**
 * 4px base spacing scale (DESIGN.md §5).
 * 페이지 유형별 적용:
 *  - 랜딩: section py-24, card p-8 (저밀도)
 *  - 대시보드/계산기: section py-8, card p-6 (표준)
 *  - 어드민 표: row py-2, px-3 (고밀도)
 */
export const spacing = {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    24: '96px',
} as const;
