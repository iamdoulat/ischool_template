"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  House,
  Bell,
  BookOpen,
  CreditCard,
  Users,
  UserCheck,
  LayoutGrid,
  X,
  User,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

interface MobileNavbarProps {
  portalType?: "user" | "admin";
}

interface NavItemConfig {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isHomeIcon?: boolean;
}

export function MobileNavbar({ portalType = "user" }: MobileNavbarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isUserPortal = portalType === "user" || pathname?.startsWith("/user");

  // Portal-specific mobile bottom navigation items
  const navItems: NavItemConfig[] = isUserPortal
    ? [
        {
          id: "home",
          label: t("home") || "Home",
          href: "/user/dashboard",
          icon: House,
          isHomeIcon: true,
        },
        {
          id: "notices",
          label: t("notices") || "Notices",
          href: "/user/notice-board",
          icon: Bell,
        },
        {
          id: "homework",
          label: t("homework") || "Homework",
          href: "/user/homework",
          icon: BookOpen,
        },
        {
          id: "fees",
          label: t("fees") || "Fees",
          href: "/user/fees",
          icon: CreditCard,
        },
      ]
    : [
        {
          id: "home",
          label: t("home") || "Home",
          href: "/dashboard",
          icon: House,
          isHomeIcon: true,
        },
        {
          id: "students",
          label: t("students") || "Students",
          href: "/dashboard/student-information/student-details",
          icon: Users,
        },
        {
          id: "fees",
          label: t("fees") || "Fees",
          href: "/dashboard/fees-collection/collect-fees",
          icon: CreditCard,
        },
        {
          id: "attendance",
          label: t("attendance") || "Attendance",
          href: "/dashboard/reports/attendance",
          icon: UserCheck,
        },
      ];

  // Determine active item based on current pathname
  const getIsActive = (item: NavItemConfig) => {
    if (!pathname) return false;
    if (item.id === "home") {
      return pathname === "/dashboard" || pathname === "/user/dashboard" || pathname === "/user";
    }
    return pathname.startsWith(item.href);
  };

  // Quick Action links for the center Grid Button popup
  const quickActions = isUserPortal
    ? [
        { title: "My Profile", href: "/user/profile", icon: User, color: "bg-blue-500/10 text-blue-600" },
        { title: "Notice Board", href: "/user/notice-board", icon: Bell, color: "bg-amber-500/10 text-amber-600" },
        { title: "Class Timetable", href: "/user/class-timetable", icon: BookOpen, color: "bg-emerald-500/10 text-emerald-600" },
        { title: "Fees & Payments", href: "/user/fees", icon: CreditCard, color: "bg-purple-500/10 text-purple-600" },
      ]
    : [
        { title: "Student Details", href: "/dashboard/student-information/student-details", icon: User, color: "bg-blue-500/10 text-blue-600" },
        { title: "Collect Fees", href: "/dashboard/fees-collection/collect-fees", icon: CreditCard, color: "bg-emerald-500/10 text-emerald-600" },
        { title: "Notice Board", href: "/dashboard/communicate/send-sms", icon: Bell, color: "bg-amber-500/10 text-amber-600" },
        { title: "System Settings", href: "/dashboard/system-setting/general-setting", icon: Settings, color: "bg-purple-500/10 text-purple-600" },
      ];

  return (
    <>
      {/* Floating Bottom Navbar Container (Mobile Only) */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 block md:hidden w-[94%] max-w-[430px] pointer-events-auto">
        <div className="relative w-full h-[66px] flex items-center justify-between px-3">
          {/* Custom SVG Background Container with Curved Notch */}
          <svg
            className="absolute inset-0 w-full h-full text-white dark:text-slate-900 drop-shadow-[0_12px_32px_rgba(0,0,0,0.14)] pointer-events-none"
            viewBox="0 0 380 66"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M 32 0 L 142 0 C 160 0, 166 26, 190 26 C 214 26, 220 0, 238 0 L 348 0 A 32 32 0 0 1 380 32 A 32 32 0 0 1 348 66 L 32 66 A 32 32 0 0 1 0 32 A 32 32 0 0 1 32 0 Z" />
          </svg>

          {/* Left Nav Items (2 items) */}
          <div className="relative z-10 flex items-center justify-around w-[42%] h-full pt-1.5">
            {navItems.slice(0, 2).map((item) => {
              const active = getIsActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex flex-col items-center justify-center group py-1 px-1 min-w-[62px]"
                >
                  <div className="relative flex items-center justify-center">
                    {/* Animated Active Pill Background */}
                    {active && (
                      <motion.div
                        layoutId="mobileNavActivePill"
                        className="absolute inset-0 -mx-3 -my-1 rounded-full bg-[#FFF0E8] dark:bg-rose-950/40"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    {item.isHomeIcon ? (
                      /* Geometrical Red Logo style icon matching example image */
                      <div className="relative z-10 p-1">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 2L3 9V20C3 20.5523 3.44772 21 4 21H9V14H15V21H20C20.5523 21 21 20.5523 21 20V9L12 2Z"
                            fill={active ? "#E53935" : "#64748B"}
                          />
                        </svg>
                      </div>
                    ) : (
                      <Icon
                        className={cn(
                          "w-5 h-5 relative z-10 transition-colors duration-200",
                          active ? "text-[#E53935]" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700"
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-semibold tracking-tight mt-0.5 relative z-10 transition-colors duration-200",
                      active ? "text-[#E53935] font-bold" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Center Circular Action Button inside Notch */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5 z-20">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsMenuOpen(true)}
              className="w-[52px] h-[52px] rounded-full bg-[#1A1926] dark:bg-slate-800 text-white flex items-center justify-center shadow-lg shadow-black/20 hover:bg-[#252436] transition-colors border-2 border-white dark:border-slate-900"
              aria-label="Quick Navigation"
            >
              <LayoutGrid className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* Right Nav Items (2 items) */}
          <div className="relative z-10 flex items-center justify-around w-[42%] h-full pt-1.5 ml-auto">
            {navItems.slice(2, 4).map((item) => {
              const active = getIsActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex flex-col items-center justify-center group py-1 px-1 min-w-[62px]"
                >
                  <div className="relative flex items-center justify-center">
                    {/* Animated Active Pill Background */}
                    {active && (
                      <motion.div
                        layoutId="mobileNavActivePill"
                        className="absolute inset-0 -mx-3 -my-1 rounded-full bg-[#FFF0E8] dark:bg-rose-950/40"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        "w-5 h-5 relative z-10 transition-colors duration-200",
                        active ? "text-[#E53935]" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-semibold tracking-tight mt-0.5 relative z-10 transition-colors duration-200",
                      active ? "text-[#E53935] font-bold" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Quick Action Sheet Modal */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl p-6 shadow-2xl md:hidden border-t border-slate-200 dark:border-slate-800"
            >
              {/* Handle indicator */}
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    {isUserPortal ? "Student Menu" : "Admin Dashboard Menu"}
                  </h3>
                  <p className="text-xs text-slate-500">Quick actions & shortcuts</p>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Actions List */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {quickActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={idx}
                      href={action.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", action.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary">
                          {action.title}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Footer action */}
              <Link
                href={isUserPortal ? "/user/dashboard" : "/dashboard"}
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-md"
              >
                <span>Go to Full Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
