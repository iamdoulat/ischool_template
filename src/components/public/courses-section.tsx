"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export function CoursesSection() {
    const courses = [
        {
            title: "Electrical Engineering",
            category: "Science",
            image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=600&auto=format&fit=crop",
            description: "All over the world, human beings create an immense and ever-increasing volume of data, with new kinds of data regularly..."
        },
        {
            title: "Computer Science",
            category: "Technology",
            image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop",
            description: "Explore the fundamentals of computing, algorithms, and software development in our state-of-the-art labs..."
        },
        {
            title: "English Literature",
            category: "Arts",
            image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop",
            description: "Dive into the world of classic and modern literature, enhancing critical thinking and communication skills..."
        }
    ];

    return (
        <section className="py-[50px] bg-white">
            <div className="container mx-auto px-4 md:px-8 space-y-12">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight">
                        Our Main Courses
                    </h2>
                    <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Fusce sem dolor, interdum in fficitur at, faucibus nec lorem. Sed nec molestie justo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {courses.map((course, i) => (
                        <div key={i} className="group bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col">
                            {/* Image Container */}
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={course.image}
                                    alt={course.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground hover:bg-primary font-bold uppercase tracking-wider text-xs px-3 py-1">
                                    {course.category}
                                </Badge>

                                {/* Overlay Reveal Button (Ref Image Style - pink circle arrow) */}
                                <div className="absolute -bottom-5 right-6">
                                    <div className="h-10 w-10 md:h-12 md:w-12 bg-[#C71585] text-white rounded-full flex items-center justify-center shadow-lg transform translate-y-0 group-hover:scale-110 transition-transform duration-300">
                                        <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 pt-10 flex flex-col flex-1">
                                <span className="text-[#C71585] font-semibold text-sm uppercase tracking-wide mb-2 block">
                                    {course.category}
                                </span>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-primary transition-colors">
                                    {course.title}
                                </h3>
                                <p className="text-slate-500 mb-8 leading-relaxed line-clamp-3 text-sm flex-1">
                                    {course.description}
                                </p>
                                <Button
                                    className="w-full bg-[#C71585] hover:bg-[#A0116B] text-white font-bold tracking-wider rounded transition-colors h-12"
                                >
                                    APPLY NOW
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
