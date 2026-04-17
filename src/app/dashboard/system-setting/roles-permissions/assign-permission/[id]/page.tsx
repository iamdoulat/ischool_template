"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function AssignPermissionPage() {
    const params = useParams();
    const router = useRouter();
    const roleId = params.id;

    const [role, setRole] = useState<any>(null);
    const [permissionsMatrix, setPermissionsMatrix] = useState<any>({});
    const [rolePermissions, setRolePermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [roleRes, matrixRes, rolePermsRes] = await Promise.all([
                    api.get(`/roles/${roleId}`),
                    api.get("/permissions"),
                    api.get(`/roles/${roleId}/permissions`)
                ]);

                setRole(roleRes.data.data);
                setPermissionsMatrix(matrixRes.data.data);
                setRolePermissions(rolePermsRes.data.data);
            } catch (error) {
                console.error("Failed to fetch permission data:", error);
                alert("Failed to load permission data");
            } finally {
                setLoading(false);
            }
        };

        if (roleId) {
            fetchData();
        }
    }, [roleId]);

    const handleCheckboxChange = (permissionName: string, checked: boolean) => {
        if (checked) {
            setRolePermissions(prev => [...prev, permissionName]);
        } else {
            setRolePermissions(prev => prev.filter(p => p !== permissionName));
        }
    };

    const handleToggleAll = (capability: string, checked: boolean) => {
        const allPermNamesForCap: string[] = [];
        Object.values(permissionsMatrix).forEach((features: any) => {
            Object.values(features).forEach((perms: any) => {
                const perm = perms.find((p: any) => p.capability === capability);
                if (perm) {
                    allPermNamesForCap.push(perm.name);
                }
            });
        });

        if (checked) {
            setRolePermissions(prev => {
                const newPerms = new Set([...prev, ...allPermNamesForCap]);
                return Array.from(newPerms);
            });
        } else {
            setRolePermissions(prev => prev.filter(p => !allPermNamesForCap.includes(p)));
        }
    };

    const isAllChecked = (capability: string) => {
        const allPermNamesForCap: string[] = [];
        Object.values(permissionsMatrix).forEach((features: any) => {
            Object.values(features).forEach((perms: any) => {
                const perm = perms.find((p: any) => p.capability === capability);
                if (perm) {
                    allPermNamesForCap.push(perm.name);
                }
            });
        });

        if (allPermNamesForCap.length === 0) return false;
        return allPermNamesForCap.every(name => rolePermissions.includes(name));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/roles/${roleId}/permissions`, {
                permissions: rolePermissions
            });
            alert("Permissions updated successfully");
            router.push("/dashboard/system-setting/roles-permissions");
        } catch (error: any) {
            console.error("Failed to update permissions:", error);
            const message = error.response?.data?.message || "Failed to update permissions";
            alert(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-800">Assign Permission</h2>
                    <p className="text-sm text-gray-500">Configure feature access for {role?.name || "Role"}</p>
                </div>
                <Button variant="outline" size="sm" asChild className="border-gray-200">
                    <Link href="/dashboard/system-setting/roles-permissions">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Roles
                    </Link>
                </Button>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-white border-b border-gray-100 py-3 px-6">
                    <CardTitle className="text-[13px] font-semibold text-gray-800">
                        Assign Permission ({role?.name})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="border-collapse">
                            <TableHeader>
                                <TableRow className="bg-[#6366f1] hover:bg-[#6366f1] border-none">
                                    <TableHead className="w-[200px] text-white font-bold h-12 py-3 px-6 text-[11px] uppercase tracking-wider">Module</TableHead>
                                    <TableHead className="text-white font-bold h-12 py-3 px-4 text-[11px] uppercase tracking-wider">Feature</TableHead>
                                    <TableHead className="w-[100px] text-center text-white font-bold h-12 py-3 px-4 text-[11px] uppercase tracking-wider">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>View</span>
                                            <Checkbox
                                                checked={isAllChecked('view')}
                                                onCheckedChange={(checked) => handleToggleAll('view', !!checked)}
                                                className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#6366f1] h-3.5 w-3.5 rounded"
                                            />
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[100px] text-center text-white font-bold h-12 py-3 px-4 text-[11px] uppercase tracking-wider">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>Add</span>
                                            <Checkbox
                                                checked={isAllChecked('add')}
                                                onCheckedChange={(checked) => handleToggleAll('add', !!checked)}
                                                className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#6366f1] h-3.5 w-3.5 rounded"
                                            />
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[100px] text-center text-white font-bold h-12 py-3 px-4 text-[11px] uppercase tracking-wider">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>Edit</span>
                                            <Checkbox
                                                checked={isAllChecked('edit')}
                                                onCheckedChange={(checked) => handleToggleAll('edit', !!checked)}
                                                className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#6366f1] h-3.5 w-3.5 rounded"
                                            />
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[100px] text-center text-white font-bold h-12 py-3 px-4 text-[11px] uppercase tracking-wider">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>Delete</span>
                                            <Checkbox
                                                checked={isAllChecked('delete')}
                                                onCheckedChange={(checked) => handleToggleAll('delete', !!checked)}
                                                className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#6366f1] h-3.5 w-3.5 rounded"
                                            />
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(permissionsMatrix).map(([module, features]: [string, any]) => (
                                    <>
                                        {Object.entries(features).map(([feature, perms]: [string, any], featureIdx) => (
                                            <TableRow key={`${module}-${feature}`} className="border-b border-gray-100 hover:bg-gray-50/10 transition-colors h-10 group">
                                                <TableCell
                                                    className={`py-2 px-6 border-r border-gray-50 text-[12px] ${featureIdx === 0 ? 'font-bold text-gray-800' : 'text-transparent selection:bg-transparent cursor-default'}`}
                                                >
                                                    {module}
                                                </TableCell>
                                                <TableCell className="text-[12px] text-gray-600 font-medium py-2 px-4 border-r border-gray-50">{feature}</TableCell>

                                                {/* Capability Checkboxes */}
                                                {['view', 'add', 'edit', 'delete'].map((cap) => {
                                                    const perm = perms.find((p: any) => p.capability === cap);
                                                    return (
                                                        <TableCell key={cap} className="text-center py-1 px-4 border-l border-gray-50">
                                                            {perm ? (
                                                                <div className="flex justify-center items-center h-full">
                                                                    <Checkbox
                                                                        checked={rolePermissions.includes(perm.name)}
                                                                        onCheckedChange={(checked) => handleCheckboxChange(perm.name, !!checked)}
                                                                        className="border-gray-300 data-[state=checked]:bg-[#6366f1] data-[state=checked]:border-[#6366f1] h-4 w-4 rounded shadow-sm transition-all"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="flex justify-center items-center h-full min-h-[1.5rem]" />
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end p-4 bg-gray-50/50 border-t border-gray-100">
                    <Button
                        onClick={handleSave}
                        disabled={saving || (role?.is_system && role?.name === 'Super Admin')}
                        className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white min-w-[160px] rounded-full shadow-md transition-all h-10 text-[13px] font-bold uppercase tracking-wide border-none"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                SAVING...
                            </>
                        ) : "SAVE PERMISSIONS"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
