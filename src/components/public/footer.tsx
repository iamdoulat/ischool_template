"use client";

import Link from "next/link";
import {
    Phone,
    Mail,
    MapPin,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    GraduationCap
} from "lucide-react";

export function PublicFooter() {
    return (
        <footer className="bg-slate-900 text-slate-300">
            {/* Main Footer Content */}
            <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-white">
                            <GraduationCap className="h-8 w-8" />
                            <span className="font-extrabold text-xl tracking-tight uppercase">Smart School</span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-400">
                            Empowering students with knowledge, character, and skills for a bright future. Excellence in education since 1990.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
                            <a href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
                            <a href="#" className="hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
                            <a href="#" className="hover:text-primary transition-colors"><Youtube className="h-5 w-5" /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Academics</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Admissions</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">News & Events</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Gallery</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Useful Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Information</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Student Handbook</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Academic Calendar</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Career</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <span>123 Education Street, Knowledge City, State - 400001</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-primary shrink-0" />
                                <span>+1 234 567 8900</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-primary shrink-0" />
                                <span>info@smartschool.com.bd</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Copyright Bar */}
            <div className="border-t border-slate-800 bg-slate-950/50">
                <div className="container mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs md:text-sm text-slate-500">
                    <p>© 2026 Smart School. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms of Use</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
