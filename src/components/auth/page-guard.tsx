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
        const role: string = user?.role || "";
        setUserRole(role);
        const permissions: string[] = user?.permissions || [];

        // Allow access to user portal routes for all authorized users
        if (pathname.startsWith("/user")) {
          setIsAuthorized(true);
          return;
        }

        // Allow Super Admin, Admin, and Staff full access to administrative pages
        const isStaffOrAdmin = !role || role.toLowerCase().includes("admin") || ["Staff", "Teacher", "Accountant", "Librarian", "Receptionist"].includes(role);
        if (isStaffOrAdmin && (pathname === "/dashboard" || pathname === "/dashboard/")) {
          setIsAuthorized(true);
          return;
        }

        if (role.toLowerCase().includes("admin")) {
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
          // If no granular permission limits are defined, allow staff access
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
        // If on main dashboard, allow rendering
        if (pathname === "/dashboard" || pathname === "/dashboard/") {
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
