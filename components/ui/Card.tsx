import * as React from "react";
import clsx from "clsx";

// Dub 3-variant. 1차의 resting/raised는 호환 매핑으로 그대로 동작.
type Variant = "outlined" | "raised" | "subtle" | "resting";
type Padding = "sm" | "md" | "lg" | "none";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padding?: Padding;
  interactive?: boolean;
}

const paddingClass: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const variantClass: Record<Variant, string> = {
  // Outlined: Dub 표준 (1차 resting 매핑)
  outlined: "bg-canvas-white border border-border-light rounded-xl",
  resting: "bg-canvas-white border border-border-light rounded-xl",
  // Raised: 4px halo (Dub raised)
  raised: "bg-canvas-white rounded-2xl shadow-subtle-2",
  // Subtle: ash 배경 (CTA band 등)
  subtle: "bg-subtle-ash rounded-2xl",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    variant = "outlined",
    padding = "md",
    interactive = false,
    className,
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx(
        variantClass[variant],
        paddingClass[padding],
        interactive &&
          "transition-all duration-200 hover:shadow-subtle cursor-pointer",
        className,
      )}
      {...props}
    />
  );
});

interface CardHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function CardHeader({
  title,
  description,
  action,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={clsx("flex items-start justify-between gap-4 mb-4", className)}
      {...props}
    >
      <div className="min-w-0">
        <h3 className="text-h3 text-ink-black">{title}</h3>
        {description ? (
          <p className="text-body-sm text-shadow-gray mt-1">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}
