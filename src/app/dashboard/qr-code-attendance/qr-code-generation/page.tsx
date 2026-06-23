"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  QrCode, Loader2, Search, Download, Printer, CheckCircle, AlertCircle, Trash2, Plus,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  role: string;
  admission_no?: string;
  staff_id?: string;
  has_qr: boolean;
  qr_code: string | null;
}

const QR_API_BASE = "https://api.qrserver.com/v1/create-qr-code/";

function getQrImageUrl(qrCode: string, size = 200): string {
  const data = JSON.stringify({ qr_code: qrCode });
  return `${QR_API_BASE}?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function PageHeaderSkeleton() {
  return (
    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gray-200 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-40 rounded bg-gray-200 animate-pulse" />
            <div className="h-2 w-64 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
      <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
        <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              {[...Array(6)].map((_, i) => (
                <TableHead key={i}><div className="h-3 w-16 rounded bg-gray-200 animate-pulse" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(6)].map((_, j) => (
                  <TableCell key={j}><div className="h-3 w-20 rounded bg-gray-100 animate-pulse" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function QrCodeGenerationPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { t } = useTranslation();

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch);
      if (roleFilter !== "all") params.set("role", roleFilter);
      const res = await api.get(`/smart-attendance/users?${params}`);
      if (res.data?.success) setUsers(res.data.data);
    } catch {
      toast.error(t("failed_to_load_users"));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const generateQr = async (userId: number) => {
    setProcessingId(userId);
    try {
      const res = await api.post("/smart-attendance/generate-qr", { user_id: userId });
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("failed_to_generate_qr_code"));
    } finally {
      setProcessingId(null);
    }
  };

  const deleteQr = async (userId: number) => {
    setProcessingId(userId);
    try {
      const res = await api.post("/smart-attendance/delete-qr", { user_id: userId });
      if (res.data?.success) {
        toast.success(res.data.message);
        setDeleteId(null);
        fetchUsers();
      }
    } catch {
      toast.error(t("failed_to_delete_qr_code"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownload = (qrCode: string, name: string) => {
    const url = getQrImageUrl(qrCode, 500);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${name.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  const handlePrint = (qrCode: string, name: string) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const imgSrc = getQrImageUrl(qrCode, 300);
    win.document.write(`
      <html><head><title>QR Code - ${name}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;gap:16px}
      img{max-width:300px}.label{font-size:18px;font-weight:600;color:#333}.sub{font-size:14px;color:#666}</style></head>
      <body>
        <img src="${imgSrc}" alt="QR Code" />
        <div class="label">${name}</div>
        <div class="sub">QR: ${qrCode}</div>
        <button onclick="window.print()" style="padding:12px 32px;font-size:16px;cursor:pointer">${t("print")}</button>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      {loading ? (
        <PageHeaderSkeleton />
      ) : (
        <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 max-w-4xl">
          <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                <QrCode className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("qr_code_management")}</CardTitle>
                <p className="text-[11px] text-gray-500 mt-1">{t("generate_qr_codes_description")}</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Users table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 max-w-4xl">
          <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
              <QrCode className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-bold text-slate-800 leading-none">{t("users")}</CardTitle>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t("search_by_name_id")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-[11px]"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-8 w-32 text-[11px]">
                <SelectValue placeholder={t("all_roles")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_roles")}</SelectItem>
                <SelectItem value="Student">{t("students")}</SelectItem>
                <SelectItem value="Teacher">{t("teachers")}</SelectItem>
                <SelectItem value="Staff">{t("staff")}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="text-[11px]">{t("name")}</TableHead>
                  <TableHead className="text-[11px]">{t("role")}</TableHead>
                  <TableHead className="text-[11px]">{t("id_admission_no")}</TableHead>
                  <TableHead className="text-[11px]">{t("qr_code")}</TableHead>
                  <TableHead className="text-[11px]">{t("status")}</TableHead>
                  <TableHead className="text-[11px] text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {searchQuery ? t("no_matching_users_found") : t("type_search_to_find_users")}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50/60 transition-colors">
                      <TableCell className="text-sm font-medium">{user.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">{user.role}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {user.role === "Student" ? user.admission_no || "-" : user.staff_id || "-"}
                      </TableCell>
                      <TableCell>
                        {user.has_qr && user.qr_code ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={getQrImageUrl(user.qr_code, 80)}
                              alt={t("qr")}
                              className="w-10 h-10 rounded border border-slate-200"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(user.qr_code!, user.name)} title={t("download_qr_code")} className="h-7 w-7 p-0">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.has_qr ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium">
                            <CheckCircle className="h-3 w-3" /> {t("generated")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-medium">
                            <AlertCircle className="h-3 w-3" /> {t("not_generated")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.has_qr && user.qr_code && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handlePrint(user.qr_code!, user.name)} title={t("print_qr_code")} className="h-7 w-7 p-0">
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                              <AlertDialog open={deleteId === user.id} onOpenChange={(o) => setDeleteId(o ? user.id : null)}>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0" title={t("delete_qr_code")}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t("delete_qr_code_confirm")}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("delete_qr_code_description")} <strong>{user.name}</strong>. {t("can_generate_new_after_deletion")}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteId(null)}>{t("cancel")}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteQr(user.id)} className="bg-red-600 hover:bg-red-700">
                                      {processingId === user.id ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("deleting")}</>
                                      ) : (
                                        <>{t("delete")}</>
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          {!user.has_qr && (
                            <Button variant="default" size="sm" onClick={() => generateQr(user.id)} disabled={processingId === user.id}
                              className="h-7 px-3 text-[11px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white">
                              {processingId === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                              {t("generate")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}