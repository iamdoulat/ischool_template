import { serverFetch } from "@/lib/server-api";
import { getImageUrl } from "@/lib/image-url";

export interface SchoolSeoData {
  schoolName: string;
  schoolDescription: string;
  logoUrl: string;
  faviconUrl: string;
  phone: string;
  email: string;
  address: string;
  websiteTemplate: string;
  baseUrl: string;
  socialLinks: string[];
  headerCode?: string;
  bodyCode?: string;
  footerCode?: string;
  cmsCourses?: Array<{
    title: string;
    description: string;
    image?: string;
    category?: string;
  }>;
  cmsAbout?: {
    title?: string;
    description?: string;
    image?: string;
  };
}

export async function getSchoolSeoData(): Promise<SchoolSeoData> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://ischool.coolify.mddoulat.com"
  ).replace(/\/+$/, "");

  const data: SchoolSeoData = {
    schoolName: "iSchool",
    schoolDescription:
      "Comprehensive School Management System & Educational Institution Portal providing online admissions, examination results, student tracking, attendance, fees collection, and digital notices.",
    logoUrl: `${baseUrl}/logo-admin.png`,
    faviconUrl: `${baseUrl}/logo-admin-small.png`,
    phone: "+8801851046320",
    email: "smartideasbd24@gmail.com",
    address: "House#68, Road#10, Sector#10, Uttara Model Town, Dhaka-1230",
    websiteTemplate: "ischool",
    baseUrl,
    socialLinks: [
      "https://facebook.com/ischool",
      "https://twitter.com/ischool",
      "https://linkedin.com/company/ischool",
      "https://youtube.com/@ischool",
    ],
  };

  try {
    const [genRes, cmsRes] = await Promise.all([
      serverFetch<Record<string, unknown>>("/system-setting/general-setting", {
        revalidate: 60,
      }),
      serverFetch<{
        website_template?: string;
        header_code?: string;
        body_code?: string;
        footer_code?: string;
        header_footer_sections?: {
          header_code?: string;
          body_code?: string;
          footer_code?: string;
        };
        main_courses?: Array<{
          title: string;
          description: string;
          image?: string;
          category?: string;
        }>;
        about_us?: {
          title?: string;
          description?: string;
          image?: string;
        };
      }>("/front-cms/settings", { revalidate: 60 }),
    ]);

    const settings = genRes.data;
    if (settings) {
      if (settings.school_name && typeof settings.school_name === "string" && settings.school_name.trim() !== "") {
        data.schoolName = settings.school_name.trim();
      } else if (settings.pwa_app_short_name && typeof settings.pwa_app_short_name === "string") {
        data.schoolName = settings.pwa_app_short_name.trim();
      }

      if (settings.school_description && typeof settings.school_description === "string" && settings.school_description.trim() !== "") {
        data.schoolDescription = settings.school_description.trim();
      }

      if (settings.phone && typeof settings.phone === "string") {
        data.phone = settings.phone;
      }

      if (settings.email && typeof settings.email === "string") {
        data.email = settings.email;
      }

      if (settings.address && typeof settings.address === "string") {
        data.address = settings.address;
      }

      if (settings.logo && typeof settings.logo === "string") {
        const fullLogo = getImageUrl(settings.logo);
        if (fullLogo) data.logoUrl = fullLogo;
      }

      if (settings.favicon && typeof settings.favicon === "string") {
        const fullFavicon = getImageUrl(settings.favicon);
        if (fullFavicon) data.faviconUrl = fullFavicon;
      }

      const social: string[] = [];
      if (settings.facebook_url && typeof settings.facebook_url === "string") social.push(settings.facebook_url);
      if (settings.twitter_url && typeof settings.twitter_url === "string") social.push(settings.twitter_url);
      if (settings.linkedin_url && typeof settings.linkedin_url === "string") social.push(settings.linkedin_url);
      if (settings.instagram_url && typeof settings.instagram_url === "string") social.push(settings.instagram_url);
      if (settings.youtube_url && typeof settings.youtube_url === "string") social.push(settings.youtube_url);
      if (social.length > 0) data.socialLinks = social;
    }

    const cms = cmsRes.data;
    if (cms) {
      if (cms.website_template) data.websiteTemplate = cms.website_template;
      if (cms.header_code || cms.header_footer_sections?.header_code) {
        data.headerCode = cms.header_code || cms.header_footer_sections?.header_code;
      }
      if (cms.body_code || cms.header_footer_sections?.body_code) {
        data.bodyCode = cms.body_code || cms.header_footer_sections?.body_code;
      }
      if (cms.footer_code || cms.header_footer_sections?.footer_code) {
        data.footerCode = cms.footer_code || cms.header_footer_sections?.footer_code;
      }
      if (Array.isArray(cms.main_courses)) data.cmsCourses = cms.main_courses;
      if (cms.about_us) data.cmsAbout = cms.about_us;
    }
  } catch {
    // Non-blocking fallback
  }

  return data;
}
