import OnlineAdmissionPage from "@/app/online_admission/page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Admission Portal",
  description: "Apply online for student admission. Fill out the application form, upload documents, and submit your admission request securely.",
  alternates: {
    canonical: "/online-admission",
  },
  openGraph: {
    title: "Online Admission Portal — iSchool",
    description: "Apply online for student admission. Secure, easy multi-step application form.",
    url: "/online-admission",
  },
};

export default function OnlineAdmissionHyphenPage() {
  return <OnlineAdmissionPage />;
}
