"use client";

import { useState, useEffect } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { toLocaleNumber } from "@/lib/utils";

interface DistributionItem {
    name: string;
    value?: number | string;
    color?: string;
}

interface DistributionChartProps {
    title: string;
    data: DistributionItem[];
}

export function DistributionChart({ title, data }: DistributionChartProps) {
    const [mounted, setMounted] = useState(false);
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    
    // Filter out dummy/empty entries when computing total
    const validData = Array.isArray(data) ? data.filter(item => item && item.name !== 'No Data' && Number(item.value) > 0) : [];
    const total = validData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const hasData = validData.length > 0;

    const noDataLabel = t("no_data") || "No Data";
    const totalLabel = t("total") || "Total";

    // Display placeholder ring when there is no data
    const chartData = hasData 
        ? validData 
        : [{ name: noDataLabel, value: 1, color: '#e2e8f0' }];

    useEffect(() => {
        const id = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(id);
    }, []);

    return (
        <Card className="group hover:shadow-2xl transition-all duration-300 ease-in-out border-none cursor-pointer hover:-translate-y-1 hover:scale-[1.005] flex flex-col h-full bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
                <CardTitle className="text-sm font-bold text-foreground/80 uppercase tracking-widest">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center relative pb-6 px-0">
                <div className="h-[320px] min-h-[320px] w-full min-w-0 relative">
                    {mounted ? (
                        <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={320}>
                            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: -10 }}>
                            <defs>
                                {chartData.map((item, index) => (
                                    <linearGradient key={`gradient-${index}`} id={`colorPie-${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={item.color} stopOpacity={1} />
                                        <stop offset="100%" stopColor={item.color} stopOpacity={0.7} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="100%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={150}
                                outerRadius={210}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                                animationBegin={200}
                                animationDuration={1800}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={`url(#colorPie-${index})`}
                                        className="outline-none hover:opacity-80 transition-opacity duration-300"
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                    backdropFilter: "blur(8px)",
                                    borderColor: "rgba(0,0,0,0.05)",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                    border: "none"
                                }}
                                itemStyle={{ fontWeight: "bold" }}
                                formatter={(value: number | string | Array<number | string> | undefined, name: unknown) => [hasData ? toLocaleNumber(String(value ?? 0), shortCode) : toLocaleNumber(0, shortCode), String(name ?? "")]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-pulse bg-muted rounded-xl w-full h-[320px]" />
                        </div>
                    )}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pb-2">
                        <span className="text-5xl font-black text-foreground/90 leading-none">
                            {total >= 1000 ? `${toLocaleNumber((total / 1000).toFixed(1), shortCode)}k` : toLocaleNumber(total, shortCode)}
                        </span>
                        <p className="text-[14px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{totalLabel}</p>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
                    {(hasData ? validData : [{ name: noDataLabel, color: '#cbd5e1' }]).map((item) => (
                        <div key={item.name} className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-tight whitespace-nowrap bg-muted/30 px-2 py-1 rounded-md transition-colors hover:bg-muted/50">
                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                            {item.name === 'No Data' ? noDataLabel : (t(item.name.toLowerCase().replace(/ /g, '_')) !== item.name.toLowerCase().replace(/ /g, '_') ? t(item.name.toLowerCase().replace(/ /g, '_')) : item.name)}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
