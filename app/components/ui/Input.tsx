"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...restProps }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="lab">
            {restProps.required && (
              <span className="text-danger ml-1" aria-hidden="true">*</span>
            )}
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...restProps}
          className={`in ${error ? "error" : ""} ${restProps.disabled ? "disabled" : ""} ${className}`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={`${errorId || ""} ${helperId || ""}`.trim() || undefined}
        />
        {error && (
          <p id={errorId} className="hp text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="hp">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";