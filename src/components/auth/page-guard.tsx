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
      // If no token exists in storage, redirect to login
      const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") : null;
      if (!token) {
        if (typeof window !== 'undefined') {
          window.location.href = "/login";
        }
        return;
      }

      // Root admin dashboard and root user portal are always authorized
      if (pathname === "/dashboard" || pathname === "/dashboard/" || pathname === "/user/dashboard") {
        setIsAuthorized(true);
      }

      try {
        const res = await api.get("/profile");
        const user = res.data?.data || res.data;
        const role: string = user?.role || user?.user_type || user?.role_name || "";
        setUserRole(role);
        const permissions: string[] = user?.permissions || [];
        const roleLower = String(role).toLowerCase().trim();

        // Synchronize role and PWA target start URL
        const isUserRole =
          roleLower === "student" ||
          roleLower === "parent" ||
          roleLower === "parents" ||
          roleLower === "guardian" ||
          roleLower === "std" ||
          roleLower === "par";
        const targetStartUrl = isUserRole ? "/user/dashboard" : "/dashboard";
        const canonicalRole = isUserRole ? (roleLower.includes("par") ? "Parent" : "Student") : (role || "Admin");

        if (typeof window !== 'undefined') {
          localStorage.setItem("user_role", canonicalRole);
          localStorage.setItem("pwa_start_url", targetStartUrl);
          document.cookie = `pwa_start_url=${targetStartUrl}; path=/; max-age=31536000; SameSite=Lax`;
          document.cookie = `user_role=${canonicalRole}; path=/; max-age=31536000; SameSite=Lax`;
        }

        // Allow access to user portal routes for all authorized users
        if (pathname.startsWith("/user")) {
          setIsAuthorized(true);
          return;
        }

        // Super Admin, Admin, and all Staff roles have full access to administrative dashboard modules
        const isStaffOrAdmin =
          !role ||
          roleLower.includes("admin") ||
          role === "Super Admin" ||
          role === "superadmin" ||
          ["staff", "teacher", "accountant", "librarian", "receptionist"].includes(roleLower);

        if (isStaffOrAdmin) {
          setIsAuthorized(true);
          return;
        }

        // Prevent Student/Parent from accessing admin portal routes (/dashboard/*)
        if ((role === "Student" || role === "Parent") && pathname.startsWith("/dashboard")) {
          setIsAuthorized(false);
          return;
        }

        // Check granular permissions for other submodules
        if (permissions && permissions.length > 0) {
          setIsAuthorized(checkPageAccess(pathname, permissions));
        } else {
          setIsAuthorized(true);
        }
      } catch (err: any) {
        // If unauthenticated (401), send to login
        if (err?.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem("auth_token");
            window.location.href = "/login";
          }
          return;
        }
        // For administrative dashboard routes, default to authorized
        if (pathname.startsWith("/dashboard")) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
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
