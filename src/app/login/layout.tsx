import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal Login",
  description: "Sign in to your iSchool portal account. Access student details, academics, attendance, and administrative panels.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
