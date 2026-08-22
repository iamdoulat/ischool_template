"use client";

import { useEffect, useState } from "react";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

interface PageData {
    id?: number;
    title?: string;
    content?: string;
}

const DEFAULT_ACADEMICS_HTML = `<div class="academics-container" style="font-family: inherit; color: #1e293b; line-height: 1.6; max-width: 1100px; margin: 0 auto;">

    <!-- 1. MESSAGE FROM PRINCIPAL -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; margin-bottom: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="display: flex; flex-wrap: wrap; gap: 32px; align-items: center;">
            <div style="flex: 1 1 240px; text-align: center;">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop" 
                     alt="Principal" 
                     style="width: 180px; height: 210px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: 3px solid #e0e7ff;">
                <h3 style="font-size: 18px; font-weight: 700; margin-top: 12px; margin-bottom: 2px; color: #0f172a;">Dr. Jonathan Reynolds</h3>
                <p style="font-size: 13px; color: #6366f1; font-weight: 600; margin: 0;">Principal & Academic Director</p>
                <span style="font-size: 11px; color: #64748b;">Ph.D. in Educational Leadership</span>
            </div>
            <div style="flex: 2 1 360px;">
                <span style="display: inline-block; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6366f1; margin-bottom: 8px;">
                    Message From Principal:
                </span>
                <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1.3; margin-bottom: 14px;">
                    "Empowering Tomorrow's Leaders with Knowledge and Character."
                </h2>
                <p style="font-size: 14.5px; color: #475569; margin-bottom: 12px;">
                    Welcome to our academic community. Education is not merely the acquisition of facts, but the training of the mind to think critically and live purposefully. We believe in providing an inclusive, inspiring environment where every learner thrives academically, socially, and emotionally.
                </p>
                <p style="font-size: 14.5px; color: #475569; margin-bottom: 16px;">
                    Our dedicated faculty integrates modern curriculum frameworks with experiential learning, ensuring our students become compassionate global citizens and innovative problem solvers.
                </p>
                <div style="display: flex; gap: 16px; font-size: 12px; font-weight: 700; color: #059669;">
                    <span>✓ Academic Rigor</span>
                    <span>✓ Holistic Growth</span>
                    <span>✓ Strong Values</span>
                </div>
            </div>
        </div>
    </div>

    <!-- 2. SCHOOL UNIFORM -->
    <div style="margin-bottom: 48px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6366f1;">Discipline & Identity</span>
            <h2 style="font-size: 26px; font-weight: 800; color: #0f172a; margin-top: 4px;">School Uniform</h2>
            <p style="font-size: 14px; color: #64748b; margin-top: 4px;">Students must wear the prescribed school uniform with neatness and pride.</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
            <!-- Summer Uniform -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="background: #fff7ed; color: #c2410c; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 12px;">☀️</div>
                <h3 style="font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Summer Uniform</h3>
                <ul style="font-size: 13.5px; color: #475569; padding-left: 18px; margin: 0; line-height: 1.8;">
                    <li><strong>Boys:</strong> White collared shirt, navy blue trousers/shorts, tie & school belt.</li>
                    <li><strong>Girls:</strong> White blouse, navy blue pleated skirt/tunic, school tie & hair ribbon.</li>
                    <li><strong>Footwear:</strong> Polished black leather shoes with navy blue socks.</li>
                </ul>
            </div>

            <!-- Winter Uniform -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="background: #eef2ff; color: #4338ca; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 12px;">❄️</div>
                <h3 style="font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Winter Uniform</h3>
                <ul style="font-size: 13.5px; color: #475569; padding-left: 18px; margin: 0; line-height: 1.8;">
                    <li><strong>Blazer:</strong> Navy blue tailored school blazer with embroidered school crest.</li>
                    <li><strong>Pullover:</strong> V-neck navy blue sweater with red/gold border stripes.</li>
                    <li><strong>Shirts:</strong> Full-sleeved crisp white shirt tucked in neatly with tie.</li>
                </ul>
            </div>

            <!-- Sports / House Dress -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="background: #ecfdf5; color: #047857; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 12px;">🏃</div>
                <h3 style="font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">Sports & House Dress</h3>
                <ul style="font-size: 13.5px; color: #475569; padding-left: 18px; margin: 0; line-height: 1.8;">
                    <li><strong>T-Shirts:</strong> Designated house colors (Red, Blue, Green, Yellow).</li>
                    <li><strong>Trackpants:</strong> Navy breathable athletic pants with white piping.</li>
                    <li><strong>Shoes:</strong> White sports running sneakers with white cotton socks.</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- 3. SCHOOL FACILITIES -->
    <div style="margin-bottom: 48px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6366f1;">Infrastructure</span>
            <h2 style="font-size: 26px; font-weight: 800; color: #0f172a; margin-top: 4px;">School Facilities:</h2>
            <p style="font-size: 14px; color: #64748b; margin-top: 4px;">World-class facilities designed for interactive learning, science, and fitness.</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <!-- Facility 1 -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <img src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=700&auto=format&fit=crop" alt="Smart Classrooms" style="width: 100%; height: 160px; object-fit: cover;">
                <div style="padding: 18px;">
                    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Smart Digital Classrooms</h3>
                    <p style="font-size: 13px; color: #64748b; margin: 0;">Interactive digital whiteboards, high-speed Wi-Fi, ergonomic seating, and multimedia teaching aids.</p>
                </div>
            </div>

            <!-- Facility 2 -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <img src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=700&auto=format&fit=crop" alt="STEM Labs" style="width: 100%; height: 160px; object-fit: cover;">
                <div style="padding: 18px;">
                    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Advanced STEM Laboratories</h3>
                    <p style="font-size: 13px; color: #64748b; margin: 0;">Equipped Physics, Chemistry, Biology, and Robotics labs with strict safety standards.</p>
                </div>
            </div>

            <!-- Facility 3 -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <img src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=700&auto=format&fit=crop" alt="Library" style="width: 100%; height: 160px; object-fit: cover;">
                <div style="padding: 18px;">
                    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Library & Resource Center</h3>
                    <p style="font-size: 13px; color: #64748b; margin: 0;">Over 15,000 titles, academic journals, reading zones, and digital catalog archives.</p>
                </div>
            </div>

            <!-- Facility 4 -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <img src="https://images.unsplash.com/photo-1584466977773-e625c37cdd50?q=80&w=700&auto=format&fit=crop" alt="Sports Complex" style="width: 100%; height: 160px; object-fit: cover;">
                <div style="padding: 18px;">
                    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Sports Complex & Track</h3>
                    <p style="font-size: 13px; color: #64748b; margin: 0;">Football turf, athletic running tracks, basketball courts, and indoor badminton hall.</p>
                </div>
            </div>

            <!-- Facility 5 -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=700&auto=format&fit=crop" alt="Computer Lab" style="width: 100%; height: 160px; object-fit: cover;">
                <div style="padding: 18px;">
                    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Computer & AI Center</h3>
                    <p style="font-size: 13px; color: #64748b; margin: 0;">Modern workstations with coding suites, AI software, and multimedia design tools.</p>
                </div>
            </div>

            <!-- Facility 6 -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <img src="https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=700&auto=format&fit=crop" alt="Cafeteria" style="width: 100%; height: 160px; object-fit: cover;">
                <div style="padding: 18px;">
                    <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Cafeteria & Health Infirmary</h3>
                    <p style="font-size: 13px; color: #64748b; margin: 0;">Nutritious meal plans with full medical screening staffed by certified nurse professionals.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- 4. ANNUAL SPORTS DAY -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #ffffff; border-radius: 16px; padding: 36px; margin-bottom: 48px; box-shadow: 0 8px 20px rgba(0,0,0,0.12);">
        <span style="display: inline-block; background: rgba(251, 191, 36, 0.2); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.4); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">
            Annual Championship
        </span>
        <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 12px;">Annual Sports Day:</h2>
        <p style="font-size: 14.5px; color: #cbd5e1; max-width: 800px; line-height: 1.7; margin-bottom: 24px;">
            The Annual Sports Day is one of the most celebrated events on our academic calendar. It showcases athletic talent, endurance, camaraderie, and team spirit. Students participate across sprints, relays, hurdles, high jump, shot put, gymnastics, and inter-house tug-of-war.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 16px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 20px;">
            <div>
                <span style="font-size: 26px; font-weight: 900; color: #fbbf24;">4</span>
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">Competitive Houses</p>
            </div>
            <div>
                <span style="font-size: 26px; font-weight: 900; color: #818cf8;">30+</span>
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">Track & Field Events</p>
            </div>
            <div>
                <span style="font-size: 26px; font-weight: 900; color: #34d399;">100%</span>
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">Student Involvement</p>
            </div>
            <div>
                <span style="font-size: 26px; font-weight: 900; color: #c084fc;">Cup</span>
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">Annual Trophy</p>
            </div>
        </div>
    </div>

    <!-- 5. STUDENT COUNCIL -->
    <div>
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6366f1;">Student Leadership</span>
            <h2 style="font-size: 26px; font-weight: 800; color: #0f172a; margin-top: 4px;">Student Council</h2>
            <p style="font-size: 14px; color: #64748b; margin-top: 4px;">Empowering students with democratic representation and leadership responsibilities.</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 20px;">
            <!-- Council 1 -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <span style="display: inline-block; background: #e0e7ff; color: #3730a3; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px;">Executive</span>
                <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Head Boy & Head Girl</h3>
                <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0;">Leads the student body, represents the institution at official forums, and coordinates prefectorial duties.</p>
            </div>

            <!-- Council 2 -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <span style="display: inline-block; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px;">House Affairs</span>
                <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">House Captains</h3>
                <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0;">Fosters inter-house sports spirit, drill practices, house assemblies, and leadership mentorship.</p>
            </div>

            <!-- Council 3 -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <span style="display: inline-block; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px;">Athletics</span>
                <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Sports Secretary</h3>
                <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0;">Assists with athletics coordination, intramural leagues, fitness events, and equipment management.</p>
            </div>

            <!-- Council 4 -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <span style="display: inline-block; background: #f3e8ff; color: #6b21a8; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px;">Co-Curricular</span>
                <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Cultural & Editorial Prefect</h3>
                <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0;">Curates the annual school magazine, debate clubs, drama productions, art exhibits, and music festivals.</p>
            </div>
        </div>
    </div>

</div>`;

export default function AcademicsPage() {
    const [pageData, setPageData] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPageContent = async () => {
            try {
                const res = await api.get("front-cms/pages/show-by-slug/academics");
                if (res.data?.status === "Success" || res.data?.data) {
                    setPageData(res.data.data || res.data);
                }
            } catch {
                // If not in database, fallback to default
            } finally {
                setLoading(false);
            }
        };

        fetchPageContent();
    }, []);

    const contentHtml = (pageData?.content && pageData.content.trim().length > 0)
        ? pageData.content
        : DEFAULT_ACADEMICS_HTML;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
            <PublicHeader />

            <main className="flex-1">
                {/* Hero Header Section */}
                <div className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
                    <div className="container mx-auto px-6 sm:px-8 md:px-12 relative z-10 text-center">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight uppercase">
                            {pageData?.title || "Academics"}
                        </h1>
                        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-xl mx-auto">
                            Excellence in education, character building, athletic development, and student leadership.
                        </p>
                    </div>
                </div>

                {/* Main Dynamic HTML Content */}
                <div className="container mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                        </div>
                    ) : (
                        <div
                            className="dynamic-html-content"
                            dangerouslySetInnerHTML={{ __html: contentHtml }}
                        />
                    )}
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
