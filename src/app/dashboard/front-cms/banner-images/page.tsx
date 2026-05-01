"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ImageIcon, Trash2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Banner {
    id: number;
    title: string | null;
    image_path: string;
}

export default function BannerImagesPage() {
    const { toast } = useToast();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        title: "",
        image: null as File | null
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/banners");
            if (res.data?.status === "Success") {
                setBanners(res.data.data);
            }
        } catch (error) {
            toast("error", "Failed to load banners");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.image) {
            toast("error", "Please select an image");
            return;
        }

        setSaving(true);
        try {
            const data = new FormData();
            data.append("title", formData.title);
            data.append("image", formData.image);

            const res = await api.post("front-cms/banners", data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.data?.status === "Success" || res.status === 201) {
                toast("success", "Banner added successfully");
                setIsDialogOpen(false);
                setFormData({ title: "", image: null });
                fetchBanners();
            }
        } catch (error) {
            toast("error", "Failed to save banner");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this banner?")) return;
        try {
            const res = await api.delete(`front-cms/banners/${id}`);
            if (res.data?.status === "Success") {
                toast("success", "Banner deleted successfully");
                fetchBanners();
            }
        } catch (error) {
            toast("error", "Failed to delete banner");
        }
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                {/* Header Section */}
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <h2 className="text-sm font-semibold text-gray-800 tracking-tight">Banner Images</h2>
                    <Button 
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-5 h-9 font-bold rounded-full shadow-md flex items-center gap-2 tracking-tight"
                    >
                        <Plus className="h-4 w-4 text-white font-bold stroke-[3px]" />
                        Add Images
                    </Button>
                </div>

                {/* Banner Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : banners.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        No banners found.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 py-2">
                        {banners.map((banner) => (
                            <div
                                key={banner.id}
                                className="bg-[#f8f9fa] rounded-xl border border-gray-100 overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300 relative"
                            >
                                {/* Delete Button on Hover */}
                                <button
                                    onClick={() => handleDelete(banner.id)}
                                    className="absolute top-2 right-2 z-10 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                >
                                    <X className="h-3.5 w-3.5 stroke-[3px]" />
                                </button>

                                {/* Image Preview Container */}
                                <div className="h-32 bg-white flex items-center justify-center overflow-hidden relative">
                                    <img 
                                        src={banner.image_path} 
                                        alt={banner.title || "Banner"} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Filename/Title Label */}
                                <div className="bg-white p-2.5 border-t border-gray-50">
                                    <p className="text-[10px] font-bold text-gray-700 uppercase tracking-tight truncate">
                                        {banner.title || "Untitled Banner"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Banner Image</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Title (Optional)</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 shadow-none bg-gray-50/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Image <span className="text-red-500">*</span></Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                                className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 shadow-none bg-gray-50/50 cursor-pointer"
                            />
                            <p className="text-[9px] text-gray-400 font-medium">Recommended: 1920x600px. Max 2MB.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-8 h-9 text-[11px] font-bold uppercase transition-all rounded-full shadow-md"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload Banner"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
