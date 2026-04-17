"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive" | "warning";
    loading?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    loading = false,
}: ConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[400px]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-sm font-bold uppercase tracking-tight">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-[11px] leading-relaxed">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 gap-2">
                    <AlertDialogCancel
                        disabled={loading}
                        className="h-8 text-[10px] font-bold uppercase rounded shadow-sm hover:bg-gray-100 transition-all border-none"
                    >
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={loading}
                        className={cn(
                            "h-8 text-[10px] font-bold uppercase rounded shadow-md transition-all border-none",
                            variant === "destructive" && "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white",
                            variant === "warning" && "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white",
                            variant === "default" && "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558dd] hover:to-[#7c3aed] text-white"
                        )}
                    >
                        {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
