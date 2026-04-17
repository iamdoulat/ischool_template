"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

interface Currency {
    id: number;
    currency: string;
    short_code: string;
    symbol: string;
    rate: number;
    is_base: boolean;
    is_active: boolean;
    is_enabled: boolean;
}

interface CurrencyContextType {
    selectedCurrency: Currency | null;
    setSelectedCurrency: (currency: Currency) => Promise<void>;
    availableCurrencies: Currency[];
    loading: boolean;
    refreshCurrencies: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType>({
    selectedCurrency: null,
    setSelectedCurrency: async () => { },
    availableCurrencies: [],
    loading: true,
    refreshCurrencies: async () => { },
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedCurrency, setSelectedCurrencyState] = useState<Currency | null>(null);
    const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCurrencies = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/system-setting/currencies");
            if (response.data.status === "Success") {
                const enabled = response.data.data.filter((c: Currency) => c.is_enabled);
                setAvailableCurrencies(enabled);

                const active = enabled.find((c: Currency) => c.is_active) || enabled[0];
                if (active) setSelectedCurrencyState(active);
            }
        } catch (error) {
            console.error("Failed to fetch currencies", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCurrencies();
    }, [fetchCurrencies]);

    const setSelectedCurrency = async (currency: Currency) => {
        try {
            const response = await api.post(`/system-setting/currencies/${currency.id}/toggle-active`);
            if (response.data.status === "Success") {
                setSelectedCurrencyState({ ...currency, is_active: true });
                // Update local list to reflect change if needed, or just re-fetch
                await fetchCurrencies();
            }
        } catch (error) {
            console.error("Failed to update active currency", error);
        }
    };

    return (
        <CurrencyContext.Provider value={{
            selectedCurrency,
            setSelectedCurrency,
            availableCurrencies,
            loading,
            refreshCurrencies: fetchCurrencies
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};
