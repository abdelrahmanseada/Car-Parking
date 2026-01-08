import { forwardRef } from "react";
import { clsx } from "clsx";

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, className, error, id, ...rest },
  ref,
) {
  const selectId = id ?? rest.name ?? label;
  return (
    <label className="flex flex-col gap-1 text-sm text-text dark:text-text-dark-on-surface" htmlFor={selectId}>
      {label && <span className="font-medium">{label}</span>}
      <select
        {...rest}
        ref={ref}
        id={selectId}
        className={clsx(
          "rounded-2xl border border-transparent bg-surface-elevated px-4 py-3 text-base text-text shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:bg-surface-elevated-dark dark:text-text-dark-on-surface dark:border-slate-700/50",
          error && "border-danger focus:ring-danger/30",
          className,
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
});
