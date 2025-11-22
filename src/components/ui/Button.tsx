import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { clsx } from "clsx";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-brand to-accent text-white shadow-lg shadow-brand/30 hover:brightness-105 focus-visible:outline-brand",
        secondary:
          "bg-surface-elevated text-text shadow-md hover:bg-brand-muted/60 focus-visible:outline-accent dark:bg-surface-elevated-dark dark:text-text-dark-on-surface",
        ghost: "text-text-muted hover:text-brand dark:text-text-dark-on-surface",
        tonal:
          "bg-brand-muted text-brand-dark hover:bg-brand-muted/80 focus-visible:outline-brand",
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
