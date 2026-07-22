"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";


import { useTranslation } from "@/hooks/use-translation";

const defaultAccordions: { id: number; title: string; content: string }[] = [
    { id: 1, title: "Collapsible Group Item #1", content: "Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod." },
    { id: 2, title: "Collapsible Group Item #2", content: "Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore." },
    { id: 3, title: "Collapsible Group Item #3", content: "Leggings occaecat craft beer farm-to-table, raw denim aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS." },
];

export function AboutSection({ about }: { about?: { section_title?: string; section_subtitle?: string; title?: string; description?: string; image_url?: string; accordions?: { id: number; title: string; content: string }[] } }) {
    const { t } = useTranslation();
    const accordions = (about?.accordions && about.accordions.length > 0) ? about.accordions : defaultAccordions;
    
    const displaySectionTitle = about?.section_title
        ? (t(about.section_title.toLowerCase().trim().replace(/[\s\-_]+/g, '_')) !== about.section_title.toLowerCase().trim().replace(/[\s\-_]+/g, '_')
            ? t(about.section_title.toLowerCase().trim().replace(/[\s\-_]+/g, '_'))
            : about.section_title)
        : t("about_us_heading");

    return (
        <section className="py-[50px] bg-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-20 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-20 left-0 w-96 h-96 bg-[#C71585]/5 rounded-full blur-3xl -z-10" />

            <div className="container mx-auto px-4 md:px-8">
                <div className="text-center space-y-4 mb-10 md:mb-12">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 uppercase tracking-tight">
                        {displaySectionTitle}
                    </h2>
                    <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
                    {(about?.section_subtitle) && (
                      <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                          {about.section_subtitle}
                      </p>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
                    {/* Left: Images */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#C71585] rounded-3xl transform translate-x-4 translate-y-4 md:translate-x-6 md:translate-y-6 -z-10" />
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                            <img
                                src={about?.image_url || "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000&auto=format&fit=crop"}
                                alt="About"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>

                    {/* Right: Content & Accordion */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 uppercase tracking-tight">
                                {about?.title || "Welcome to Smart School"}
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                {about?.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
                            </p>
                        </div>

                        <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={`item-${accordions[0]?.id || 1}`}>
                            {accordions.map((acc) => (
                                <AccordionItem key={acc.id} value={`item-${acc.id}`} className="border-none">
                                    <AccordionTrigger className="bg-[#C71585] hover:bg-indigo-600 text-white px-6 py-4 rounded-lg hover:no-underline font-semibold text-left transition-all duration-300 ease-out data-[state=open]:rounded-b-none hover:shadow-lg hover:scale-[1.02] group [&>svg]:text-white/70 [&>svg]:group-hover:text-white [&>svg]:group-hover:scale-125 [&>svg]:transition-all [&>svg]:duration-300">
                                        <span className="group-hover:translate-x-1 transition-transform duration-300">{acc.title}</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="border border-[#C71585]/20 border-t-0 rounded-b-lg p-6 bg-white text-slate-600 leading-relaxed shadow-sm">
                                        {acc.content}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    );
}
