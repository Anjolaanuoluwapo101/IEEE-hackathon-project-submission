"use client";

import { Button, AnchorButton } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
    variant?: "primary" | "brand" | "secondary";
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`card p-8 lg:p-12 text-center ${className}`}>
      {icon && (
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-mint flex items-center justify-center text-emerald">
          {icon}
        </div>
      )}
      <h3 className="d text-2xl lg:text-3xl mb-3">{title}</h3>
      <p className="text-muted text-base lg:text-lg max-w-md mx-auto mb-6">{description}</p>
      {action && (
        <AnchorButton variant={action.variant || "brand"} size="lg" href={action.href}>
          {action.label}
        </AnchorButton>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({ title, message, onRetry, retryLabel = "Try again", className = "" }: ErrorStateProps) {
  return (
    <div className={`card p-8 lg:p-12 text-center border-danger-border bg-danger-soft ${className}`}>
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-danger-soft flex items-center justify-center text-danger">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <h3 className="d text-2xl text-danger mb-2">{title}</h3>
      <p className="text-muted mb-6">{message}</p>
      {onRetry && (
        <Button variant="danger" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}