import React from "react";

interface JsonLdProps {
  schoolName?: string;
  description?: string;
  url?: string;
  logoUrl?: string;
  telephone?: string;
  email?: string;
  address?:
    | {
        streetAddress?: string;
        addressLocality?: string;
        addressRegion?: string;
        postalCode?: string;
        addressCountry?: string;
      }
    | string;
  sameAs?: string[];
}

export function JsonLd({
  schoolName = "iSchool",
  description = "Comprehensive School Management System & Educational Institution Portal",
  url = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://ischool.coolify.mddoulat.com",
  logoUrl = `${(process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "https://ischool.coolify.mddoulat.com").replace(/\/+$/, "")}/logo-admin.png`,
  telephone = "+880 1800-123456",
  email = "info@ischool.edu.bd",
  address = "House#68, Road#10, Sector#10, Uttara Model Town, Dhaka-1230",
  sameAs = [
    "https://facebook.com/ischool",
    "https://twitter.com/ischool",
    "https://linkedin.com/company/ischool",
    "https://instagram.com/ischool",
    "https://youtube.com/@ischool",
  ],
}: JsonLdProps) {
  const cleanUrl = url.replace(/\/+$/, "");

  const postalAddress =
    typeof address === "string"
      ? {
          "@type": "PostalAddress",
          streetAddress: address,
          addressCountry: "BD",
        }
      : {
          "@type": "PostalAddress",
          streetAddress: address?.streetAddress || "Dhaka",
          addressLocality: address?.addressLocality || "Dhaka",
          addressRegion: address?.addressRegion || "Dhaka Division",
          postalCode: address?.postalCode || "1230",
          addressCountry: address?.addressCountry || "BD",
        };

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["EducationalOrganization", "School"],
        "@id": `${cleanUrl}/#organization`,
        name: schoolName,
        url: cleanUrl,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
          caption: `${schoolName} Logo`,
        },
        image: logoUrl,
        description: description,
        telephone: telephone,
        email: email,
        address: postalAddress,
        sameAs: (Array.isArray(sameAs) ? sameAs : []).filter(Boolean),
        knowsAbout: [
          "Primary Education",
          "Secondary Education",
          "Higher Secondary Education",
          "STEM Education",
          "Academic Examinations",
          "Digital Student Records",
        ],
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: telephone,
            contactType: "Admissions & General Enquiries",
            email: email,
            availableLanguage: ["English", "Bengali"],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${cleanUrl}/#website`,
        url: cleanUrl,
        name: schoolName,
        description: description,
        publisher: {
          "@id": `${cleanUrl}/#organization`,
        },
        inLanguage: ["en", "bn"],
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${cleanUrl}/academics?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      id="schema-org-jsonld"
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
    />
  );
}

