import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";
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
    return (
        <Card className={cn(
            "group hover:shadow-2xl transition-all duration-300 ease-in-out border-none text-white cursor-pointer hover:-translate-y-2 hover:scale-[1.01]",
            colorMaps[color]
        )}>
            <CardContent className="px-6 py-2 md:px-8 md:py-3">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-xs md:text-base font-bold text-white/80 uppercase tracking-widest">{title}</h3>
                        <p className="text-3xl md:text-[2.5rem] font-extrabold mt-2 leading-none">
                            {current}
                            <span className="text-base md:text-lg text-white/60 font-medium ml-1">/{total}</span>
                        </p>
                    </div>
                    <div className="p-3 md:p-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/30">
                        <Icon className="h-7 w-7 md:h-8 md:w-8 text-white" />
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-[0.65rem] md:text-xs font-bold text-white/70 uppercase tracking-tighter">
                        <span>Utilization</span>
                        <span>{percentage}%</span>
                    </div>
                    <Progress
                        value={percentage}
                        className="h-2.5 bg-white/20"
                        indicatorClassName="bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-500 group-hover:bg-white/90"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
