"use client";

import { useEffect } from "react";

export function PWAInit() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("PWA Service Worker registered successfully with scope:", reg.scope);
          })
          .catch((err) => {
            console.log("PWA Service Worker registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}
