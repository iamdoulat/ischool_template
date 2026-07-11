/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Eye,
    ArrowUpDown,
    MapPin,
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
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const TABLE_COLS = 4;

function SkeletonRows({ rows = 6, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div className="h-3 rounded bg-gray-200/70 animate-pulse" style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function PickupPointPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [points, setPoints] = useState<PickupPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPoint, setCurrentPoint] = useState<PickupPoint | null>(null);
    const [isViewing, setIsViewing] = useState(false);
    const [formState, setFormState] = useState({ name: "", latitude: "", longitude: "" });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/transport/pickup-points");
            setPoints(response.data.data);
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
        if (!formState.name) {
            toast("error", t("pickup_point_name_required"));
            return;
        }
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

    const handleDelete = async (id: number) => {
        if (!confirm(t("delete_pickup_point_confirmation"))) return;
        try {
            await api.delete(`/transport/pickup-points/${id}`);
            tt.success("pickup_point_deleted_successfully");
            fetchData();
        } catch (error) {
            tt.error("failed_to_delete_pickup_point");
        }
    };

    const resetForm = () => {
        setFormState({ name: "", latitude: "", longitude: "" });
        setIsEditing(false);
        setIsViewing(false);
        setCurrentPoint(null);
    };

    // Leaflet Map Initialization
    useEffect(() => {
        if (isModalOpen) {
            const loadLeaflet = () => {
                const mapElement = document.getElementById('map-container');
                if (!mapElement || !window.L) return;
                if ((mapElement as any)._leaflet_id) {
                    (mapElement as any)._leaflet_id = null;
                }
                const initialLat = parseFloat(formState.latitude) || 23.8103;
                const initialLng = parseFloat(formState.longitude) || 90.4125;
                const map = window.L.map('map-container').setView([initialLat, initialLng], 13);
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                const marker = window.L.marker([initialLat, initialLng], { draggable: !isViewing }).addTo(map);
                if (!isViewing) {
                    map.on('click', (e: any) => {
                        const { lat, lng } = e.latlng;
                        marker.setLatLng([lat, lng]);
                        setFormState(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
                    });
                    marker.on('dragend', (e: any) => {
                        const { lat, lng } = e.target.getLatLng();
                        setFormState(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
                    });
                }
                setTimeout(() => map.invalidateSize(), 100);
            };
            if (!window.L) {
                if (!document.getElementById('leaflet-css')) {
                    const link = document.createElement('link');
                    link.id = 'leaflet-css';
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    document.head.appendChild(link);
                }
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                script.async = true;
                script.onload = loadLeaflet;
                document.head.appendChild(script);
            } else {
                loadLeaflet();
            }
        }
    }, [isModalOpen]);

    const filteredPoints = points.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filteredPoints.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredPoints.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const dataToExport = points.map(p => ({ 'Name': p.name, 'Latitude': p.latitude, 'Longitude': p.longitude }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PickupPoints");
        XLSX.writeFile(wb, "transport_pickup_points.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Transport Pickup Points List", 14, 15);
        autoTable(doc, { head: [['Name', 'Latitude', 'Longitude']], body: points.map(p => [p.name, p.latitude, p.longitude]), startY: 20 });
        doc.save("transport_pickup_points.pdf");
    };

    const copyToClipboard = () => {
        const text = points.map(p => `${p.name} (${p.latitude}, ${p.longitude})`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const toolbarActions = [
        { Icon: Copy, onClick: copyToClipboard, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: exportToExcel, title: t("excel") },
        { Icon: FileText, onClick: exportToPDF, title: t("pdf") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
        { Icon: Columns, onClick: () => {}, title: t("columns") },
    ];

    return (
        <div className="space-y-6">
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <MapPin className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("pickup_point_list")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{points.length} {points.length === 1 ? t("pickup_point").toLowerCase() : t("pickup_points").toLowerCase()}</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="ml-auto h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                        <Plus className="h-4 w-4" /> {t("add")}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <Input placeholder={t("search")} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="h-9 text-xs w-full md:w-64" />
                        <div className="flex items-center gap-2">
                            <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(parseInt(val)); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[70px] h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                {toolbarActions.map((action, i) => (
                                    <Button key={i} variant="ghost" size="icon" onClick={action.onClick} title={action.title} className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <action.Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[700px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("name")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">{t("latitude")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">{t("longitude")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows rows={6} cols={TABLE_COLS} />
                                ) : paginatedData.length === 0 ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_pickup_points_found")}</TableCell></TableRow>
                                ) : paginatedData.map((point) => (
                                    <TableRow key={point.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                        <TableCell className="py-3 text-gray-700 font-medium">{point.name}</TableCell>
                                        <TableCell className="py-3 text-right text-gray-500">{point.latitude}</TableCell>
                                        <TableCell className="py-3 text-right text-gray-500">{point.longitude}</TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button onClick={() => handleView(point)} size="sm" className="h-7 w-7 bg-blue-500 hover:bg-blue-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Eye className="h-4 w-4" /></Button>
                                                <Button onClick={() => handleEdit(point)} size="sm" className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Pencil className="h-4 w-4" /></Button>
                                                <Button onClick={() => handleDelete(point.id)} size="sm" className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                        <div>{t("showing_x_to_y_of_z", { from: filteredPoints.length === 0 ? 0 : startIndex + 1, to: Math.min(startIndex + itemsPerPage, filteredPoints.length), total: filteredPoints.length })}</div>
                        <div className="flex gap-1 items-center">
                            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button key={page} size="sm" onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all", currentPage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>{page}</Button>
                            ))}
                            <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pickup Point Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl bg-white">
                    <DialogHeader className="p-6 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                        <DialogTitle className="text-white text-xl font-bold tracking-tight">
                            {isViewing ? t("view_pickup_point") : isEditing ? t("edit_pickup_point") : t("add_pickup_point")}
                        </DialogTitle>
                        <p className="text-indigo-100 text-xs font-medium opacity-90">{isViewing ? t("pickup_point_details") : t("manage_transit_location_details")}</p>
                    </DialogHeader>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("pickup_point_name")} <span className="text-red-500">*</span></Label>
                            <Input value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} readOnly={isViewing} className="h-10 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs" placeholder={t("pickup_point_name_placeholder")} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("latitude")}</Label>
                                <Input value={formState.latitude} onChange={(e) => setFormState({ ...formState, latitude: e.target.value })} readOnly={isViewing} className="h-10 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs" placeholder="23.2195..." />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("longitude")}</Label>
                                <Input value={formState.longitude} onChange={(e) => setFormState({ ...formState, longitude: e.target.value })} readOnly={isViewing} className="h-10 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs" placeholder="79.9206..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("select_location_on_map")}</Label>
                            <div id="map-container" className="w-full h-[250px] bg-gray-100 rounded-lg border border-gray-100 overflow-hidden z-0">
                                <div className="flex items-center justify-center h-full text-gray-400 text-[10px] italic">{t("loading_map")}</div>
                            </div>
                            <p className="text-[10px] text-gray-400">{t("click_map_to_set_coordinates")}</p>
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-gray-50/50 block sm:flex sm:justify-end gap-3 border-t border-gray-100">
                        <Button onClick={() => setIsModalOpen(false)} variant="outline" className="w-full sm:w-auto px-6 h-10 text-[11px] font-bold uppercase rounded-lg border-gray-200 hover:bg-gray-100 transition-all shadow-sm">{isViewing ? t("close") : t("cancel")}</Button>
                        {!isViewing && (
                            <Button onClick={handleSubmit} className="w-full sm:w-auto px-10 h-10 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] font-bold uppercase shadow-lg active:scale-95 transition-all">{isEditing ? t("save_changes") : t("create_point")}</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
