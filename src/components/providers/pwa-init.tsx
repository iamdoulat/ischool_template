"use client";

import { useEffect } from "react";
import { useSettings } from "@/components/providers/settings-provider";
import { PWAInstallPrompt } from "@/components/pwa/pwa-install-prompt";

import { getImageUrl } from "@/lib/image-url";

export function PWAInit() {
  const { settings } = useSettings();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("PWA Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.log("PWA Service Worker registration failed:", err);
          });
      });
    }

    // Dynamic Head Tag Sync for iOS Safari & Android mobile app installation
    const localShortName = localStorage.getItem("ischool_pwa_app_short_name");
    const localIcon192 = localStorage.getItem("ischool_pwa_icon_192");
    const localIcon512 = localStorage.getItem("ischool_pwa_icon_512");

    const appShortName = settings?.pwa_app_short_name || localShortName || settings?.school_name || "iSchool";
    const rawAppIcon = settings?.pwa_icon_192 || localIcon192 || settings?.pwa_icon_512 || localIcon512 || settings?.app_logo || "/logo-app.png";
    const appIcon = getImageUrl(rawAppIcon) || "/logo-app.png";

    // 1. Sync iOS Apple App Title meta tag
    let appleTitleTag = document.querySelector<HTMLMetaElement>("meta[name='apple-mobile-web-app-title']");
    if (!appleTitleTag) {
      appleTitleTag = document.createElement("meta");
      appleTitleTag.name = "apple-mobile-web-app-title";
      document.head.appendChild(appleTitleTag);
    }
    appleTitleTag.content = appShortName;

    // 2. Sync iOS Apple Touch Icon link tag
    let appleIconTag = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!appleIconTag) {
      appleIconTag = document.createElement("link");
      appleIconTag.rel = "apple-touch-icon";
      document.head.appendChild(appleIconTag);
    }
    appleIconTag.href = appIcon;

    // 3. Sync mobile icon link tags for Android Chrome
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
    icon512Tag.href = settings?.pwa_icon_512 || localIcon512 || appIcon;
  }, [settings?.pwa_app_short_name, settings?.pwa_icon_192, settings?.pwa_icon_512, settings?.school_name, settings?.app_logo]);

  return <PWAInstallPrompt />;
}
