"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import { tokenManager } from "@/lib/token-manager";
import { checkPageAccess } from "@/lib/page-access";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PageGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [userBranchSlug, setUserBranchSlug] = useState<string>("");
  const [userBranchName, setUserBranchName] = useState<string>("");
  const [deniedReason, setDeniedReason] = useState<"branch_mismatch" | "student_portal" | "permission_denied">("permission_denied");

  useEffect(() => {
    const check = async () => {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
      const branchMatch = currentPath.match(/^\/br\/([^\/]+)/);
      const urlBranchSlug = branchMatch ? branchMatch[1] : (typeof window !== 'undefined' ? localStorage.getItem("active_branch_slug") : "");
      const branchLoginUrl = urlBranchSlug && urlBranchSlug !== "main" ? `/br/${urlBranchSlug}/login` : "/login";

      // If no token exists in memory/session, redirect to login
      const token = typeof window !== 'undefined' ? await tokenManager.syncSession() : null;
      if (!token) {
        if (typeof window !== 'undefined') {
          router.replace(branchLoginUrl);
        }
        return;
      }

      try {
        const res = await api.get("/profile");
        const user = res.data?.data || res.data;
        const role: string = user?.role || user?.user_type || user?.role_name || "";
        setUserRole(role);
        const permissions: string[] = user?.permissions || [];
        const roleLower = String(role).toLowerCase().trim();
        const isGlobalAdmin = roleLower === "super admin" || roleLower === "superadmin" || roleLower === "admin";

        // Branch verification
        const isMainBranch = Boolean(
          user?.branch?.is_main ||
          user?.branch_slug === "main" ||
          user?.branch?.slug === "main" ||
          !user?.branch_id ||
          user?.branch_id === 1 ||
          String(user?.branch_id) === "1"
        );
        const activeBranchSlug = isMainBranch ? "" : (user?.branch_slug || user?.branch?.slug || "");
        const activeBranchName = user?.branch?.branch_name || (isMainBranch ? "Main Branch" : (activeBranchSlug || "My Campus"));
        setUserBranchSlug(isMainBranch ? "" : activeBranchSlug);
        setUserBranchName(activeBranchName);

        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const branchMatch = currentPath.match(/^\/br\/([^\/]+)/);

          if (isMainBranch || !activeBranchSlug || activeBranchSlug === "main") {
            // Main branch staff (Super Admin, Admin, Teacher, Accountant, Receptionist, Librarian, etc.)
            // If on /br/main/* or any /br/* path, strip branch prefix and redirect to standard route
            if (branchMatch) {
              const cleanedPath = currentPath.replace(/^\/br\/[^\/]+/, "") || (pathname.startsWith("/user") ? "/user/dashboard" : "/dashboard");
              router.replace(cleanedPath);
              return;
            }
          } else if (!isGlobalAdmin && user?.branch_id && activeBranchSlug) {
            // Sub-branch users
            if (branchMatch) {
              const urlBranchSlug = branchMatch[1];
              if (urlBranchSlug.toLowerCase() !== activeBranchSlug.toLowerCase()) {
                setDeniedReason("branch_mismatch");
                setIsAuthorized(false);
                return;
              }
            } else if (currentPath.startsWith("/dashboard")) {
              // Redirect branch users to their branch prefix
              router.replace(`/br/${activeBranchSlug}/dashboard`);
              return;
            } else if (currentPath.startsWith("/user")) {
              router.replace(`/br/${activeBranchSlug}/user/dashboard`);
              return;
            }
          }
        }

        // Synchronize role and PWA target start URL
        const isUserRole =
          roleLower === "student" ||
          roleLower === "parent" ||
          roleLower === "parents" ||
          roleLower === "guardian" ||
          roleLower === "std" ||
          roleLower === "par";
        const targetStartUrl = isUserRole 
          ? (isMainBranch || !activeBranchSlug || activeBranchSlug === "main" ? "/user/dashboard" : `/br/${activeBranchSlug}/user/dashboard`) 
          : (isMainBranch || !activeBranchSlug || activeBranchSlug === "main" ? "/dashboard" : `/br/${activeBranchSlug}/dashboard`);
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

        // Global Super Admin & Admin have universal bypass to all dashboard modules
        if (isGlobalAdmin) {
          setIsAuthorized(true);
          return;
        }

        // Prevent Student/Parent from accessing admin portal routes (/dashboard/*)
        if (isUserRole && pathname.startsWith("/dashboard")) {
          setDeniedReason("student_portal");
          setIsAuthorized(false);
          return;
        }

        // Dashboard Home (/dashboard or /br/:slug/dashboard) is always accessible to all authenticated staff
        const cleanPath = pathname.replace(/\/$/, "").replace(/^\/br\/[^\/]+/, "") || "/dashboard";
        if (cleanPath === "/dashboard" || cleanPath === "") {
          setIsAuthorized(true);
          return;
        }

        // Enforce granular permissions and role-based access for specific modules
        setIsAuthorized(checkPageAccess(pathname, permissions, role));
      } catch (err: unknown) {
        // If unauthenticated (401), send to login
        const axiosError = err as { response?: { status?: number } };
        if (axiosError?.response?.status === 401) {
          if (typeof window !== 'undefined') {
            await tokenManager.clearToken();
            router.replace(branchLoginUrl);
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
  }, [pathname, router]);

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    const isStudent = userRole === "Student" || userRole === "Parent";
    const isBranchMismatch = deniedReason === "branch_mismatch";

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 rounded-full bg-red-100 p-4 dark:bg-red-900/20">
          <ShieldAlert className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">403</h1>
        <h2 className="mb-2 text-xl font-semibold">
          {isBranchMismatch ? "Branch Access Restricted" : "Access Denied"}
        </h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          {isBranchMismatch
            ? `You do not have permission to view or manage another branch. You are assigned to the "${userBranchName}" branch.`
            : isStudent
            ? "Students cannot access administrative portal modules. Please use your Student Portal dashboard."
            : "You do not have permission to access this page. Please contact your administrator if you believe this is a mistake."}
        </p>
        <Button asChild>
          <Link
            href={
              isBranchMismatch && userBranchSlug && userBranchSlug !== "main"
                ? `/br/${userBranchSlug}/dashboard`
                : isStudent
                ? "/user/dashboard"
                : "/dashboard"
            }
          >
            {isBranchMismatch ? `Go to ${userBranchName} Dashboard` : isStudent ? "Go to Student Portal" : "Go to Dashboard"}
          </Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
