import * as React from "react";
import clsx from "clsx";

type Variant = "success" | "warning" | "danger" | "neutral" | "outline";

/** 기존 코드 호환을 위한 legacy variant. 새 코드는 variant prop을 사용한다. */
type LegacyType = "high" | "medium" | "low" | "new";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  /** @deprecated 새 코드는 variant + children을 사용. legacy 호환 전용. */
  type?: LegacyType;
}

const variantClass: Record<Variant, string> = {
  success: "bg-mint/15 text-mint-dark",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  neutral: "bg-neutral-100 text-neutral-700",
  outline: "border border-neutral-200 bg-transparent text-neutral-700",
};

const legacyMap: Record<LegacyType, { variant: Variant; label: string }> = {
  high: { variant: "danger", label: "HIGH IMPACT" },
  medium: { variant: "warning", label: "MEDIUM" },
  low: { variant: "success", label: "INFO" },
  new: { variant: "outline", label: "NEW 2026" },
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
        "inline-flex items-center px-2 py-0.5 rounded-pill text-caption font-medium",
        variantClass[resolvedVariant],
        className,
      )}
      {...props}
    >
      {resolvedChildren}
    </span>
  );
}
