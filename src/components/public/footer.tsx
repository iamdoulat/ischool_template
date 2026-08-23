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
import { useImageUrl } from "@/lib/image-url";
import { getPublicMenus, type PublicMenuItem as MenuItem } from "@/lib/public-menus";
import { useTranslation } from "@/hooks/use-translation";

export function PublicFooter() {
    const { settings } = useSettings();
    const getImageUrl = useImageUrl();
    const { t } = useTranslation();
    const [footerMenus, setFooterMenus] = useState<MenuItem[]>([]);

    useEffect(() => {
        let active = true;
        getPublicMenus().then((menus) => {
            if (active) setFooterMenus(menus.filter((m) => m.type === "bottom"));
        });
        return () => { active = false; };
    }, []);

    const renderMenuLink = (item: MenuItem) => {
        const href = item.is_external
            ? item.url || "#"
            : `/${(item.page || '').replace(/^\//, '')}`;

        const key = item.title.toLowerCase().trim().replace(/[\s\-_]+/g, '_');
        const translatedTitle = t(key) !== key ? t(key) : item.title;

        return (
            <Link
                href={href}
                target={item.open_new_tab ? "_blank" : "_self"}
                className="hover:text-primary transition-colors block py-1"
            >
                {translatedTitle}
            </Link>
        );
    };

    const getColumnMenus = (column: number) => {
        return footerMenus.filter(m => m.column === column);
    };

    // Combine column 1 and column 3 menu items into Information section if column 1 contains extra nav links
    const informationMenus = [
        ...getColumnMenus(3),
        ...getColumnMenus(1),
    ];

    return (
        <footer className="bg-slate-900 text-slate-300">
            {/* Main Footer Content */}
            <div className="container mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
                    {/* Brand Column (Column 1) */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-3 text-white group">
                            {settings?.app_logo ? (
                                <img
                                    src={getImageUrl(settings.app_logo)}
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

                        <div className="flex gap-4 pt-2">
                            <a href={settings?.facebook_url && settings.facebook_url !== '#' ? settings.facebook_url : "https://facebook.com/ischool"} target="_blank" rel="noopener noreferrer" className="hover:text-[#044E43] transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href={settings?.twitter_url && settings.twitter_url !== '#' ? settings.twitter_url : "https://twitter.com/ischool"} target="_blank" rel="noopener noreferrer" className="hover:text-[#044E43] transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href={settings?.linkedin_url && settings.linkedin_url !== '#' ? settings.linkedin_url : "https://linkedin.com/company/ischool"} target="_blank" rel="noopener noreferrer" className="hover:text-[#044E43] transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                            <a href={settings?.youtube_url && settings.youtube_url !== '#' ? settings.youtube_url : "https://youtube.com/@ischool"} target="_blank" rel="noopener noreferrer" className="hover:text-[#044E43] transition-colors">
                                <Youtube className="h-5 w-5" />
                            </a>
                            {(settings?.instagram_url && settings.instagram_url !== '#') && (
                                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#044E43] transition-colors">
                                    <Instagram className="h-5 w-5" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Quick Links Column (Column 2) */}
                    <div className="space-y-4">
                        <h4 className="text-white font-bold text-base uppercase tracking-tight">{settings?.footer_menu_label || t("quick_links")}</h4>
                        <div className="w-12 h-1 bg-[#044E43] rounded-full" />
                        <ul className="space-y-2 text-sm text-slate-400">
                            {getColumnMenus(2).length > 0 ? (
                                getColumnMenus(2).map(item => (
                                    <li key={item.id}>{renderMenuLink(item)}</li>
                                ))
                            ) : (
                                <>
                                    <li><Link href="/about-us" className="hover:text-white transition-colors">{t("about_us")}</Link></li>
                                    <li><Link href="/academics" className="hover:text-white transition-colors">{t("academics")}</Link></li>
                                    <li><Link href="/online_admission" className="hover:text-white transition-colors">{t("admissions")}</Link></li>
                                    <li><Link href="/exam-results" className="hover:text-white transition-colors">{t("exam_results")}</Link></li>
                                    <li><Link href="/notices" className="hover:text-white transition-colors">{t("notices")}</Link></li>
                                    <li><Link href="/contact-us" className="hover:text-white transition-colors">{t("contact")}</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Information Column (Column 3) */}
                    <div className="space-y-4">
                        <h4 className="text-white font-bold text-base uppercase tracking-tight">{t("information")}</h4>
                        <div className="w-12 h-1 bg-[#044E43] rounded-full" />
                        <ul className="space-y-2 text-sm text-slate-400">
                            {informationMenus.length > 0 ? (
                                informationMenus.map(item => (
                                    <li key={item.id}>{renderMenuLink(item)}</li>
                                ))
                            ) : (
                                <>
                                    <li><Link href="/online_admission" className="hover:text-white transition-colors">{t("online_admission")}</Link></li>
                                    <li><Link href="/exam-results" className="hover:text-white transition-colors">{t("exam_results")}</Link></li>
                                    <li><Link href="/notices" className="hover:text-white transition-colors">{t("notice_board")}</Link></li>
                                    <li><Link href="/contact-us" className="hover:text-white transition-colors">{t("contact_us")}</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Contact Us Column (Column 4) */}
                    <div className="space-y-4">
                        <h4 className="text-white font-bold text-base uppercase tracking-tight">{settings?.footer_contact_info_label || t("contact_us")}</h4>
                        <div className="w-12 h-1 bg-[#044E43] rounded-full" />
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-[#044E43] shrink-0 mt-0.5" />
                                <span>{settings?.address || "House 42, Road 11, Banani, Dhaka-1213, Bangladesh"}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-[#044E43] shrink-0" />
                                <a href={`tel:${settings?.phone || "+880 1800-123456"}`} className="hover:text-white transition-colors">
                                    {settings?.phone || "+880 1800-123456"}
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-[#044E43] shrink-0" />
                                <a href={`mailto:${settings?.email || "info@ischool.edu.bd"}`} className="hover:text-white transition-colors">
                                    {settings?.email || "info@ischool.edu.bd"}
                                </a>
                            </li>
                        </ul>
                        {/* Dynamic Column 4 Links */}
                        <div className="space-y-1">
                            {getColumnMenus(4).length > 0 && (
                                <h4 className="text-white font-medium text-sm mb-2 opacity-80">{settings?.footer_contact_info_label || t("contact_us")}</h4>
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
                <div className="container mx-auto pl-3 pr-5 sm:px-6 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] text-slate-500">
                    <p>© {new Date().getFullYear()} {settings?.school_name || "iSchool"}. {t("all_rights_reserved")}.</p>
                    <div className="flex gap-6">
                        <Link href="/privacy-policy" className="hover:text-white transition-colors">{t("privacy_policy")}</Link>
                        <Link href="/terms-and-conditions" className="hover:text-white transition-colors">{t("terms_and_conditions")}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
