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

export default function NfcAssignmentPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [assigningId, setAssigningId] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [nfcUid, setNfcUid] = useState("");

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

  const openAssignDialog = (user: User) => {
    setSelectedUser(user);
    setNfcUid("");
    setDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedUser || !nfcUid.trim()) {
      toast.error("Please enter an NFC tag UID");
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
      const msg = err.response?.data?.message || "Failed to assign NFC tag";
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
      toast.error("Failed to remove NFC tag");
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-purple-600" /> NFC Tag Assignment
          </h2>
          <p className="text-muted-foreground text-sm">
            Assign NFC tags to students, teachers, and staff for tap-and-go attendance.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Users</CardTitle>
          <CardDescription>
            Search users and assign their NFC tag UIDs.
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
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
                <TableHead>NFC UID</TableHead>
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
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.role === "Student" ? user.admission_no || "-" : user.staff_id || "-"}
                    </TableCell>
                    <TableCell>
                      {user.nfc_uid ? (
                        <code className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">
                          {user.nfc_uid}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.has_nfc ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium">
                          <CheckCircle className="h-3 w-3" /> Assigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-medium">
                          <AlertCircle className="h-3 w-3" /> Not Assigned
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
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" /> Remove
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openAssignDialog(user)}
                          >
                            <Plus className="h-4 w-4" /> Assign Tag
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Nfc className="h-5 w-5 text-purple-600" />
              Assign NFC Tag
            </DialogTitle>
            <DialogDescription>
              Enter the NFC tag UID for <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">NFC Tag UID</label>
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
                  title="Simulate NFC Scan"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tap "Simulate" to generate a random UID for testing, or enter one manually.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assigningId !== null || !nfcUid.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {assigningId !== null ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...</>
              ) : (
                "Assign Tag"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
