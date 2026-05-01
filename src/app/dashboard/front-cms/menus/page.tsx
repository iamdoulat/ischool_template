"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    Menu,
    Pencil,
    Trash2,
    Loader2,
    X,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface MenuItem {
    id: number;
    title: string;
    is_external: boolean;
    open_new_tab: boolean;
    url?: string;
    page?: string;
    type: string;
    parent_id?: number | null;
    order: number;
    sub_items?: MenuItem[];
}

export default function MenusPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<"main" | "bottom">("main");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [pages, setPages] = useState<{ id: number, title: string, url: string }[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "https://ischool.com";
    
    const [formData, setFormData] = useState({
        title: "",
        is_external: false,
        open_new_tab: false,
        url: "",
        page: "",
        column: 1,
    });

    // Delete confirmation state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchMenus();
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const res = await api.get("front-cms/pages");
            if (res.data?.status === "Success") {
                setPages(res.data.data);
            }
        } catch (error) {
            console.error("Failed to load pages", error);
        }
    };

    const fetchMenus = async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/menus");
            if (res.data?.status === "Success") {
                setMenus(res.data.data);
            }
        } catch (error) {
            toast("error", "Failed to load menus");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title) {
            toast("error", "Title is required");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                type: activeTab
            };

            let res;
            if (editingId) {
                res = await api.put(`front-cms/menus/${editingId}`, payload);
            } else {
                res = await api.post("front-cms/menus", payload);
            }

            if (res.data?.status === "Success" || res.status === 201 || res.status === 200) {
                toast("success", editingId ? "Menu item updated successfully" : "Menu item added successfully");
                handleCancelEdit();
                fetchMenus();
            }
        } catch (error) {
            toast("error", "Failed to save menu");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item: MenuItem) => {
        setEditingId(item.id);
        setActiveTab(item.type as "main" | "bottom");
        setFormData({
            title: item.title,
            is_external: item.is_external,
            open_new_tab: item.open_new_tab,
            url: item.url || "",
            page: item.page || "",
            column: (item as any).column || 1,
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            title: "",
            is_external: false,
            open_new_tab: false,
            url: "",
            page: "",
            column: 1,
        });
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        
        setDeleting(true);
        try {
            const res = await api.delete(`front-cms/menus/${deleteId}`);
            if (res.data?.status === "Success") {
                toast("success", "Menu item deleted successfully");
                setIsDeleteOpen(false);
                setDeleteId(null);
                fetchMenus();
            }
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Failed to delete menu item");
        } finally {
            setDeleting(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        const currentActiveMenus = [...menus.filter(m => m.type === activeTab)];
        const [reorderedItem] = currentActiveMenus.splice(sourceIndex, 1);
        currentActiveMenus.splice(destinationIndex, 0, reorderedItem);

        const updatedMenus = currentActiveMenus.map((item, index) => ({
            ...item,
            order: index
        }));

        setMenus(prev => {
            const others = prev.filter(m => m.type !== activeTab);
            return [...others, ...updatedMenus];
        });

        try {
            await api.post('front-cms/menus/reorder', {
                items: updatedMenus.map(item => ({ id: item.id, order: item.order }))
            });
        } catch (error) {
            toast("error", "Failed to save menu order");
            fetchMenus();
        }
    };

    const currentMenus = menus.filter(m => m.type === activeTab).sort((a, b) => a.order - b.order);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Add Menu Item Form */}
                <div className="w-full lg:w-[450px]">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800 tracking-tight">{editingId ? "Edit Menu Item" : "Add Menu Item"}</h2>
                        </div>
                        <div className="p-4 space-y-5">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Menu Item <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder=""
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-1">
                                    <Label className="text-[11px] font-medium text-gray-600">External URL</Label>
                                    <Switch 
                                        checked={formData.is_external}
                                        onCheckedChange={(v) => setFormData({ ...formData, is_external: v })}
                                        className="data-[state=checked]:bg-indigo-500 scale-75" 
                                    />
                                </div>
                                <div className="flex items-center justify-between py-1">
                                    <Label className="text-[11px] font-medium text-gray-600">Open in New Tab</Label>
                                    <Switch 
                                        checked={formData.open_new_tab}
                                        onCheckedChange={(v) => setFormData({ ...formData, open_new_tab: v })}
                                        className="data-[state=checked]:bg-indigo-500 scale-75" 
                                    />
                                </div>
                            </div>

                            {formData.is_external ? (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">External URL Address</Label>
                                    <Input
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                        placeholder="https://"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Pages</Label>
                                    <Select value={formData.page} onValueChange={(v) => setFormData({ ...formData, page: v })}>
                                        <SelectTrigger className="h-9 border-gray-200 text-[11px] shadow-none rounded">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pages.map((p) => (
                                                <SelectItem key={p.id} value={p.url || p.title.toLowerCase().replace(/\s+/g, '-')}>
                                                    {p.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {activeTab === "bottom" && (
                                <div className="space-y-1.5 pt-2 border-t border-gray-50 mt-2">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Footer Column</Label>
                                    <Select 
                                        value={formData.column.toString()} 
                                        onValueChange={(v) => setFormData({ ...formData, column: parseInt(v) })}
                                    >
                                        <SelectTrigger className="h-9 border-gray-200 text-[11px] shadow-none rounded">
                                            <SelectValue placeholder="Select Column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Column 1 (Logo & Bio)</SelectItem>
                                            <SelectItem value="2">Column 2 (Quick Links)</SelectItem>
                                            <SelectItem value="3">Column 3 (Information)</SelectItem>
                                            <SelectItem value="4">Column 4 (Contact Us)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                {editingId && (
                                    <Button 
                                        onClick={handleCancelEdit}
                                        variant="outline"
                                        className="h-9 px-4 text-[11px] font-bold uppercase transition-all rounded shadow-sm"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-8 h-9 text-[11px] font-bold uppercase transition-all rounded-full shadow-md"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Update" : "Save")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Menu Item List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                            <h1 className="text-sm font-medium text-gray-800 tracking-tight">Menu Item List</h1>
                            <div className="flex bg-gray-50/50 p-1 rounded-lg border border-gray-100">
                                <Button
                                    onClick={() => setActiveTab("main")}
                                    className={cn(
                                        "h-7 px-4 text-[9px] font-bold uppercase rounded-md transition-all shadow-none",
                                        activeTab === "main" ? "bg-gradient-to-r from-orange-400 to-indigo-500 text-white shadow-sm" : "bg-transparent text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    Main Menu
                                </Button>
                                <Button
                                    onClick={() => setActiveTab("bottom")}
                                    className={cn(
                                        "h-7 px-4 text-[9px] font-bold uppercase rounded-md transition-all shadow-none",
                                        activeTab === "bottom" ? "bg-gradient-to-r from-orange-400 to-indigo-500 text-white shadow-sm" : "bg-transparent text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    Bottom Menu
                                </Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                            </div>
                        ) : (
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="menu-list">
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="space-y-1.5 pt-2"
                                        >
                                            {currentMenus.length === 0 ? (
                                                <div className="text-center text-sm text-gray-400 py-4">No menu items found.</div>
                                            ) : (
                                                currentMenus.map((item, index) => (
                                                    <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className="space-y-1.5"
                                                            >
                                                                <div className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded group hover:border-indigo-100 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <div {...provided.dragHandleProps}>
                                                                            <Menu className="h-4 w-4 text-gray-400 group-hover:text-indigo-400 transition-colors cursor-move" />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{item.title}</span>
                                                                                {activeTab === "bottom" && (
                                                                                    <span className="text-[7px] font-extrabold text-white bg-indigo-500 px-1.5 py-0.5 rounded uppercase">Col {item.column}</span>
                                                                                )}
                                                                            </div>
                                                                             <span className="text-[8px] text-indigo-400 font-medium lowercase truncate max-w-[200px]">
                                                                                 {item.is_external ? item.url : `${frontendUrl.replace(/\/$/, '')}/${(item.page || '').replace(/^\//, '')}`}
                                                                             </span>
                                                                        </div>
                                                                        {!!item.is_external && <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">External</span>}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 transition-opacity">
                                                                        <Button size="icon" variant="ghost" onClick={() => handleEdit(item)} className="h-7 w-7 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-[10px] shadow-md border-0">
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="h-7 w-7 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-[10px] shadow-md border-0">
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Sub Items */}
                                                                {item.sub_items && item.sub_items.length > 0 && (
                                                                    <div className="pl-8 space-y-1.5 border-l-2 border-indigo-50 ml-2">
                                                                        {item.sub_items.map((sub) => (
                                                                            <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50/50 border border-gray-100 rounded group hover:border-indigo-100 hover:bg-white transition-all">
                                                                                 <div className="flex items-center gap-3">
                                                                                     <Menu className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-300 transition-colors cursor-move" />
                                                                                     <div className="flex flex-col">
                                                                                         <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">{sub.title}</span>
                                                                                         <span className="text-[7px] text-indigo-400 font-medium lowercase truncate max-w-[150px]">
                                                                                             {sub.is_external ? sub.url : `${frontendUrl.replace(/\/$/, '')}/${(sub.page || '').replace(/^\//, '')}`}
                                                                                         </span>
                                                                                     </div>
                                                                                 </div>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(sub)} className="h-6 w-6 bg-[#6366f1] text-white rounded-[8px] shadow-sm">
                                                                                        <Pencil className="h-2.5 w-2.5" />
                                                                                    </Button>
                                                                                    <Button size="icon" variant="ghost" onClick={() => handleDelete(sub.id)} className="h-6 w-6 bg-[#ef4444] text-white rounded-[8px] shadow-sm">
                                                                                        <Trash2 className="h-2.5 w-2.5" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}

                        {/* Footer / Pagination Placeholder */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50">
                            <div>
                                Showing {currentMenus.length} entries
                            </div>
                            <div className="flex gap-2 items-center">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[12px] bg-gray-50/50 border border-gray-100 hover:bg-gray-100 text-gray-500">
                                    <ChevronLeft className="h-3.5 w-3.5 stroke-[3px]" />
                                </Button>
                                <Button variant="default" size="icon" className="h-8 w-8 p-0 bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white border-0 font-bold text-[12px] rounded-[12px] shadow-md">
                                    1
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[12px] bg-gray-50/50 border border-gray-100 hover:bg-gray-100 text-gray-500">
                                    <ChevronRight className="h-3.5 w-3.5 stroke-[3px]" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <DeleteConfirmationDialog 
                isOpen={isDeleteOpen} 
                onClose={() => setIsDeleteOpen(false)} 
                onConfirm={confirmDelete}
                loading={deleting}
            />
        </div>
    );
}

function DeleteConfirmationDialog({ 
    isOpen, 
    onClose, 
    onConfirm, 
    loading 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    onConfirm: () => void, 
    loading: boolean 
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] border-none shadow-2xl p-0 overflow-hidden rounded-2xl">
                <div className="bg-gradient-to-br from-red-50 to-white p-6">
                    <DialogHeader className="space-y-3">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-center text-lg font-bold text-gray-800">
                            Confirm Deletion
                        </DialogTitle>
                        <p className="text-center text-sm text-gray-500 leading-relaxed">
                            Are you sure you want to delete this menu item? This action cannot be undone.
                        </p>
                    </DialogHeader>
                </div>
                
                <DialogFooter className="bg-gray-50/80 p-4 gap-3 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 h-10 font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Deleting...
                            </>
                        ) : (
                            "Delete Now"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
