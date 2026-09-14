"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MonitorDown, Share, Plus, X, CheckCircle2 } from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { getImageUrl } from "@/lib/image-url";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

interface PWAInstallButtonProps {
  className?: string;
  variant?: "ghost" | "outline" | "default" | "secondary";
  showLabel?: boolean;
}

export function PWAInstallButton({ className, variant = "ghost", showLabel = false }: PWAInstallButtonProps) {
  const { settings } = useSettings();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const appName = settings?.pwa_app_short_name || settings?.school_name || "iSchool";
  const rawLogo = settings?.pwa_icon_192 || settings?.pwa_icon_512 || "/logo-app.png";
  const appLogo = getImageUrl(rawLogo) || "/logo-app.png";

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      if (typeof window === "undefined") return;

      const standaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        localStorage.getItem("pwa_installed") === "true";
      setIsStandalone(standaloneMode);

      const isApple = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      setIsIOS(isApple);

      if (window.deferredPWAInstallPrompt) {
        setDeferredPrompt(window.deferredPWAInstallPrompt);
      }
    }, 0);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.deferredPWAInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      localStorage.setItem("pwa_installed", "true");
      setIsStandalone(true);
      setDeferredPrompt(null);
      window.deferredPWAInstallPrompt = null;
      toast.success(`${appName} installed successfully!`);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [appName]);

  const handleInstallClick = async () => {
    if (isStandalone) {
      toast.info(`${appName} is already installed on this device.`);
      return;
    }

    const promptEvent = deferredPrompt || window.deferredPWAInstallPrompt;

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          localStorage.setItem("pwa_installed", "true");
          setIsStandalone(true);
          setDeferredPrompt(null);
          window.deferredPWAInstallPrompt = null;
          toast.success(`Installing ${appName}...`);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
        setShowGuideModal(true);
      }
    } else {
      // If native beforeinstallprompt has not fired or on Safari/Desktop, open installation guide modal
      setShowGuideModal(true);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <div className="relative group flex items-center justify-center">
        <Button
          type="button"
          variant={variant}
          size={showLabel ? "default" : "icon"}
          onClick={handleInstallClick}
          className={cn(
            "text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl relative",
            isStandalone && "opacity-60",
            className
          )}
          title={isStandalone ? `${appName} is Installed` : `Install ${appName} App`}
        >
          {/* Custom SVG icon matching browser address bar desktop install icon (Monitor with Down Arrow) */}
          <svg
            className="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="14" x="2" y="3" rx="2" />
            <line x1="8" x2="16" y1="21" y2="21" />
            <line x1="12" x2="12" y1="17" y2="21" />
            <polyline points="9 10 12 13 15 10" />
            <line x1="12" x2="12" y1="6" y2="13" />
          </svg>

          {showLabel && (
            <span className="ml-2 text-xs font-semibold">
              {isStandalone ? "App Installed" : "Install App"}
            </span>
          )}

          {/* Pulse notification dot when ready to install */}
          {!isStandalone && deferredPrompt && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}
        </Button>

        {/* Hover Tooltip */}
        {!showLabel && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-[#6366f1] text-white text-[11px] font-bold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#6366f1] rotate-45" />
            {isStandalone ? "App Installed" : "Install Desktop / PWA App"}
          </div>
        )}
      </div>

      {/* Interactive Install Guide Modal for Desktop & iOS */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-card border border-muted/80 shadow-2xl rounded-3xl w-full max-w-md p-6 text-center space-y-5 animate-in zoom-in-95 duration-300 relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full bg-muted/60 hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-primary/20 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-inner overflow-hidden">
              {isStandalone ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              ) : appLogo && appLogo !== "/logo-app.png" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={appLogo} alt={appName} className="w-12 h-12 object-contain rounded-xl" />
              ) : (
                <MonitorDown className="w-8 h-8 text-primary animate-bounce" />
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-foreground">
                {isStandalone ? `${appName} is Already Installed` : `Install ${appName} Application`}
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {isStandalone
                  ? "You are already using the installed standalone application."
                  : "Enjoy instant loading, offline capabilities, and a dedicated desktop window without browser tabs."}
              </p>
            </div>

            {isStandalone ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold">
                Application is active and running in standalone desktop mode.
              </div>
            ) : isIOS ? (
              /* iOS Instructions */
              <div className="bg-muted/40 rounded-2xl p-4 text-left space-y-3 text-xs border border-muted/60">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">1</div>
                  <div className="flex-1 text-slate-700 dark:text-slate-300">
                    Tap the <strong className="text-foreground">Share</strong> icon <Share className="w-3.5 h-3.5 inline text-primary mx-0.5" /> at the bottom of Safari.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">2</div>
                  <div className="flex-1 text-slate-700 dark:text-slate-300">
                    Scroll and tap <strong className="text-foreground">Add to Home Screen</strong> <Plus className="w-3.5 h-3.5 inline text-primary mx-0.5" />.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">3</div>
                  <div className="flex-1 text-slate-700 dark:text-slate-300">
                    Tap <strong className="text-foreground">Add</strong> in the top-right corner.
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Chrome / Edge / Brave Instructions */
              <div className="bg-muted/40 rounded-2xl p-4 text-left space-y-3 text-xs border border-muted/60">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">1</div>
                  <div className="flex-1 text-slate-700 dark:text-slate-300">
                    Look at the right side of your browser <strong>address bar</strong> (URL bar at the top).
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">2</div>
                  <div className="flex-1 text-slate-700 dark:text-slate-300">
                    Click the <strong>Install icon</strong> (computer monitor with downward arrow <MonitorDown className="w-3.5 h-3.5 inline text-primary mx-0.5" />).
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">3</div>
                  <div className="flex-1 text-slate-700 dark:text-slate-300">
                    Click <strong>Install</strong> to add {appName} to your computer&apos;s Desktop and App list!
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => setShowGuideModal(false)}
              className="w-full h-11 text-xs font-bold rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md cursor-pointer"
            >
              Got it, thanks!
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
