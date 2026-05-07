import * as React from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[14px]",
};

const variantClass: Record<Variant, string> = {
  primary: clsx(
    "bg-primary text-primary-foreground font-semibold",
    "hover:bg-primary-700",
    "focus-visible:ring-primary-600",
    "disabled:bg-neutral-300",
  ),
  secondary: clsx(
    "bg-card text-foreground border border-neutral-200",
    "hover:bg-neutral-100 hover:border-neutral-300",
    "focus-visible:ring-primary-600",
    "disabled:opacity-50",
  ),
  ghost: clsx(
    "bg-transparent text-foreground",
    "hover:bg-neutral-100",
    "focus-visible:ring-primary-600",
    "disabled:opacity-50",
  ),
  danger: clsx(
    "bg-danger text-card font-semibold",
    "hover:brightness-90",
    "focus-visible:ring-danger",
    "disabled:opacity-50",
  ),
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          base,
          sizeClass[size],
          variantClass[variant],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="opacity-70">{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

/**
 * Link 스타일이 필요할 때 — Button 대신 사용. 동일 variant/size 시각.
 * 기존 button을 anchor로 바꿀 수 없는 상황(Next.js Link 래핑 등)에서 적용.
 */
type LinkButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  size?: Size;
};

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function LinkButton(
    { variant = "primary", size = "md", className, ...props },
    ref,
  ) {
    return (
      <a
        ref={ref}
        className={clsx(
          base,
          sizeClass[size],
          variantClass[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
