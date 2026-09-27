"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// 1. Guard against "Cannot read properties of null (reading 'removeChild')"
// Caused by third-party scripts, live chat widgets, or next-themes detached style tags during route changes
if (typeof window !== "undefined") {
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
        if (!child || child.parentNode !== this) {
            return child;
        }
        return originalRemoveChild.call(this, child);
    };

    // 2. Filter out React 19 false-positive "script tag inside React component" warning for next-themes
    if (process.env.NODE_ENV === "development") {
        const originalConsoleError = console.error;
        console.error = (...args: unknown[]) => {
            if (
                typeof args[0] === "string" &&
                args[0].includes("Encountered a script tag while rendering React component")
            ) {
                return;
            }
            originalConsoleError.apply(console, args);
        };
    }
}

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider
            enableColorScheme={false}
            disableTransitionOnChange={false}
            {...props}
        >
            {children}
        </NextThemesProvider>
    );
}
