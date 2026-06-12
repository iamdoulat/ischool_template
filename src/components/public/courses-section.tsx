"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, X, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const defaultCourses = [
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

export function CoursesSection({ courses: propCourses, sectionTitle, sectionSubtitle }: { courses?: { title: string; description: string; price?: string; category?: string; image?: string; link?: string }[]; sectionTitle?: string; sectionSubtitle?: string }) {
    const [detailCourse, setDetailCourse] = useState<any | null>(null);

    const courses = (propCourses && propCourses.length > 0 ? propCourses : defaultCourses).map((c, i) => ({
        ...c,
        category: (c as any).category || "General",
        image: (c as any).image || defaultCourses[i]?.image || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop",
        link: (c as any).link || "",
    }));

    return (
        <>
            <section className="py-[50px] bg-white">
                <div className="container mx-auto px-4 md:px-8 space-y-12">
                    <div className="text-center space-y-4 mb-8 md:mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight">
                            {sectionTitle || "Our Main Courses"}
                        </h2>
                        <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
                        {sectionSubtitle && (
                          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                              {sectionSubtitle}
                          </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {courses.map((course, i) => (
                            <div key={i} className="group bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col">
                                {/* Image Container */}
                                <div className="relative h-64">
                                    <div className="w-full h-full overflow-hidden rounded-t-xl">
                                        <img
                                            src={course.image}
                                            alt={course.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80 rounded-t-xl pointer-events-none" />
                                    <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground hover:bg-primary font-bold uppercase tracking-wider text-xs px-3 py-1">
                                        {course.category}
                                    </Badge>

                                    {/* Overlay Reveal Button (Ref Image Style - pink circle arrow) */}
                                    <div className="absolute -bottom-6 right-6 z-10">
                                        <div className="h-10 w-10 md:h-12 md:w-12 bg-[#C71585] text-white rounded-full flex items-center justify-center shadow-lg transform translate-y-0 group-hover:scale-110 transition-transform duration-300 cursor-pointer">
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
                                    {course.link ? (
                                        <Button asChild className="w-full bg-[#C71585] hover:bg-[#A0116B] text-white font-bold tracking-wider rounded transition-colors h-12">
                                            <Link href={course.link}>APPLY NOW</Link>
                                        </Button>
                                    ) : (
                                        <Button onClick={() => setDetailCourse(course)} className="w-full bg-[#C71585] hover:bg-[#A0116B] text-white font-bold tracking-wider rounded transition-colors h-12">
                                            APPLY NOW
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Dialog open={!!detailCourse} onOpenChange={(open) => !open && setDetailCourse(null)}>
                <DialogContent className="sm:max-w-[600px] p-0 rounded-lg border-none shadow-2xl">
                    <div className="relative h-56 bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 overflow-hidden">
                        {detailCourse?.image && (
                            <img src={detailCourse.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <button onClick={() => setDetailCourse(null)} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10">
                            <X className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-6 left-6 right-6 z-10">
                            <Badge className="bg-primary text-primary-foreground border-none text-xs font-bold uppercase mb-2">{detailCourse?.category}</Badge>
                            <DialogHeader className="p-0">
                                <DialogTitle className="text-2xl font-bold text-white uppercase tracking-tight">{detailCourse?.title}</DialogTitle>
                            </DialogHeader>
                        </div>
                    </div>
                    <div className="p-8 space-y-6 bg-white">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            {detailCourse?.price && <span className="font-bold text-lg text-gray-900">${detailCourse.price}</span>}
                        </div>
                        <div className="text-gray-700 leading-relaxed text-sm">
                            {detailCourse?.description || "No description available."}
                        </div>
                        {detailCourse?.link ? (
                            <Button asChild className="w-full bg-[#C71585] hover:bg-[#A0116B] text-white font-bold tracking-wider rounded h-12">
                                <Link href={detailCourse.link}>Apply Now</Link>
                            </Button>
                        ) : (
                            <Button asChild className="w-full bg-[#C71585] hover:bg-[#A0116B] text-white font-bold tracking-wider rounded h-12">
                                <Link href="/online_admission">Apply Now</Link>
                            </Button>
                        )}
                    </div>
                    <DialogFooter className="p-4 bg-gray-50/50 border-t border-gray-100">
                        <Button variant="outline" onClick={() => setDetailCourse(null)} className="h-10 text-[10px] uppercase font-bold rounded-full px-8 bg-white border-gray-200">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
