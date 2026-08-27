"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  QrCode, Loader2, Search, Download, Printer, CheckCircle, AlertCircle, Trash2, Plus,
  Sparkles, CheckCircle2, RefreshCw, FileSpreadsheet, Copy, ShieldCheck,
  Eye, Zap, Users, CreditCard, Check, Layers
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";

interface UserItem {
  id: number;
  name: string;
  email?: string;
  role: string;
  avatar: string | null;
  admission_no?: string;
  staff_id?: string;
  roll_no?: string;
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

export default function QrCodeGenerationPage() {
  const getImageUrl = useImageUrl();
  const { t } = useTranslation();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

  // ID Card Badge Preview Modal
  const [previewUser, setPreviewUser] = useState<UserItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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
      toast.error(t("failed_to_load_users") || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Generate QR code for a single user
  const generateQr = async (userId: number) => {
    setProcessingId(userId);
    try {
      const res = await api.post("/smart-attendance/generate-qr", { user_id: userId });
      if (res.data?.success) {
        toast.success(res.data.message || "QR code generated successfully!");
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("failed_to_generate_qr_code"));
    } finally {
      setProcessingId(null);
    }
  };

  // Bulk generate for all missing users
  const handleBulkGenerate = async () => {
    const missing = users.filter(u => !u.has_qr);
    if (missing.length === 0) {
      toast.info("All registered users already have QR codes assigned.");
      return;
    }
    setBulkGenerating(true);
    let successCount = 0;
    try {
      for (const u of missing) {
        await api.post("/smart-attendance/generate-qr", { user_id: u.id }).catch(() => {});
        successCount++;
      }
      toast.success(`Generated QR codes for ${successCount} users!`);
      fetchUsers();
    } catch {
      toast.error("Failed during bulk QR generation");
    } finally {
      setBulkGenerating(false);
    }
  };

  const confirmDelete = (user: UserItem) => {
    setUserToDelete(user);
    setDeleteId(user.id);
  };

  const deleteQr = async () => {
    if (!deleteId) return;
    setProcessingId(deleteId);
    try {
      const res = await api.post("/smart-attendance/delete-qr", { user_id: deleteId });
      if (res.data?.success) {
        toast.success(res.data.message || "QR Code deleted");
        setDeleteId(null);
        setUserToDelete(null);
        if (previewOpen) setPreviewOpen(false);
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
    toast.success(`Downloaded QR Code for ${name}`);
  };

  const handlePrintBadge = (user: UserItem) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const imgSrc = getQrImageUrl(user.qr_code || String(user.id), 260);
    const avatarSrc = user.avatar ? getImageUrl(user.avatar) : "";

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Institutional ID Badge - ${user.name}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9; padding: 20px; }
            .badge-card {
              width: 320px; height: 480px; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
              border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; text-align: center;
              padding: 24px; position: relative; overflow: hidden;
            }
            .header-banner {
              position: absolute; top: 0; left: 0; right: 0; height: 80px;
              background: linear-gradient(135deg, #FF9800, #6366F1);
            }
            .avatar {
              width: 76px; height: 76px; border-radius: 50%; border: 4px solid white; object-fit: cover;
              margin-top: 24px; position: relative; z-index: 10; background: #e0e7ff;
            }
            .name { font-size: 16px; font-weight: 800; color: #1e293b; margin-top: 10px; }
            .role { font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; }
            .details { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500; }
            .qr-container { margin-top: 14px; padding: 8px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
            .qr-img { width: 140px; height: 140px; }
            .footer-text { font-size: 10px; color: #94a3b8; margin-top: auto; font-family: monospace; }
            @media print {
              body { background: white; padding: 0; }
              .badge-card { box-shadow: none; border: 1px solid #ccc; page-break-inside: avoid; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="badge-card">
            <div class="header-banner"></div>
            ${avatarSrc ? `<img src="${avatarSrc}" class="avatar" alt="" />` : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;font-weight:bold;color:#4f46e5;font-size:24px;">${user.name.charAt(0)}</div>`}
            <h2 class="name">${user.name}</h2>
            <p class="role">${user.role}</p>
            <p class="details">${user.role === 'Student' ? `Admission: ${user.admission_no || user.roll_no || 'N/A'}` : `Employee ID: ${user.staff_id || 'N/A'}`}</p>
            <div class="qr-container">
              <img src="${imgSrc}" class="qr-img" alt="QR Code" />
            </div>
            <p class="footer-text">SCAN FOR ATTENDANCE & ACCESS</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Batch Print All Badges
  const handleBatchPrintAll = () => {
    const validUsers = users.filter(u => u.has_qr && u.qr_code);
    if (validUsers.length === 0) {
      toast.error("No generated QR codes available to print.");
      return;
    }
    const win = window.open("", "_blank");
    if (!win) return;

    const cardsHtml = validUsers.map(user => {
      const imgSrc = getQrImageUrl(user.qr_code!, 180);
      const avatarSrc = user.avatar ? getImageUrl(user.avatar) : "";
      return `
        <div class="badge-card">
          <div class="header-banner"></div>
          ${avatarSrc ? `<img src="${avatarSrc}" class="avatar" alt="" />` : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;font-weight:bold;color:#4f46e5;font-size:20px;">${user.name.charAt(0)}</div>`}
          <h2 class="name">${user.name}</h2>
          <p class="role">${user.role}</p>
          <p class="details">${user.role === 'Student' ? `Roll/Adm: ${user.admission_no || user.roll_no || '-'}` : `ID: ${user.staff_id || '-'}`}</p>
          <div class="qr-container">
            <img src="${imgSrc}" class="qr-img" alt="QR Code" />
          </div>
          <p class="footer-text">SMART ATTENDANCE BADGE</p>
        </div>
      `;
    }).join("");

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Institutional QR Badges - Batch Print</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            body { background: white; padding: 20px; }
            .grid-container {
              display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px;
            }
            .badge-card {
              height: 360px; background: white; border-radius: 12px; border: 1px solid #cbd5e1;
              display: flex; flex-direction: column; align-items: center; text-align: center;
              padding: 16px; position: relative; overflow: hidden; page-break-inside: avoid;
            }
            .header-banner { position: absolute; top: 0; left: 0; right: 0; height: 50px; background: linear-gradient(135deg, #FF9800, #6366F1); }
            .avatar { width: 56px; height: 56px; border-radius: 50%; border: 3px solid white; object-fit: cover; margin-top: 16px; position: relative; z-index: 10; background: #e0e7ff; }
            .name { font-size: 13px; font-weight: 800; color: #1e293b; margin-top: 6px; }
            .role { font-size: 10px; font-weight: 700; color: #6366f1; text-transform: uppercase; }
            .details { font-size: 11px; color: #64748b; margin-top: 2px; }
            .qr-container { margin-top: 8px; padding: 4px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .qr-img { width: 110px; height: 110px; }
            .footer-text { font-size: 9px; color: #94a3b8; margin-top: auto; font-family: monospace; }
            @media print {
              body { padding: 0; }
              .badge-card { border: 1px solid #999; }
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${cardsHtml}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Filtered users by status
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (statusFilter === "generated") return user.has_qr;
      if (statusFilter === "not_generated") return !user.has_qr;
      return true;
    });
  }, [users, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const generated = users.filter(u => u.has_qr).length;
    const pending = total - generated;
    const percentage = total > 0 ? Math.round((generated / total) * 100) : 0;
    return { total, generated, pending, percentage };
  }, [users]);

  // Export handlers
  const handleCopyTable = () => {
    const header = "Name\tRole\tID/Admission\tQR Code\tStatus\n";
    const rows = filteredUsers.map(u =>
      `${u.name}\t${u.role}\t${u.admission_no || u.staff_id || '-'}\t${u.qr_code || '-'}\t${u.has_qr ? 'Generated' : 'Pending'}`
    ).join("\n");
    navigator.clipboard.writeText(header + rows);
    toast.success("Registry table copied to clipboard!");
  };

  const handleExportCsv = () => {
    const header = "Name,Role,ID/Admission,QR Code,Status\n";
    const rows = filteredUsers.map(u =>
      `"${u.name}","${u.role}","${u.admission_no || u.staff_id || '-'}","${u.qr_code || '-'}","${u.has_qr ? 'Generated' : 'Pending'}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qr_codes_registry_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success("CSV file downloaded!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-4 sm:py-6 font-sans">
      {/* Master Top Header Banner */}
      <div className="rounded-2xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F9FE] to-[#EFF0FD]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
              <QrCode className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                QR Code Generation & ID Badging
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Automated Credentials
                </span>
              </h1>
              <p className="text-[11px] text-gray-500 mt-1">
                Generate, download, and print secure encrypted optical QR codes for contactless student and staff attendance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchPrintAll}
              className="h-8 text-xs font-semibold gap-1.5 border-slate-200 bg-white"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              Batch Print Badges
            </Button>
            <Button
              size="sm"
              onClick={handleBulkGenerate}
              disabled={bulkGenerating || stats.pending === 0}
              className="h-8 text-xs font-bold gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
            >
              {bulkGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Generate All Missing ({stats.pending})
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Directory</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{stats.total}</h3>
            <span className="text-[10px] text-slate-500">Students & Staff</span>
          </div>
          <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generated Badges</p>
            <h3 className="text-xl font-black text-emerald-600 mt-0.5">{stats.generated}</h3>
            <span className="text-[10px] text-emerald-600 font-medium">{stats.percentage}% Completed</span>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Codes</p>
            <h3 className="text-xl font-black text-amber-600 mt-0.5">{stats.pending}</h3>
            <span className="text-[10px] text-amber-600 font-medium">Ready to Generate</span>
          </div>
          <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <AlertCircle className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Encryption Standard</p>
            <h3 className="text-xl font-black text-purple-600 mt-0.5">UUID v4</h3>
            <span className="text-[10px] text-purple-600 font-medium">ISO 18004 Matrix</span>
          </div>
          <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <ShieldCheck className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-bold text-slate-800">
              User Credential Directory ({filteredUsers.length})
            </CardTitle>
          </div>

          {/* Filters & Export Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search name, roll, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-white border-slate-200"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-8 w-28 text-xs bg-white border-slate-200">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Student">Students</SelectItem>
                <SelectItem value="Teacher">Teachers</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs bg-white border-slate-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="generated">Generated Only</SelectItem>
                <SelectItem value="not_generated">Pending Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Toolbar Buttons */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
              <button
                type="button"
                onClick={handleCopyTable}
                className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                title="Copy Table"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                title="Export CSV"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="p-1.5 hover:bg-slate-100 text-slate-600 transition-all"
                title="Print Directory"
              >
                <Printer className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate-600 py-3">Student / Staff</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Role</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Admission / Staff ID</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">QR Code Preview</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Status</TableHead>
                <TableHead className="text-xs font-bold text-slate-600 text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-500" />
                    <p className="text-xs font-medium">Loading user credential directory...</p>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">No matching users found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try changing your search keywords or role filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="hover:bg-indigo-50/30 transition-colors group"
                  >
                    {/* User Profile */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-slate-200">
                          <AvatarImage src={getImageUrl(user.avatar)} className="object-cover" />
                          <AvatarFallback className="text-xs font-bold text-slate-600 bg-slate-100">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-snug">{user.name}</p>
                          <p className="text-[10px] text-slate-400">{user.email || 'Institutional User'}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold border",
                        user.role === 'Student'
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : user.role === 'Teacher'
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                      )}>
                        {user.role}
                      </span>
                    </TableCell>

                    {/* ID / Admission No */}
                    <TableCell className="text-xs font-mono font-medium text-slate-600">
                      {user.role === "Student" ? (user.admission_no || user.roll_no || "—") : (user.staff_id || "—")}
                    </TableCell>

                    {/* QR Code Matrix */}
                    <TableCell>
                      {user.has_qr && user.qr_code ? (
                        <div className="flex items-center gap-2">
                          <div
                            onClick={() => { setPreviewUser(user); setPreviewOpen(true); }}
                            className="cursor-pointer group/qr relative p-1 bg-white border border-slate-200 rounded-lg shadow-xs hover:border-indigo-400 transition-all"
                            title="Click to expand Badge Preview"
                          >
                            <img
                              src={getQrImageUrl(user.qr_code, 100)}
                              alt="QR Code"
                              className="w-9 h-9 rounded object-contain"
                            />
                            <span className="absolute inset-0 bg-indigo-900/60 rounded-lg flex items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-opacity text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-slate-500 font-medium">
                              {user.qr_code.slice(0, 8)}...
                            </span>
                            <span className="text-[9px] text-emerald-600 font-bold">Active</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not Generated</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {user.has_qr ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active QR Badge
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          <AlertCircle className="h-3 w-3 text-amber-600" /> Pending QR
                        </span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        {user.has_qr && user.qr_code ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setPreviewUser(user); setPreviewOpen(true); }}
                              className="h-7 px-2 text-xs border-slate-200 hover:bg-slate-100 text-slate-700"
                              title="Preview ID Badge"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1 text-indigo-600" /> Badge
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(user.qr_code!, user.name)}
                              className="h-7 w-7 p-0 border-slate-200 text-slate-600 hover:text-indigo-600"
                              title="Download QR PNG"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintBadge(user)}
                              className="h-7 w-7 p-0 border-slate-200 text-slate-600 hover:text-indigo-600"
                              title="Print ID Card"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(user)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 w-7 p-0"
                              title="Delete QR Code"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => generateQr(user.id)}
                            disabled={processingId === user.id}
                            className="h-7 px-3 text-[11px] font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-xs gap-1"
                          >
                            {processingId === user.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                            Generate QR
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

      {/* ID Badge Card Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-slate-50 border border-slate-200">
          <DialogHeader className="text-center">
            <DialogTitle className="text-base font-bold text-slate-800">
              Institutional ID Badge Card
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Digital identity badge for scanning and verification
            </DialogDescription>
          </DialogHeader>

          {previewUser && (
            <div className="flex flex-col items-center justify-center py-2">
              {/* Virtual Badge Card */}
              <div className="w-full max-w-[280px] bg-white rounded-2xl border border-slate-200 shadow-md p-5 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#FF9800] to-[#6366F1]" />

                <Avatar className="h-16 w-16 border-4 border-white shadow-md relative z-10 mt-2">
                  <AvatarImage src={getImageUrl(previewUser.avatar)} className="object-cover" />
                  <AvatarFallback className="text-xl font-bold bg-indigo-100 text-indigo-700">
                    {previewUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <h3 className="text-sm font-bold text-slate-900 mt-2 leading-snug">{previewUser.name}</h3>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{previewUser.role}</span>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {previewUser.role === 'Student' ? `Roll/Adm: ${previewUser.admission_no || previewUser.roll_no || 'N/A'}` : `ID: ${previewUser.staff_id || 'N/A'}`}
                </p>

                {previewUser.qr_code && (
                  <div className="mt-3 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <img
                      src={getQrImageUrl(previewUser.qr_code, 220)}
                      alt="QR Badge"
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                )}

                <p className="text-[9px] text-slate-400 font-mono mt-3">
                  UUID: {previewUser.qr_code ? previewUser.qr_code.slice(0, 16) : 'N/A'}...
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2 flex flex-col sm:flex-row">
            {previewUser && previewUser.qr_code && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(previewUser.qr_code!, previewUser.name)}
                  className="text-xs font-semibold flex-1 gap-1 border-slate-200"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" /> PNG
                </Button>
                <Button
                  size="sm"
                  onClick={() => handlePrintBadge(previewUser)}
                  className="text-xs font-bold flex-1 gap-1 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Badge
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-800">
              Revoke QR Code?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete the QR code for <strong>{userToDelete?.name}</strong>? Existing printed badges with this QR code will no longer scan for attendance until regenerated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteQr}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {processingId !== null ? "Revoking..." : "Revoke QR"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}