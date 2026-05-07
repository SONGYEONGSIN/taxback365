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
  "w-full h-11 px-3.5 rounded-md bg-card text-foreground text-body placeholder:text-neutral-300 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/25";

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
      ? "border border-danger focus-visible:border-danger focus-visible:ring-danger/25"
      : "border border-neutral-200 hover:border-neutral-300 focus-visible:border-primary";

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={fieldId}
            className="text-body-sm font-medium text-foreground"
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
              disabled && "bg-neutral-100 text-neutral-300 cursor-not-allowed",
              className,
            )}
            {...props}
          />
          {amount || suffix ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-body-sm text-neutral-500">
              {suffix ?? "원"}
            </span>
          ) : null}
        </div>

        {errorText ? (
          <p id={errorId} className="text-caption text-danger">
            {errorText}
          </p>
        ) : helpText ? (
          <p id={helpId} className="text-caption text-neutral-500">
            {helpText}
          </p>
        ) : null}
      </div>
    );
  },
);
