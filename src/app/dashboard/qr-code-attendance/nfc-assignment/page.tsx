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
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Smartphone, Loader2, Search, Trash2, CheckCircle, AlertCircle, Plus, Nfc,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  role: string;
  admission_no?: string;
  staff_id?: string;
  has_nfc: boolean;
  nfc_uid: string | null;
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
        <div className="h-9 w-32 rounded-full bg-gray-200 animate-pulse" />
      </CardHeader>
    </Card>
  );
}

function SearchSkeleton() {
  return (
    <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
      <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
        <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
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

export default function NfcAssignmentPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [assigningId, setAssigningId] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [nfcUid, setNfcUid] = useState("");

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

  const openAssignDialog = (user: User) => {
    setSelectedUser(user);
    setNfcUid("");
    setDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedUser || !nfcUid.trim()) {
      toast.error(t("please_enter_nfc_tag_uid"));
      return;
    }
    setAssigningId(selectedUser.id);
    try {
      const res = await api.post("/smart-attendance/assign-nfc", {
        user_id: selectedUser.id,
        nfc_uid: nfcUid.trim(),
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setDialogOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || t("failed_to_assign_nfc_tag");
      toast.error(msg);
    } finally {
      setAssigningId(null);
    }
  };

  const handleRemove = async (userId: number) => {
    try {
      const res = await api.post("/smart-attendance/remove-nfc", { user_id: userId });
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch {
      toast.error(t("failed_to_remove_nfc_tag"));
    }
  };

  const simulateNfcScan = () => {
    const uid = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join(":").toUpperCase();
    setNfcUid(uid);
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
                <Nfc className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("nfc_tag_assignment")}</CardTitle>
                <p className="text-[11px] text-gray-500 mt-1">{t("assign_nfc_tags_description")}</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Users table */}
      {loading ? (
        <SearchSkeleton />
      ) : (
        <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 max-w-4xl">
          <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
              <Smartphone className="h-4 w-4" />
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
                  <TableHead className="text-[11px]">{t("nfc_uid")}</TableHead>
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
                    <TableRow key={user.id} className="hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                      <TableCell className="text-sm font-medium">{user.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">{user.role}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {user.role === "Student" ? user.admission_no || "-" : user.staff_id || "-"}
                      </TableCell>
                      <TableCell>
                        {user.nfc_uid ? (
                          <code className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">{user.nfc_uid}</code>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.has_nfc ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium">
                            <CheckCircle className="h-3 w-3" /> {t("assigned")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-medium">
                            <AlertCircle className="h-3 w-3" /> {t("not_assigned")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.has_nfc ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemove(user.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-[11px]"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> {t("remove")}
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openAssignDialog(user)}
                              className="h-7 px-3 text-[11px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white"
                            >
                              <Plus className="h-3.5 w-3.5" /> {t("assign")}
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

      {/* Assign Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Nfc className="h-5 w-5 text-purple-600" />
              {t("assign_nfc_tag")}
            </DialogTitle>
            <DialogDescription>
              {t("enter_nfc_tag_uid_for")} <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("nfc_tag_uid")}</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 04:5A:6B:C2:1D:3E:8F:12"
                  value={nfcUid}
                  onChange={(e) => setNfcUid(e.target.value)}
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={simulateNfcScan}
                  title={t("simulate_nfc_scan")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("tap_simulate_description")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("cancel")}</Button>
            <Button
              onClick={handleAssign}
              disabled={assigningId !== null || !nfcUid.trim()}
              className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white"
            >
              {assigningId !== null ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("assigning")}</>
              ) : (
                <>{t("assign_tag")}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}