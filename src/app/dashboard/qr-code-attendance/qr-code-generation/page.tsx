"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
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

function getQrData(qrCode: string): string {
  return JSON.stringify({ qr_code: qrCode });
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

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
      toast.error("Failed to load users");
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
      toast.error(err.response?.data?.message || "Failed to generate QR code");
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
      toast.error("Failed to delete QR code");
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
        <button onclick="window.print()" style="padding:12px 32px;font-size:16px;cursor:pointer">Print</button>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <QrCode className="h-6 w-6 text-indigo-600" /> QR Code Management
          </h2>
          <p className="text-muted-foreground text-sm">
            Generate one-time QR codes for students, teachers, and staff. Delete to regenerate.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Users</CardTitle>
          <CardDescription>Search users and manage their QR attendance codes.</CardDescription>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, ID..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Student">Students</SelectItem>
                <SelectItem value="Teacher">Teachers</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>ID / Admission No</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {searchQuery ? "No matching users found." : "Type a search to find users."}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">{user.role}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.role === "Student" ? user.admission_no || "-" : user.staff_id || "-"}
                    </TableCell>
                    <TableCell>
                      {user.has_qr && user.qr_code ? (
                        <div className="flex items-center gap-2">
                          <img src={getQrImageUrl(user.qr_code, 80)}
                            alt="QR" className="w-10 h-10 rounded border border-slate-200"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <Button variant="ghost" size="sm"
                            onClick={() => handleDownload(user.qr_code!, user.name)}
                            title="Download QR Code">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.has_qr ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium">
                          <CheckCircle className="h-3 w-3" /> Generated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-medium">
                          <AlertCircle className="h-3 w-3" /> Not Generated
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user.has_qr && user.qr_code && (
                          <>
                            <Button variant="ghost" size="sm"
                              onClick={() => handlePrint(user.qr_code!, user.name)}
                              title="Print QR Code">
                              <Printer className="h-4 w-4" />
                            </Button>
                            <AlertDialog open={deleteId === user.id} onOpenChange={(o) => setDeleteId(o ? user.id : null)}>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Delete QR Code">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete QR Code?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the QR code for <strong>{user.name}</strong>. 
                                    You can generate a new one after deletion.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteQr(user.id)}
                                    className="bg-red-600 hover:bg-red-700">
                                    {processingId === user.id ? (
                                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                                    ) : (
                                      "Delete"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        {!user.has_qr && (
                          <Button variant="default" size="sm"
                            onClick={() => generateQr(user.id)}
                            disabled={processingId === user.id}>
                            {processingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                            Generate
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

      {/* Empty state when no user selected but list is filtered */}
      {users.length > 0 && !users.some(u => u.has_qr) && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <QrCode className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No QR codes generated yet</p>
            <p className="text-sm mt-1">Click the <strong>Generate</strong> button next to a user to create their QR code.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
