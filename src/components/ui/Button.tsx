import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { clsx } from "clsx";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-brand to-accent text-white shadow-lg shadow-brand/30 hover:shadow-xl hover:shadow-brand/40 hover:scale-105 focus-visible:outline-brand",
        secondary:
          "bg-surface-elevated text-text shadow-md hover:shadow-lg hover:bg-brand-muted/60 hover:scale-105 focus-visible:outline-accent dark:bg-surface-elevated-dark dark:text-text-dark-on-surface dark:hover:shadow-slate-900/50",
        ghost: "text-text-muted hover:text-brand hover:scale-105 dark:text-text-dark-on-surface/80 dark:hover:text-brand",
        tonal:
          "bg-brand-muted text-brand-dark hover:bg-brand-muted/80 hover:scale-105 focus-visible:outline-brand dark:bg-brand-muted/30 dark:text-brand",
      },
      size: {
        sm: "px-3 py-1 text-sm",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, children, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={clsx(buttonStyles({ variant, size }), className)} {...rest}>
      {children}
    </button>
  );
});
