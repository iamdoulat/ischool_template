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
import { Loader2, ArrowLeft, ShieldCheck, Save } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { translateRoleName } from "@/lib/utils";
import { toast } from "sonner";

export default function AssignPermissionPage() {
    const { t, language } = useTranslation();
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
                toast.error(t("failed_to_load_permission_data"));
            } finally {
                setLoading(false);
            }
        };

        if (roleId) {
            fetchData();
        }
    }, [roleId, t]);

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
            toast.success(t("permissions_updated_successfully"));
            router.push("/dashboard/system-setting/roles-permissions");
        } catch (error: any) {
            console.error("Failed to update permissions:", error);
            const message = error.response?.data?.message || t("failed_to_update_permissions");
            toast.error(message);
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

    const translatedRoleName = role?.name ? (translateRoleName(role.name, language?.short_code) || role.name) : t("role");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Top Header Banner (Mandatory Rule) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("assign_permission")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("configure_feature_access_for_role").replace("{role}", translatedRoleName)}
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" asChild className="border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-xs">
                    <Link href="/dashboard/system-setting/roles-permissions">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t("back_to_roles")}
                    </Link>
                </Button>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3 px-6">
                    <CardTitle className="text-[13px] font-semibold text-gray-800">
                        {t("assign_permission")} ({translatedRoleName})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="border-collapse">
                            <TableHeader>
                                <TableRow className="bg-[#6366f1] hover:bg-[#6366f1] border-none">
                                    <TableHead className="w-[200px] text-white font-bold h-12 py-3 px-6 text-[11px] uppercase tracking-wider">{t("module")}</TableHead>
                                    <TableHead className="text-white font-bold h-12 py-3 px-4 text-[11px] uppercase tracking-wider">{t("feature")}</TableHead>
                                    <TableHead className="w-[100px] text-center text-white font-bold h-12 py-3 px-4 text-[11px] uppercase tracking-wider">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>{t("view")}</span>
                                            <Checkbox
                                                checked={isAllChecked('view')}
                                                onCheckedChange={(checked) => handleToggleAll('view', !!checked)}
                                                className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#6366f1] h-3.5 w-3.5 rounded"
                                            />
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[100px] text-center text-white font-bold h-12 py-3 px-4 text-[11px] uppercase tracking-wider">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>{t("add")}</span>
                                            <Checkbox
                                                checked={isAllChecked('add')}
                                                onCheckedChange={(checked) => handleToggleAll('add', !!checked)}
                                                className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#6366f1] h-3.5 w-3.5 rounded"
                                            />
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[100px] text-center text-white font-bold h-12 py-3 px-4 text-[11px] uppercase tracking-wider">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>{t("edit")}</span>
                                            <Checkbox
                                                checked={isAllChecked('edit')}
                                                onCheckedChange={(checked) => handleToggleAll('edit', !!checked)}
                                                className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#6366f1] h-3.5 w-3.5 rounded"
                                            />
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[100px] text-center text-white font-bold h-12 py-3 px-4 text-[11px] uppercase tracking-wider">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>{t("delete")}</span>
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
                                            <TableRow key={`${module}-${feature}`} className="border-b border-gray-100 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer h-10 group">
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
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#4f46e5] text-white min-w-[160px] rounded-full shadow-md transition-all h-10 text-[13px] font-bold uppercase tracking-wide border-none gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                {t("saving_permissions")}
                            </>
                        ) : (
                            <>
                                <Save className="h-3.5 w-3.5" />
                                {t("save_permissions")}
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
