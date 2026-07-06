/**
 * Design tokens — taxback365 (Premium Dark Fintech)
 *
 * 1차 출처는 app/globals.css의 :root CSS 변수 + @theme inline 블록 (Tailwind v4).
 * 본 파일은 동일 값을 TS `as const`로 미러링한다.
 *
 * 변경 시 globals.css와 함께 동기화 필수.
 * 컴포넌트는 가능하면 Tailwind 클래스(`bg-surface`, `text-hi`, `text-mint`, `text-mono-display` 등)를 우선 사용하고,
 * 직접 색 참조가 필요한 경우(인라인 스타일·차트 라이브러리·SVG 등)에만 본 토큰을 import한다.
 */

export const colors = {
  /* Surfaces (off-black base + elevated) */
  base: "#0b0c0f",
  ink: "#0b0c0f", // mint 등 밝은 액센트 위 어두운 텍스트
  surface: "#14161b",
  surface2: "#1b1f27",
  surface3: "#232833",

  /* Borders / hairlines */
  edge: "#23262e",
  edgeStrong: "#333844",

  /* Text */
  hi: "#f4f6f9",
  mid: "#a7aebc",
  dim: "#6b7280",

  /* Accents — brand mint + 시맨틱 */
  mint: "#35e4a4", // 브랜드 액센트 / 양수 / 강조
  mintSoft: "#1e5c48",
  rose: "#fb7185", // 음수 / 파괴적 액션
  amber: "#fbbf24", // 경고 / 주의
  sky: "#60a5fa", // 정보 / 보조

  /* 시맨틱 별칭 (globals.css 매핑과 정합) */
  background: "#0b0c0f",
  foreground: "#f4f6f9",
  card: "#14161b",
  cardForeground: "#f4f6f9",
  muted: "#1b1f27",
  mutedForeground: "#a7aebc",
  border: "#23262e",
  input: "#14161b",
  ring: "#35e4a4",
  primary: "#35e4a4",
  primaryForeground: "#0b0c0f",
  destructive: "#fb7185",
  destructiveForeground: "#0b0c0f",
} as const;

export const radius = {
  md: "8px",
  xl: "12px",
  "2xl": "16px",
  "2xl2": "20px",
  full: "9999px",
  DEFAULT: "8px",
} as const;

/**
 * 다크 elevation — drop shadow보다 border/glow 우선.
 * 카드 elevation은 `border border-edge` + 필요 시 아래 shadow 병행.
 */
export const shadows = {
  sm: "rgba(0, 0, 0, 0.4) 0px 1px 2px 0px",
  md: "rgba(0, 0, 0, 0.5) 0px 10px 15px -3px, rgba(0, 0, 0, 0.4) 0px 4px 6px -4px",
  lg: "rgba(0, 0, 0, 0.6) 0px 24px 60px -20px",
  mintGlow: "rgba(53, 228, 164, 0.16) 0px 0px 60px 0px",
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
 * 4px base spacing scale.
 * 페이지 유형별 적용:
 *  - 랜딩: section gap 64px, card padding 16px
 *  - 대시보드/계산기: 16px element-gap
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
