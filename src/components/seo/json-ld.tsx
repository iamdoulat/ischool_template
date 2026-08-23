import React from "react";

interface JsonLdProps {
  schoolName?: string;
  description?: string;
  url?: string;
  logoUrl?: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  sameAs?: string[];
}

export function JsonLd({
  schoolName = "iSchool",
  description = "Comprehensive School Management System & Educational Institution Portal",
  url = "https://ischool.com",
  logoUrl = "https://ischool.com/logo-admin.png",
  telephone = "+880 1800-123456",
  email = "info@ischool.edu.bd",
  address = {
    streetAddress: "House 42, Road 11, Block E, Banani",
    addressLocality: "Dhaka",
    addressRegion: "Dhaka Division",
    postalCode: "1213",
    addressCountry: "BD",
  },
  sameAs = [
    "https://facebook.com/ischool",
    "https://twitter.com/ischool",
    "https://linkedin.com/company/ischool",
    "https://instagram.com/ischool",
    "https://youtube.com/@ischool",
  ],
}: JsonLdProps) {
  const cleanUrl = url.replace(/\/+$/, "");

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
        address: {
          "@type": "PostalAddress",
          streetAddress: address.streetAddress,
          addressLocality: address.addressLocality,
          addressRegion: address.addressRegion,
          postalCode: address.postalCode,
          addressCountry: address.addressCountry,
        },
        sameAs: sameAs.filter(Boolean),
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: telephone,
            contactType: "Admissions & Inquiries",
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
        inLanguage: ["en-US", "bn-BD"],
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
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
    />
  );
}
