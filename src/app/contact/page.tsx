import ContactUsPage from "@/app/contact-us/page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us & Campus Location",
  description:
    "Get in touch with iSchool administration, admissions desk, and student support. Find campus address, contact numbers, email, and visit guidelines.",
  alternates: {
    canonical: "/contact-us",
  },
};

export default function ContactAliasPage() {
  return <ContactUsPage />;
}
