"use client";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DistributionChartProps {
    title: string;
    data: any[];
}

export function DistributionChart({ title, data }: DistributionChartProps) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <Card className="group hover:shadow-2xl transition-all duration-300 ease-in-out border-none cursor-pointer hover:-translate-y-1 hover:scale-[1.005] flex flex-col h-full bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
                <CardTitle className="text-sm font-bold text-foreground/80 uppercase tracking-widest">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center relative pb-6 px-0">
                <div className="h-[320px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: -10 }}>
                            <defs>
                                {data.map((item, index) => (
                                    <linearGradient key={`gradient-${index}`} id={`colorPie-${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={item.color} stopOpacity={1} />
                                        <stop offset="100%" stopColor={item.color} stopOpacity={0.7} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <Pie
                                data={data}
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
                                {data.map((entry, index) => (
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
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pb-2">
                        <span className="text-5xl font-black text-foreground/90 leading-none">
                            {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
                        </span>
                        <p className="text-[14px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Total</p>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
                    {data.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-tight whitespace-nowrap bg-muted/30 px-2 py-1 rounded-md transition-colors hover:bg-muted/50">
                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                            {item.name}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
