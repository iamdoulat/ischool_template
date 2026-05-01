"use client";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, Loader2 } from "lucide-react";
import { useCurrency } from "@/components/providers/currency-provider";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

export function CurrencySwitcher() {
    const { selectedCurrency, setSelectedCurrency, availableCurrencies, loading } = useCurrency();
    const { t } = useLanguage();

    return (
        <div className="relative group flex items-center justify-center">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl relative group"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <CircleDollarSign className="h-5 w-5" />
                                {selectedCurrency && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white font-black ring-2 ring-background uppercase">
                                        {selectedCurrency.symbol}
                                    </span>
                                )}
                            </>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 bg-card/95 backdrop-blur-md border-muted/50 shadow-2xl rounded-2xl" align="end" sideOffset={12}>
                    <div className="p-3 border-b border-muted/50 mb-2">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Select Currency</p>
                    </div>
                    <div className="space-y-1">
                        {availableCurrencies.map((currency) => (
                            <Button
                                key={currency.id}
                                variant="ghost"
                                onClick={() => setSelectedCurrency(currency)}
                                className={cn(
                                    "w-full justify-between items-center h-10 text-sm font-medium rounded-xl hover:bg-primary/10 transition-all px-3",
                                    selectedCurrency?.id === currency.id ? "bg-primary/15 text-primary" : "text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={cn(
                                        "w-8 h-6 rounded bg-muted/50 flex items-center justify-center text-[10px] font-bold uppercase",
                                        selectedCurrency?.id === currency.id ? "bg-primary/20" : ""
                                    )}>
                                        {currency.short_code}
                                    </div>
                                    <span className="font-semibold text-[12px]">{currency.currency}</span>
                                </div>
                                <span className="text-muted-foreground font-bold">{currency.symbol}</span>
                            </Button>
                        ))}
                        {availableCurrencies.length === 0 && !loading && (
                            <div className="p-4 text-center text-[11px] text-muted-foreground italic">
                                No currencies available
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-[#6366f1] text-white text-[11px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#6366f1] rotate-45" />
                Change Currency
            </div>
        </div>
    );
}
