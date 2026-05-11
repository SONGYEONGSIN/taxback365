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
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 focus-visible:ring-offset-2";

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-caption",
  md: "h-10 px-4 text-body",
};

const variantClass: Record<Variant, string> = {
  primary: clsx(
    "bg-ink-black text-canvas-white font-medium",
    "hover:opacity-90",
    "shadow-subtle",
  ),
  secondary: clsx(
    "bg-canvas-white text-ink-black border border-border-light",
    "hover:bg-subtle-ash",
  ),
  ghost: clsx("bg-transparent text-ink-black", "hover:bg-subtle-ash"),
  // Dub은 red 미사용 — danger는 warm-orange 톤으로 통일
  danger: clsx(
    "bg-warm-orange text-canvas-white font-medium",
    "hover:opacity-90",
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
