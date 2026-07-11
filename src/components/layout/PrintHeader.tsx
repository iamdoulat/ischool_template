import { useSettings } from "@/components/providers/settings-provider";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface PrintHeaderProps {
    title: string;
    headerImageUrl?: string | null;
    tabName?: string; // If provided, fetches print settings for this tab automatically
}

export function PrintHeader({ title, headerImageUrl: externalHeaderImageUrl, tabName }: PrintHeaderProps) {
    const { settings } = useSettings();
    const [fetchedImageUrl, setFetchedImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (tabName) {
            const fetchSettings = async () => {
                try {
                    const res = await api.get("system-setting/print-settings");
                    if (res.data?.status === "success") {
                        const tabSetting = (res.data.data || []).find((s: any) => s.type === tabName);
                        if (tabSetting && tabSetting.header_image_url) {
                            setFetchedImageUrl(tabSetting.header_image_url);
                        }
                    }
                } catch {
                    // silently fail
                }
            };
            fetchSettings();
        }
    }, [tabName]);

    const finalHeaderImageUrl = externalHeaderImageUrl || fetchedImageUrl;

    if (finalHeaderImageUrl) {
        return (
            <div className="border-b border-gray-200">
                <img src={finalHeaderImageUrl} alt="Header Preview" className="w-full h-auto object-contain" />
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col border-b border-gray-200 bg-white">
            <div className="flex justify-between p-3 md:p-4 bg-white min-h-[90px] items-center">
                {/* Left Side: Logo and School Name */}
                <div className="flex flex-col justify-center items-start">
                    <div className="h-6 md:h-7 relative flex items-center mb-1">
                        {settings.print_logo ? (
                            <img src={settings.print_logo} alt="Logo" className="max-h-full object-contain" />
                        ) : (
                            <div className="text-sm font-bold bg-green-500 text-white px-2 py-0.5 rounded">SMART SCHOOL</div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight leading-none uppercase">
                            {settings.school_name || "Your School Name Here"}
                        </h1>
                    </div>
                </div>

                {/* Right Side: Contact Info */}
                <div className="flex flex-col text-[8px] md:text-[9px] text-gray-600 font-medium items-end text-right space-y-0.5 justify-center">
                    <p>Address: {settings.address || "25 Kings Street, CA"}</p>
                    <p>Phone No.: {settings.phone || "89562423934"}</p>
                    <p>Email: {settings.email || "yourschool@gmail.com"}</p>
                    <p>Website: {settings.base_url?.replace(/^https?:\/\//, '') || "www.yoursite.in"}</p>
                </div>
            </div>

            {/* Bottom Bar: Title */}
            <div className="w-full bg-black text-white text-center py-2 md:py-2.5">
                <h2 className="text-sm md:text-base font-bold uppercase tracking-widest">{title}</h2>
            </div>
        </div>
    );
}
