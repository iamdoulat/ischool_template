"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import {
    Loader2, Bus, MapPin, Clock, Navigation, User, BadgeCheck,
    Phone, IdCard, Route as RouteIcon, CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

type PickupPoint = {
    name: string;
    distance: string;
    pickup_time: string;
    route_pickup_point_id: number;
};

type TransportData = {
    route: { title: string } | null;
    vehicle: {
        vehicle_number: string;
        vehicle_model: string;
        made: string;
        driver_name: string;
        driver_licence: string;
        driver_contact: string;
    } | null;
    pickup_points: PickupPoint[];
    assigned_pickup_point_id: number | null;
};

export default function TransportRoutesPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<TransportData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchTransportRoute = async () => {
            try {
                const response = await api.get("/user/transport-routes");
                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    toast({
                        variant: "destructive",
                        title: t("error"),
                        description: response.data.message || t("failed_to_fetch_transport_route"),
                    });
                }
            } catch (error) {
                const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || t("an_error_occurred_while_fetching_data");
                toast({ variant: "destructive", title: t("error"), description: message });
            } finally {
                setLoading(false);
            }
        };

        fetchTransportRoute();
    }, [toast]);

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="p-4 lg:p-6">
                <div className="flex h-[400px] items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>{t("loading_transport_route")}</span>
                </div>
            </div>
        );
    }

    /* ── Empty ── */
    if (!data || !data.route) {
        return (
            <div className="p-4 lg:p-6 animate-in fade-in duration-500">
                <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Bus className="h-5 w-5" />
                        </span>
                        <h1 className="text-[16px] font-bold text-gray-800 tracking-tight">{t("transport_route")}</h1>
                    </div>
                    <CardContent className="p-0">
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <div className="p-5 rounded-full bg-gray-50 mb-4">
                                <Bus className="h-12 w-12 opacity-30" />
                            </div>
                            <p className="text-base font-semibold text-gray-500">{t("no_transport_route_assigned")}</p>
                            <p className="text-sm mt-1">{t("contact_the_administration_office_for_transport_allocation")}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const vehicleFields = data.vehicle
        ? [
              { label: t("vehicle_number"), value: data.vehicle.vehicle_number, icon: Bus },
              { label: t("vehicle_model"), value: data.vehicle.vehicle_model, icon: Bus },
              { label: t("made_year"), value: data.vehicle.made || "N/A", icon: BadgeCheck },
              { label: t("driver_name"), value: data.vehicle.driver_name, icon: User },
              { label: t("driver_licence"), value: data.vehicle.driver_licence, icon: IdCard },
              { label: t("driver_contact"), value: data.vehicle.driver_contact, icon: Phone },
          ]
        : [];

    const points = data.pickup_points;

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Bus className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("transport_route")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {points.length} {t("pickup_point")}{points.length === 1 ? "" : "s"} {t("on_your_route")}
                            </p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-4 sm:p-6 space-y-6">
                    {/* ── Route + Vehicle hero ── */}
                    <div className="flex flex-col md:flex-row gap-5 items-stretch">
                        {/* Route banner */}
                        <div className="w-full md:w-56 shrink-0 rounded-xl relative overflow-hidden bg-gradient-to-br from-[#FF9800] to-[#6366F1] p-5 flex flex-col justify-between min-h-[140px] shadow-sm">
                            <Bus className="h-12 w-12 text-white/90" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{t("route_title")}</p>
                                <h2 className="text-lg font-bold text-white leading-tight">{data.route.title}</h2>
                            </div>
                            <div className="absolute -right-4 -top-4 opacity-10">
                                <RouteIcon className="h-28 w-28 text-white" />
                            </div>
                        </div>

                        {/* Vehicle + driver grid */}
                        {data.vehicle ? (
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {vehicleFields.map((field) => (
                                    <div
                                        key={field.label}
                                        className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/60"
                                    >
                                        <div className="p-2 rounded-lg bg-white shadow-sm shrink-0">
                                            <field.icon className="h-4 w-4 text-[#6366F1]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{field.label}</p>
                                            <p className="font-semibold text-[13px] text-gray-800 truncate">{field.value || "—"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/40 text-gray-400 text-sm py-8">
                                {t("no_vehicle_assigned_to_this_route_yet")}
                            </div>
                        )}
                    </div>

                    {/* ── Pickup point timeline ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="h-4 w-4 text-[#6366F1]" />
                            <h3 className="text-[14px] font-bold text-gray-800">{t("pickup_point_list")}</h3>
                            <span className="ml-auto text-[11px] text-gray-400">{t("ordered_by_pickup_time")}</span>
                        </div>

                        {points.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                                <MapPin className="h-10 w-10 mb-3 opacity-30" />
                                <p className="text-sm font-medium">{t("no_pickup_points_added_for_this_route")}</p>
                            </div>
                        ) : (
                            <div className="relative pl-2">
                                {/* vertical line */}
                                <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-[#FF9800]/40 via-gray-200 to-[#6366F1]/40" />

                                <ol className="space-y-3">
                                    {points.map((point, index) => {
                                        const isAssigned = point.route_pickup_point_id === data.assigned_pickup_point_id;
                                        return (
                                            <li key={point.route_pickup_point_id} className="relative flex gap-4">
                                                {/* node */}
                                                <div className="relative z-10 shrink-0">
                                                    <span
                                                        className={cn(
                                                            "flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white shadow-sm",
                                                            isAssigned ? "border-green-500" : "border-gray-300"
                                                        )}
                                                    >
                                                        {isAssigned ? (
                                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                        ) : (
                                                            <span className="text-[11px] font-bold text-gray-500">{index + 1}</span>
                                                        )}
                                                    </span>
                                                </div>

                                                {/* card */}
                                                <div
                                                    className={cn(
                                                        "flex-1 rounded-xl border p-3.5 shadow-sm transition-all duration-200 hover:shadow-md",
                                                        isAssigned
                                                            ? "bg-green-50/70 border-green-300 ring-1 ring-green-200"
                                                            : "bg-white border-gray-200"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between gap-2 mb-2.5">
                                                        <h4 className="font-bold text-[14px] text-gray-800 truncate">{point.name}</h4>
                                                        {isAssigned && (
                                                            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">
                                                                <CheckCircle2 className="h-3 w-3" /> {t("your_stop")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] font-medium text-gray-600">
                                                        <span className="flex items-center gap-1.5">
                                                            <Navigation className="h-3.5 w-3.5 text-[#6366F1]" />
                                                            {t("distance")}: <span className="text-gray-800">{point.distance || "0.0"} km</span>
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5 text-[#FF9800]" />
                                                            {t("pickup")}: <span className="text-gray-800">{point.pickup_time || "N/A"}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
