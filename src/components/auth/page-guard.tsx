"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import api from "@/lib/api";
import { checkPageAccess } from "@/lib/page-access";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PageGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.get("/profile");
        const user = res.data.data;
        const role: string = user?.role || "";
        setUserRole(role);
        const permissions: string[] = user?.permissions || [];

        // Allow access to user portal routes
        if (pathname.startsWith("/user")) {
          setIsAuthorized(true);
          return;
        }

        // Allow Admins and Super Admins full access
        if (role.toLowerCase().includes("admin")) {
          setIsAuthorized(true);
          return;
        }

        // Prevent Student/Parent from accessing admin portal routes (/dashboard/*)
        if ((role === "Student" || role === "Parent") && pathname.startsWith("/dashboard")) {
          setIsAuthorized(false);
          return;
        }

        setIsAuthorized(checkPageAccess(pathname, permissions));
      } catch {
        setIsAuthorized(false);
      }
    };
    check();
  }, [pathname]);

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    const isStudent = userRole === "Student" || userRole === "Parent";
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 rounded-full bg-red-100 p-4 dark:bg-red-900/20">
          <ShieldAlert className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">403</h1>
        <h2 className="mb-2 text-xl font-semibold">Access Denied</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          {isStudent
            ? "Students cannot access administrative portal modules. Please use your Student Portal dashboard."
            : "You do not have permission to access this page. Please contact your administrator if you believe this is a mistake."}
        </p>
        <Button asChild>
          <Link href={isStudent ? "/user/dashboard" : "/dashboard"}>
            {isStudent ? "Go to Student Portal" : "Go to Dashboard"}
          </Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
