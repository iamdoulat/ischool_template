import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: "blue" | "red" | "purple" | "primary" | "cyan" | "indigo" | "orange" | "yellow" | "emerald" | "rose";
}

const colorMaps = {
    blue: "bg-gradient-to-br from-blue-600 to-indigo-700",
    red: "bg-gradient-to-br from-rose-500 to-orange-500",
    purple: "bg-gradient-to-br from-violet-600 to-indigo-800",
    primary: "bg-gradient-to-br from-primary to-primary/80",
    cyan: "bg-gradient-to-br from-cyan-500 to-blue-600",
    indigo: "bg-gradient-to-br from-indigo-600 to-purple-700",
    orange: "bg-gradient-to-br from-orange-400 to-rose-400",
    yellow: "bg-gradient-to-br from-amber-400 to-orange-500",
    emerald: "bg-gradient-to-br from-emerald-500 to-teal-600",
    rose: "bg-gradient-to-br from-rose-400 to-pink-600"
};

export function SummaryCard({ title, value, icon: Icon, color }: SummaryCardProps) {
    return (
        <Card className={cn(
            "group hover:shadow-2xl transition-all duration-300 ease-in-out border-none text-white cursor-pointer hover:-translate-y-2 hover:scale-[1.02]",
            colorMaps[color]
        )}>
            <CardContent className="px-4 py-3 md:px-5 md:py-4 flex items-center gap-4">
                <div className="p-3 md:p-4 rounded-xl bg-white/20 backdrop-blur-md border border-white/10 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/30">
                    <Icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
                <div>
                    <p className="text-[0.65rem] md:text-xs font-bold text-white/80 uppercase tracking-widest leading-none mb-1">{title}</p>
                    <h4 className="text-xl md:text-2xl font-extrabold tracking-tight">{value}</h4>
                </div>
            </CardContent>
        </Card>
    );
}
