"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Printer,
    FileText,
    Table as TableIcon,
    FileDown,
    Download,
    Columns,
    ChevronDown,
    Pencil,
    Trash2,
    Copy,
    FileSpreadsheet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
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
import { Checkbox } from "@/components/ui/checkbox";

const tabs = [
    { id: "purpose", label: "Purpose", endpoint: "/front-office-purposes" },
    { id: "complaint-type", label: "Complaint Type", endpoint: "/complaint-types" },
    { id: "source", label: "Source", endpoint: "/front-office-sources" },
    { id: "reference", label: "Reference", endpoint: "/front-office-references" },
];

interface TabItem {
    id: number;
    name: string;
    description: string | null;
}

export default function SetupFrontOfficePage() {
    const { toast } = useToast();
    const [activeTabId, setActiveTabId] = useState("purpose");
    const [items, setItems] = useState<TabItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: ""
    });

    const activeTab = tabs.find(t => t.id === activeTabId)!;
    const currentTabLabel = activeTab.label;

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get(activeTab.endpoint, {
                params: {
                    search: searchQuery
                }
            });
            setItems(response.data.data.data || response.data.data);
            setSelectedIds([]);
        } catch (error) {
            console.error("Error fetching items:", error);
            toast("error", `Failed to load ${currentTabLabel} list`);
        } finally {
            setLoading(false);
        }
    }, [activeTab.endpoint, searchQuery, toast, currentTabLabel]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && editId) {
                await api.put(`${activeTab.endpoint}/${editId}`, formData);
                toast("success", `${currentTabLabel} updated successfully`);
            } else {
                await api.post(activeTab.endpoint, formData);
                toast("success", `${currentTabLabel} added successfully`);
            }
            fetchItems();
            resetForm();
        } catch (error: any) {
            console.error("Error saving item:", error);
            const message = error.response?.data?.message || `Failed to save ${currentTabLabel}`;
            toast("error", message);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`${activeTab.endpoint}/${deleteId}`);
            toast("success", `${currentTabLabel} deleted successfully`);
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchItems();
        } catch (error) {
            console.error("Error deleting item:", error);
            toast("error", `Failed to delete ${currentTabLabel}`);
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post(`${activeTab.endpoint}/bulk-delete`, { ids: selectedIds });
            toast("success", `${selectedIds.length} items deleted successfully`);
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchItems();
        } catch (error) {
            console.error("Error bulk deleting items:", error);
            toast("error", `Failed to delete selected ${currentTabLabel} list`);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: ""
        });
        setIsEdit(false);
        setEditId(null);
    };

    const startEdit = (item: TabItem) => {
        setIsEdit(true);
        setEditId(item.id);
        setFormData({
            name: item.name,
            description: item.description || ""
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map(p => p.id));
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleCopy = () => {
        const text = items.map(p => `${p.name}\t${p.description}`).join("\n");
        navigator.clipboard.writeText(text);
        toast("success", "Copied to clipboard");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Column 1: Vertical Tabs */}
                <div className="md:col-span-2">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden sticky top-6">
                        <div className="flex flex-col">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTabId(tab.id);
                                        setSearchQuery("");
                                        resetForm();
                                    }}
                                    className={cn(
                                        "flex items-center px-4 py-3.5 text-sm font-semibold transition-all border-b border-muted/30 last:border-0",
                                        activeTabId === tab.id
                                            ? "bg-muted/50 text-[#FFA500] border-l-4 border-l-[#FFA500]"
                                            : "text-muted-foreground hover:bg-muted/20 hover:text-slate-900 border-l-4 border-l-transparent"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Column 2: Add Form */}
                <div className="md:col-span-4">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm sticky top-6">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">
                                {isEdit ? `Edit ${currentTabLabel}` : `Add ${currentTabLabel}`}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                        {currentTabLabel} <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50 transition-all hover:border-indigo-200 text-slate-700 font-medium"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Description</label>
                                    <Textarea
                                        className="min-h-[120px] rounded-lg bg-muted/30 border-muted/50 resize-none font-medium text-slate-700"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    {isEdit && (
                                        <Button type="button" variant="outline" className="h-10 px-6" onClick={resetForm}>
                                            Cancel
                                        </Button>
                                    )}
                                    <Button type="submit" variant="gradient" className="h-10 px-8">
                                        Save
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Column 3: List Table */}
                <div className="md:col-span-6">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">{currentTabLabel} List</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search"
                                        className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 mr-4">
                                        <span className="text-sm font-semibold text-muted-foreground">50</span>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex gap-1">
                                        <IconButton icon={Printer} onClick={() => window.print()} />
                                        <IconButton icon={Copy} onClick={handleCopy} />
                                        <IconButton icon={FileSpreadsheet} onClick={() => toast("success", "Exporting to Excel...")} />
                                        <IconButton icon={FileText} onClick={() => toast("success", "Exporting to PDF...")} />
                                        <IconButton icon={Download} onClick={() => toast("success", "Downloading...")} />
                                        <IconButton icon={Columns} />
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto rounded-xl border border-muted/50">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-4 w-10 border-b border-muted/50">
                                                <Checkbox
                                                    checked={selectedIds.length === items.length && items.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <Th>{currentTabLabel}</Th>
                                            <Th>Description</Th>
                                            <th className="px-4 py-4 border-b border-muted/50 text-right">
                                                <div className="flex justify-end pr-1 text-slate-700">
                                                    {selectedIds.length > 0 ? (
                                                        <button
                                                            onClick={() => setIsBulkDeleteDialogOpen(true)}
                                                            className="bg-red-500 hover:bg-red-600 p-1.5 rounded transition-colors"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 text-white" />
                                                        </button>
                                                    ) : (
                                                        "ACTION"
                                                    )}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/30">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                                            </tr>
                                        ) : items.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No data found</td>
                                            </tr>
                                        ) : (
                                            items.map((item) => (
                                                <tr key={item.id} className={cn(
                                                    "hover:bg-muted/10 transition-colors group",
                                                    selectedIds.includes(item.id) && "bg-muted/30"
                                                )}>
                                                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                                                        <Checkbox
                                                            checked={selectedIds.includes(item.id)}
                                                            onCheckedChange={() => toggleSelect(item.id)}
                                                        />
                                                    </td>
                                                    <Td className="font-semibold text-slate-700">{item.name}</Td>
                                                    <Td className="text-slate-600 font-medium truncate max-w-[200px]">{item.description || "-"}</Td>
                                                    <Td className="text-right">
                                                        <div className="flex justify-end gap-1 px-2">
                                                            <ActionBtn icon={Pencil} className="bg-[#4F39F6]" onClick={() => startEdit(item)} />
                                                            <ActionBtn icon={Trash2} className="bg-red-500" onClick={() => { setDeleteId(item.id); setIsDeleteDialogOpen(true); }} />
                                                        </div>
                                                    </Td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    Showing {items.length} entries
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                        <ChevronDown className="h-4 w-4 rotate-90" />
                                    </Button>
                                    <Button className="h-8 w-8 rounded-lg border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-br from-[#FF9800] to-[#4F39F6]">1</Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                        <ChevronDown className="h-4 w-4 -rotate-90" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this {currentTabLabel} entry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setDeleteId(null); setIsDeleteDialogOpen(false); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bulk Delete Entries</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {selectedIds.length} selected items? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsBulkDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600">Delete Selected</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-4 border-b border-muted/50 whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-4 py-4 text-sm whitespace-nowrap", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick }: { icon: any, onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm"
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}

function ActionBtn({ icon: Icon, className, onClick }: { icon: any, className?: string, onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn("p-1.5 text-white rounded transition-all hover:shadow-md active:scale-90", className)}
        >
            <Icon className="h-3 w-3" />
        </button>
    );
}
