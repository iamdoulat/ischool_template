/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Eye,
    MapPin,
    Search,
    Compass,
    Navigation,
    Sparkles,
    Globe,
    ExternalLink,
    X,
    Map
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn, toLocaleNumber } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

declare global {
    interface Window {
        L: any;
    }
}

interface PickupPoint {
    id: number;
    name: string;
    latitude: string;
    longitude: string;
}

const TABLE_COLS = 5;

function SkeletonRows({ rows = 5, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-border/40">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-4">
                            <div
                                className="h-4 rounded-lg bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 5 + j * 11) % 35)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function PickupPointPage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const shortCode = language?.short_code || "en";

    const [searchTerm, setSearchTerm] = useState("");
    const [points, setPoints] = useState<PickupPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    const [currentPoint, setCurrentPoint] = useState<PickupPoint | null>(null);
    const [formState, setFormState] = useState({ name: "", latitude: "", longitude: "" });

    // Delete confirmation state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/transport/pickup-points");
            const data = response.data?.data || response.data || [];
            setPoints(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching pickup points:", error);
            tt.error("failed_to_load_pickup_points");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!formState.name.trim()) {
            tt.error("pickup_point_name_required");
            return;
        }
        setSaving(true);
        try {
            if (isEditing && currentPoint) {
                await api.put(`/transport/pickup-points/${currentPoint.id}`, formState);
                tt.success("pickup_point_updated_successfully");
            } else {
                await api.post("/transport/pickup-points", formState);
                tt.success("pickup_point_created_successfully");
            }
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            tt.error("failed_to_save_pickup_point");
        } finally {
            setSaving(false);
        }
    };

    const handleView = (point: PickupPoint) => {
        setCurrentPoint(point);
        setFormState({ name: point.name || "", latitude: point.latitude || "", longitude: point.longitude || "" });
        setIsEditing(false);
        setIsViewing(true);
        setIsModalOpen(true);
    };

    const handleEdit = (point: PickupPoint) => {
        setCurrentPoint(point);
        setFormState({ name: point.name || "", latitude: point.latitude || "", longitude: point.longitude || "" });
        setIsEditing(true);
        setIsViewing(false);
        setIsModalOpen(true);
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/transport/pickup-points/${deleteId}`);
            tt.success("pickup_point_deleted_successfully");
            fetchData();
        } catch (error) {
            tt.error("failed_to_delete_pickup_point");
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormState({ name: "", latitude: "", longitude: "" });
        setIsEditing(false);
        setIsViewing(false);
        setCurrentPoint(null);
    };

    // Leaflet Interactive Map Initialization
    useEffect(() => {
        if (isModalOpen) {
            let isMounted = true;
            const initMap = () => {
                const mapElement = document.getElementById("pickup-map-container");
                if (!mapElement || !window.L || !isMounted) return;

                if ((mapElement as any)._leaflet_id) {
                    (mapElement as any)._leaflet_id = null;
                    mapElement.innerHTML = "";
                }

                const initialLat = parseFloat(formState.latitude) || 23.8103;
                const initialLng = parseFloat(formState.longitude) || 90.4125;

                const map = window.L.map("pickup-map-container", {
                    zoomControl: true,
                    attributionControl: false
                }).setView([initialLat, initialLng], 14);

                window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    maxZoom: 19,
                }).addTo(map);

                const marker = window.L.marker([initialLat, initialLng], {
                    draggable: !isViewing,
                }).addTo(map);

                if (!isViewing) {
                    map.on("click", (e: any) => {
                        const { lat, lng } = e.latlng;
                        marker.setLatLng([lat, lng]);
                        setFormState((prev) => ({
                            ...prev,
                            latitude: lat.toFixed(6),
                            longitude: lng.toFixed(6),
                        }));
                    });

                    marker.on("dragend", (e: any) => {
                        const { lat, lng } = e.target.getLatLng();
                        setFormState((prev) => ({
                            ...prev,
                            latitude: lat.toFixed(6),
                            longitude: lng.toFixed(6),
                        }));
                    });
                }

                setTimeout(() => {
                    if (isMounted) map.invalidateSize();
                }, 200);
            };

            if (!window.L) {
                if (!document.getElementById("leaflet-css")) {
                    const link = document.createElement("link");
                    link.id = "leaflet-css";
                    link.rel = "stylesheet";
                    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                    document.head.appendChild(link);
                }
                const script = document.createElement("script");
                script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                script.async = true;
                script.onload = () => {
                    if (isMounted) initMap();
                };
                document.head.appendChild(script);
            } else {
                initMap();
            }

            return () => {
                isMounted = false;
            };
        }
    }, [isModalOpen, isViewing]);

    const filteredPoints = points.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.latitude && p.latitude.includes(searchTerm)) ||
        (p.longitude && p.longitude.includes(searchTerm))
    );

    const totalPages = Math.ceil(filteredPoints.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredPoints.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const dataToExport = points.map((p, i) => ({
            "SL": i + 1,
            "Pickup Point Name": p.name,
            "Latitude": p.latitude,
            "Longitude": p.longitude,
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PickupPoints");
        XLSX.writeFile(wb, "transport_pickup_points.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Transport Pickup Points List", 14, 15);
        autoTable(doc, {
            head: [["#", "Name", "Latitude", "Longitude"]],
            body: points.map((p, i) => [i + 1, p.name, p.latitude || "-", p.longitude || "-"]),
            startY: 20,
        });
        doc.save("transport_pickup_points.pdf");
    };

    const copyToClipboard = () => {
        const text = points.map((p, i) => `${i + 1}. ${p.name} (Lat: ${p.latitude || "-"}, Lng: ${p.longitude || "-"})`).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const toolbarActions = [
        { Icon: Copy, onClick: copyToClipboard, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: exportToExcel, title: t("excel") },
        { Icon: FileText, onClick: exportToPDF, title: t("pdf") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
    ];

    return (
        <div className="space-y-6 w-full pb-12 animate-in fade-in duration-500">
            {/* Fully Filled Gradient Header Banner Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FF9800] via-[#8B5CF6] to-[#6366F1] p-5 sm:p-7 text-white shadow-xl shadow-indigo-500/15 border border-white/20">
                {/* Glow Effects */}
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/15 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-black/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 border border-white/40 text-white shadow-inner backdrop-blur-md">
                            <MapPin className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
                                    {t("pickup_point_list")}
                                </h1>
                                <Badge className="bg-white/25 hover:bg-white/30 text-white border-white/40 text-xs font-bold px-3 py-0.5 rounded-full backdrop-blur-md shadow-xs">
                                    <Sparkles className="w-3 h-3 mr-1 text-amber-200" />
                                    {toLocaleNumber(points.length, shortCode)} {points.length === 1 ? t("pickup_point") : t("pickup_points")}
                                </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-white/90 font-medium max-w-2xl leading-relaxed">
                                {t("manage_transit_location_details")}
                            </p>
                        </div>
                    </div>

                    {/* Top Action Button */}
                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        <Button
                            onClick={() => {
                                resetForm();
                                setIsModalOpen(true);
                            }}
                            className="h-11 px-6 rounded-2xl bg-white hover:bg-white/95 text-slate-900 font-black text-xs sm:text-sm shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all gap-2 cursor-pointer border border-white/60"
                        >
                            <Plus className="h-4 w-4 text-indigo-600" />
                            <span>{t("add_pickup_point")}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Table Card */}
            <Card className="border border-muted/60 shadow-lg bg-card/60 backdrop-blur-xl overflow-hidden rounded-3xl">
                <CardContent className="p-4 sm:p-6 space-y-5">
                    {/* Search & Action Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder={t("search")}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-10 pl-9 pr-8 text-xs font-medium rounded-2xl bg-background/80 border-border/80 focus-visible:ring-primary shadow-none"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Page Size & Export Tools */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(val) => {
                                    setItemsPerPage(parseInt(val));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[85px] h-10 text-xs font-bold rounded-2xl bg-background/80 border-border/80">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="10" className="text-xs font-bold">{toLocaleNumber("10", shortCode)}</SelectItem>
                                    <SelectItem value="25" className="text-xs font-bold">{toLocaleNumber("25", shortCode)}</SelectItem>
                                    <SelectItem value="50" className="text-xs font-bold">{toLocaleNumber("50", shortCode)}</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center border border-border/70 rounded-2xl p-1 bg-muted/40 gap-0.5">
                                {toolbarActions.map((action, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        onClick={action.onClick}
                                        title={action.title}
                                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all cursor-pointer"
                                    >
                                        <action.Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="rounded-2xl border border-border/60 overflow-hidden shadow-xs bg-card/40">
                        <div className="overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[700px]">
                                <TableHeader className="bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-16 py-3.5 px-4 text-center font-bold">#</TableHead>
                                        <TableHead className="font-bold py-3.5 px-4">{t("name")}</TableHead>
                                        <TableHead className="font-bold py-3.5 px-4">{t("latitude")}</TableHead>
                                        <TableHead className="font-bold py-3.5 px-4">{t("longitude")}</TableHead>
                                        <TableHead className="font-bold py-3.5 px-4 text-right">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/40">
                                    {loading ? (
                                        <SkeletonRows rows={5} cols={TABLE_COLS} />
                                    ) : paginatedData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={TABLE_COLS} className="px-4 py-16 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="p-3.5 rounded-2xl bg-muted/60 text-muted-foreground">
                                                        <MapPin className="h-6 w-6" />
                                                    </div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                        {t("no_pickup_points_found")}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((point, idx) => {
                                            const serialNumber = startIndex + idx + 1;
                                            const hasCoordinates = Boolean(point.latitude && point.longitude);
                                            const mapUrl = hasCoordinates
                                                ? `https://www.google.com/maps?q=${point.latitude},${point.longitude}`
                                                : null;

                                            return (
                                                <TableRow
                                                    key={point.id}
                                                    className="text-xs transition-colors hover:bg-primary/[0.03] group"
                                                >
                                                    {/* Serial Number */}
                                                    <TableCell className="py-3.5 px-4 text-center">
                                                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs font-mono">
                                                            {toLocaleNumber(String(serialNumber).padStart(2, "0"), shortCode)}
                                                        </span>
                                                    </TableCell>

                                                    {/* Name */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                                                <Navigation className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <span className="text-xs sm:text-sm font-bold text-foreground block">
                                                                    {point.name}
                                                                </span>
                                                                {hasCoordinates && (
                                                                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                                                                        <Globe className="h-3 w-3 text-muted-foreground" />
                                                                        <span>{point.latitude}, {point.longitude}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Latitude */}
                                                    <TableCell className="py-3.5 px-4 font-mono text-xs font-bold text-foreground">
                                                        {point.latitude ? (
                                                            <Badge variant="outline" className="bg-muted/40 font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg border-border/80">
                                                                {point.latitude}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground italic">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Longitude */}
                                                    <TableCell className="py-3.5 px-4 font-mono text-xs font-bold text-foreground">
                                                        {point.longitude ? (
                                                            <Badge variant="outline" className="bg-muted/40 font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg border-border/80">
                                                                {point.longitude}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground italic">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {mapUrl && (
                                                                <a
                                                                    href={mapUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title="Open in Google Maps"
                                                                    className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all shadow-2xs"
                                                                >
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                </a>
                                                            )}
                                                            <Button
                                                                onClick={() => handleView(point)}
                                                                size="sm"
                                                                title={t("view")}
                                                                className="h-8 w-8 bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl p-0 shadow-2xs active:scale-95 transition-all"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleEdit(point)}
                                                                size="sm"
                                                                title={t("edit")}
                                                                className="h-8 w-8 bg-amber-500/10 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl p-0 shadow-2xs active:scale-95 transition-all"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                onClick={() => confirmDelete(point.id)}
                                                                size="sm"
                                                                title={t("delete")}
                                                                className="h-8 w-8 bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white rounded-xl p-0 shadow-2xs active:scale-95 transition-all"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-muted-foreground font-medium">
                        <div>
                            {t("showing_x_to_y_of_z", {
                                from: toLocaleNumber(filteredPoints.length === 0 ? 0 : startIndex + 1, shortCode),
                                to: toLocaleNumber(Math.min(startIndex + itemsPerPage, filteredPoints.length), shortCode),
                                total: toLocaleNumber(filteredPoints.length, shortCode),
                            })}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="h-8 w-8 p-0 rounded-xl bg-background border-border text-foreground shadow-2xs disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 min-w-[32px] px-2 rounded-xl text-xs font-bold transition-all",
                                        currentPage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md"
                                            : "bg-background text-muted-foreground hover:text-foreground border border-border/80"
                                    )}
                                >
                                    {toLocaleNumber(page, shortCode)}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="h-8 w-8 p-0 rounded-xl bg-background border-border text-foreground shadow-2xs disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pickup Point Interactive Map Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
                    {/* Modal Gradient Header */}
                    <DialogHeader className="p-6 bg-gradient-to-r from-[#FF9800] via-[#8B5CF6] to-[#6366F1] text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-white/20 border border-white/30 text-white backdrop-blur-md">
                                <Map className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-white text-lg sm:text-xl font-black tracking-tight">
                                    {isViewing ? t("view_pickup_point") : isEditing ? t("edit_pickup_point") : t("add_pickup_point")}
                                </DialogTitle>
                                <p className="text-white/90 text-xs font-medium mt-0.5">
                                    {isViewing ? t("pickup_point_details") : t("manage_transit_location_details")}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Modal Body */}
                    <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto custom-scrollbar">
                        {/* Point Name Input */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                                <span>{t("pickup_point_name")}</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formState.name}
                                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                readOnly={isViewing}
                                className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-bold"
                                placeholder={t("pickup_point_name_placeholder")}
                            />
                        </div>

                        {/* Coordinates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                                    <Compass className="h-3.5 w-3.5 text-primary" />
                                    <span>{t("latitude")}</span>
                                </Label>
                                <Input
                                    value={formState.latitude}
                                    onChange={(e) => setFormState({ ...formState, latitude: e.target.value })}
                                    readOnly={isViewing}
                                    className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-mono font-bold"
                                    placeholder="23.810300"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                                    <Compass className="h-3.5 w-3.5 text-primary" />
                                    <span>{t("longitude")}</span>
                                </Label>
                                <Input
                                    value={formState.longitude}
                                    onChange={(e) => setFormState({ ...formState, longitude: e.target.value })}
                                    readOnly={isViewing}
                                    className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-mono font-bold"
                                    placeholder="90.412500"
                                />
                            </div>
                        </div>

                        {/* Interactive OpenStreetMap Container */}
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-primary" />
                                    <span>{t("select_location_on_map")}</span>
                                </Label>
                                {!isViewing && (
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                        {t("click_map_to_set_coordinates")}
                                    </span>
                                )}
                            </div>
                            <div
                                id="pickup-map-container"
                                className="w-full h-[260px] bg-muted/40 rounded-2xl border border-border overflow-hidden relative shadow-inner"
                            >
                                <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">
                                    {t("loading_map")}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <DialogFooter className="p-4 sm:p-6 bg-muted/30 border-t border-border flex flex-col sm:flex-row sm:justify-end gap-2.5">
                        <Button
                            onClick={() => setIsModalOpen(false)}
                            variant="outline"
                            className="h-10 px-6 rounded-xl border-border text-xs font-bold"
                        >
                            {isViewing ? t("close") : t("cancel")}
                        </Button>
                        {!isViewing && (
                            <Button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="h-10 px-8 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#4f46e5] text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all gap-2"
                            >
                                <span>{saving ? t("saving") : isEditing ? t("save_changes") : t("create_point")}</span>
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-black tracking-tight text-foreground">
                            {t("delete")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {t("delete_pickup_point_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-border text-xs font-bold">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                        >
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
