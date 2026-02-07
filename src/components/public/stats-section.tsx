"use client";

import React, { useState, useEffect, useRef } from "react";
import { Users, GraduationCap, Trophy, BookOpen } from "lucide-react";

interface CounterProps {
    end: number;
    duration?: number;
    suffix?: string;
}

const Counter: React.FC<CounterProps> = ({ end, duration = 2000, suffix = "" }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const countRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );

        if (countRef.current) {
            observer.observe(countRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [isVisible, end, duration]);

    return <span ref={countRef}>{count.toLocaleString()}{suffix}</span>;
};

export function StatsSection() {
    const stats = [
        { label: "Students", value: 2500, suffix: "+", icon: Users },
        { label: "Teachers", value: 150, suffix: "+", icon: GraduationCap },
        { label: "Awards", value: 50, suffix: "+", icon: Trophy },
        { label: "Courses", value: 30, suffix: "+", icon: BookOpen },
    ];

    return (
        <section className="py-[50px] bg-[#1e1b4b] text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />

            <div className="container mx-auto px-4 md:px-8 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="text-center space-y-4 p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all duration-300 group"
                        >
                            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <stat.icon className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                                <Counter end={stat.value} suffix={stat.suffix} />
                            </h3>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
