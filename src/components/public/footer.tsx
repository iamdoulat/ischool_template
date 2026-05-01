"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Phone,
    Mail,
    MapPin,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Linkedin,
    GraduationCap
} from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import api from "@/lib/api";

interface MenuItem {
    id: number;
    title: string;
    url?: string;
    page?: string;
    is_external: boolean;
    open_new_tab: boolean;
    type: string;
    column: number;
}

export function PublicFooter() {
    const { settings } = useSettings();
    const [footerMenus, setFooterMenus] = useState<MenuItem[]>([]);
    const appUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

    useEffect(() => {
        fetchFooterMenus();
    }, []);

    const fetchFooterMenus = async () => {
        try {
            const res = await api.get("front-cms/menus");
            if (res.data?.status === "Success") {
                const bottomMenus = res.data.data.filter((m: MenuItem) => m.type === "bottom");
                setFooterMenus(bottomMenus);
            }
        } catch (error) {
            console.error("Failed to load footer menus", error);
        }
    };

    const renderMenuLink = (item: MenuItem) => {
        const href = item.is_external 
            ? item.url || "#" 
            : `${appUrl.replace(/\/$/, '')}/${(item.page || '').replace(/^\//, '')}`;
        
        return (
            <Link 
                href={href} 
                target={item.open_new_tab ? "_blank" : "_self"}
                className="hover:text-primary transition-colors block py-1"
            >
                {item.title}
            </Link>
        );
    };

    const getColumnMenus = (column: number) => {
        return footerMenus.filter(m => m.column === column);
    };

    return (
        <footer className="bg-slate-900 text-slate-300">
            {/* Main Footer Content */}
            <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {/* Brand Column (Column 1) */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-3 text-white group">
                            {settings?.app_logo ? (
                                <img
                                    src={settings.app_logo}
                                    alt={settings.school_name || "School Logo"}
                                    className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                                />
                            ) : (
                                <>
                                    <div className="flex items-center">
                                        <GraduationCap className="h-8 w-8 transition-transform group-hover:scale-110" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-extrabold text-xl tracking-tight uppercase leading-none group-hover:text-primary transition-colors">
                                            {settings?.school_name || "iSchool"}
                                        </span>
                                        <span className="text-[9px] font-semibold tracking-widest text-slate-500 uppercase">
                                            {settings?.school_slogan || "Excellence in Education"}
                                        </span>
                                    </div>
                                </>
                            )}
                        </Link>
                        <p className="text-sm leading-relaxed text-slate-400">
                            {settings?.school_description || "Empowering students with knowledge, character, and skills for a bright future. Excellence in education since 2026."}
                        </p>
                        
                        {/* Dynamic Column 1 Links */}
                        <div className="pt-2 space-y-1">
                            {getColumnMenus(1).map(item => (
                                <div key={item.id}>{renderMenuLink(item)}</div>
                            ))}
                        </div>

                        <div className="flex gap-4 pt-2">
                            {settings?.facebook_url && (
                                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                    <Facebook className="h-5 w-5" />
                                </a>
                            )}
                            {settings?.twitter_url && (
                                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                    <Twitter className="h-5 w-5" />
                                </a>
                            )}
                            {settings?.instagram_url && (
                                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                    <Instagram className="h-5 w-5" />
                                </a>
                            )}
                            {settings?.youtube_url && (
                                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                    <Youtube className="h-5 w-5" />
                                </a>
                            )}
                            {settings?.linkedin_url && (
                                <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                    <Linkedin className="h-5 w-5" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-1 text-sm">
                            {getColumnMenus(2).length > 0 ? (
                                getColumnMenus(2).map(item => (
                                    <li key={item.id}>{renderMenuLink(item)}</li>
                                ))
                            ) : (
                                <>
                                    <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
                                    <li><Link href="#" className="hover:text-primary transition-colors">Academics</Link></li>
                                    <li><Link href="#" className="hover:text-primary transition-colors">Admissions</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Column 3: Information */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Information</h3>
                        <ul className="space-y-1 text-sm">
                            {getColumnMenus(3).length > 0 ? (
                                getColumnMenus(3).map(item => (
                                    <li key={item.id}>{renderMenuLink(item)}</li>
                                ))
                            ) : (
                                <>
                                    <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                                    <li><Link href="#" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Column 4: Contact Info */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">{settings?.footer_contact_title || "Contact Us"}</h3>
                        <ul className="space-y-4 text-sm mb-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <span>{settings?.address || "123 Education Street, Knowledge City, State - 400001"}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-primary shrink-0" />
                                <span>{settings?.phone || "+1 234 567 8900"}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-primary shrink-0" />
                                <span>{settings?.email || "info@smartschool.com.bd"}</span>
                            </li>
                        </ul>
                        {/* Dynamic Column 4 Links */}
                        <div className="space-y-1">
                            {getColumnMenus(4).length > 0 && (
                                <h4 className="text-white font-medium text-sm mb-2 opacity-80">{settings?.footer_contact_info_label || "Contact Info"}</h4>
                            )}
                            {getColumnMenus(4).map(item => (
                                <div key={item.id}>{renderMenuLink(item)}</div>
                            ))}
                        </div>
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
