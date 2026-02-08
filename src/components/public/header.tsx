"use client";

import Link from "next/link";
import {
    Phone,
    Mail,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Linkedin,
    LogIn,
    GraduationCap,
    Menu,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function PublicHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { name: "Home", href: "/" },
        { name: "Academics", href: "#" },
        { name: "Admissions", href: "/admissions" },
        { name: "Exam Results", href: "/exam-results" },
        { name: "Notices", href: "#notices" },
        { name: "About Us", href: "/about" },
        { name: "Contact", href: "#" },
    ];

    return (
        <header className="w-full flex flex-col z-50 sticky top-0 bg-white shadow-md">
            {/* Top Bar */}
            <div className="bg-primary text-primary-foreground py-2 px-4 md:px-8 text-xs md:text-sm transition-all duration-300">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
                    <div className="flex items-center gap-4">
                        <a href="tel:+1234567890" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                            <Phone className="h-3 w-3 md:h-4 md:w-4" />
                            <span>+1 234 567 8900</span>
                        </a>
                        <a href="mailto:info@smartschool.com.bd" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                            <Mail className="h-3 w-3 md:h-4 md:w-4" />
                            <span>info@smartschool.com.bd</span>
                        </a>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <a href="#" className="hover:opacity-80 transition-opacity"><Facebook className="h-3 w-3 md:h-4 md:w-4" /></a>
                            <a href="#" className="hover:opacity-80 transition-opacity"><Twitter className="h-3 w-3 md:h-4 md:w-4" /></a>
                            <a href="#" className="hover:opacity-80 transition-opacity"><Instagram className="h-3 w-3 md:h-4 md:w-4" /></a>
                            <a href="#" className="hover:opacity-80 transition-opacity"><Youtube className="h-3 w-3 md:h-4 md:w-4" /></a>
                            <a href="#" className="hover:opacity-80 transition-opacity"><Linkedin className="h-3 w-3 md:h-4 md:w-4" /></a>
                        </div>
                        <div className="w-px h-4 bg-primary-foreground/30 hidden md:block" />
                        <Link href="/dashboard">
                            <Button variant="secondary" size="sm" className="h-7 px-3 text-xs bg-white text-primary hover:bg-white/90">
                                <LogIn className="h-3 w-3 mr-1" />
                                Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="bg-white border-b sticky top-0 shadow-sm">
                <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 text-primary">
                        <GraduationCap className="h-8 w-8 md:h-10 md:w-10" />
                        <div className="flex flex-col">
                            <span className="font-extrabold text-xl md:text-2xl tracking-tight uppercase leading-none">Smart School</span>
                            <span className="text-[10px] md:text-xs font-semibold tracking-widest text-muted-foreground uppercase">Excellence in Education</span>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition-all"
                            >
                                {item.name}
                            </Link>
                        ))}
                        <Button className="ml-4 font-semibold">Apply Now</Button>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden border-t bg-white absolute w-full left-0 shadow-lg animate-in slide-in-from-top-2">
                        <div className="flex flex-col p-4 space-y-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <div className="pt-2">
                                <Button className="w-full">Apply Now</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
