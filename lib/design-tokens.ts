/**
 * Design tokens — taxback365 (Dub Design System — Crisp Utility on White Canvas)
 *
 * 1차 출처는 app/globals.css의 :root CSS 변수 + @theme inline 블록 (Tailwind v4).
 * 본 파일은 동일 값을 TS `as const`로 미러링한다.
 *
 * 변경 시 globals.css와 함께 동기화 필수. design-ref/DESIGN.md가 단일 진실원.
 * 컴포넌트는 가능하면 Tailwind 클래스(`bg-canvas-white`, `text-ink-black`, `text-mono-display` 등)를 우선 사용하고,
 * 직접 색 참조가 필요한 경우(인라인 스타일·차트 라이브러리·SVG 등)에만 본 토큰을 import한다.
 */

export const colors = {
  /* Surfaces / semantic aliases */
  background: "#ffffff",
  foreground: "#0a0a0a",
  card: "#ffffff",
  cardForeground: "#0a0a0a",
  popover: "#ffffff",
  popoverForeground: "#0a0a0a",

  primary: "#0a0a0a",
  primaryForeground: "#ffffff",
  secondary: "#ffffff",
  secondaryForeground: "#0a0a0a",

  muted: "#f5f5f5",
  mutedForeground: "#262626",
  border: "#e5e5e5",
  input: "#ffffff",
  ring: "#1e40af",

  destructive: "#ea580c",
  destructiveForeground: "#ffffff",

  /* Dub palette — 직접 사용 가능 */
  canvasWhite: "#ffffff",
  jetBlack: "#000000",
  inkBlack: "#0a0a0a",
  thunderGray: "#171717",
  shadowGray: "#262626",
  steelGray: "#404040",
  subtleAsh: "#f5f5f5",
  borderLight: "#e5e5e5",
  borderMuted: "#d4d4d4",
  systemInfo: "#111827",

  accent: {
    blue: "#3b82f6",
    freshGreen: "#16a34a",
    warmOrange: "#ea580c",
    deepViolet: "#7c3aed",
    focusRingBlue: "#1e40af",
  },

  highlight: {
    green: "#4ade80",
    violet: "#c084fc",
    orange: "#fb923c",
  },

  linearGray: {
    dark: "#525252",
    light: "#737373",
  },
} as const;

export const radius = {
  md: "8px",
  xl: "12px",
  "2xl": "16px",
  "2xl2": "20px",
  full: "9999px",
  DEFAULT: "8px",
} as const;

export const shadows = {
  subtle: "rgba(0, 0, 0, 0.05) 0px 1px 2px 0px",
  sm: "rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px",
  sm2: "rgba(0, 0, 0, 0.2) 0px 2px 6px 0px inset",
  subtle2: "rgba(0, 0, 0, 0.1) 0px 0px 0px 4px",
  md: "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px",
  lg: "rgba(0, 0, 0, 0.09) 0px 20px 20px 0px",
  subtle3: "rgb(255, 255, 255) 0px 0px 0px 3px, rgb(0, 0, 0) 0px 0px 0px 4px",
} as const;

export const borders = {
  width: "1px",
  hairline: "1px",
} as const;

export const typography = {
  baseFontSize: "14px",
  fontDisplay:
    'var(--font-montserrat-loaded), "Montserrat", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  fontBody:
    'var(--font-inter-loaded), "Inter", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  fontMono:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as const;

/**
 * 4px base spacing scale (Dub spec § Spacing).
 * 페이지 유형별 적용:
 *  - 랜딩: section gap 64px (section-gap), card padding 16px
 *  - 대시보드/계산기: 동일 16px element-gap
 *  - 어드민 표: row py-2 (8px), px-3 (12px) 고밀도
 */
export const spacing = {
  4: "4px",
  8: "8px",
  12: "12px",
  16: "16px",
  20: "20px",
  24: "24px",
  28: "28px",
  32: "32px",
  36: "36px",
  40: "40px",
  48: "48px",
  56: "56px",
  64: "64px",
  80: "80px",
  96: "96px",
  112: "112px",
} as const;

export const layout = {
  pageMaxWidth: "1200px",
  sectionGap: "64px",
  cardPadding: "16px",
  elementGap: "16px",
} as const;
