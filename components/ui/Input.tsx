import * as React from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  helpText?: React.ReactNode;
  errorText?: React.ReactNode;
  /** 금액 입력 모드 — Mono + tabular + 우측 정렬 + 단위 suffix */
  amount?: boolean;
  suffix?: React.ReactNode;
}

const baseField =
  "w-full h-10 px-3 rounded-md bg-canvas-white text-system-info text-body placeholder:text-steel-gray transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      helpText,
      errorText,
      amount = false,
      suffix,
      id,
      className,
      disabled,
      ...props
    },
    ref,
  ) {
    const reactId = React.useId();
    const fieldId = id ?? reactId;
    const helpId = helpText ? `${fieldId}-help` : undefined;
    const errorId = errorText ? `${fieldId}-err` : undefined;
    const describedBy = errorId ?? helpId;

    const fieldBorder = errorText
      ? "border border-warm-orange focus-visible:border-warm-orange focus-visible:ring-warm-orange/30"
      : "border border-border-muted hover:border-shadow-gray focus-visible:border-focus-ring-blue";

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={fieldId}
            className="text-body-sm font-medium text-ink-black"
          >
            {label}
          </label>
        ) : null}

        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            aria-describedby={describedBy}
            aria-invalid={errorText ? true : undefined}
            disabled={disabled}
            className={clsx(
              baseField,
              fieldBorder,
              amount && "font-mono text-right tabular-nums pr-9",
              disabled && "bg-subtle-ash text-steel-gray cursor-not-allowed",
              className,
            )}
            {...props}
          />
          {amount || suffix ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-body-sm text-shadow-gray">
              {suffix ?? "원"}
            </span>
          ) : null}
        </div>

        {errorText ? (
          <p id={errorId} className="text-caption text-warm-orange">
            {errorText}
          </p>
        ) : helpText ? (
          <p id={helpId} className="text-caption text-shadow-gray">
            {helpText}
          </p>
        ) : null}
      </div>
    );
  },
);
