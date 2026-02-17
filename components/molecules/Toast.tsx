"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number;
}

interface ToastItemProps extends Toast {
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({
  id,
  variant,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300); // Tempo para animação
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const variantStyles = {
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: <Info className="h-5 w-5 text-blue-600" />,
      text: "text-blue-900",
    },
    success: {
      bg: "bg-green-50 border-green-200",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      text: "text-green-900",
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      text: "text-yellow-900",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      icon: <AlertCircle className="h-5 w-5 text-red-600" />,
      text: "text-red-900",
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg mb-3 min-w-75 max-w-md",
        style.bg,
        isExiting
          ? "animate-out slide-out-to-right-full"
          : "animate-in slide-in-from-right-full",
      )}
      role="alert"
    >
      {/* Icon */}
      <div className="shrink-0">{style.icon}</div>

      {/* Message */}
      <div className={cn("flex-1 text-sm", style.text)}>{message}</div>

      {/* Close Button */}
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(id), 300);
        }}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);

  if (toasts.length === 0) return null;

  if (!mounted) setMounted(true);

  return createPortal(
    <div
      className="fixed top-4 right-4 z-100 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} onClose={onClose} />
        ))}
      </div>
    </div>,
    document.body,
  );
};

// Hook para gerenciar toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (variant: ToastVariant, message: string, duration?: number) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, variant, message, duration }]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    info: (message: string, duration?: number) =>
      addToast("info", message, duration),
    success: (message: string, duration?: number) =>
      addToast("success", message, duration),
    warning: (message: string, duration?: number) =>
      addToast("warning", message, duration),
    error: (message: string, duration?: number) =>
      addToast("error", message, duration),
  };
};
