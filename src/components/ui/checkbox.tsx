"use client"

import * as React from "react"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'checked'> {
    checked?: boolean | "indeterminate"
    onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<
    HTMLInputElement,
    CheckboxProps
>(({ className, checked, onCheckedChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const resolvedRef = (ref as React.RefObject<HTMLInputElement | null>) || inputRef

    React.useEffect(() => {
        if (resolvedRef?.current) {
            resolvedRef.current.indeterminate = checked === "indeterminate"
        }
    }, [checked, resolvedRef])

    const isChecked = checked === true

    return (
        <div className="relative flex items-center justify-center">
            <input
                type="checkbox"
                ref={resolvedRef}
                checked={isChecked}
                className={cn(
                    "peer h-4 w-4 shrink-0 rounded-sm border border-primary bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none checked:bg-primary checked:text-primary-foreground transition-all cursor-pointer",
                    className,
                    checked === "indeterminate" && "bg-primary/30 border-primary/60"
                )}
                onChange={(e) => {
                    props.onChange?.(e)
                    onCheckedChange?.(e.target.checked)
                }}
                {...props}
            />
            {isChecked && (
                <Check
                    className="absolute h-3 w-3 text-white pointer-events-none"
                    strokeWidth={4}
                />
            )}
            {checked === "indeterminate" && (
                <Minus
                    className="absolute h-3 w-3 text-primary pointer-events-none"
                    strokeWidth={4}
                />
            )}
        </div>
    )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
