"use client";

import {
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FinanceChartProps {
    title: string;
    data: any[];
    type: "bar" | "line";
}

export function FinanceChart({ title, data, type }: FinanceChartProps) {
    const isBar = type === "bar";
    const ChartComponent = isBar ? BarChart : AreaChart;

    return (
        <Card className="group hover:shadow-2xl transition-all duration-300 ease-in-out border-none cursor-pointer hover:-translate-y-1 hover:scale-[1.005] h-full bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-sm font-bold text-foreground/80 uppercase tracking-widest">{title}</CardTitle>
                <Badge variant="secondary" className="font-bold text-[10px] py-1 px-3 bg-primary/10 text-primary border-primary/20 uppercase tracking-tighter">Session 2025-26</Badge>
            </CardHeader>
            <CardContent className="pb-0">
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ChartComponent data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="barCollections" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#bef264" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#84cc16" stopOpacity={1} />
                                </linearGradient>
                                <linearGradient id="barExpenses" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#fb7185" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.08)" />
                            <XAxis
                                dataKey={isBar ? "day" : "month"}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                                tickFormatter={(value) => value === 0 ? "0" : `${value / 1000}k`}
                            />
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
                                cursor={{ stroke: "hsl(var(--primary) / 0.1)", strokeWidth: 2 }}
                            />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                iconType={isBar ? "rect" : "circle"}
                                wrapperStyle={{ paddingTop: "0px", paddingBottom: "30px", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}
                            />
                            {isBar ? (
                                <>
                                    <Bar
                                        name="Collections"
                                        dataKey="collections"
                                        fill="url(#barCollections)"
                                        radius={[4, 4, 0, 0]}
                                        barSize={12}
                                        animationDuration={1500}
                                    />
                                    <Bar
                                        name="Expenses"
                                        dataKey="expenses"
                                        fill="url(#barExpenses)"
                                        radius={[4, 4, 0, 0]}
                                        barSize={12}
                                        animationDuration={1500}
                                    />
                                </>
                            ) : (
                                <>
                                    <Area
                                        name="Collections"
                                        type="monotone"
                                        dataKey="collections"
                                        stroke="#84cc16"
                                        strokeWidth={5}
                                        fillOpacity={1}
                                        fill="url(#colorCollections)"
                                        dot={{ r: 4, fill: "#84cc16", strokeWidth: 2, stroke: "#fff" }}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: "#84cc16" }}
                                        animationDuration={2000}
                                    />
                                    <Area
                                        name="Expenses"
                                        type="monotone"
                                        dataKey="expenses"
                                        stroke="#f43f5e"
                                        strokeWidth={4}
                                        strokeDasharray="6 6"
                                        fillOpacity={1}
                                        fill="url(#colorExpenses)"
                                        dot={{ r: 3, fill: "#f43f5e", strokeWidth: 2, stroke: "#fff" }}
                                        activeDot={{ r: 5, strokeWidth: 0, fill: "#f43f5e" }}
                                        animationDuration={2000}
                                    />
                                </>
                            )}
                        </ChartComponent>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
