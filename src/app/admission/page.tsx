import OnlineAdmissionPage from "@/app/online_admission/page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Admission — Apply Now",
  description: "Apply online for student admission. Fill out the application form, upload documents, and submit your admission request securely.",
  alternates: {
    canonical: "/admission",
  },
  openGraph: {
    title: "Online Student Admission — iSchool",
    description: "Apply online for student admission. Secure, easy multi-step application form.",
    url: "/admission",
  },
};

export default function AdmissionRoutePage() {
  return <OnlineAdmissionPage />;
}
