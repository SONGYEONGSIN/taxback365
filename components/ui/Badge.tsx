import * as React from "react";
import clsx from "clsx";

type Variant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "outline";

/** 기존 코드 호환을 위한 legacy variant. 새 코드는 variant prop을 사용한다. */
type LegacyType = "high" | "medium" | "low" | "new";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  /** @deprecated 새 코드는 variant + children을 사용. legacy 호환 전용. */
  type?: LegacyType;
}

const variantClass: Record<Variant, string> = {
  // Dub functional accents — subtle bg + saturated text
  success: "bg-highlight-green/20 text-fresh-green",
  warning: "bg-highlight-orange/30 text-warm-orange",
  danger: "bg-highlight-orange/40 text-warm-orange",
  info: "bg-highlight-violet/20 text-deep-violet",
  neutral: "bg-subtle-ash text-shadow-gray",
  outline: "border border-border-light bg-transparent text-ink-black",
};

const legacyMap: Record<LegacyType, { variant: Variant; label: string }> = {
  high: { variant: "danger", label: "HIGH IMPACT" },
  medium: { variant: "warning", label: "MEDIUM" },
  low: { variant: "neutral", label: "INFO" },
  new: { variant: "info", label: "NEW 2026" },
};

export function Badge({
  variant,
  type,
  className,
  children,
  ...props
}: BadgeProps) {
  let resolvedVariant: Variant = variant ?? "neutral";
  let resolvedChildren: React.ReactNode = children;

  if (type && !variant && !children) {
    const mapped = legacyMap[type];
    resolvedVariant = mapped.variant;
    resolvedChildren = mapped.label;
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center px-3 py-1 rounded-full text-caption font-medium",
        variantClass[resolvedVariant],
        className,
      )}
      {...props}
    >
      {resolvedChildren}
    </span>
  );
}
