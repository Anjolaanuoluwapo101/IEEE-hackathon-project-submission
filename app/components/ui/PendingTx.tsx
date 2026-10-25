"use client";

import { useState, useEffect } from "react";
import { Button } from "./Button";

interface PendingTxProps {
  status: "pending" | "confirming" | "confirmed" | "failed";
  message?: string;
  onRetry?: () => void;
}

export function PendingTx({ status, message, onRetry }: PendingTxProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (status !== "pending" && status !== "confirming") return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [status]);

  const statusConfig = {
    pending: {
      icon: (
        <svg className="spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.75" strokeLinecap="round" />
        </svg>
      ),
      title: "Pending",
      description: message || "Waiting for confirmation…",
      color: "text-emerald",
      bg: "bg-mint",
    },
    confirming: {
      icon: (
        <svg className="spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.75" strokeLinecap="round" />
        </svg>
      ),
      title: "Confirming on-chain…",
      description: message || "This takes a few seconds. Please keep this page open.",
      color: "text-emerald",
      bg: "bg-mint",
    },
    confirmed: {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      title: "Confirmed",
      description: message || "Transaction confirmed on-chain.",
      color: "text-emerald",
      bg: "bg-mint",
    },
    failed: {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
      title: "Failed",
      description: message || "Transaction failed. Please try again.",
      color: "text-danger",
      bg: "bg-danger-soft",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`card row p-4 gap-4 ${config.bg} animate-fade-in`}>
      <div className={`flex-shrink-0 ${config.color}`}>{config.icon}</div>
      <div className="flex-1">
        <div className="b8">{config.title}</div>
        <div className="text-sm text-muted mt-1">{config.description}</div>
      </div>
      {status === "failed" && onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}