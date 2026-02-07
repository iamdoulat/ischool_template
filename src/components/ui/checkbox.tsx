"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
    <div className="relative flex items-center justify-center">
        <input
            type="checkbox"
            ref={ref}
            className={cn(
                "peer h-4 w-4 shrink-0 rounded-sm border border-primary bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none checked:bg-primary checked:text-primary-foreground transition-all cursor-pointer",
                className
            )}
            {...props}
        />
        <Check
            className="absolute h-3 w-3 text-white scale-0 peer-checked:scale-100 transition-all pointer-events-none"
            strokeWidth={4}
        />
    </div>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
