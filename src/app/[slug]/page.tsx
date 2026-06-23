"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { ContactFormSection } from "@/components/public/contact-form";
import { NoticeBoardSection } from "@/components/public/notice-board-section";
import { ExamResultSection } from "@/components/public/exam-result-section";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

interface PageData {
    id: number;
    title: string;
    content: string;
}

export default function DynamicPage() {
    const { slug } = useParams();
    const [page, setPage] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPage = async () => {
            try {
                const res = await api.get(`front-cms/pages/show-by-slug/${slug}`);
                if (res.data?.status === "Success") {
                    setPage(res.data.data);
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
            <div className="min-h-screen flex flex-col">
                <PublicHeader />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                </div>
                <PublicFooter />
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="min-h-screen flex flex-col">
                <PublicHeader />
                <div className="flex-1 container mx-auto px-4 py-20 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                    <p className="text-gray-600">The page you are looking for does not exist or has been moved.</p>
                </div>
                <PublicFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <PublicHeader />
            <main className="flex-1">
                {/* Hero Section */}
                <div className="bg-slate-900 text-white py-20 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
                    <div className="container mx-auto px-4 md:px-8 relative z-10">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight uppercase">
                            {page.title}
                        </h1>
                    </div>
                </div>

                {/* Content Section */}
                <div className="container mx-auto px-4 md:px-8 py-16">
                    {(() => {
                        if (!page.content) {
                            return (
                                <div className="text-center py-20 text-gray-400">
                                    <p>No content available for this page.</p>
                                </div>
                            );
                        }

                        const shortcodeRegex = /\[(contact_form|notice_board|exam_result)\]/g;
                        const tokens: { type: 'html' | 'shortcode'; value: string }[] = [];
                        let lastIndex = 0;
                        let match;

                        while ((match = shortcodeRegex.exec(page.content)) !== null) {
                            if (match.index > lastIndex) {
                                tokens.push({ type: 'html', value: page.content.slice(lastIndex, match.index) });
                            }
                            tokens.push({ type: 'shortcode', value: match[1] });
                            lastIndex = match.index + match[0].length;
                        }
                        if (lastIndex < page.content.length) {
                            tokens.push({ type: 'html', value: page.content.slice(lastIndex) });
                        }

                        if (tokens.length === 0) {
                            return (
                                <div
                                    className="prose prose-indigo prose-lg max-w-none prose-headings:uppercase prose-headings:tracking-tight prose-headings:font-bold prose-img:max-w-full prose-img:h-auto prose-table:w-full prose-table:max-w-full prose-pre:overflow-x-auto prose-p:break-words max-w-full overflow-x-hidden"
                                    dangerouslySetInnerHTML={{ __html: page.content }}
                                />
                            );
                        }

                        return (
                            <div className="space-y-8">
                                {tokens.map((token, i) => (
                                    <div key={i}>
                                        {token.type === 'html' && token.value && (
                                            <div
                                                className="prose prose-indigo prose-lg max-w-none prose-headings:uppercase prose-headings:tracking-tight prose-headings:font-bold prose-img:max-w-full prose-img:h-auto prose-table:w-full prose-table:max-w-full prose-pre:overflow-x-auto prose-p:break-words max-w-full overflow-x-hidden"
                                                dangerouslySetInnerHTML={{ __html: token.value }}
                                            />
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
