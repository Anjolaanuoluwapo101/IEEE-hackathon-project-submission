"use client";

import { useEffect, useState } from "react";

export function PrototypeBanner() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localStorage.getItem("circulagos-prototype-dismissed")) {
        setShow(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up" role="status" aria-live="polite">
      <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-neutral-200 shadow-lg max-w-sm animate-slide-up">
        <div className="flex items-center gap-2 text-neutral-700">
          <span className="text-lg" aria-hidden="true">🔬</span>
          <span className="font-medium text-neutral-900">Prototype Mode</span>
        </div>
        <p className="text-xs text-neutral-500 ml-6 flex-1">
          Demo data only — Sepolia testnet
        </p>
        <button
          onClick={() => {
            localStorage.setItem("circulagos-prototype-dismissed", "true");
            setShow(false);
          }}
          className="ml-2 p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="Dismiss prototype notice"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
