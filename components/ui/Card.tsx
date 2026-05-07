import * as React from "react";
import clsx from "clsx";

type Variant = "resting" | "raised";
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
  resting: "bg-card border border-neutral-200",
  raised: "bg-card border border-neutral-200 shadow-resting",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    variant = "resting",
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
        "rounded-lg",
        variantClass[variant],
        paddingClass[padding],
        interactive &&
          "transition-shadow duration-200 hover:shadow-raised cursor-pointer",
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
        <h3 className="text-h3 text-foreground">{title}</h3>
        {description ? (
          <p className="text-body-sm text-neutral-500 mt-1">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}
