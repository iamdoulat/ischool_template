"use client";

import { useState, useEffect } from "react";
import {
    Bell, CheckCheck, Trash2, RefreshCw, ChevronLeft, ChevronRight, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import api from "@/lib/api";

interface NotificationItem {
    id: number;
    title: string;
    body: string;
    type?: string;
    is_read: boolean;
    created_at: string;
}

export default function UserNotificationsPage() {
    const { t } = useTranslation();
    const { toast } = useToast();

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "read">("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [fromItem, setFromItem] = useState(0);
    const [toItem, setToItem] = useState(0);
    const perPage = 20;

    // Selection & Modal
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [viewingNotif, setViewingNotif] = useState<NotificationItem | null>(null);

    useEffect(() => {
        fetchNotifications(currentPage, activeFilter);
    }, [currentPage, activeFilter]);

    const fetchNotifications = async (page: number = 1, filter: string = "all") => {
        try {
            setLoading(true);
            const res = await api.get(`/notifications?page=${page}&limit=${perPage}`);
            
            const paginatedData = res.data?.data;
            const list: NotificationItem[] = paginatedData?.data || paginatedData || [];

            // Pagination metadata
            setCurrentPage(paginatedData?.current_page || 1);
            setLastPage(paginatedData?.last_page || 1);
            setTotalItems(paginatedData?.total || list.length);
            setFromItem(paginatedData?.from || (list.length > 0 ? 1 : 0));
            setToItem(paginatedData?.to || list.length);

            setNotifications(list);
            setSelectedIds([]);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filter: "all" | "unread" | "read") => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };

    const handleOpenView = (notif: NotificationItem) => {
        setViewingNotif(notif);
        if (!notif.is_read) {
            markAsRead(notif.id);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            setActionLoading(true);
            await api.post("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            toast({ title: "All notifications marked as read" });
        } catch (error) {
            console.error("Failed to mark all as read", error);
        } finally {
            setActionLoading(false);
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            setSelectedIds((prev) => prev.filter((item) => item !== id));
            toast({ title: "Notification deleted" });
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredNotifications.map((n) => n.id));
        }
    };

    const toggleSelectOne = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Bulk actions
    const handleBulkMarkAsRead = async () => {
        if (selectedIds.length === 0) return;
        try {
            setActionLoading(true);
            await api.post("/notifications/bulk-read", { ids: selectedIds });
            setNotifications((prev) =>
                prev.map((n) => (selectedIds.includes(n.id) ? { ...n, is_read: true } : n))
            );
            setSelectedIds([]);
            toast({ title: `${selectedIds.length} notification(s) marked as read` });
        } catch (error) {
            console.error("Failed bulk mark read", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        try {
            setActionLoading(true);
            await api.post("/notifications/bulk-delete", { ids: selectedIds });
            setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
            setSelectedIds([]);
            toast({ title: "Selected notification(s) deleted" });
            fetchNotifications(currentPage, activeFilter);
        } catch (error) {
            console.error("Failed bulk delete", error);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredNotifications = notifications.filter((n) => {
        if (activeFilter === "unread") return !n.is_read;
        if (activeFilter === "read") return n.is_read;
        return true;
    });

    const unreadCount = notifications.filter((n) => !n.is_read).length;
    const isAllSelected = filteredNotifications.length > 0 && selectedIds.length === filteredNotifications.length;

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 animate-in fade-in duration-300">
            {/* Notification Card */}
            <Card className="border shadow-sm overflow-hidden pt-0">
                {/* Fully top filled gradient header from #FEF4E7 to #EFF0FC */}
                <CardHeader className="flex flex-row items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FEF4E7] to-[#EFF0FC] dark:from-[#29221a] dark:to-[#1a1b2d] border-b">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Bell className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-lg font-bold tracking-tight text-foreground leading-none">
                                {t("notifications") || "Notifications"}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">
                                {totalItems} Notification{totalItems !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={markAllAsRead}
                            disabled={actionLoading}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-xs h-9 px-4"
                        >
                            <CheckCheck className="h-4 w-4" />
                            {t("mark_all_as_read") || "Mark All as Read"}
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchNotifications(currentPage, activeFilter)}
                            title="Refresh"
                            className="h-9 w-9 rounded-xl bg-background/80"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`} />
                        </Button>
                    </div>
                </CardHeader>

                {/* Toolbar Filter & Bulk Action Row */}
                <div className="p-4 bg-background border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Filter Buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant={activeFilter === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFilterChange("all")}
                            className={`rounded-xl text-xs font-bold ${
                                activeFilter === "all" ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0" : ""
                            }`}
                        >
                            All ({notifications.length})
                        </Button>
                        <Button
                            variant={activeFilter === "unread" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFilterChange("unread")}
                            className={`rounded-xl text-xs font-bold ${
                                activeFilter === "unread" ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0" : ""
                            }`}
                        >
                            Unread ({unreadCount})
                        </Button>
                        <Button
                            variant={activeFilter === "read" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFilterChange("read")}
                            className={`rounded-xl text-xs font-bold ${
                                activeFilter === "read" ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0" : ""
                            }`}
                        >
                            Read ({notifications.length - unreadCount})
                        </Button>
                    </div>

                    {/* Bulk Action Controls */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in duration-200">
                            <span className="text-xs font-semibold text-muted-foreground mr-1">
                                {selectedIds.length} Selected
                            </span>

                            <Button
                                size="sm"
                                onClick={handleBulkMarkAsRead}
                                disabled={actionLoading}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white font-bold rounded-xl text-xs h-8 px-3 shadow-sm"
                            >
                                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                                Mark Read
                            </Button>

                            <Button
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={actionLoading}
                                className="bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 text-white font-bold rounded-xl text-xs h-8 px-3 shadow-sm"
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Delete All
                            </Button>
                        </div>
                    )}
                </div>

                {/* Sub-header for Select All Checkbox */}
                <div className="bg-muted/20 px-4 py-2.5 border-b border-border flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={toggleSelectAll}
                            id="select-all"
                        />
                        <label htmlFor="select-all" className="cursor-pointer font-bold select-none text-foreground">
                            Select All
                        </label>
                    </div>

                    <span>Showing 20 items per page</span>
                </div>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                            <span>Loading notifications...</span>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3 italic">
                            <Bell className="h-10 w-10 opacity-20" />
                            <span>No notifications found in this view.</span>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredNotifications.map((notif) => {
                                const isSelected = selectedIds.includes(notif.id);
                                return (
                                    <div
                                        key={notif.id}
                                        className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                                            isSelected
                                                ? "bg-primary/10 dark:bg-primary/20"
                                                : !notif.is_read
                                                ? "bg-primary/5 dark:bg-primary/10 font-medium"
                                                : "hover:bg-accent/40"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelectOne(notif.id)}
                                                className="mt-1"
                                            />

                                            <div
                                                className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                                                    !notif.is_read ? "bg-primary animate-pulse" : "bg-transparent border border-muted-foreground/30"
                                                }`}
                                            />

                                            <div className="space-y-1 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="text-sm font-bold text-foreground leading-tight cursor-pointer hover:text-primary transition-colors" onClick={() => handleOpenView(notif)}>
                                                        {notif.title}
                                                    </h4>
                                                    {notif.type && (
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">
                                                            {notif.type}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-2">
                                                    {notif.body}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/70 font-semibold pt-1">
                                                    {new Date(notif.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Button
                                                size="icon"
                                                onClick={() => handleOpenView(notif)}
                                                className="h-8 w-8 bg-gradient-to-r from-sky-400 to-blue-500 hover:opacity-90 text-white border-0 shadow-sm rounded-lg"
                                                title="View Notification"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>

                                            {!notif.is_read && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="h-8 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white font-bold text-xs px-3 rounded-lg shadow-sm border-0"
                                                >
                                                    Mark Read
                                                </Button>
                                            )}

                                            <Button
                                                size="icon"
                                                onClick={() => deleteNotification(notif.id)}
                                                className="h-8 w-8 bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 text-white border-0 shadow-sm rounded-lg"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>

                {/* Pagination Footer */}
                <div className="bg-muted/20 border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-black tracking-wider text-muted-foreground/70 uppercase">
                    <span>
                        SHOWING {fromItem} TO {toItem} OF {totalItems} NOTIFICATIONS
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={currentPage <= 1 || loading}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className="h-8 w-8 rounded-full border border-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors shadow-sm"
                            title="Previous"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: lastPage || 1 }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setCurrentPage(p)}
                                    className={`h-8 w-8 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                        p === currentPage
                                            ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-indigo-200/50"
                                            : "border border-muted/40 hover:bg-muted text-muted-foreground"
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            disabled={currentPage >= (lastPage || 1) || loading}
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, lastPage))}
                            className="h-8 w-8 rounded-full border border-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors shadow-sm"
                            title="Next"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </Card>

            {/* View Notification Dialog Modal */}
            <Dialog open={!!viewingNotif} onOpenChange={() => setViewingNotif(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            Notification Details
                        </DialogTitle>
                    </DialogHeader>
                    {viewingNotif && (
                        <div className="space-y-4 py-2 text-xs">
                            <div className="flex items-center justify-between gap-2 border-b pb-3">
                                <div>
                                    <h3 className="font-bold text-base text-foreground">{viewingNotif.title}</h3>
                                    <p className="text-[10px] text-muted-foreground font-semibold pt-0.5">
                                        {new Date(viewingNotif.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {viewingNotif.type && (
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30 shrink-0">
                                        {viewingNotif.type}
                                    </Badge>
                                )}
                            </div>
                            <div>
                                <span className="font-semibold text-muted-foreground uppercase text-[10px] block mb-1">Message Content</span>
                                <div className="p-3.5 rounded-xl bg-muted/40 text-foreground text-xs leading-relaxed whitespace-pre-wrap border border-border">
                                    {viewingNotif.body}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewingNotif(null)} className="rounded-xl">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
