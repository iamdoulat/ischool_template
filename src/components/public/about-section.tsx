"use client";

import { useEffect, useState } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useImageUrl } from "@/lib/image-url";
import { useSettings } from "@/components/providers/settings-provider";
import api from "@/lib/api";
import {
    Target,
    Eye,
    Heart,
    Award,
    Shield,
    BookOpen,
    Users,
    Trophy,
    Sparkles,
    CheckCircle2,
    GraduationCap,
    Lightbulb
} from "lucide-react";

const defaultAccordions = [
    {
        id: 1,
        title: "Experiential & Project-Based Learning",
        content: "We believe students learn best by doing. Through hands-on science experiments, community projects, and design-thinking workshops, learners apply theoretical knowledge to solve real problems."
    },
    {
        id: 2,
        title: "Continuous Assessment & Personalized Guidance",
        content: "Rather than relying solely on high-stakes testing, our teachers employ formative feedback, diagnostic assessments, and 1-on-1 mentorship to cater to each student's unique learning pace."
    },
    {
        id: 3,
        title: "Global Perspectives & Digital Fluency",
        content: "Digital literacy, ethical coding, cross-cultural studies, and foreign language programs equip our graduates to collaborate seamlessly on international stages."
    }
];

export function AboutUsSection({ about }: { about?: any }) {
    const { settings } = useSettings();
    const getImageUrl = useImageUrl();
    const [cmsAbout, setCmsAbout] = useState<any>(about || null);

    useEffect(() => {
        if (about) {
            setCmsAbout(about);
            return;
        }

        // Fetch from Front CMS settings if not supplied via props
        const fetchCmsAbout = async () => {
            try {
                const res = await api.get("/front-cms/settings");
                if (res.data?.data?.about_us) {
                    setCmsAbout(res.data.data.about_us);
                }
            } catch {
                // Ignore fallback to defaults
            }
        };
        fetchCmsAbout();
    }, [about]);

    const activeAbout = cmsAbout || about || {};

    const schoolName = settings?.school_name || "iSchool";
    const title = activeAbout.title || "Empowering Minds, Inspiring Character, Shaping the Future.";
    const sectionTitle = activeAbout.section_title || `Welcome to ${schoolName}`;
    const description = activeAbout.description || `At ${schoolName}, we provide a holistic learning environment where academic curiosity meets moral integrity. Our pedagogy nurtures critical thinking, creative innovation, and collaborative leadership.`;
    const imageUrl = activeAbout.image_url 
        ? getImageUrl(activeAbout.image_url) 
        : "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop";

    const experienceYears = activeAbout.experience_years || "25+";
    const experienceLabel = activeAbout.experience_label || "Years Of Educational Excellence";

    const missionTitle = activeAbout.mission_title || "Our Mission";
    const missionDesc = activeAbout.mission_description || "To inspire every student to realize their fullest intellectual, ethical, and athletic potential through engaging pedagogical methods, inclusive support, and real-world problem-solving.";

    const visionTitle = activeAbout.vision_title || "Our Vision";
    const visionDesc = activeAbout.vision_description || "To stand as a benchmark educational sanctuary that cultivates empathetic leaders, ground-breaking researchers, and globally conscious citizens equipped to build a brighter tomorrow.";

    const valuesTitle = activeAbout.values_title || "Our Core Values";
    const valuesDesc = activeAbout.values_description || "Integrity, Mutual Respect, Academic Excellence, Inclusivity, and Lifelong Curiosity. These pillars guide all student interactions, faculty dedication, and institutional governance.";

    const stat1Val = activeAbout.stat1_val || "100%";
    const stat1Label = activeAbout.stat1_label || "Academic Pass Rate";
    const stat2Val = activeAbout.stat2_val || "50+";
    const stat2Label = activeAbout.stat2_label || "Qualified Educators";
    const stat3Val = activeAbout.stat3_val || "1,200+";
    const stat3Label = activeAbout.stat3_label || "Enrolled Learners";
    const stat4Val = activeAbout.stat4_val || "25+";
    const stat4Label = activeAbout.stat4_label || "Modern Laboratories";

    const accordions = (activeAbout.accordions && activeAbout.accordions.length > 0)
        ? activeAbout.accordions
        : defaultAccordions;

    return (
        <section id="about" className="py-16 sm:py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-6xl space-y-16">
                
                {/* 1. Main Story / Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                    {/* Left: Images with floating badge */}
                    <div className="lg:col-span-6 relative">
                        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                            <img
                                src={imageUrl}
                                alt="Campus Life"
                                className="w-full h-[380px] sm:h-[440px] object-cover hover:scale-105 transition-transform duration-500"
                            />
                        </div>

                        {/* Floating Experience Badge */}
                        <div className="absolute -bottom-5 -right-4 sm:bottom-6 sm:-right-6 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white p-4 sm:p-5 rounded-2xl shadow-xl flex items-center gap-3.5 backdrop-blur-md">
                            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center font-black text-2xl">
                                {experienceYears}
                            </div>
                            <div>
                                <span className="block font-black text-base leading-none">Years</span>
                                <span className="text-xs text-white/90 font-medium">{experienceLabel}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Narrative */}
                    <div className="lg:col-span-6 space-y-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/50">
                            <Sparkles className="h-3.5 w-3.5" /> {sectionTitle}
                        </div>

                        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                            {title}
                        </h2>

                        <div className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                            {description}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Innovative STEM Curriculum</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Personalized Mentorship</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Global Ethical Values</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Comprehensive Sports & Arts</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Mission, Vision & Core Values (3 Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Mission */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-4">
                        <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center">
                            <Target className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{missionTitle}</h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {missionDesc}
                        </p>
                    </div>

                    {/* Vision */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                            <Eye className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{visionTitle}</h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {visionDesc}
                        </p>
                    </div>

                    {/* Core Values */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                            <Heart className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{valuesTitle}</h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {valuesDesc}
                        </p>
                    </div>
                </div>

                {/* 3. Statistics Counter Strip */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-lg border border-slate-800">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
                        <div className="space-y-1">
                            <span className="block text-3xl sm:text-5xl font-black text-amber-400">{stat1Val}</span>
                            <p className="text-xs sm:text-sm text-slate-300 font-medium">{stat1Label}</p>
                        </div>
                        <div className="space-y-1 pt-6 md:pt-0">
                            <span className="block text-3xl sm:text-5xl font-black text-indigo-400">{stat2Val}</span>
                            <p className="text-xs sm:text-sm text-slate-300 font-medium">{stat2Label}</p>
                        </div>
                        <div className="space-y-1 pt-6 md:pt-0">
                            <span className="block text-3xl sm:text-5xl font-black text-emerald-400">{stat3Val}</span>
                            <p className="text-xs sm:text-sm text-slate-300 font-medium">{stat3Label}</p>
                        </div>
                        <div className="space-y-1 pt-6 md:pt-0">
                            <span className="block text-3xl sm:text-5xl font-black text-purple-400">{stat4Val}</span>
                            <p className="text-xs sm:text-sm text-slate-300 font-medium">{stat4Label}</p>
                        </div>
                    </div>
                </div>

                {/* 4. Why Choose Us Grid */}
                <div className="space-y-6">
                    <div className="text-center max-w-2xl mx-auto">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                            Distinctive Advantages
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                            Why Choose Our Institution
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                            Delivering unmatched educational experiences and comprehensive student support.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            {
                                icon: BookOpen,
                                title: "Holistic Curriculum",
                                desc: "Blending STEM innovation, humanistic literature, arts, and environmental sustainability."
                            },
                            {
                                icon: Shield,
                                title: "Safe & Caring Campus",
                                desc: "24/7 guarded security, CCTV surveillance, and proactive child welfare policies."
                            },
                            {
                                icon: Trophy,
                                title: "Sports & Athletics",
                                desc: "Professional coaching in football, basketball, cricket, track events, and swimming."
                            },
                            {
                                icon: Lightbulb,
                                title: "Creative Arts & Music",
                                desc: "Dedicated performance theaters, fine arts studios, music chambers, and digital design labs."
                            }
                        ].map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={i}
                                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                                >
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-bold text-base text-slate-900 dark:text-white">{feature.title}</h4>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 5. Frequently Asked Questions / Key Pillars */}
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                    <div className="text-center max-w-xl mx-auto">
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                            Our Educational Pillars
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Core methodologies that power learning inside our classrooms
                        </p>
                    </div>

                    <Accordion type="single" collapsible className="w-full space-y-3" defaultValue={`item-${accordions[0]?.id || 1}`}>
                        {accordions.map((acc: any) => (
                            <AccordionItem key={acc.id} value={`item-${acc.id}`} className="border border-slate-200 dark:border-slate-800 rounded-xl px-4">
                                <AccordionTrigger className="hover:no-underline font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">
                                    {acc.title}
                                </AccordionTrigger>
                                <AccordionContent className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-1 pb-4">
                                    {acc.content}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
}

// Backwards-compatible export
export function AboutSection({ about }: { about?: any }) {
    return <AboutUsSection about={about} />;
}
