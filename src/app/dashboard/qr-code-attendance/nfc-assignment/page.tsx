"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/language-provider";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Smartphone, Loader2, Search, Trash2, CheckCircle, AlertCircle, Plus,
  SmartphoneNfc, CreditCard, Sparkles, RefreshCw, FileSpreadsheet,
  Printer, Copy, Download, Radio, ShieldCheck, CheckCircle2, User,
  Zap, ArrowRight, Check, Edit
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useImageUrl } from "@/lib/image-url";
import { cn, toLocaleNumber } from "@/lib/utils";

interface UserItem {
  id: number;
  name: string;
  email?: string;
  role: string;
  avatar: string | null;
  admission_no?: string;
  staff_id?: string;
  roll_no?: string;
  has_nfc: boolean;
  nfc_uid: string | null;
  has_face?: boolean;
  has_qr?: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function NfcAssignmentPage() {
  const getImageUrl = useImageUrl();
  const { t, language } = useLanguage();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigningId, setAssigningId] = useState<number | null>(null);

  // Assignment Modal State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [nfcUid, setNfcUid] = useState("");
  const [isNfcReading, setIsNfcReading] = useState(false);

  // Delete Alert Confirmation State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch users directory
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch);
      if (roleFilter !== "all") params.set("role", roleFilter);
      const res = await api.get(`/smart-attendance/users?${params}`);
      if (res.data?.success) {
        setUsers(res.data.data);
      }
    } catch {
      toast.error(t("failed_to_load_users") || "Failed to load users directory");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Web NFC Reader for direct hardware tag scanning
  const startWebNfcReader = useCallback(() => {
    if (typeof window === 'undefined' || !('NDEFReader' in window)) return;
    setIsNfcReading(true);
    let ndef: any;
    try {
      ndef = new (window as any).NDEFReader();
      ndef.scan().then(() => {
        ndef.onreading = (event: any) => {
          const serialNumber: string = event.serialNumber;
          if (serialNumber) {
            const formatted = serialNumber.toUpperCase();
            setNfcUid(formatted);
            toast.success(t("nfc_tag_detected_toast", { uid: formatted }) || `NFC Tag Detected: ${formatted}`);
            try {
              const audio = new Audio('/sounds/success.mp3');
              audio.play().catch(() => {});
            } catch {}
          }
        };
      }).catch((err: any) => {
        console.warn("NFC Reader scan canceled or not allowed", err);
        setIsNfcReading(false);
      });
    } catch {
      setIsNfcReading(false);
    }
  }, [t]);

  const openAssignDialog = (user: UserItem) => {
    setSelectedUser(user);
    setNfcUid(user.nfc_uid || "");
    setDialogOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
      startWebNfcReader();
    }, 150);
  };

  const handleAssign = async () => {
    if (!selectedUser || !nfcUid.trim()) {
      toast.error(t("please_enter_nfc_tag_uid") || "Please enter or scan an NFC Tag UID");
      return;
    }
    setAssigningId(selectedUser.id);
    try {
      const res = await api.post("/smart-attendance/assign-nfc", {
        user_id: selectedUser.id,
        nfc_uid: nfcUid.trim(),
      });
      if (res.data?.success) {
        toast.success(res.data.message || t("nfc_tag_assigned_success", { name: selectedUser.name }) || `NFC Tag assigned to ${selectedUser.name}`);
        setDialogOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || t("failed_to_assign_nfc_tag") || "Failed to assign NFC tag";
      toast.error(msg);
    } finally {
      setAssigningId(null);
    }
  };

  const confirmRemove = (user: UserItem) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleRemove = async () => {
    if (!userToDelete) return;
    setRemovingId(userToDelete.id);
    try {
      const res = await api.post("/smart-attendance/remove-nfc", { user_id: userToDelete.id });
      if (res.data?.success) {
        toast.success(res.data.message || t("nfc_tag_removed_success", { name: userToDelete.name }) || `NFC Tag removed for ${userToDelete.name}`);
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("failed_to_remove_nfc_tag") || "Failed to remove NFC tag");
    } finally {
      setRemovingId(null);
    }
  };

  // Generate simulated RFID / NFC UID for testing
  const simulateNfcScan = () => {
    const uid = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
    ).join(":");
    setNfcUid(uid);
    toast.info(t("simulated_rfid_tag_toast", { uid }) || `Simulated RFID Tag: ${uid}`);
  };

  // Filtered users by status
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (statusFilter === "assigned") return user.has_nfc;
      if (statusFilter === "unassigned") return !user.has_nfc;
      return true;
    });
  }, [users, statusFilter]);

  // Overview statistics
  const stats = useMemo(() => {
    const total = users.length;
    const assigned = users.filter(u => u.has_nfc).length;
    const unassigned = total - assigned;
    const percentage = total > 0 ? Math.round((assigned / total) * 100) : 0;
    return { total, assigned, unassigned, percentage };
  }, [users]);

  // Export handlers
  const handleCopy = () => {
    const header = `${t("student_staff_col") || "Name"}\t${t("role_col") || "Role"}\t${t("admission_staff_id_col") || "ID/Admission"}\t${t("nfc_rfid_tag_uid_col") || "NFC UID"}\t${t("assignment_status_col") || "Status"}\n`;
    const rows = filteredUsers.map(u =>
      `${u.name}\t${u.role}\t${u.admission_no || u.staff_id || '-'}\t${u.nfc_uid || '-'}\t${u.has_nfc ? (t("active_card_linked") || 'Assigned') : (t("card_pending") || 'Unassigned')}`
    ).join("\n");
    navigator.clipboard.writeText(header + rows);
    toast.success(t("table_data_copied_toast") || "Table data copied to clipboard!");
  };

  const handleExportCsv = () => {
    const header = `${t("student_staff_col") || "Name"},${t("role_col") || "Role"},${t("admission_staff_id_col") || "ID/Admission"},${t("nfc_rfid_tag_uid_col") || "NFC UID"},${t("assignment_status_col") || "Status"}\n`;
    const rows = filteredUsers.map(u =>
      `"${u.name}","${u.role}","${u.admission_no || u.staff_id || '-'}","${u.nfc_uid || '-'}","${u.has_nfc ? (t("active_card_linked") || 'Assigned') : (t("card_pending") || 'Unassigned')}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nfc_assignment_registry_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success(t("csv_export_downloaded_toast") || "CSV export downloaded!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-4 font-sans pb-12 text-xs">
      {/* Canonical Standalone Edge-to-Edge Header Banner */}
      <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
              <SmartphoneNfc className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                {t("nfc_smart_rfid_card_assignment") || "NFC & Smart RFID Card Assignment"}
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  {t("hardware_access_badge") || "Hardware Access"}
                </span>
              </h1>
              <p className="text-[11px] text-gray-500 mt-1">
                {t("nfc_assignment_header_desc") || "Link MIFARE Classic, NTAG213/215, 125kHz EM4100 RFID & NFC cards to students and staff for contactless tap attendance."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchUsers}
              disabled={loading}
              className="h-8 text-xs font-semibold gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-indigo-600", loading && "animate-spin")} />
              {t("sync_directory_btn") || "Sync Directory"}
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("total_users_stat") || "Total Users"}</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{toLocaleNumber(stats.total, language?.short_code)}</h3>
            <span className="text-[10px] text-slate-500">{t("students_and_staff_label") || "Students & Staff"}</span>
          </div>
          <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <CreditCard className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("assigned_cards_stat") || "Assigned Cards"}</p>
            <h3 className="text-xl font-black text-emerald-600 mt-0.5">{toLocaleNumber(stats.assigned, language?.short_code)}</h3>
            <span className="text-[10px] text-emerald-600 font-medium">
              {t("tagged_percentage", { percent: toLocaleNumber(stats.percentage, language?.short_code) }) || `${toLocaleNumber(stats.percentage, language?.short_code)}% Tagged`}
            </span>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("pending_assignment_stat") || "Pending Assignment"}</p>
            <h3 className="text-xl font-black text-amber-600 mt-0.5">{toLocaleNumber(stats.unassigned, language?.short_code)}</h3>
            <span className="text-[10px] text-amber-600 font-medium">{t("unlinked_cards_label") || "Unlinked Cards"}</span>
          </div>
          <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <AlertCircle className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("nfc_frequency_stat") || "NFC Frequency"}</p>
            <h3 className="text-xl font-black text-purple-600 mt-0.5">13.56 MHz</h3>
            <span className="text-[10px] text-purple-600 font-medium">{t("iso_iec_standard") || "ISO/IEC 14443 Type A"}</span>
          </div>
          <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <Radio className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden bg-white">
        <CardHeader className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <SmartphoneNfc className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-bold text-slate-800">
              {t("card_registry_directory", { count: toLocaleNumber(filteredUsers.length, language?.short_code) }) || `Card Registry Directory (${toLocaleNumber(filteredUsers.length, language?.short_code)})`}
            </CardTitle>
          </div>

          {/* Filters & Export Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder={t("search_name_roll_id_placeholder") || "Search name, roll, or ID..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-white border-slate-200"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-8 w-28 text-xs bg-white border-slate-200">
                <SelectValue placeholder={t("all_roles_filter") || "All Roles"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_roles_filter") || "All Roles"}</SelectItem>
                <SelectItem value="Student">{t("students_role_filter") || "Students"}</SelectItem>
                <SelectItem value="Teacher">{t("teachers_role_filter") || "Teachers"}</SelectItem>
                <SelectItem value="Staff">{t("staff_role_filter") || "Staff"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs bg-white border-slate-200">
                <SelectValue placeholder={t("all_status_filter") || "All Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_status_filter") || "All Status"}</SelectItem>
                <SelectItem value="assigned">{t("assigned_only_filter") || "Assigned Only"}</SelectItem>
                <SelectItem value="unassigned">{t("unassigned_only_filter") || "Unassigned Only"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Toolbar Buttons */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                title={t("copy_table") || "Copy Table"}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                title={t("export_csv") || "Export CSV"}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 hover:bg-slate-100 text-slate-600 transition-all"
                title={t("print_registry") || "Print Registry"}
              >
                <Printer className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="text-xs font-bold text-slate-700 py-3 px-4">{t("student_staff_col") || "Student / Staff"}</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 px-4">{t("role_col") || "Role"}</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 px-4">{t("admission_staff_id_col") || "Admission / Staff ID"}</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 px-4">{t("nfc_rfid_tag_uid_col") || "NFC / RFID Tag UID"}</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 px-4">{t("assignment_status_col") || "Assignment Status"}</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right pr-6">{t("action_col") || "Action"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-500" />
                      <p className="text-xs font-medium">{t("loading_user_registry") || "Loading institutional user registry..."}</p>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">{t("no_matching_users_found") || "No matching users found"}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{t("try_searching_different_name") || "Try searching with a different name or role filter."}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-indigo-50/20 transition-colors group"
                    >
                      {/* User Profile */}
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-slate-200">
                            <AvatarImage src={getImageUrl(user.avatar)} className="object-cover" />
                            <AvatarFallback className="text-xs font-bold text-slate-600 bg-slate-100">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-snug">{user.name}</p>
                            <p className="text-[10px] text-slate-400">{user.email || t("no_email_on_file") || 'No email on file'}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell className="px-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          user.role === 'Student'
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : user.role === 'Teacher'
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          {user.role === 'Student' ? (t("students_role_filter") || user.role) : user.role === 'Teacher' ? (t("teachers_role_filter") || user.role) : user.role}
                        </span>
                      </TableCell>

                      {/* ID / Admission No */}
                      <TableCell className="px-4 text-xs font-mono font-medium text-slate-600">
                        {user.role === "Student" ? toLocaleNumber(user.admission_no || user.roll_no || "—", language?.short_code) : toLocaleNumber(user.staff_id || "—", language?.short_code)}
                      </TableCell>

                      {/* NFC UID */}
                      <TableCell className="px-4">
                        {user.nfc_uid ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                            <CreditCard className="w-3 h-3 text-purple-500" />
                            {user.nfc_uid}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">{t("not_linked") || "Not Linked"}</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-4">
                        {user.has_nfc ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> {t("active_card_linked") || "Active Card Linked"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <AlertCircle className="h-3 w-3 text-amber-600" /> {t("card_pending") || "Card Pending"}
                          </span>
                        )}
                      </TableCell>

                      {/* Actions with Radiant Gradient Buttons */}
                      <TableCell className="text-right pr-6 py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.has_nfc ? (
                            <>
                              <Button
                                type="button"
                                onClick={() => openAssignDialog(user)}
                                className="h-7 w-7 p-0 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs active:scale-95 transition-all border-0"
                                title={t("edit_card_btn") || "Edit Card"}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                onClick={() => confirmRemove(user)}
                                className="h-7 w-7 p-0 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xs active:scale-95 transition-all border-0"
                                title={t("unlink_nfc_card_tooltip") || "Unlink NFC Card"}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => openAssignDialog(user)}
                              className="h-7 px-3 rounded-lg text-[11px] font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-xs active:scale-95 transition-all gap-1 border-0"
                            >
                              <Plus className="h-3.5 w-3.5" /> {t("assign_card_btn") || "Assign Card"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* NFC Card Assignment Modal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
              <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                <SmartphoneNfc className="h-5 w-5" />
              </span>
              {t("assign_nfc_rfid_smart_card_title") || "Assign NFC / RFID Smart Card"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {t("link_institutional_card_desc", { name: selectedUser?.name, role: selectedUser?.role }) || `Link an institutional RFID card or NFC tag to ${selectedUser?.name} (${selectedUser?.role}).`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* User Details Summary Card */}
            {selectedUser && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-slate-200">
                  <AvatarImage src={getImageUrl(selectedUser.avatar)} />
                  <AvatarFallback className="font-bold text-slate-600">
                    {selectedUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{selectedUser.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    {selectedUser.role} • {selectedUser.role === 'Student' ? `${t("admission_staff_id_col") || "Admission No"}: ${toLocaleNumber(selectedUser.admission_no || selectedUser.roll_no || 'N/A', language?.short_code)}` : `${t("admission_staff_id_col") || "Staff ID"}: ${toLocaleNumber(selectedUser.staff_id || 'N/A', language?.short_code)}`}
                  </p>
                </div>
              </div>
            )}

            {/* Live Scan or Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">{t("card_uid_serial_label") || "Card UID / Serial Number"} <span className="text-rose-500">*</span></label>
                {isNfcReading && (
                  <span className="text-[10px] font-bold text-purple-600 animate-pulse flex items-center gap-1">
                    <Radio className="w-3 h-3" /> {t("web_nfc_reader_ready") || "Web NFC Reader Ready"}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder={t("card_uid_input_placeholder") || "e.g. 04:5A:6B:C2:1D:3E:8F or 12345678"}
                  value={nfcUid}
                  onChange={(e) => setNfcUid(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAssign();
                  }}
                  className="font-mono text-xs uppercase bg-white border-slate-200"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={simulateNfcScan}
                  className="text-xs font-semibold shrink-0 border-slate-200 text-purple-700 hover:bg-purple-50"
                  title="Generate test RFID UID"
                >
                  <Zap className="h-3.5 w-3.5 mr-1" /> {t("mock_uid_btn") || "Mock UID"}
                </Button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t("swipe_nfc_hardware_hint") || "Swipe your USB RFID reader or hold an NFC card against your NFC-enabled device to automatically capture the UID."}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="text-xs font-semibold border-slate-200"
            >
              {t("cancel_btn") || "Cancel"}
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assigningId !== null || !nfcUid.trim()}
              className="text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm border-0"
            >
              {assigningId !== null ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> {t("saving_card_btn") || "Saving Card..."}</>
              ) : (
                <><Check className="mr-1.5 h-3.5 w-3.5" /> {t("link_nfc_card_btn") || "Link NFC Card"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete / Unlink Confirmation Alert */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-800">
              {t("unlink_nfc_card_title") || "Unlink NFC Card?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              {t("unlink_nfc_card_desc", { uid: userToDelete?.nfc_uid, name: userToDelete?.name }) || `Are you sure you want to remove the assigned NFC tag (${userToDelete?.nfc_uid}) for ${userToDelete?.name}? They will no longer be able to tap in with this card.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs font-semibold">{t("cancel_btn") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removingId !== null}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {removingId !== null ? (t("unlinking_btn") || "Unlinking...") : (t("unlink_card_btn") || "Unlink Card")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}