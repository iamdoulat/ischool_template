"use client";

import {
    Bell,
    Search,
    Moon,
    Sun,
    MessageSquare,
    Menu,
    Languages,
    CircleDollarSign,
    LayoutGrid,
    MoreVertical,
    ArrowLeftRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";



export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    return (
        <header className="h-14 min-h-[56px] border-b bg-card/80 backdrop-blur-xl pl-2 pr-4 md:pr-8 flex items-center justify-between sticky top-0 z-30 transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 to-indigo-500/40 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-300 animate-pulse" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl bg-muted/50 border border-muted/50 shadow-sm backdrop-blur-sm"
                        onClick={onToggleSidebar}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
                <div className="flex flex-col min-w-0">
                    <h1 className="text-base md:text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-600 to-rose-500 animate-in fade-in slide-in-from-left-4 duration-500 whitespace-nowrap overflow-hidden text-ellipsis">
                        Smart School
                    </h1>
                    <div className="h-0.5 w-12 bg-gradient-to-r from-primary to-transparent rounded-full mt-[-2px] hidden md:block opacity-70" />
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                <div className="hidden lg:flex items-center relative max-w-sm group">
                    <Search className="absolute left-4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by Student Name..."
                        className="pl-11 h-10 w-[320px] bg-muted/30 border-muted/50 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all rounded-2xl shadow-sm group-hover:bg-muted/50"
                    />
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                        <LayoutGrid className="h-5 w-5" />
                    </Button>

                    <div className="relative group hidden sm:block">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                            <ArrowLeftRight className="h-5 w-5" />
                        </Button>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-[#6366f1] text-white text-[11px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#6366f1] rotate-45" />
                            Switch Branch
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-1 md:gap-2">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                            <CircleDollarSign className="h-5 w-5" />
                        </Button>

                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                            <Languages className="h-5 w-5" />
                        </Button>

                        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-card animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        </Button>

                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                            <MessageSquare className="h-5 w-5" />
                        </Button>

                        {mounted && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl"
                            >
                                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                        )}
                    </div>

                    <div className="md:hidden">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl bg-muted/30">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-fit p-2 bg-card/95 backdrop-blur-md border-muted/50 shadow-xl rounded-2xl" align="end" sideOffset={8}>
                                <div className="flex flex-row items-center gap-1">
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                                        <LayoutGrid className="h-5 w-5" />
                                    </Button>

                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                                        <ArrowLeftRight className="h-5 w-5" />
                                    </Button>

                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                                        <CircleDollarSign className="h-5 w-5" />
                                    </Button>

                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                                        <Languages className="h-5 w-5" />
                                    </Button>

                                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                                        <Bell className="h-5 w-5" />
                                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-card animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                    </Button>

                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl">
                                        <MessageSquare className="h-5 w-5" />
                                    </Button>

                                    {mounted && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl"
                                        >
                                            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                        </Button>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="h-8 w-[1px] bg-border mx-1" />

                <div className="relative group cursor-pointer active:scale-95 transition-transform">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-500 rounded-full blur opacity-25 group-hover:opacity-60 transition duration-300" />
                    <Avatar className="h-9 w-9 border-2 border-background shadow-lg relative rounded-full ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/50">
                        <AvatarImage src="https://lh3.googleusercontent.com/a/ACg8ocL-X..." alt="Admin" />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white font-bold text-xs ring-inset ring-1 ring-white/20">AD</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    );
}
