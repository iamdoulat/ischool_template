"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/components/providers/settings-provider";
import { useTranslation } from "@/hooks/use-translation";
import { toLocaleNumber } from "@/lib/utils";
import { getImageUrl } from "@/lib/image-url";
import { GraduationCap, ShieldCheck, Sparkles } from "lucide-react";

export function MobilePreloader() {
  const pathname = usePathname();
  const { settings, loading: settingsLoading } = useSettings();
  const { t, language } = useTranslation();

  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(12);
  const [logoError, setLogoError] = useState(false);
  const [targetPathname, setTargetPathname] = useState<string | null>(null);

  // Active path during navigation transition or current pathname
  const activePath = targetPathname || pathname;

  const [logoVersion, setLogoVersion] = useState<number>(() => Date.now());
  const [localAdminSmallLogo, setLocalAdminSmallLogo] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ischool_admin_small_logo");
    }
    return null;
  });

  // Listen for logo re-upload and storage events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLogoSync = () => {
      const stored = localStorage.getItem("ischool_admin_small_logo");
      if (stored) {
        setLocalAdminSmallLogo(stored);
      }
      setLogoVersion(Date.now());
      setLogoError(false);
    };

    window.addEventListener("storage", handleLogoSync);
    window.addEventListener("ischool_logo_updated", handleLogoSync);
    return () => {
      window.removeEventListener("storage", handleLogoSync);
      window.removeEventListener("ischool_logo_updated", handleLogoSync);
    };
  }, []);

  // Track portal type
  const isStudentPortal = activePath?.startsWith("/user");
  const isAdminPortal = activePath?.startsWith("/dashboard");

  // Track template type
  const isMadrasha =
    settings?.website_template === "imadrasha" ||
    (typeof window !== "undefined" &&
      (window.location.hostname.includes("madrasha") || window.location.hostname.includes("madrasa")));

  // Resolve logo source: strictly prioritize 'Admin Small Logo' ('অ্যাডমিন ছোট লোগো')
  const rawLogo =
    settings?.admin_small_logo ||
    localAdminSmallLogo ||
    (isMadrasha ? "/anwara-logo.png" : "") ||
    settings?.favicon ||
    settings?.app_logo ||
    settings?.admin_logo ||
    settings?.print_logo ||
    "/logo-admin-small.png";

  // Automatically reset logo error whenever rawLogo updates (e.g. user re-uploaded logo)
  useEffect(() => {
    setLogoError(false);
  }, [rawLogo]);

  // Compute final logo URL with cache buster for uploaded assets so re-uploads reflect immediately
  const resolvedLogoUrl = getImageUrl(rawLogo, settings?.base_url);
  const logoSrc = resolvedLogoUrl
    ? (resolvedLogoUrl.startsWith("data:") || resolvedLogoUrl.startsWith("blob:")
        ? resolvedLogoUrl
        : `${resolvedLogoUrl}${resolvedLogoUrl.includes("?") ? "&" : "?"}v=${logoVersion}`)
    : "";

  // Check mobile viewport on mount and resize without synchronous effect state updates
  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setIsMounted(true);
      setIsMobile(window.innerWidth < 768);
    }, 0);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", checkMobile);
    return () => {
      clearTimeout(mountTimer);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Initial load simulation & document ready listener
  useEffect(() => {
    if (!isMobile) return;

    let safetyTimeout: NodeJS.Timeout;
    const startTime = Date.now();
    const minDisplayTime = 700; // ms to ensure smooth, pleasant animation

    const advanceProgress = () => {
      setProgress((prev) => {
        if (prev >= 100) return 100;

        // Progressive easing: faster early, gentle cruise near 90%
        if (prev < 45) {
          return prev + Math.floor(Math.random() * 12) + 8;
        } else if (prev < 78) {
          return prev + Math.floor(Math.random() * 8) + 5;
        } else if (prev < 92) {
          return prev + Math.floor(Math.random() * 3) + 1;
        }
        return prev;
      });
    };

    // Increment progress tick
    const progressTimer = setInterval(advanceProgress, 60);

    const finishLoading = () => {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      setTimeout(() => {
        clearInterval(progressTimer);
        setProgress(100);
        setTimeout(() => {
          setIsVisible(false);
        }, 260); // brief pause at 100% before exit
      }, remainingTime);
    };

    if (typeof document !== "undefined") {
      if (document.readyState === "complete" && !settingsLoading) {
        finishLoading();
      } else {
        const handleWindowLoad = () => {
          finishLoading();
        };
        window.addEventListener("load", handleWindowLoad);

        // Safety fallback ceiling: 2200ms maximum
        safetyTimeout = setTimeout(() => {
          finishLoading();
        }, 2200);

        return () => {
          clearInterval(progressTimer);
          clearTimeout(safetyTimeout);
          window.removeEventListener("load", handleWindowLoad);
        };
      }
    }

    return () => {
      clearInterval(progressTimer);
      clearTimeout(safetyTimeout);
    };
  }, [isMobile, settingsLoading]);

  // Refs for tracking navigation transition state across page switches
  const prevPathnameRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionStartRef = useRef<number>(0);

  // Complete transition loading animation (called when new route pathname mounts)
  const completePageTransition = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    const elapsed = Date.now() - transitionStartRef.current;
    const minDisplay = 320; // ensures smooth pleasant animation even on fast connections
    const delay = Math.max(0, minDisplay - elapsed);

    minDisplayTimerRef.current = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setTargetPathname(null);
        setTimeout(() => setProgress(12), 250);
      }, 250);
    }, delay);
  }, []);

  // Start transition loading animation (called on link click, popstate, or programmatic navigation)
  const startPageTransition = useCallback((destinationPath?: string) => {
    if (!isMobile) return;

    if (destinationPath) {
      setTargetPathname(destinationPath);
    }

    // Clear any previous transition timers
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    if (minDisplayTimerRef.current) clearTimeout(minDisplayTimerRef.current);

    transitionStartRef.current = Date.now();
    setIsVisible(true);
    setProgress(18);

    // Progressive ticking simulating connection and resource retrieval
    // On slow internet, this smoothly advances up to ~88% and holds there until page mounts
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) return 88;
        if (prev < 45) {
          return prev + Math.floor(Math.random() * 8) + 5;
        } else if (prev < 72) {
          return prev + Math.floor(Math.random() * 5) + 3;
        } else {
          return prev + Math.floor(Math.random() * 2) + 1;
        }
      });
    }, 100);

    // Safety timeout: 7000ms maximum so it never gets permanently stuck on network failure
    safetyTimerRef.current = setTimeout(() => {
      completePageTransition();
    }, 7000);
  }, [isMobile, completePageTransition]);

  // Listen for route changes (when Next.js completes navigation and renders the new page)
  useEffect(() => {
    if (!isMounted || !isMobile) return;

    // First mount: establish baseline pathname without triggering completePageTransition
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }

    // Pathname has changed -> the new page is ready!
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      completePageTransition();
    }
  }, [pathname, isMounted, isMobile, completePageTransition]);

  // Intercept internal link taps and navigation events on mobile devices
  useEffect(() => {
    if (!isMounted || !isMobile) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref) return;

      // Ignore hash anchors, protocols, new tabs, downloads, and keyboard modifiers
      if (
        rawHref.startsWith("#") ||
        rawHref.startsWith("javascript:") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      try {
        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(anchor.href, window.location.href);

        // Ignore external domains
        if (targetUrl.origin !== currentUrl.origin) return;

        // If clicking exact current URL, ignore
        if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
          return;
        }

        // Trigger mobile preloader immediately
        startPageTransition(targetUrl.pathname);
      } catch {
        // Ignore invalid URLs
      }
    };

    const handlePopState = () => {
      setTimeout(() => {
        startPageTransition();
      }, 0);
    };

    // Safe monkey-patch of window.history.pushState to catch programmatic router.push
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      try {
        const url = args[2];
        if (url && typeof url === "string") {
          const targetUrl = new URL(url, window.location.href);
          if (targetUrl.pathname !== window.location.pathname) {
            // Defer execution out of React's synchronous useInsertionEffect callstack
            setTimeout(() => {
              startPageTransition(targetUrl.pathname);
            }, 0);
          }
        }
      } catch {
        // Safe fallback
      }
      return originalPushState.apply(this, args);
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      window.history.pushState = originalPushState;
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      if (minDisplayTimerRef.current) clearTimeout(minDisplayTimerRef.current);
    };
  }, [isMounted, isMobile, startPageTransition]);

  // If not mounted or not mobile, render nothing
  if (!isMounted || !isMobile) {
    return null;
  }

  // Dynamic status text based on progress
  const getStatusText = () => {
    if (progress < 35) {
      return t("connecting_server") || "Connecting to server...";
    }
    if (progress < 75) {
      return t("loading_data_resources") || "Loading resources & data...";
    }
    if (progress < 100) {
      return t("almost_ready") || "Almost ready...";
    }
    return t("portal_ready") || "Ready!";
  };

  // Portal metadata badges and themes
  const portalConfig = isStudentPortal
    ? {
      title: t("student_portal") || "Student Portal",
      subtitle: t("loading_student_portal") || "Loading Student Portal...",
      icon: GraduationCap,
      glowClass: "from-emerald-500 via-teal-500 to-cyan-500",
      badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      dotColor: "bg-emerald-500",
      barGradient: "from-emerald-500 via-teal-500 to-cyan-500",
    }
    : isAdminPortal
      ? {
        title: t("admin_dashboard") || "Admin Dashboard",
        subtitle: t("loading_admin_portal") || "Loading Admin Dashboard...",
        icon: ShieldCheck,
        glowClass: "from-[#FF9800] via-indigo-500 to-[#6366F1]",
        badgeBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        dotColor: "bg-indigo-500",
        barGradient: "from-[#FF9800] via-indigo-500 to-[#6366F1]",
      }
      : {
        title: t("educational_portal") || "Educational Portal",
        subtitle: t("loading_website") || "Loading Educational Portal...",
        icon: Sparkles,
        glowClass: isMadrasha
          ? "from-emerald-600 via-teal-500 to-amber-500"
          : "from-[#FF9800] via-indigo-500 to-[#6366F1]",
        badgeBg: isMadrasha
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
          : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        dotColor: isMadrasha ? "bg-emerald-600" : "bg-indigo-500",
        barGradient: isMadrasha
          ? "from-emerald-600 via-teal-500 to-amber-500"
          : "from-[#FF9800] via-indigo-500 to-[#6366F1]",
      };

  const PortalIcon = portalConfig.icon;
  const schoolName = settings?.school_name || "iSchool Educational Platform";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="mobile-preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.03,
            filter: "blur(8px)",
            transition: { duration: 0.35, ease: "easeInOut" },
          }}
          className="fixed inset-0 z-[99999] block md:hidden pointer-events-auto select-none overflow-hidden"
          style={{ touchAction: "none" }}
        >
          {/* Layered Backdrop: Soft modern radial glow + Glassmorphism */}
          <div className="absolute inset-0 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-2xl transition-colors" />

          {/* Ambient Background Glow Spotlights */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-tr from-indigo-500/15 via-orange-400/10 to-teal-400/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-emerald-400/10 blur-3xl pointer-events-none" />

          {/* Main Layout Container: Center Logo + Bottom Loading Bar */}
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-between px-6 pt-16 pb-10">
            {/* Top Empty Spacer for balance */}
            <div className="h-6" />

            {/* Center Stage: Spinning Logo with Multi-layered Orbital Rings */}
            <div className="flex flex-col items-center justify-center text-center">
              {/* Spinning Logo Container */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* 1. Outer Conic Spinning Radiant Halo */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className={`absolute inset-0 rounded-full bg-gradient-to-r ${portalConfig.glowClass} opacity-70 blur-md`}
                />

                {/* 2. Middle Dashed Counter-Rotating Orbital Ring with Satellites */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="absolute -inset-2.5 rounded-full border-2 border-dashed border-indigo-400/40 dark:border-indigo-400/30 flex items-center justify-center"
                >
                  {/* Orbiting Satellite Node 1 */}
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm shadow-orange-500/50" />
                  {/* Orbiting Satellite Node 2 */}
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-sm shadow-indigo-500/50" />
                </motion.div>

                {/* 3. Smooth Inner Rotating Thin Accent Ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="absolute -inset-0.5 rounded-3xl border border-white/60 dark:border-white/20"
                />

                {/* 4. Center Logo Card with Breathing & Gloss Sheen */}
                <motion.div
                  animate={{ scale: [1, 1.035, 1] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                  className="relative z-10 w-28 h-28 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/20 border border-white/80 dark:border-slate-800 flex items-center justify-center p-3.5 overflow-hidden"
                >
                  {/* Diagonal Light Sweep Sheen */}
                  <motion.div
                    animate={{ x: ["-150%", "200%"] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut", repeatDelay: 0.8 }}
                    className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent skew-x-12 pointer-events-none"
                  />

                  {/* Logo Image or Fallback Academic Crest */}
                  {!logoError && logoSrc ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={logoSrc}
                      alt={schoolName}
                      onError={() => setLogoError(true)}
                      className="max-h-full max-w-full object-contain filter drop-shadow-xs transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center text-white shadow-md">
                      <GraduationCap className="h-9 w-9" />
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Institution Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="mt-6 max-w-[280px]"
              >
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white line-clamp-1">
                  {schoolName}
                </h2>
              </motion.div>

              {/* Portal Pill Badge with Pulsing Live Dot */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.18, duration: 0.35 }}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-2xs backdrop-blur-md"
              >
                <div className={`px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${portalConfig.badgeBg}`}>
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${portalConfig.dotColor}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${portalConfig.dotColor}`} />
                  </span>
                  <PortalIcon className="h-3 w-3" />
                  <span>{portalConfig.title}</span>
                </div>
              </motion.div>
            </div>

            {/* Bottom Loading Section: Percentage counter + Progress Bar */}
            <div className="w-full max-w-xs flex flex-col items-center gap-2.5">
              {/* Dynamic Status + Percentage Indicator */}
              <div className="w-full flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600 dark:text-slate-300 transition-all duration-200">
                  {getStatusText()}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
                  {toLocaleNumber(Math.round(progress), language?.short_code)}%
                </span>
              </div>

              {/* Radiant Loading Bar Track */}
              <div className="relative w-full h-2 bg-slate-200/80 dark:bg-slate-800/90 rounded-full p-[1.5px] overflow-hidden shadow-inner">
                {/* Active Gradient Fill Bar */}
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${portalConfig.barGradient} transition-all duration-150 ease-out relative overflow-hidden`}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                >
                  {/* Moving Shimmer Highlight Across the Fill */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite] -skew-x-12" />

                  {/* Luminous Tip Glow */}
                  <span className="absolute right-0 top-0 bottom-0 w-2 bg-white/70 rounded-full blur-[1px]" />
                </div>
              </div>

              {/* Sub-label hint */}
              <p className="text-[11px] text-slate-600 dark:text-slate-300 tracking-wide mt-0.5">
                {portalConfig.subtitle}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
