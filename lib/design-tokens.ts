/**
 * Design tokens — taxback365 (Neo-Brutalism)
 *
 * 1차 출처는 app/globals.css의 :root CSS 변수 + @theme inline 블록 (Tailwind v4).
 * 이 파일은 동일 값을 TS `as const`로 미러링한다.
 *
 * 변경 시 globals.css와 함께 동기화 필수.
 * 컴포넌트는 가능하면 Tailwind 클래스(`bg-background`, `text-primary` 등)를 우선 사용하고,
 * 직접 색 참조가 필요한 경우(인라인 스타일·차트 라이브러리 등)에만 본 토큰을 import한다.
 */

export const colors = {
  background: '#FFFFFF',
  foreground: '#000000',
  card: '#FFFFFF',
  cardForeground: '#000000',
  popover: '#FFFFFF',
  popoverForeground: '#000000',

  primary: '#000000',
  primaryForeground: '#FFFFFF',
  secondary: '#FFFFFF',
  secondaryForeground: '#000000',

  accent: {
    orange: '#FF6B35',
    yellow: '#F7CB15',
    cyan: '#00D9FF',
    pink: '#FF85A1',
  },

  muted: '#e0e0e0',
  mutedForeground: '#555555',

  destructive: '#FF0000',
  destructiveForeground: '#FFFFFF',

  border: '#000000',
  input: '#FFFFFF',
  ring: '#00D9FF',

  neo: {
    black: '#000000',
    white: '#FFFFFF',
  },
} as const;

export const radius = {
  DEFAULT: '0px',
} as const;

export const shadows = {
  hard: '4px 4px 0px 0px #000000',
  hover: '2px 2px 0px 0px #000000',
} as const;

export const borders = {
  width: '3px',
} as const;

export const typography = {
  baseFontSize: '16px',
  fontHead: 'var(--font-lexend), "Lexend", sans-serif',
  fontBody: 'var(--font-inter), "Inter", sans-serif',
} as const;
