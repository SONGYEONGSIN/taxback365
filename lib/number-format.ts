/**
 * 숫자 표기 헬퍼 — taxback365 (DESIGN.md §3 탈템플릿 결정)
 *
 * 규칙:
 *  - 모든 금액은 ko-KR 콤마 + 정수 (소수 표기는 의도적 사용 시에만)
 *  - 한자 단위(萬/億)는 Hero·KPI 등 강조 영역에서만 병기
 *  - 음수 처리는 호출자가 부호를 결정 (자동 색상 분기 금지: DESIGN.md §7 Don'ts #6)
 */

/** "1,234,567" — 콤마 정수 (단위 없음). 인풋·표 안의 숫자에 사용 */
export function formatKRW(value: number): string {
  return Math.round(value).toLocaleString("ko-KR");
}

/** "1,234,567원" — 본문에 표시되는 일반 금액 */
export function formatKRWWithSuffix(value: number): string {
  return `${formatKRW(value)}원`;
}

interface UnitDisplay {
  /** 콤마가 들어간 정수 문자열 (Mono 표기 대상) */
  main: string;
  /** 한자 단위 — '万' | '億' | '' (단위 미적용 시) */
  unit: "" | "萬" | "億";
  /** 한국식 단위 라벨 ("만원" | "억원" | "원") — 보조 캡션용 */
  suffix: "원" | "만원" | "억원";
}

/**
 * Hero·KPI 등 강조 영역 전용. 금액을 한자 단위 표기와 함께 분해해 반환한다.
 * 1억 이상은 億 단위, 10,000원 이상은 萬 단위, 그 외는 단위 없음.
 *
 * 사용 예 (DESIGN.md §3 한자 단위 보조 표기):
 *   const { main, unit, suffix } = formatKRWWithUnit(12_345_678);
 *   <span class="text-mono-display">{main}</span>
 *   <span class="text-caption text-neutral-300 ml-1">{unit}{suffix}</span>
 *   // → "1,234" + "萬원"
 */
export function formatKRWWithUnit(value: number): UnitDisplay {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 100_000_000) {
    const eok = abs / 100_000_000;
    const formatted = eok % 1 === 0 ? eok.toFixed(0) : eok.toFixed(1);
    return {
      main: `${sign}${Number(formatted).toLocaleString("ko-KR")}`,
      unit: "億",
      suffix: "억원",
    };
  }

  if (abs >= 10_000) {
    const man = Math.round(abs / 10_000);
    return {
      main: `${sign}${man.toLocaleString("ko-KR")}`,
      unit: "萬",
      suffix: "만원",
    };
  }

  return {
    main: `${sign}${formatKRW(abs)}`,
    unit: "",
    suffix: "원",
  };
}

/** "12.3%" — 소수점 1자리. 표·뱃지·KPI 변화량 표기 */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/** 부호 명시 표기 ("+12.3%" / "-3.1%") — KPI 변화량 indicator. 색상은 호출자가 결정 */
export function formatPercentSigned(value: number, fractionDigits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(fractionDigits)}%`;
}
