"use client";

import Link from "next/link";
import { Quote, ArrowRight, Sparkles } from "lucide-react";
import { getImageUrl } from "@/lib/image-url";

interface PrincipalSpeechSectionProps {
    about?: any;
    schoolName?: string;
    sectionId?: string;
}

export function PrincipalSpeechSection({ about, schoolName, sectionId = "principal-speech" }: PrincipalSpeechSectionProps) {
    const badge = about?.muhtamim_badge || "Principal's Speech";
    const name = about?.muhtamim_name || "Dr. Mohammad Rafiqul Islam";
    const designation = about?.muhtamim_designation || "Principal & Head of Institution";
    const institute = about?.muhtamim_institute || schoolName || "Bhujpur Government Primary School";
    const subtitle = about?.muhtamim_subtitle || "Guiding Vision & Leadership Message";
    const heading = about?.muhtamim_heading || "Inspiring Excellence, Fostering Leadership & Lifelong Learning";
    const message = about?.muhtamim_message ||
        `Welcome to our institution. Education is the cornerstone of individual growth and societal advancement. We are dedicated to nurturing well-rounded individuals equipped with knowledge, moral integrity, and critical thinking skills. Together with our passionate educators, supportive parents, and vibrant students, we strive to build a future of limitless possibilities.`;
    const image = about?.muhtamim_image || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80";
    const btn1Text = about?.muhtamim_btn1_text || "Apply For Admission";
    const btn1Url = about?.muhtamim_btn1_url || "/online_admission";
    const btn2Text = about?.muhtamim_btn2_text || "Contact Us";
    const btn2Url = about?.muhtamim_btn2_url || "/contact-us";

    const resolvedImg = getImageUrl(image);

    return (
        <section id={sectionId} className="py-12 md:py-16 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
            <div className="container mx-auto pl-3 pr-5 sm:px-6 md:px-8">
                {/* Main Card with Deep Indigo & Slate iSchool Aesthetic */}
                <div className="bg-gradient-to-br from-[#0b1021] via-[#161938] to-[#0d122b] text-white rounded-3xl shadow-2xl p-8 sm:p-12 md:p-14 relative overflow-hidden border border-indigo-500/20">
                    {/* Glowing Accent Blobs */}
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#6366F1]/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#FF9800]/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
                        {/* Left Portrait & Info (4 cols) */}
                        <div className="lg:col-span-4 flex flex-col items-center text-center">
                            {/* Pill Badge */}
                            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500/20 to-indigo-500/20 text-[#FFA726] border border-orange-500/30 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm mb-5 backdrop-blur-sm">
                                <Sparkles className="h-3.5 w-3.5 text-[#FFA726]" />
                                {badge}
                            </div>

                            {/* Circular Photo with Gradient Border Ring */}
                            <div className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-full p-[3.5px] bg-gradient-to-tr from-[#FF9800] via-amber-400 to-[#6366F1] shadow-2xl overflow-hidden group mb-4">
                                <div className="h-full w-full rounded-full overflow-hidden bg-slate-900">
                                    <img
                                        src={resolvedImg || image}
                                        alt={name}
                                        className="h-full w-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80";
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-orange-200 tracking-tight">
                                    {name}
                                </h3>
                                <p className="text-sm text-indigo-200 font-semibold tracking-wide">
                                    {designation}
                                </p>
                                <p className="text-xs text-slate-300 font-medium">
                                    {institute}
                                </p>
                            </div>
                        </div>

                        {/* Right Speech Narrative (8 cols) */}
                        <div className="lg:col-span-8 space-y-5">
                            <div className="space-y-1.5 flex flex-col items-center md:items-start text-center md:text-left">
                                <span className="text-xs font-bold text-[#FFA726] tracking-wider uppercase">
                                    {subtitle}
                                </span>
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight w-full">
                                    {heading}
                                </h2>
                                {/* Radiant iSchool Orange to Indigo divider bar */}
                                <div className="h-1.5 w-20 bg-gradient-to-r from-[#FF9800] to-[#6366F1] rounded-full mt-2 mb-4 mx-auto md:mx-0 shadow-sm" />
                            </div>

                            {/* Quote Message Box */}
                            <div className="relative bg-slate-950/50 border border-indigo-500/25 rounded-2xl p-6 sm:p-7 text-sm sm:text-[15px] text-slate-200 leading-relaxed font-normal whitespace-pre-line shadow-inner backdrop-blur-md">
                                <Quote className="h-7 w-7 text-[#FF9800] mb-2 fill-[#FF9800]/20" />
                                <p className="break-words">
                                    {message}
                                </p>
                            </div>

                            {/* CTA Action Buttons */}
                            <div className="flex flex-wrap items-center gap-4 pt-2 justify-center md:justify-start">
                                <Link
                                    href={btn1Url}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-orange-600 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm px-7 py-3 rounded-full shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all"
                                >
                                    {btn1Text}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href={btn2Url}
                                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-full border border-white/20 hover:border-white/30 backdrop-blur-sm transition-all hover:scale-[1.02]"
                                >
                                    {btn2Text}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
