"use client";

import { Search, ChevronDown, Trash2, ArrowLeft, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import Link from "next/link";
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

interface Class {
    id: number;
    name: string;
    sections?: Section[];
}

interface Section {
    id: number;
    name: string;
}

interface Student {
    id: number;
    admission_no: string;
    name: string;
    father_name: string;
    roll_number: string;
    admission_date: string;
    balance: number;
    student_fee_master_id: number;
    selected?: boolean;
}

export default function DeleteCarryForwardPage() {
    const { formatCurrency, symbol } = useCurrencyFormatter();
    const [classes, setClasses] = useState<Class[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await api.get("/academics/classes?no_paginate=true");
            setClasses(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch classes", error);
        }
    };

    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedClass(val);
        setSelectedSection("");
        setStudents([]);
        if (val) {
            const foundClass = classes.find(c => c.id === parseInt(val));
            setSections(foundClass?.sections || []);
        } else {
            setSections([]);
        }
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection) {
            toast("error", "Please select Class and Section");
            return;
        }

        setLoading(true);
        setStudents([]);
        try {
            const res = await api.get("/fee-collection/carry-forward/delete-search", {
                params: {
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                }
            });
            const data = res.data.data || [];
            setStudents(data.map((s: Student) => ({ ...s, selected: false })));
            
            if (data.length === 0) {
                toast("info", "No carry forward records found for this class and section.");
            }
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Failed to fetch students");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        setStudents(prev => prev.map(s => ({ ...s, selected: checked })));
    };

    const handleSelectStudent = (id: number, checked: boolean) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, selected: checked } : s));
    };

    const handleDelete = async () => {
        const selectedIds = students.filter(s => s.selected).map(s => s.student_fee_master_id);
        
        setDeleting(true);
        try {
            await api.delete("/fee-collection/carry-forward/delete", {
                data: { student_fee_master_ids: selectedIds }
            });
            toast("success", "Carry forward records deleted successfully");
            setIsDeleteDialogOpen(false);
            handleSearch(); // Refresh list
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Failed to delete carry forward records");
            setIsDeleteDialogOpen(false);
        } finally {
            setDeleting(false);
        }
    };

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students;
        return students.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.admission_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.father_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const selectedCount = students.filter(s => s.selected).length;

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/fees-collection/fees-carry-forward">
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Delete Carry Forward</h1>
                    <p className="text-sm text-muted-foreground">Remove fees carried forward from previous session.</p>
                </div>
            </div>

            {/* Selection Card */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/5 py-4">
                    <CardTitle className="text-base font-semibold">Select Criteria</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        {/* Class */}
                        <div className="space-y-2 group">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Class <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select 
                                    value={selectedClass}
                                    onChange={handleClassChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
                                >
                                    <option value="">Select Class</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Section */}
                        <div className="space-y-2 group">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Section <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select 
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
                                >
                                    <option value="">Select Section</option>
                                    {sections.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end mt-2">
                            <Button
                                variant="gradient"
                                onClick={handleSearch}
                                disabled={loading}
                                className="h-10 px-8"
                            >
                                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                                Search
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            <Card className="border-none shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="border-b bg-muted/5 py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold">Previous Session Balance Fees</CardTitle>
                    <div className="text-sm font-semibold text-destructive">
                        Due Date: {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 border-b flex items-center justify-between bg-background gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                <Checkbox 
                                    checked={students.length > 0 && students.every(s => s.selected)}
                                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                />
                                Select All
                            </label>
                            <div className="relative max-w-sm w-full sm:w-[300px]">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9"
                                />
                            </div>
                        </div>
                        <Button
                            variant="gradient"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            disabled={selectedCount === 0}
                            className="h-9"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="border-b bg-muted/10">
                                    <th className="px-6 py-3 font-semibold text-muted-foreground w-[50px]">#</th>
                                    <th className="px-6 py-3 font-semibold text-muted-foreground">Student Name</th>
                                    <th className="px-6 py-3 font-semibold text-muted-foreground">Admission No</th>
                                    <th className="px-6 py-3 font-semibold text-muted-foreground">Admission Date</th>
                                    <th className="px-6 py-3 font-semibold text-muted-foreground">Roll Number</th>
                                    <th className="px-6 py-3 font-semibold text-muted-foreground">Father Name</th>
                                    <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Balance ({symbol})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student, index) => (
                                        <tr key={student.id} className="border-b hover:bg-muted/5 transition-colors">
                                            <td className="px-6 py-3">
                                                <Checkbox 
                                                    checked={student.selected}
                                                    onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                                                />
                                            </td>
                                            <td className="px-6 py-3 font-medium text-foreground">{student.name}</td>
                                            <td className="px-6 py-3 text-muted-foreground">{student.admission_no}</td>
                                            <td className="px-6 py-3 text-muted-foreground">{student.admission_date}</td>
                                            <td className="px-6 py-3 text-muted-foreground">{student.roll_number}</td>
                                            <td className="px-6 py-3 text-muted-foreground">{student.father_name}</td>
                                            <td className="px-6 py-3 text-right font-medium text-primary">
                                                {formatCurrency(student.balance)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Info className="h-10 w-10 text-muted-foreground/30" />
                                                <p className="text-muted-foreground">No data available in table</p>
                                                <p className="text-xs text-muted-foreground/70">
                                                    Search with different criteria.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the carry forward fees for {selectedCount} selected student(s).
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
