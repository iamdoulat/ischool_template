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
} from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { getImageUrl } from "@/lib/image-url";
import api from "@/lib/api";

interface MadrashaFooterProps {
  cmsData?: Record<string, unknown> | null;
}

export function MadrashaFooter({ cmsData }: MadrashaFooterProps = {}) {
  const { settings } = useSettings();
  const [fetchedCms, setFetchedCms] = useState<Record<string, unknown> | null>(null);
  const cms = cmsData || fetchedCms;

  useEffect(() => {
    if (cmsData) return;
    let active = true;
    api
      .get("/front-cms/settings")
      .then((res) => {
        if (active && res.data?.data) {
          setFetchedCms(res.data.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [cmsData]);

  const hfs = (cms?.header_footer_sections as Record<string, unknown>) || {};

  if (hfs.footer_enabled === false) {
    return null;
  }

  const isMadrashaFooterBgEnabled =
    hfs.madrasha_footer_bg_enabled !== false && hfs.footer_bg_enabled !== false;
  const madrashaFooterBg = isMadrashaFooterBgEnabled
    ? ((hfs.madrasha_footer_bg as string) || (hfs.footer_bg as string) || "#01352A")
    : "#01352A";

  const madrasaNameBn =
    (hfs.footer_madrasa_name as string) ||
    (hfs.madrasa_name_bn as string) ||
    ((settings?.school_name as string) && !String(settings?.school_name).toLowerCase().includes("school") ? (settings?.school_name as string) : "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মদপুর");

  const arabicTitle =
    (hfs.footer_arabic_title as string) ||
    (hfs.arabic_title as string) ||
    "مدرسة البنات دار الحديث انواره بيغم محمدفور";

  const madrasaAddress =
    (hfs.footer_address as string) ||
    (hfs.madrasa_address as string) ||
    (settings?.address as string) ||
    "১২ নং গিয়াসনগর ইউনিয়ন, মোহাম্মদপুর, মৌলভীবাজার সদর, মৌলভীবাজার";

  const madrasaPhone =
    (hfs.footer_phone as string) ||
    (hfs.madrasa_phone as string) ||
    (settings?.phone as string) ||
    "+8801719606713";

  const madrasaEmail =
    (hfs.footer_email as string) ||
    (hfs.madrasa_email as string) ||
    (settings?.email as string) ||
    "anwarabegumgirlsmadrasa@gmail.com";

  // Social Links
  const cmsSoc = (cms?.social_media as Record<string, string>) || {};
  const soc = (hfs.footer_social_links as Record<string, string>) || cmsSoc;
  const fb = soc.facebook || cmsSoc.facebook;
  const yt = soc.youtube || cmsSoc.youtube;
  const tw = soc.twitter || cmsSoc.twitter;
  const insta = soc.instagram || cmsSoc.instagram;
  const wa = soc.whatsapp || cmsSoc.whatsapp;
  const li = soc.linkedin || cmsSoc.linkedin;

  const defaultDepartmentLinks = [
    { title: "নুরানি ও নাজেরা বিভাগ", url: "/#departments" },
    { title: "হিফজুল কুরআন বিভাগ", url: "/#departments" },
    { title: "কিতাব ও দাওরায়ে হাদিস বিভাগ", url: "/#departments" },
    { title: "আইটি ও কম্পিউটার প্রশিক্ষণ", url: "/#departments" },
    { title: "কারিগরি ও সেলাই প্রশিক্ষণ", url: "/#departments" },
  ];

  const isDefaultIschoolDepts =
    Array.isArray(hfs.footer_department_links) &&
    hfs.footer_department_links.some((d: { title?: string }) =>
      d.title?.includes("English Literature") ||
      d.title?.includes("Computer Science") ||
      d.title?.includes("Academic Programs") ||
      d.title?.includes("Physics") ||
      d.title?.includes("Mathematics")
    );

  const departmentLinks =
    Array.isArray(hfs.footer_department_links) &&
    hfs.footer_department_links.length > 0 &&
    !isDefaultIschoolDepts
      ? (hfs.footer_department_links as Array<{ title: string; url?: string }>)
      : defaultDepartmentLinks;

  const defaultQuickLinks = [
    { title: "অনলাইন ভর্তি আবেদন", url: "/online_admission" },
    { title: "মাদরাসা নোটিশ বোর্ড", url: "/notices" },
    { title: "ফলাফল ও মার্কশীট", url: "/exam-results" },
    { title: "মাদ্রাসা পরিচিতি ও ইতিহাস", url: "/#about-madrasa" },
    { title: "মুহতামিম সাহেবের বাণী", url: "/#muhtamim" },
    { title: "শিক্ষক ও পরিচালকমণ্ডলী", url: "/#faculty" },
    { title: "যোগাযোগ ও তথ্যসেবা", url: "/contact-us" },
    { title: "এডমিন / শিক্ষক লগইন", url: "/login" },
  ];

  const isDefaultIschoolQuickLinks =
    Array.isArray(hfs.footer_quick_links) &&
    hfs.footer_quick_links.some((q: { title?: string }) =>
      q.title?.includes("About School") ||
      q.title?.includes("Our Faculty") ||
      q.title?.includes("Programs") ||
      q.title?.includes("Courses")
    );

  const quickLinks =
    Array.isArray(hfs.footer_quick_links) &&
    hfs.footer_quick_links.length > 0 &&
    !isDefaultIschoolQuickLinks
      ? (hfs.footer_quick_links as Array<{ title: string; url?: string }>)
      : defaultQuickLinks;

  const col2Title =
    !hfs.footer_info_label ||
    hfs.footer_info_label === "Academic Programs" ||
    hfs.footer_info_label === "Courses"
      ? "জামিয়ার শিক্ষাবিভাগ"
      : (hfs.footer_info_label as string);

  const col3Title =
    !hfs.footer_menu_label ||
    hfs.footer_menu_label === "Quick Links" ||
    hfs.footer_menu_label === "Links"
      ? "জরুরি লিংকসমূহ"
      : (hfs.footer_menu_label as string);

  const col4Title =
    !hfs.footer_contact_info_label ||
    hfs.footer_contact_info_label === "Contact & Location" ||
    hfs.footer_contact_info_label === "Contact Us" ||
    hfs.footer_contact_info_label === "Contact Info"
      ? "যোগাযোগের ঠিকানা"
      : (hfs.footer_contact_info_label as string);

  const rawFooterLogo = (hfs.footer_logo as string) || "";
  const isCustomFooterLogo =
    Boolean(rawFooterLogo) &&
    !rawFooterLogo.toLowerCase().includes("ischool") &&
    !rawFooterLogo.includes("default_logo");

  const copyrightText = (() => {
    const text = (hfs.copyright_text as string) || (cms?.footer_text as string);
    if (!text || text.includes("iSchool") || text.includes("© 202")) {
      return "© All Rights reserved by Anwara Begum Girls Titel Madrasha Muhammadpur";
    }
    return text;
  })();

  const rawPoweredBy = (hfs.footer_powered_by_text as string) || "iSchool Management System";
  const cleanPoweredBy = rawPoweredBy.replace(/^powered\s*by:?\s*/i, "");

  return (
    <footer
      id="contact"
      className="text-emerald-100 border-t-4 border-amber-400 transition-colors"
      style={{ backgroundColor: madrashaFooterBg }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Column 1: Identity */}
          <div className="space-y-4 col-span-2 md:col-span-1 text-center md:text-left flex flex-col items-center md:items-start">
            {hfs.footer_show_logo !== false && isCustomFooterLogo && (
              <div className="mb-1">
                <img
                  src={getImageUrl(rawFooterLogo)}
                  alt={(hfs.footer_madrasa_name as string) || "Madrasa Logo"}
                  className="h-12 w-auto object-contain rounded-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="text-amber-300 font-serif text-sm w-full text-center md:text-left" dir="rtl">
              {(hfs.footer_arabic_title as string) || arabicTitle}
            </div>
            {hfs.footer_show_school_name !== false && hfs.footer_show_institute_name !== false && (
              <h3 className="text-lg font-extrabold text-white leading-snug w-full text-center md:text-left">
                {madrasaNameBn}
              </h3>
            )}
            <p className="text-xs text-emerald-200/80 leading-relaxed max-w-md mx-auto md:mx-0 text-center md:text-left">
              {((hfs.footer_about_text as string) && !String(hfs.footer_about_text).includes("Providing quality education"))
                ? (hfs.footer_about_text as string)
                : "মা খাদিজা (রা.) ও আয়েশা (রা.)-এর আদর্শে অনুকরণীয় নারীসমাজ গঠনের লক্ষ্যে প্রতিষ্ঠিত এক ঐতিহ্যবাহী দ্বীনি শিক্ষাপ্রতিষ্ঠান।"}
            </p>
            {hfs.footer_show_established_year !== false && (
              <div className="pt-1 text-[11px] text-amber-300 font-bold w-full text-center md:text-left">
                {(hfs.footer_established_year as string) || "স্থাপিত: ২০০৬ খ্রিস্টাব্দ"}
              </div>
            )}

            {/* Social Media Links */}
            {hfs.footer_show_social !== false && (
              <div className="flex items-center gap-2 pt-2 flex-wrap justify-center md:justify-start">
                {fb && (
                  <a
                    href={fb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 w-7 rounded-full bg-emerald-900/80 hover:bg-blue-600 hover:text-white text-emerald-200 flex items-center justify-center transition-colors border border-emerald-700/50 shadow-xs"
                    title="Facebook"
                  >
                    <Facebook size={13} />
                  </a>
                )}
                {yt && (
                  <a
                    href={yt}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 w-7 rounded-full bg-emerald-900/80 hover:bg-rose-600 hover:text-white text-emerald-200 flex items-center justify-center transition-colors border border-emerald-700/50 shadow-xs"
                    title="YouTube"
                  >
                    <Youtube size={13} />
                  </a>
                )}
                {tw && (
                  <a
                    href={tw}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 w-7 rounded-full bg-emerald-900/80 hover:bg-sky-500 hover:text-white text-emerald-200 flex items-center justify-center transition-colors border border-emerald-700/50 shadow-xs"
                    title="Twitter / X"
                  >
                    <Twitter size={13} />
                  </a>
                )}
                {insta && (
                  <a
                    href={insta}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 w-7 rounded-full bg-emerald-900/80 hover:bg-pink-600 hover:text-white text-emerald-200 flex items-center justify-center transition-colors border border-emerald-700/50 shadow-xs"
                    title="Instagram"
                  >
                    <Instagram size={13} />
                  </a>
                )}
                {wa && (
                  <a
                    href={wa.startsWith("http") ? wa : `https://wa.me/${wa.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 w-7 rounded-full bg-emerald-900/80 hover:bg-emerald-500 hover:text-white text-emerald-200 flex items-center justify-center transition-colors border border-emerald-700/50 shadow-xs"
                    title="WhatsApp"
                  >
                    <Phone size={13} />
                  </a>
                )}
                {li && (
                  <a
                    href={li}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 w-7 rounded-full bg-emerald-900/80 hover:bg-blue-700 hover:text-white text-emerald-200 flex items-center justify-center transition-colors border border-emerald-700/50 shadow-xs"
                    title="LinkedIn"
                  >
                    <Linkedin size={13} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Column 2: Academic Departments / Information */}
          <div className="space-y-3 col-span-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-emerald-800 pb-2">
              {col2Title}
            </h4>
            <ul className="space-y-2 text-xs">
              {departmentLinks.map((dept, idx) => (
                <li key={idx}>
                  <Link href={dept.url || "/#departments"} className="hover:text-amber-300 transition-colors">
                    {dept.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="space-y-3 col-span-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-emerald-800 pb-2">
              {col3Title}
            </h4>
            <ul className="space-y-2 text-xs">
              {quickLinks.map((qLink, idx) => (
                <li key={idx}>
                  <Link href={qLink.url || "#"} className="hover:text-amber-300 transition-colors">
                    {qLink.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Information */}
          <div className="space-y-3 col-span-2 md:col-span-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-emerald-800 pb-2">
              {col4Title}
            </h4>
            <ul className="space-y-2.5 text-xs text-emerald-200/90">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{madrasaAddress}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{madrasaPhone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{madrasaEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/70 gap-2">
          <p>{copyrightText}</p>
          <p className="flex items-center gap-1">
            {!cleanPoweredBy.includes("চালিত হচ্ছে") && (
              <span>চালিত হচ্ছে:</span>
            )}
            <span className="font-bold text-amber-400">
              {cleanPoweredBy}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
