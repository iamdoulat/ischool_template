"use client";

import { useImageUrl } from "@/lib/image-url";

interface StaffItem {
    name: string;
    role: string;
    image_url?: string;
    image?: string;
}

const defaultStaff = [
    {
        name: "Dr. Rafiqul Islam",
        role: "Principal & Academic Director",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop"
    },
    {
        name: "Syeda Farhana Rahman",
        role: "Head of Sciences & Senior Lecturer",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop"
    },
    {
        name: "Mohammad Tanvir Hasan",
        role: "Senior Mathematics Faculty",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"
    },
    {
        name: "Nusrat Jahan",
        role: "English Literature Specialist",
        image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=400&auto=format&fit=crop"
    }
];

export function StaffSection({ staff: propStaff, sectionTitle, sectionSubtitle }: { staff?: StaffItem[]; sectionTitle?: string; sectionSubtitle?: string }) {
    const getImageUrl = useImageUrl();
    const staff = (propStaff && propStaff.length > 0 ? propStaff : defaultStaff).map((s, i) => ({
        name: s.name,
        role: s.role,
        image: s.image_url || s.image || defaultStaff[i]?.image || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop"
    }));

    return (
        <section className="py-[50px] bg-slate-50">
            <div className="container mx-auto px-6 sm:px-8 md:px-12 text-center space-y-8">
                <div className="space-y-4 max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight">
                        {sectionTitle || "Our Experienced Staffs"}
                    </h2>
                    <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
                    {sectionSubtitle && (
                        <p className="text-muted-foreground text-lg">
                            {sectionSubtitle}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {staff.map((member, idx) => (
                        <div key={`staff-${idx}`} className="flex flex-col items-center space-y-4 group">
                            <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white shadow-xl transition-transform duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:border-primary/20">
                                <img
                                    src={getImageUrl(member.image)}
                                    alt={member.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                                <p className="text-primary font-medium">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
