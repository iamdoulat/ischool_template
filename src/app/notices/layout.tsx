import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "School Notices & Circulars",
  description: "Official school notices, circulars, exam schedules, holidays, and academic announcements for students, parents, and teachers.",
  alternates: {
    canonical: "/notices",
  },
  openGraph: {
    title: "School Notices & Circulars — iSchool",
    description: "Official school notices, circulars, exam schedules, and academic announcements.",
    url: "/notices",
  },
};

export default function NoticesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
