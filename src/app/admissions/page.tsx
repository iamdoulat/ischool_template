import OnlineAdmissionPage from "@/app/online_admission/page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admissions — Apply for Enrollment",
  description: "Enroll your child at iSchool. Access the comprehensive online admission portal and view application instructions.",
  alternates: {
    canonical: "/admissions",
  },
  openGraph: {
    title: "Admissions — iSchool",
    description: "Enroll your child at iSchool. Access the comprehensive online admission portal.",
    url: "/admissions",
  },
};

export default function AdmissionsPluralPage() {
  return <OnlineAdmissionPage />;
}
