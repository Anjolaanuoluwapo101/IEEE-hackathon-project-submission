"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={title ? "modal-title" : undefined}>
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative w-full ${sizeClasses[size]} animate-slide-up bg-white rounded-2xl shadow-xl`}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-line">
            <h2 id="modal-title" className="d text-xl">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-ground transition-colors"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  position?: "left" | "right" | "bottom";
}

export function Drawer({ isOpen, onClose, children, title, position = "right" }: DrawerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClasses = {
    left: "justify-start",
    right: "justify-end",
    bottom: "items-end",
  };

  const drawerClasses = {
    left: "w-full max-w-[320px]",
    right: "w-full max-w-[320px]",
    bottom: "w-full max-h-[70vh]",
  };

  return (
    <div className={`fixed inset-0 z-[100] flex ${positionClasses[position]} p-4`} role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative ${drawerClasses[position]} animate-slide-up bg-white rounded-2xl shadow-xl flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h2 className="b7">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-ground transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}