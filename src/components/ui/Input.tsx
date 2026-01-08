import { forwardRef } from "react";
import { clsx } from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name ?? label;
  return (
    <label className="flex w-full flex-col gap-1 text-sm text-text dark:text-text-dark-on-surface" htmlFor={inputId}>
      {label && <span className="font-medium">{label}</span>}
      <input
        {...rest}
        ref={ref}
        id={inputId}
        className={clsx(
          "rounded-2xl border border-transparent bg-surface-elevated px-4 py-3 text-base text-text shadow-sm transition placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 dark:bg-surface-elevated-dark dark:text-text-dark-on-surface dark:placeholder:text-text-dark-on-surface/50",
          error && "border-danger focus:ring-danger/30",
          className,
        )}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
});
