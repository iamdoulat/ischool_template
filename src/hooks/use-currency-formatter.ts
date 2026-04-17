"use client";

import { useCurrency } from "@/components/providers/currency-provider";

export function useCurrencyFormatter() {
    const { selectedCurrency } = useCurrency();

    const formatCurrency = (amount: number | string) => {
        const value = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(value)) return "0.00";

        const symbol = selectedCurrency?.symbol || "$";
        // If we want to apply conversion rate:
        // const rate = selectedCurrency?.rate || 1;
        // const converted = value * rate;

        return `${symbol}${value.toFixed(2)}`;
    };

    return {
        symbol: selectedCurrency?.symbol || "$",
        code: selectedCurrency?.short_code || "USD",
        formatCurrency,
        selectedCurrency
    };
}
