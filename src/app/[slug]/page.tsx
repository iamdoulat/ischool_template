"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, notFound } from "next/navigation";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { ContactFormSection } from "@/components/public/contact-form";
import { NoticeBoardSection } from "@/components/public/notice-board-section";
import { ExamResultSection } from "@/components/public/exam-result-section";
import { AboutUsSection } from "@/components/public/about-section";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

interface PageData {
    id: number;
    title: string;
    content: string;
}

/**
 * Executes embedded <script> tags when raw HTML is injected into the DOM
 */
function RawHtmlRenderer({ html }: { html: string }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Find all script tags within the injected HTML
        const scripts = containerRef.current.querySelectorAll("script");
        scripts.forEach((oldScript) => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach((attr) => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode?.replaceChild(newScript, oldScript);
        });
    }, [html]);

    return (
        <div
            ref={containerRef}
            className="raw-html-content w-full max-w-full overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

export default function DynamicPage() {
    const { slug } = useParams();
    const [page, setPage] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPage = async () => {
            const rawSlug = String(slug || "");
            if (rawSlug.endsWith(".txt") || rawSlug.endsWith(".xml") || rawSlug.endsWith(".json") || rawSlug.endsWith(".ico")) {
                setError("Page not found");
                setLoading(false);
                return;
            }

            try {
                const res = await api.get(`front-cms/pages/show-by-slug/${slug}`);
                if (res.data?.status === "Success" || res.data?.data) {
                    const loadedPage = res.data.data || res.data;
                    setPage(loadedPage);
                    if (loadedPage?.title) {
                        document.title = `${loadedPage.title} — iSchool`;
                    }
                } else {
                    setError("Page not found");
                }
            } catch {
                setError("Page not found");
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchPage();
        }
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
                <PublicHeader />
                <div className="flex-1 flex items-center justify-center py-32">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                </div>
                <PublicFooter />
            </div>
        );
    }

    if (error || !page) {
        notFound();
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
            <PublicHeader />
            <main className="flex-1">
                {/* Hero Banner Section */}
                <div className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
                    <div className="container mx-auto px-6 sm:px-8 md:px-12 relative z-10 text-center">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight uppercase">
                            {page.title}
                        </h1>
                    </div>
                </div>

                {/* Content Section */}
                <div className="container mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16">
                    {(() => {
                        const rawContent = page.content ? page.content.trim() : "";
                        if (!rawContent) {
                            return (
                                <div className="text-center py-20 text-slate-400">
                                    <p className="text-base font-medium">No content available for this page.</p>
                                </div>
                            );
                        }

                        // Check if content contains any system shortcode
                        const shortcodeRegex = /\[(contact_form|notice_board|exam_result|about_us|about)\]/g;
                        const hasShortcodes = shortcodeRegex.test(rawContent);

                        // If admin replaced shortcode with raw HTML code, render the full raw HTML
                        if (!hasShortcodes) {
                            return <RawHtmlRenderer html={rawContent} />;
                        }

                        // Otherwise parse shortcodes & mixed HTML chunks
                        shortcodeRegex.lastIndex = 0;
                        const tokens: { type: 'html' | 'shortcode'; value: string }[] = [];
                        let lastIndex = 0;
                        let match: RegExpExecArray | null;

                        while ((match = shortcodeRegex.exec(rawContent)) !== null) {
                            if (match.index > lastIndex) {
                                tokens.push({ type: 'html', value: rawContent.slice(lastIndex, match.index) });
                            }
                            tokens.push({ type: 'shortcode', value: match[1] });
                            lastIndex = match.index + match[0].length;
                        }
                        if (lastIndex < rawContent.length) {
                            tokens.push({ type: 'html', value: rawContent.slice(lastIndex) });
                        }

                        return (
                            <div className="space-y-8 w-full">
                                {tokens.map((token, i) => (
                                    <div key={i} className="w-full">
                                        {token.type === 'html' && token.value && (
                                            <RawHtmlRenderer html={token.value} />
                                        )}
                                        {(token.type === 'shortcode' && (token.value === 'about_us' || token.value === 'about')) && (
                                            <AboutUsSection />
                                        )}
                                        {token.type === 'shortcode' && token.value === 'contact_form' && (
                                            <ContactFormSection />
                                        )}
                                        {token.type === 'shortcode' && token.value === 'notice_board' && (
                                            <NoticeBoardSection />
                                        )}
                                        {token.type === 'shortcode' && token.value === 'exam_result' && (
                                            <ExamResultSection />
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </main>
            <PublicFooter />
        </div>
    );
}
