"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "brand" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading,
      disabled,
      className = "",
      children,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      primary: "bg-emerald text-white hover:bg-emerald-deep active:bg-ink focus:ring-emerald-bright",
      brand: "bg-gradient-to-b from-emerald-bright to-emerald text-white hover:from-emerald-hover hover:to-emerald-focus active:from-emerald-pressed active:to-emerald-pressed focus:ring-emerald-bright",
      secondary: "bg-white text-ink border border-border hover:bg-ground active:bg-line-light focus:ring-emerald-bright",
      danger: "bg-white text-danger border border-danger-border hover:bg-danger-soft active:bg-danger-soft focus:ring-danger",
      ghost: "bg-transparent text-ink hover:bg-ground active:bg-line-light focus:ring-emerald-bright",
    };

    const sizeStyles = {
      sm: "h-10 px-4 text-sm rounded-full",
      md: "h-13 px-6.5 text-base rounded-full",
      lg: "h-14 px-8 text-lg rounded-full",
    };

    return (
      <button
        ref={ref}
// disabled is not a valid attribute for <a>, handle via pointer-events
  style={disabled || isLoading ? { pointerEvents: "none", opacity: 0.5 } : undefined}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export function AnchorButton({
  variant = "brand",
  size = "md",
  isLoading,
  disabled,
  className = "",
  children,
  leftIcon,
  rightIcon,
  href,
  ...props
}: {
  variant?: "primary" | "brand" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href: string;
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: "bg-emerald text-white hover:bg-emerald-deep active:bg-ink focus:ring-emerald-bright",
    brand: "bg-gradient-to-b from-emerald-bright to-emerald text-white hover:from-emerald-hover hover:to-emerald-focus active:from-emerald-pressed active:to-emerald-pressed focus:ring-emerald-bright",
    secondary: "bg-white text-ink border border-border hover:bg-ground active:bg-line-light focus:ring-emerald-bright",
    danger: "bg-white text-danger border border-danger-border hover:bg-danger-soft active:bg-danger-soft focus:ring-danger",
    ghost: "bg-transparent text-ink hover:bg-ground active:bg-line-light focus:ring-emerald-bright",
  };

  const sizeStyles = {
    sm: "h-10 px-4 text-sm rounded-full",
    md: "h-13 px-6.5 text-base rounded-full",
    lg: "h-14 px-8 text-lg rounded-full",
  };

  return (
    <a
      href={href}
      style={{ pointerEvents: disabled || isLoading ? "none" : undefined, opacity: disabled || isLoading ? 0.5 : undefined }}
      className={`${"inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-offset-2"} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </a>
  );
}