import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-ota-orange hover:bg-ota-orange-dark text-white focus:ring-ota-orange/50",
  secondary:
    "bg-ota-blue hover:bg-ota-blue-dark text-white focus:ring-ota-blue/50",
  outline:
    "border-2 border-ota-orange text-ota-orange hover:bg-ota-orange hover:text-white",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500/50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "py-1.5 px-3 text-sm",
  md: "py-2.5 px-6 text-base",
  lg: "py-3 px-8 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "font-semibold rounded-lg transition-colors duration-200",
          "focus:outline-none focus:ring-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "inline-flex items-center justify-center gap-2",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
