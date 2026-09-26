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
import api from "@/lib/api";

interface PublicFooterProps {
    cmsData?: Record<string, unknown> | null;
}

export function PublicFooter({ cmsData }: PublicFooterProps = {}) {
    const { settings } = useSettings();
    const getImageUrl = useImageUrl();
    const { t } = useTranslation();
    const [footerMenus, setFooterMenus] = useState<MenuItem[]>([]);
    const [fetchedSettings, setFetchedSettings] = useState<Record<string, unknown> | null>(null);
    const cmsSettings = cmsData || fetchedSettings;

    useEffect(() => {
        let active = true;
        getPublicMenus().then((menus) => {
            if (active) setFooterMenus(menus.filter((m) => m.type === "bottom"));
        });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (cmsData) return;
        let active = true;
        api.get("/front-cms/settings")
            .then((res) => {
                if (active && res.data?.data) {
                    setFetchedSettings(res.data.data);
                }
            })
            .catch(() => {});
        return () => { active = false; };
    }, [cmsData]);

    const hfs = (cmsSettings?.header_footer_sections as Record<string, unknown>) || {};

    // If footer is explicitly disabled in CMS settings, do not render
    if (hfs.footer_enabled === false) {
        return null;
    }

    const renderMenuLink = (item: MenuItem) => {
        const href = item.is_external
            ? item.url || "/"
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

    // Brand / Column 1 Data
    const logoSrc = (hfs.footer_logo as string) ||
        (cmsSettings?.logo_url as string) ||
        (hfs.ischool_header_logo as string) ||
        (hfs.ischool_logo as string) ||
        (cmsSettings?.logo as string) ||
        settings?.app_logo ||
        settings?.admin_logo;

    const schoolName = (hfs.footer_madrasa_name as string) ||
        (hfs.footer_school_name as string) ||
        (hfs.institute_name as string) ||
        (cmsSettings?.institute_name as string) ||
        settings?.school_name ||
        "iSchool";

    const establishedYear = (hfs.footer_established_year as string) || "";

    const showLogo = hfs.footer_show_logo !== false;
    const showSchoolName = hfs.footer_show_school_name !== false && hfs.footer_show_institute_name !== false;
    const showEstablishedYear = hfs.footer_show_established_year !== false;

    const aboutText = (hfs.footer_about_text as string) ||
        settings?.school_description ||
        "Providing quality education for over two decades. Committed to fostering academic excellence, critical thinking, and character development.";

    const showSocial = hfs.footer_show_social !== false;
    const footerSoc = (hfs.footer_social_links as Record<string, string>) || {};
    const cmsSoc = (cmsSettings?.social_media as Record<string, string>) || {};
    const fb = footerSoc.facebook || cmsSoc.facebook || (settings?.facebook_url && settings.facebook_url !== '#' ? settings.facebook_url : "");
    const tw = footerSoc.twitter || cmsSoc.twitter || (settings?.twitter_url && settings.twitter_url !== '#' ? settings.twitter_url : "");
    const yt = footerSoc.youtube || cmsSoc.youtube || (settings?.youtube_url && settings.youtube_url !== '#' ? settings.youtube_url : "");
    const insta = footerSoc.instagram || cmsSoc.instagram || (settings?.instagram_url && settings.instagram_url !== '#' ? settings.instagram_url : "");
    const wa = footerSoc.whatsapp || cmsSoc.whatsapp || "";
    const waHref = wa ? (wa.startsWith('http') ? wa : `https://wa.me/${wa.replace(/[^0-9]/g, '')}`) : "";
    const li = footerSoc.linkedin || cmsSoc.linkedin || (settings?.linkedin_url && settings.linkedin_url !== '#' ? settings.linkedin_url : "");

    // Column 2 Data (Academic Programs / Departments)
    const col2Title = (hfs.footer_info_label as string) || t("academic_programs");
    const deptLinks = (Array.isArray(hfs.footer_department_links) && hfs.footer_department_links.length > 0)
        ? (hfs.footer_department_links as Array<{ title: string; url?: string }>)
        : null;

    // Column 3 Data (Quick Links)
    const col3Title = (hfs.footer_menu_label as string) || t("quick_links");
    const quickLinks = (Array.isArray(hfs.footer_quick_links) && hfs.footer_quick_links.length > 0)
        ? (hfs.footer_quick_links as Array<{ title: string; url?: string }>)
        : null;

    // Column 4 Data (Contact Info)
    const col4Title = (hfs.footer_contact_info_label as string) || settings?.footer_contact_info_label || t("contact_us");
    const contactAddress = (hfs.footer_address as string) ||
        (hfs.school_address as string) ||
        (hfs.madrasa_address as string) ||
        settings?.address ||
        "House#68, Road#10, Sector#10, Uttara Model Town, Dhaka-1230";
    const contactPhone = (hfs.footer_phone as string) ||
        (hfs.school_phone as string) ||
        (hfs.madrasa_phone as string) ||
        settings?.phone ||
        "+8801851046320";
    const contactEmail = (hfs.footer_email as string) ||
        (hfs.school_email as string) ||
        (hfs.madrasa_email as string) ||
        settings?.email ||
        "smartideasbd24@gmail.com";

    // Bottom Bar Data
    const copyrightText = (hfs.copyright_text as string) ||
        (cmsSettings?.footer_text as string) ||
        `© ${new Date().getFullYear()} ${schoolName}. ${t("all_rights_reserved")}.`;

    const poweredByText = (hfs.footer_powered_by_text as string) || "Powered by: iSchool Management System";

    // Footer Background Color
    const isBgEnabled = hfs.ischool_footer_bg_enabled !== false && hfs.footer_bg_enabled !== false;
    const footerBg = isBgEnabled
        ? ((hfs.ischool_footer_bg as string) || (hfs.footer_bg as string) || "#0f172a")
        : "#0f172a";

    return (
        <footer 
            className="text-slate-300 transition-colors"
            style={{ backgroundColor: footerBg }}
        >
            {/* Main Footer Content */}
            <div className="container mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
                    
                    {/* Brand Column (Column 1) */}
                    <div className="space-y-4 col-span-2 md:col-span-1 text-center md:text-left flex flex-col items-center md:items-start">
                        {(showLogo || showSchoolName || (showEstablishedYear && establishedYear)) && (
                            <Link href="/" className="flex items-center gap-3 text-white group justify-center md:justify-start">
                                {showLogo && (
                                    logoSrc ? (
                                        <img
                                            src={getImageUrl(logoSrc)}
                                            alt={schoolName}
                                            className="h-10 sm:h-12 w-auto max-w-[150px] sm:max-w-[180px] object-contain transition-transform group-hover:scale-105 shrink-0"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-primary shrink-0">
                                            <GraduationCap className="h-6 w-6 transition-transform group-hover:scale-110" />
                                        </div>
                                    )
                                )}
                                {(showSchoolName || (showEstablishedYear && establishedYear)) && (
                                    <div className="flex flex-col text-left">
                                        {showSchoolName && (
                                            <span className="font-extrabold text-base sm:text-lg tracking-tight uppercase leading-tight group-hover:text-primary transition-colors">
                                                {schoolName}
                                            </span>
                                        )}
                                        {showEstablishedYear && establishedYear && (
                                            <span className="text-[11px] font-semibold tracking-wider text-amber-400">
                                                {establishedYear}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </Link>
                        )}
                        <p className="text-sm leading-relaxed text-slate-400 text-center md:text-left max-w-md mx-auto md:mx-0">
                            {aboutText}
                        </p>

                        {showSocial && (
                            <div className="flex flex-wrap gap-2 pt-1 justify-center md:justify-start">
                                {fb && (
                                    <a
                                        href={fb}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-8 w-8 rounded-full bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 flex items-center justify-center transition-all duration-200 border border-slate-700/60 shadow-xs hover:scale-105"
                                        title="Facebook"
                                    >
                                        <Facebook className="h-4 w-4" />
                                    </a>
                                )}
                                {yt && (
                                    <a
                                        href={yt}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-8 w-8 rounded-full bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 flex items-center justify-center transition-all duration-200 border border-slate-700/60 shadow-xs hover:scale-105"
                                        title="YouTube"
                                    >
                                        <Youtube className="h-4 w-4" />
                                    </a>
                                )}
                                {tw && (
                                    <a
                                        href={tw}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-8 w-8 rounded-full bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-300 flex items-center justify-center transition-all duration-200 border border-slate-700/60 shadow-xs hover:scale-105"
                                        title="Twitter / X"
                                    >
                                        <Twitter className="h-4 w-4" />
                                    </a>
                                )}
                                {insta && (
                                    <a
                                        href={insta}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-8 w-8 rounded-full bg-slate-800 hover:bg-pink-600 hover:text-white text-slate-300 flex items-center justify-center transition-all duration-200 border border-slate-700/60 shadow-xs hover:scale-105"
                                        title="Instagram"
                                    >
                                        <Instagram className="h-4 w-4" />
                                    </a>
                                )}
                                {wa && (
                                    <a
                                        href={waHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-8 w-8 rounded-full bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 flex items-center justify-center transition-all duration-200 border border-slate-700/60 shadow-xs hover:scale-105"
                                        title="WhatsApp"
                                    >
                                        <Phone className="h-4 w-4" />
                                    </a>
                                )}
                                {li && (
                                    <a
                                        href={li}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-8 w-8 rounded-full bg-slate-800 hover:bg-blue-700 hover:text-white text-slate-300 flex items-center justify-center transition-all duration-200 border border-slate-700/60 shadow-xs hover:scale-105"
                                        title="LinkedIn"
                                    >
                                        <Linkedin className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Column 2: Academic Programs / Departments */}
                    <div className="space-y-4 col-span-1">
                        <h4 className="text-white font-bold text-base uppercase tracking-tight">{col2Title}</h4>
                        <div className="w-12 h-1 bg-[#044E43] rounded-full" />
                        <ul className="space-y-2 text-sm text-slate-400">
                            {deptLinks && deptLinks.length > 0 ? (
                                deptLinks.map((item, idx) => (
                                    <li key={idx}>
                                        <Link href={item.url || "#"} className="hover:text-white transition-colors block py-1">
                                            {item.title}
                                        </Link>
                                    </li>
                                ))
                            ) : getColumnMenus(2).length > 0 ? (
                                getColumnMenus(2).map(item => (
                                    <li key={item.id}>{renderMenuLink(item)}</li>
                                ))
                            ) : (
                                <>
                                    <li><Link href="/online_admission" className="hover:text-white transition-colors block py-1">{t("online_admission")}</Link></li>
                                    <li><Link href="/academics" className="hover:text-white transition-colors block py-1">{t("academics")}</Link></li>
                                    <li><Link href="/#courses" className="hover:text-white transition-colors block py-1">{t("courses")}</Link></li>
                                    <li><Link href="/notices" className="hover:text-white transition-colors block py-1">{t("notices")}</Link></li>
                                    <li><Link href="/login" className="hover:text-white transition-colors block py-1">{t("login")}</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Column 3: Quick Links */}
                    <div className="space-y-4 col-span-1">
                        <h4 className="text-white font-bold text-base uppercase tracking-tight">{col3Title}</h4>
                        <div className="w-12 h-1 bg-[#044E43] rounded-full" />
                        <ul className="space-y-2 text-sm text-slate-400">
                            {quickLinks && quickLinks.length > 0 ? (
                                quickLinks.map((item, idx) => (
                                    <li key={idx}>
                                        <Link href={item.url || "#"} className="hover:text-white transition-colors block py-1">
                                            {item.title}
                                        </Link>
                                    </li>
                                ))
                            ) : informationMenus.length > 0 ? (
                                informationMenus.map(item => (
                                    <li key={item.id}>{renderMenuLink(item)}</li>
                                ))
                            ) : (
                                <>
                                    <li><Link href="/about-us" className="hover:text-white transition-colors block py-1">{t("about_us")}</Link></li>
                                    <li><Link href="/notices" className="hover:text-white transition-colors block py-1">{t("notice_board")}</Link></li>
                                    <li><Link href="/exam-results" className="hover:text-white transition-colors block py-1">{t("exam_results")}</Link></li>
                                    <li><Link href="/contact-us" className="hover:text-white transition-colors block py-1">{t("contact_us")}</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Column 4: Contact Us */}
                    <div className="space-y-4 col-span-2 md:col-span-1">
                        <h4 className="text-white font-bold text-base uppercase tracking-tight">{col4Title}</h4>
                        <div className="w-12 h-1 bg-[#044E43] rounded-full" />
                        <ul className="space-y-3 text-sm text-slate-400">
                            {contactAddress && (
                                <li className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-[#044E43] shrink-0 mt-0.5" />
                                    <span>{contactAddress}</span>
                                </li>
                            )}
                            {contactPhone && (
                                <li className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-[#044E43] shrink-0" />
                                    <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">
                                        {contactPhone}
                                    </a>
                                </li>
                            )}
                            {contactEmail && (
                                <li className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-[#044E43] shrink-0" />
                                    <a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors">
                                        {contactEmail}
                                    </a>
                                </li>
                            )}
                        </ul>
                        {/* Dynamic Column 4 Links */}
                        {getColumnMenus(4).length > 0 && (
                            <div className="space-y-1 pt-2">
                                {getColumnMenus(4).map(item => (
                                    <div key={item.id}>{renderMenuLink(item)}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Copyright Bar */}
            <div className="border-t border-white/10 bg-black/25">
                <div className="container mx-auto px-4 sm:px-6 md:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] text-slate-500">
                    <p>{copyrightText}</p>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        {poweredByText && (
                            <span className="text-slate-400 font-medium">{poweredByText}</span>
                        )}
                        <Link href="/privacy-policy" className="hover:text-white transition-colors">{t("privacy_policy")}</Link>
                        <Link href="/terms-and-conditions" className="hover:text-white transition-colors">{t("terms_and_conditions")}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
