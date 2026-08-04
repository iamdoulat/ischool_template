"use client";

import { useEffect } from "react";
import { useSettings } from "@/components/providers/settings-provider";
import { PWAInstallPrompt } from "@/components/pwa/pwa-install-prompt";

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
    const appIcon = settings?.pwa_icon_192 || localIcon192 || settings?.pwa_icon_512 || localIcon512 || settings?.app_logo || "/logo-app.png";

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

    // 3. Sync shortcut favicon icon
    let shortcutIconTag = document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");
    if (shortcutIconTag) {
      shortcutIconTag.href = appIcon;
    }
  }, [settings?.pwa_app_short_name, settings?.pwa_icon_192, settings?.pwa_icon_512, settings?.school_name, settings?.app_logo]);

  return <PWAInstallPrompt />;
}
