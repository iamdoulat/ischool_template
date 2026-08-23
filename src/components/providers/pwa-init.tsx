"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSettings } from "@/components/providers/settings-provider";
import { PWAInstallPrompt } from "@/components/pwa/pwa-install-prompt";

import { getImageUrl } from "@/lib/image-url";

export function PWAInit() {
  const { settings } = useSettings();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register Service Worker and force update / activation
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("PWA Service Worker registered with scope:", reg.scope);
            reg.update();
            if (reg.waiting) {
              reg.waiting.postMessage({ type: "SKIP_WAITING" });
            }
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                    installingWorker.postMessage({ type: "SKIP_WAITING" });
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.log("PWA Service Worker registration failed:", err);
          });
      });
    }

    // Dynamic Head Tag Sync for iOS Safari, Browser Favicon & Android mobile app installation
    const localFavicon = localStorage.getItem("ischool_favicon");
    const localShortName = localStorage.getItem("ischool_pwa_app_short_name");
    const localIcon192 = localStorage.getItem("ischool_pwa_icon_192");
    const localIcon512 = localStorage.getItem("ischool_pwa_icon_512");
    const localIconMaskable = localStorage.getItem("ischool_pwa_icon_maskable");
    const storedRole = (localStorage.getItem("user_role") || "").toLowerCase().trim();
    const storedStartUrl = localStorage.getItem("pwa_start_url")?.trim();
    const currentPath = pathname || (typeof window !== "undefined" ? window.location.pathname : "");

    const isStudentOrParentRole =
      storedRole === "student" ||
      storedRole === "parent" ||
      storedRole === "parents" ||
      storedRole === "guardian" ||
      storedRole === "std" ||
      storedRole === "par";

    const isExplicitAdminOrStaffRole =
      storedRole !== "" &&
      !isStudentOrParentRole;

    let isUserPortal = false;
    if (isStudentOrParentRole) {
      isUserPortal = true;
    } else if (isExplicitAdminOrStaffRole) {
      isUserPortal = false;
    } else if (currentPath.startsWith("/user")) {
      isUserPortal = true;
    } else if (currentPath.startsWith("/dashboard")) {
      isUserPortal = false;
    } else if (storedStartUrl === "/user/dashboard") {
      isUserPortal = true;
    } else {
      isUserPortal = false;
    }

    const targetStartUrl = isUserPortal ? "/user/dashboard" : "/dashboard";
    const manifestPortalParam = isUserPortal ? "user" : "admin";
    const manifestHref = `/manifest.json?portal=${manifestPortalParam}`;

    localStorage.setItem("pwa_start_url", targetStartUrl);
    document.cookie = `pwa_start_url=${targetStartUrl}; path=/; max-age=31536000; SameSite=Lax`;
    if (storedRole) {
      document.cookie = `user_role=${storedRole}; path=/; max-age=31536000; SameSite=Lax`;
    }

    const appShortName = settings?.pwa_app_short_name || localShortName || "iSchool";
    const rawFavicon = settings?.favicon || localFavicon || "/logo-admin-small.png";
    const rawPwaIcon192 = settings?.pwa_icon_192 || localIcon192 || settings?.pwa_icon_512 || localIcon512 || settings?.pwa_icon_maskable || localIconMaskable || "/logo-app.png";
    const rawPwaIcon512 = settings?.pwa_icon_512 || localIcon512 || settings?.pwa_icon_192 || localIcon192 || settings?.pwa_icon_maskable || localIconMaskable || "/logo-app.png";
    
    const resolvedFaviconUrl = getImageUrl(rawFavicon) || "/logo-admin-small.png";
    const faviconHref = `${resolvedFaviconUrl}${resolvedFaviconUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
    const appIcon = getImageUrl(rawPwaIcon192) || "/logo-app.png";
    const appIcon512 = getImageUrl(rawPwaIcon512) || "/logo-app.png";

    // 1. Safely sync Browser Main Favicon, Apple Touch Icon and Dynamic Manifest link tags
    const syncLinkTag = (rel: string, href: string) => {
      let link = document.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
      if (link) {
        link.href = href;
      } else {
        link = document.createElement("link");
        link.rel = rel;
        link.href = href;
        document.head.appendChild(link);
      }
    };

    syncLinkTag("manifest", manifestHref);
    syncLinkTag("icon", faviconHref);
    syncLinkTag("shortcut icon", faviconHref);
    syncLinkTag("apple-touch-icon", appIcon);

    // 2. Sync iOS Safari Apple App meta & touch icon tags
    let appleCapableTag = document.querySelector<HTMLMetaElement>("meta[name='apple-mobile-web-app-capable']");
    if (!appleCapableTag) {
      appleCapableTag = document.createElement("meta");
      appleCapableTag.name = "apple-mobile-web-app-capable";
      document.head.appendChild(appleCapableTag);
    }
    appleCapableTag.content = "yes";

    let appleStatusTag = document.querySelector<HTMLMetaElement>("meta[name='apple-mobile-web-app-status-bar-style']");
    if (!appleStatusTag) {
      appleStatusTag = document.createElement("meta");
      appleStatusTag.name = "apple-mobile-web-app-status-bar-style";
      document.head.appendChild(appleStatusTag);
    }
    appleStatusTag.content = "default";

    let appleTitleTag = document.querySelector<HTMLMetaElement>("meta[name='apple-mobile-web-app-title']");
    if (!appleTitleTag) {
      appleTitleTag = document.createElement("meta");
      appleTitleTag.name = "apple-mobile-web-app-title";
      document.head.appendChild(appleTitleTag);
    }
    appleTitleTag.content = appShortName;

    // 3. Sync Windows PC PWA & Start Menu Tile meta tags
    let msAppTitle = document.querySelector<HTMLMetaElement>("meta[name='application-name']");
    if (!msAppTitle) {
      msAppTitle = document.createElement("meta");
      msAppTitle.name = "application-name";
      document.head.appendChild(msAppTitle);
    }
    msAppTitle.content = appShortName;

    let msTileImage = document.querySelector<HTMLMetaElement>("meta[name='msapplication-TileImage']");
    if (!msTileImage) {
      msTileImage = document.createElement("meta");
      msTileImage.name = "msapplication-TileImage";
      document.head.appendChild(msTileImage);
    }
    msTileImage.content = appIcon;

    let msTileColor = document.querySelector<HTMLMetaElement>("meta[name='msapplication-TileColor']");
    if (!msTileColor) {
      msTileColor = document.createElement("meta");
      msTileColor.name = "msapplication-TileColor";
      document.head.appendChild(msTileColor);
    }
    msTileColor.content = "#6366f1";

    // 4. Sync mobile icon link tags for Android Chrome
    let icon192Tag = document.querySelector<HTMLLinkElement>("link[rel='icon'][sizes='192x192']");
    if (!icon192Tag) {
      icon192Tag = document.createElement("link");
      icon192Tag.rel = "icon";
      icon192Tag.setAttribute("sizes", "192x192");
      document.head.appendChild(icon192Tag);
    }
    icon192Tag.href = appIcon;

    let icon512Tag = document.querySelector<HTMLLinkElement>("link[rel='icon'][sizes='512x512']");
    if (!icon512Tag) {
      icon512Tag = document.createElement("link");
      icon512Tag.rel = "icon";
      icon512Tag.setAttribute("sizes", "512x512");
      document.head.appendChild(icon512Tag);
    }
    icon512Tag.href = appIcon512;
    // Auto-reload on Next.js ChunkLoadError (e.g. after production deployments update chunk hashes)
    const handleChunkError = (message?: string) => {
      if (message && /Loading chunk [\d]+ failed|ChunkLoadError/i.test(message)) {
        const storageKey = "ischool_chunk_load_reload";
        const lastReload = sessionStorage.getItem(storageKey);
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem(storageKey, now.toString());
          window.location.reload();
        }
      }
    };

    const onError = (e: ErrorEvent) => handleChunkError(e.message);
    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason?.message || String(e.reason || "");
      handleChunkError(reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [pathname, settings?.favicon, settings?.pwa_app_short_name, settings?.pwa_icon_192, settings?.pwa_icon_512, settings?.pwa_icon_maskable]);

  return <PWAInstallPrompt />;
}
