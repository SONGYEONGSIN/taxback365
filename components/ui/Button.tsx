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
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/40";

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-caption",
  md: "h-10 px-4 text-body",
};

const variantClass: Record<Variant, string> = {
  primary: clsx(
    "bg-mint text-ink font-semibold",
    "hover:brightness-110 active:scale-[0.98]",
  ),
  secondary: clsx(
    "bg-surface text-hi border border-edge-strong",
    "hover:bg-surface-2 active:scale-[0.98]",
  ),
  ghost: clsx("bg-transparent text-mid", "hover:text-hi hover:bg-surface"),
  // Dark 핀테크 — 음수/파괴적 액션은 rose
  danger: clsx(
    "bg-rose text-ink font-semibold",
    "hover:brightness-110 active:scale-[0.98]",
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
