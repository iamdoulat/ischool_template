"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function StaffSection() {
    const staff = [
        {
            name: "Stella Roffin",
            role: "Drawing Teacher",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop"
        },
        {
            name: "Princy Flora",
            role: "English Tutor",
            image: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?q=80&w=300&auto=format&fit=crop"
        },
        {
            name: "Jesica Matt",
            role: "Art Teacher",
            image: "https://images.unsplash.com/photo-1544168190-79c1180f7169?q=80&w=300&auto=format&fit=crop"
        },
        {
            name: "Janaton Doe",
            role: "Math Teacher",
            image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=300&auto=format&fit=crop"
        }
    ];

    return (
        <section className="py-[50px] bg-slate-50">
            <div className="container mx-auto px-4 md:px-8 text-center space-y-12">
                <div className="space-y-4 max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight">
                        Our Experienced Staffs
                    </h2>
                    <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
                    <p className="text-muted-foreground text-lg">
                        Considering desire as primary motivation for the generation of narratives is a useful concept.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {staff.map((member) => (
                        <div key={member.name} className="flex flex-col items-center space-y-4 group">
                            <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white shadow-xl transition-transform duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:border-primary/20">
                                <img
                                    src={member.image}
                                    alt={member.name}
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
