import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    current: number;
    total: number;
    percentage: number;
    icon: LucideIcon;
    color: "blue" | "red" | "purple" | "primary" | "cyan" | "indigo" | "orange" | "yellow";
}

const colorMaps = {
    blue: "bg-gradient-to-br from-blue-600 to-indigo-700",
    red: "bg-gradient-to-br from-rose-500 to-orange-500",
    purple: "bg-gradient-to-br from-violet-600 to-indigo-800",
    primary: "bg-gradient-to-br from-primary to-primary/80",
    cyan: "bg-gradient-to-br from-cyan-500 to-blue-600",
    indigo: "bg-gradient-to-br from-indigo-600 to-purple-700",
    orange: "bg-gradient-to-br from-orange-400 to-rose-400",
    yellow: "bg-gradient-to-br from-amber-400 to-orange-500"
};

export function StatCard({ title, current, total, percentage, icon: Icon, color }: StatCardProps) {
    // Generate dynamic points based on the percentage so each card looks slightly different
    // This creates a realistic looking sparkline
    const pt1 = 25 - (percentage % 15);
    const pt2 = 10 + (percentage % 20);
    const pt3 = 25 - (total % 15);
    const pt4 = 15 + (current % 15);
    const pt5 = 5 + (percentage % 10);
    
    const pathD = `M0,40 L0,${pt1} C15,${pt1 + 10} 25,${pt2 - 10} 40,${pt2} C55,${pt2 + 10} 65,${pt3 - 10} 80,${pt3} C90,${pt3 + 5} 95,${pt4 - 5} 100,${pt4} L100,40 Z`;
    const lineD = `M0,${pt1} C15,${pt1 + 10} 25,${pt2 - 10} 40,${pt2} C55,${pt2 + 10} 65,${pt3 - 10} 80,${pt3} C90,${pt3 + 5} 95,${pt4 - 5} 100,${pt4}`;

    return (
        <Card className={cn(
            "group hover:shadow-2xl transition-all duration-300 ease-in-out border-none text-white cursor-pointer hover:-translate-y-2 hover:scale-[1.01] relative overflow-hidden",
            colorMaps[color]
        )}>
            <CardContent className="px-6 py-4 md:px-8 md:py-6 relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xs md:text-sm font-bold text-white/80 uppercase tracking-widest mb-1">{title}</h3>
                        <p className="text-3xl md:text-[2.5rem] font-extrabold leading-none">
                            {current}
                            <span className="text-sm md:text-base text-white/60 font-medium ml-1">/{total}</span>
                        </p>
                    </div>
                    <div className="p-3 md:p-4 rounded-xl bg-white/20 backdrop-blur-md border border-white/10 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/30">
                        <Icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </div>
                </div>

                {/* Left aligned percentage text with dynamic trend arrow based on visual graph slope */}
                <div className="flex items-center gap-1.5 text-sm font-bold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    {pt4 < pt1 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                    ) : pt4 > pt1 ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                    ) : (
                        <Minus className="w-3.5 h-3.5" />
                    )}
                    {percentage}%
                </div>
            </CardContent>

            {/* Background Sparkline Graph */}
            <svg 
                className="absolute bottom-0 left-0 w-full h-[60%] opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                viewBox="0 0 100 40" 
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                <path d={pathD} fill={`url(#grad-${color})`} />
                <path d={lineD} fill="none" stroke="white" strokeWidth="1.5" className="drop-shadow-md" />
                {/* Dots on the line */}
                <circle cx="0" cy={pt1} r="1.5" fill="white" />
                <circle cx="40" cy={pt2} r="1.5" fill="white" />
                <circle cx="80" cy={pt3} r="1.5" fill="white" />
                <circle cx="100" cy={pt4} r="1.5" fill="white" />
            </svg>
        </Card>
    );
}
