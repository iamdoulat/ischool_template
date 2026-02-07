import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OverviewItem {
    label: string;
    value: string | number;
    percentage: number;
    color: string;
}

interface OverviewCardProps {
    title: string;
    items: OverviewItem[];
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

export function OverviewCard({ title, items, color }: OverviewCardProps) {
    return (
        <Card className={cn(
            "group hover:shadow-2xl transition-all duration-300 ease-in-out border-none text-white cursor-pointer hover:-translate-y-2 hover:scale-[1.01] h-full",
            colorMaps[color]
        )}>
            <CardHeader className="pb-0 flex-none border-b border-white/10 mb-0 px-4 md:px-5 pt-3">
                <CardTitle className="text-xs md:text-base font-bold text-white/80 uppercase tracking-widest leading-tight">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2 px-4 md:px-5 pb-3">
                {items.map((item, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center text-[0.65rem] md:text-xs font-bold text-white/70 uppercase tracking-tighter">
                            <span>{item.value} {item.label}</span>
                            <span>{item.percentage}%</span>
                        </div>
                        <Progress
                            value={item.percentage}
                            className="h-2 rounded-full bg-white/20"
                            indicatorClassName="bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-500 group-hover:bg-white/90"
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
