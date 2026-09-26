"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    Code2, 
    Copy, 
    Check, 
    Trash2, 
    Sparkles, 
    Save, 
    Loader2, 
    Info, 
    ShieldCheck, 
    Activity, 
    MessageSquare,
    Globe
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";

interface HeaderFooterTabProps {
    headerCode: string;
    bodyCode: string;
    footerCode: string;
    onChangeHeaderCode: (val: string) => void;
    onChangeBodyCode: (val: string) => void;
    onChangeFooterCode: (val: string) => void;
    onSave: () => void;
    saving: boolean;
}

const TEMPLATES = {
    gtag: `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-XXXXXXXXXX');
</script>`,

    gtm_head: `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->`,

    gtm_body: `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`,

    meta_pixel: `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
<!-- End Meta Pixel Code -->`,

    meta_pixel_body: `<!-- Meta Pixel (noscript) -->
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"
/></noscript>`,

    site_verification: `<!-- Search Engine & Platform Verification Tags -->
<meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_KEY" />
<meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_KEY" />
<meta name="facebook-domain-verification" content="YOUR_FB_DOMAIN_KEY" />`,

    tawk_chat: `<!-- Start of Tawk.to Live Chat Script -->
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/YOUR_PROPERTY_ID/default';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script>
<!-- End of Tawk.to Script -->`,

    custom_css: `<style>
/* Custom Global Site Styling */
:root {
  --primary-accent: #6366f1;
}
</style>`,

    google_ads: `<!-- Google Ads Conversion Tracking & Remarketing Tag -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'AW-XXXXXXXXX');
</script>`,

    datalayer_init: `<!-- Google Tag Manager / GA4 DataLayer Initialization -->
<script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'portal_initialized',
    'portal_system': 'iSchool',
    'portal_timestamp': new Date().toISOString()
  });
</script>`,

    datalayer_event: `<!-- Custom DataLayer Lead & Conversion Event Helper -->
<script>
  function trackPortalEvent(eventName, payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event': eventName || 'admission_lead_submit',
      'timestamp': Date.now(),
      ...(payload || {})
    });
  }
</script>`,

    tiktok_pixel: `<!-- TikTok Pixel Code -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
  ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load('YOUR_TIKTOK_PIXEL_ID');
  ttq.page();
}(window, document, 'ttq');
</script>
<!-- End TikTok Pixel Code -->`,

    meta_lead_event: `<!-- Meta Pixel Lead Conversion Event -->
<script>
  if (typeof fbq === 'function') {
    fbq('track', 'Lead', {
      content_name: 'Online Admission Inquiry',
      content_category: 'Education Portal'
    });
  }
</script>`,
};

export function HeaderFooterTab({
    headerCode,
    bodyCode,
    footerCode,
    onChangeHeaderCode,
    onChangeBodyCode,
    onChangeFooterCode,
    onSave,
    saving,
}: HeaderFooterTabProps) {
    const { t } = useTranslation();
    const { toast } = useToast();

    const [copiedField, setCopiedField] = useState<"header" | "body" | "footer" | null>(null);

    const handleCopy = async (field: "header" | "body" | "footer", text: string) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast("success", t("code_copied_success"));
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            toast("error", "Failed to copy code to clipboard");
        }
    };

    const handleClear = (field: "header" | "body" | "footer") => {
        if (field === "header") onChangeHeaderCode("");
        if (field === "body") onChangeBodyCode("");
        if (field === "footer") onChangeFooterCode("");
    };

    const appendTemplate = (
        field: "header" | "body" | "footer",
        templateCode: string
    ) => {
        if (field === "header") {
            const next = headerCode ? `${headerCode.trim()}\n\n${templateCode}` : templateCode;
            onChangeHeaderCode(next);
        } else if (field === "body") {
            const next = bodyCode ? `${bodyCode.trim()}\n\n${templateCode}` : templateCode;
            onChangeBodyCode(next);
        } else if (field === "footer") {
            const next = footerCode ? `${footerCode.trim()}\n\n${templateCode}` : templateCode;
            onChangeFooterCode(next);
        }
        toast("info", t("quick_snippet_templates") + " applied");
    };

    const getStats = (text: string) => {
        const lines = text ? text.split("\n").length : 0;
        const chars = text ? text.length : 0;
        return { lines, chars };
    };

    const headerStats = getStats(headerCode);
    const bodyStats = getStats(bodyCode);
    const footerStats = getStats(footerCode);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Top Info Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-md border border-indigo-800/40 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-lg">
                            <Code2 className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-bold text-white tracking-tight">{t("header_footer_code_settings")}</h2>
                                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-emerald-400" />
                                    Both Templates (iSchool + iMadrasha)
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
                                {t("header_footer_code_desc")}
                            </p>
                            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-indigo-200 bg-indigo-950/70 border border-indigo-700/50 rounded-lg px-3 py-1.5 w-fit">
                                <Globe className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                <span>{t("template_both_templates_notice")}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                                    <ShieldCheck className="h-3 w-3 text-emerald-400" /> Site Verification
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                                    <Activity className="h-3 w-3 text-cyan-400" /> Google Analytics & GTM
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                                    <Sparkles className="h-3 w-3 text-amber-400" /> Meta & TikTok Ads
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                                    <Code2 className="h-3 w-3 text-violet-400" /> {t("datalayer_tracking")}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                                    <MessageSquare className="h-3 w-3 text-purple-400" /> Live Chat Widgets
                                </span>
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={onSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white font-bold px-6 h-10 rounded-lg shadow-md shrink-0 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {t("save_all_changes")}
                    </Button>
                </div>
            </div>

            {/* Hint Notice */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{t("supported_code_types_hint")}</span>
            </div>

            {/* 1. HEADER CODE BOX */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                                &lt;head&gt; ... &lt;/head&gt;
                            </span>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{t("header_code_title")}</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t("header_code_desc")}</p>
                    </div>

                    {/* Quick templates for Header */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mr-1">{t("quick_snippet_templates")}:</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTemplate("header", TEMPLATES.gtag)}
                            className="h-7 text-[11px] px-2.5 rounded-md border-gray-200 dark:border-gray-700 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-700 hover:border-cyan-300"
                        >
                            + {t("sample_template_gtag")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTemplate("header", TEMPLATES.google_ads)}
                            className="h-7 text-[11px] px-2.5 rounded-md border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 hover:border-amber-300"
                        >
                            + {t("sample_template_google_ads")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTemplate("header", TEMPLATES.gtm_head)}
                            className="h-7 text-[11px] px-2.5 rounded-md border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 hover:border-indigo-300"
                        >
                            + {t("sample_template_gtm_head")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTemplate("header", TEMPLATES.meta_pixel)}
                            className="h-7 text-[11px] px-2.5 rounded-md border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 hover:border-blue-300"
                        >
                            + {t("sample_template_meta_pixel")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTemplate("header", TEMPLATES.tiktok_pixel)}
                            className="h-7 text-[11px] px-2.5 rounded-md border-gray-200 dark:border-gray-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 hover:border-rose-300"
                        >
                            + {t("sample_template_tiktok_pixel")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTemplate("header", TEMPLATES.datalayer_init)}
                            className="h-7 text-[11px] px-2.5 rounded-md border-gray-200 dark:border-gray-700 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-700 hover:border-violet-300"
                        >
                            + {t("sample_template_datalayer_init")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTemplate("header", TEMPLATES.site_verification)}
                            className="h-7 text-[11px] px-2.5 rounded-md border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 hover:border-emerald-300"
                        >
                            + {t("sample_template_site_verification")}
                        </Button>
                    </div>
                </div>

                {/* Editor Container */}
                <div className="p-4 bg-slate-950 text-slate-100">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-900 rounded-t-lg border-b border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="flex gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 ml-2">head_scripts.html</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-slate-400">
                                {headerStats.lines} {t("lines_count")} • {headerStats.chars} {t("chars_count")}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy("header", headerCode)}
                                disabled={!headerCode}
                                className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                            >
                                {copiedField === "header" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                {copiedField === "header" ? t("code_copied_success") : t("copy_code")}
                            </button>
                            {headerCode && (
                                <button
                                    type="button"
                                    onClick={() => handleClear("header")}
                                    className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-950/60 transition-colors"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    {t("clear_code")}
                                </button>
                            )}
                        </div>
                    </div>
                    <textarea
                        value={headerCode}
                        onChange={(e) => onChangeHeaderCode(e.target.value)}
                        placeholder={`<!-- Paste your Header verification, Google Analytics, or <script> tags here -->\n<meta name="google-site-verification" content="..." />\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-..."></script>`}
                        className="w-full min-h-[220px] p-3.5 bg-slate-900/90 text-slate-100 font-mono text-xs leading-relaxed rounded-b-lg border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y placeholder:text-slate-600 selection:bg-indigo-600 selection:text-white"
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* 2. BODY CODE BOX */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                &lt;body&gt; (Top)
                            </span>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{t("body_code_title")}</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t("body_code_desc")}</p>
                    </div>

                    {/* Quick templates for Body */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mr-1">{t("quick_snippet_templates")}:</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTemplate("body", TEMPLATES.gtm_body)}
                            className="h-7 text-[11px] px-2.5 rounded-md border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 hover:border-amber-300"
                        >
                            + {t("sample_template_gtm_body")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTemplate("body", TEMPLATES.meta_pixel_body)}
                            className="h-7 text-[11px] px-2.5 rounded-md border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 hover:border-blue-300"
                        >
                            + Meta Pixel Noscript
                        </Button>
                    </div>
                </div>

                {/* Editor Container */}
                <div className="p-4 bg-slate-950 text-slate-100">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-900 rounded-t-lg border-b border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="flex gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 ml-2">body_top.html</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-slate-400">
                                {bodyStats.lines} {t("lines_count")} • {bodyStats.chars} {t("chars_count")}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy("body", bodyCode)}
                                disabled={!bodyCode}
                                className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                            >
                                {copiedField === "body" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                {copiedField === "body" ? t("code_copied_success") : t("copy_code")}
                            </button>
                            {bodyCode && (
                                <button
                                    type="button"
                                    onClick={() => handleClear("body")}
                                    className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-950/60 transition-colors"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    {t("clear_code")}
                                </button>
                            )}
                        </div>
                    </div>
                    <textarea
                        value={bodyCode}
                        onChange={(e) => onChangeBodyCode(e.target.value)}
                        placeholder={`<!-- Paste your opening <body> tracking codes here (e.g. Google Tag Manager noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-..." height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`}
                        className="w-full min-h-[180px] p-3.5 bg-slate-900/90 text-slate-100 font-mono text-xs leading-relaxed rounded-b-lg border-none focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y placeholder:text-slate-600 selection:bg-amber-600 selection:text-white"
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* 3. FOOTER CODE BOX */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                &lt;/body&gt; (Bottom)
                            </span>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{t("footer_code_title")}</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t("footer_code_desc")}</p>
                    </div>

                    {/* Quick templates for Footer */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mr-1">{t("quick_snippet_templates")}:</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTemplate("footer", TEMPLATES.tawk_chat)}
                            className="h-7 text-[11px] px-2.5 rounded-md border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 hover:border-emerald-300"
                        >
                            + {t("sample_template_tawk_chat")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTemplate("footer", TEMPLATES.datalayer_event)}
                            className="h-7 text-[11px] px-2.5 rounded-md border-gray-200 dark:border-gray-700 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-700 hover:border-violet-300"
                        >
                            + {t("sample_template_datalayer_event")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTemplate("footer", TEMPLATES.meta_lead_event)}
                            className="h-7 text-[11px] px-2.5 rounded-md border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 hover:border-blue-300"
                        >
                            + Meta Lead Event
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTemplate("footer", TEMPLATES.custom_css)}
                            className="h-7 text-[11px] px-2.5 rounded-md border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 hover:border-purple-300"
                        >
                            + Custom CSS (&lt;style&gt;)
                        </Button>
                    </div>
                </div>

                {/* Editor Container */}
                <div className="p-4 bg-slate-950 text-slate-100">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-900 rounded-t-lg border-b border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="flex gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 ml-2">footer_scripts.html</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-slate-400">
                                {footerStats.lines} {t("lines_count")} • {footerStats.chars} {t("chars_count")}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy("footer", footerCode)}
                                disabled={!footerCode}
                                className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                            >
                                {copiedField === "footer" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                {copiedField === "footer" ? t("code_copied_success") : t("copy_code")}
                            </button>
                            {footerCode && (
                                <button
                                    type="button"
                                    onClick={() => handleClear("footer")}
                                    className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-950/60 transition-colors"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    {t("clear_code")}
                                </button>
                            )}
                        </div>
                    </div>
                    <textarea
                        value={footerCode}
                        onChange={(e) => onChangeFooterCode(e.target.value)}
                        placeholder={`<!-- Paste your Footer live chat scripts, conversion pixels, or custom javascript here -->\n<script>\n  // Custom Javascript before </body>\n</script>`}
                        className="w-full min-h-[220px] p-3.5 bg-slate-900/90 text-slate-100 font-mono text-xs leading-relaxed rounded-b-lg border-none focus:outline-none focus:ring-1 focus:ring-purple-500 resize-y placeholder:text-slate-600 selection:bg-purple-600 selection:text-white"
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-500">
                    Changes are automatically verified and injected into all public website pages upon saving.
                </p>
                <Button 
                    onClick={onSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white font-bold px-8 h-10 rounded-full shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? t("saving") : t("save_all_changes")}
                </Button>
            </div>
        </div>
    );
}
