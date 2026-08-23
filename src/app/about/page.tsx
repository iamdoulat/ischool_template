import AboutUsPage from "@/app/about-us/page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Mission, Vision & Campus",
  description:
    "Learn about iSchool's history, leadership, educational philosophy, campus facilities, and our dedication to academic excellence.",
  alternates: {
    canonical: "/about-us",
  },
};

export default function AboutAliasPage() {
  return <AboutUsPage />;
}
