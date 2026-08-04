"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSettings } from "@/components/providers/settings-provider";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus, X, Smartphone } from "lucide-react";

export function PWAInstallPrompt() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const appName = settings?.pwa_app_short_name || settings?.school_name || "iSchool";
  const appLogo = settings?.pwa_icon_192 || settings?.app_logo || "/logo-app.png";

  // Target exclusively user portal (/user/*) and admin portal (/dashboard/*)
  const isTargetPortal = Boolean(pathname?.startsWith("/user") || pathname?.startsWith("/dashboard"));

  useEffect(() => {
    if (typeof window === "undefined" || !isTargetPortal) return;

    // 1. Check if PWA is already installed or running in standalone mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      localStorage.getItem("pwa_installed") === "true";

    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // 2. 60-minute reminder interval check
    const dismissedAt = localStorage.getItem("pwa_install_dismissed_at");
    if (dismissedAt) {
      const timePassed = Date.now() - parseInt(dismissedAt, 10);
      const SIXTY_MINUTES = 60 * 60 * 1000;
      if (timePassed < SIXTY_MINUTES) {
        return; // Suppress notification until 60 minutes pass
      }
    }

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    if (iosDevice && !isStandaloneMode) {
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    // Standard Android / Desktop PWA event listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    // Event listener when installation completes (permanently disables notifications)
    const handleAppInstalled = () => {
      localStorage.setItem("pwa_installed", "true");
      setIsStandalone(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isTargetPortal, pathname]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      localStorage.setItem("pwa_installed", "true");
      setIsStandalone(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSModal(false);
    // Save timestamp to trigger 60-minute reminder interval
    localStorage.setItem("pwa_install_dismissed_at", Date.now().toString());
  };

  if (!isTargetPortal || isStandalone || !showPrompt) return null;

  return (
    <>
      {/* Floating PWA Install Banner (Portal-Scoped) */}
      <div className="fixed bottom-20 md:bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[99990] animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-card/95 backdrop-blur-xl border border-primary/20 shadow-2xl rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#FF9800] via-[#818cf8] to-[#6366F1]" />
          
          <div className="w-12 h-12 rounded-xl bg-muted/60 border border-muted flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
            <img
              src={appLogo}
              alt={appName}
              className="w-10 h-10 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <Smartphone className="w-6 h-6 text-primary hidden group-has-[img[style*='display: none']]:block" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <h4 className="text-xs font-bold text-foreground truncate">
              Install {appName} App
            </h4>
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              {isIOS ? "Add to your iPhone Home Screen" : "Fast, offline & full screen app experience"}
            </p>
          </div>

          <Button
            size="sm"
            onClick={handleInstallClick}
            className="h-8 text-xs font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white rounded-lg px-3 shadow-md shrink-0 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </Button>

          <button
            onClick={handleDismiss}
            className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* iOS Install Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-muted shadow-2xl rounded-3xl w-full max-w-sm p-6 text-center space-y-4 animate-in zoom-in-95 duration-300 relative">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full bg-muted/50"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
              <Smartphone className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Install {appName} on iPhone
              </h3>
              <p className="text-xs text-muted-foreground">
                Follow these simple steps to install on your home screen:
              </p>
            </div>

            <div className="bg-muted/40 rounded-2xl p-4 text-left space-y-3 text-xs border border-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="flex-1">
                  Tap the <strong className="text-foreground">Share</strong> icon <Share className="w-3.5 h-3.5 inline text-primary ml-1" /> at the bottom of Safari.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="flex-1">
                  Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong> <Plus className="w-3.5 h-3.5 inline text-primary ml-1" />.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="flex-1">
                  Tap <strong className="text-foreground">Add</strong> in the top right corner. Done!
                </div>
              </div>
            </div>

            <Button
              onClick={handleDismiss}
              className="w-full h-10 text-xs font-semibold rounded-xl bg-primary text-primary-foreground"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
