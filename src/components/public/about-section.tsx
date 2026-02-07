"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export function AboutSection() {
    return (
        <section className="py-[50px] bg-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-20 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-20 left-0 w-96 h-96 bg-[#C71585]/5 rounded-full blur-3xl -z-10" />

            <div className="container mx-auto px-4 md:px-8">
                <div className="text-center space-y-4 mb-20 md:mb-24">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 uppercase tracking-tight">
                        About Us
                    </h2>
                    <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
                    <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Fusce sem dolor, interdum in fficitur at, faucibus nec lorem. Sed nec molestie justo.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
                    {/* Left: Images */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#C71585] rounded-3xl transform translate-x-4 translate-y-4 md:translate-x-6 md:translate-y-6 -z-10" />
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000&auto=format&fit=crop"
                                alt="Students in classroom"
                                className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Decorative graphical elements from reference if needed, kept simple for now */}
                        </div>
                    </div>

                    {/* Right: Content & Accordion */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 uppercase tracking-tight">
                                Welcome to Mount Carmel
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                            </p>
                        </div>

                        <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-1">
                            <AccordionItem value="item-1" className="border-none">
                                <AccordionTrigger className="bg-[#C71585] hover:bg-[#A0116B] text-white px-6 py-4 rounded-lg hover:no-underline font-semibold text-left transition-colors data-[state=open]:rounded-b-none">
                                    Collapsible Group Item #1
                                </AccordionTrigger>
                                <AccordionContent className="border border-[#C71585]/20 border-t-0 rounded-b-lg p-6 bg-white text-slate-600 leading-relaxed shadow-sm">
                                    Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-2" className="border-none">
                                <AccordionTrigger className="bg-[#C71585] hover:bg-[#A0116B] text-white px-6 py-4 rounded-lg hover:no-underline font-semibold text-left transition-colors data-[state=open]:rounded-b-none">
                                    Collapsible Group Item #2
                                </AccordionTrigger>
                                <AccordionContent className="border border-[#C71585]/20 border-t-0 rounded-b-lg p-6 bg-white text-slate-600 leading-relaxed shadow-sm">
                                    Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3" className="border-none">
                                <AccordionTrigger className="bg-[#C71585] hover:bg-[#A0116B] text-white px-6 py-4 rounded-lg hover:no-underline font-semibold text-left transition-colors data-[state=open]:rounded-b-none">
                                    Collapsible Group Item #3
                                </AccordionTrigger>
                                <AccordionContent className="border border-[#C71585]/20 border-t-0 rounded-b-lg p-6 bg-white text-slate-600 leading-relaxed shadow-sm">
                                    Leggings occaecat craft beer farm-to-table, raw denim aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    );
}
