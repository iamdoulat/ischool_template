"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error";

export interface ToastMessage {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    toast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback((type: ToastType, message: string, duration = 3500) => {
        const id = ++_counter;
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => dismiss(id), duration);
    }, [dismiss]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Global Toaster */}
            <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium pointer-events-auto min-w-[260px] max-w-sm transition-all",
                            t.type === "success" ? "bg-green-600" : "bg-red-600"
                        )}
                    >
                        {t.type === "success"
                            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                            : <XCircle className="h-4 w-4 shrink-0" />
                        }
                        <span className="flex-1">{t.message}</span>
                        <button
                            onClick={() => dismiss(t.id)}
                            className="ml-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within a ToastProvider");
    return ctx;
}
