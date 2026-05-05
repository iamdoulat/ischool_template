"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Pencil, Trash2, Search, Award, GraduationCap, 
    Percent, BadgeCheck, FileSearch, Copy, FileSpreadsheet, 
    FileText, Printer, Columns 
} from "lucide-react";
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

interface GradeEntry {
    id: string;
    exam_type: string;
    name: string;
    percent_from: string;
    percent_upto: string;
    grade_point: string;
    description: string;
}

export default function MarksGradePage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [grades, setGrades] = useState<GradeEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Form State
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        exam_type: "",
        name: "",
        percent_from: "",
        percent_upto: "",
        grade_point: "",
        description: ""
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchGrades();
    }, [searchTerm]);

    const fetchGrades = async () => {
        setLoading(true);
        try {
            const response = await api.get('/examination/marks-grades', {
                params: { search: searchTerm }
            });
            setGrades(response.data || []);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch grades", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const groupedData = useMemo(() => {
        const groups: { [key: string]: GradeEntry[] } = {};
        grades.forEach((entry) => {
            if (!groups[entry.exam_type]) {
                groups[entry.exam_type] = [];
            }
            groups[entry.exam_type].push(entry);
        });
        return Object.entries(groups);
    }, [grades]);

    const handleSave = async () => {
        if (!formData.exam_type || !formData.name || !formData.percent_from || !formData.percent_upto || !formData.grade_point) {
            toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/examination/marks-grades/${selectedId}`, formData);
                toast({ title: "Success", description: "Grade updated successfully" });
            } else {
                await api.post('/examination/marks-grades', formData);
                toast({ title: "Success", description: "Grade created successfully" });
            }
            resetForm();
            fetchGrades();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save grade", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (grade: GradeEntry) => {
        setFormData({
            exam_type: grade.exam_type,
            name: grade.name,
            percent_from: grade.percent_from,
            percent_upto: grade.percent_upto,
            grade_point: grade.grade_point,
            description: grade.description || ""
        });
        setSelectedId(grade.id);
        setEditMode(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/examination/marks-grades/${deleteId}`);
            toast({ title: "Success", description: "Grade deleted successfully" });
            fetchGrades();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete grade", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData({
            exam_type: "",
            name: "",
            percent_from: "",
            percent_upto: "",
            grade_point: "",
            description: ""
        });
        setEditMode(false);
        setSelectedId(null);
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Add Marks Grade Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 sticky top-4">
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                            <div className="bg-indigo-50 p-2 rounded-xl">
                                <BadgeCheck className="h-5 w-5 text-indigo-500" />
                            </div>
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">
                                {editMode ? "Edit Grade" : "Add Grade"}
                            </h2>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Exam Type <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.exam_type} onValueChange={(val) => setFormData({...formData, exam_type: val})}>
                                    <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-xl focus:ring-indigo-500 shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="General Purpose (Pass/Fail)">General Purpose (Pass/Fail)</SelectItem>
                                        <SelectItem value="School Based Grading System">School Based Grading System</SelectItem>
                                        <SelectItem value="College Based Grading System">College Based Grading System</SelectItem>
                                        <SelectItem value="GPA Grading System">GPA Grading System</SelectItem>
                                        <SelectItem value="Average Passing">Average Passing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Grade Name <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. A+"
                                    className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-xl focus:ring-indigo-500 shadow-none" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                        Percent From <span className="text-red-500">*</span>
                                    </Label>
                                    <Input 
                                        type="number"
                                        value={formData.percent_from}
                                        onChange={(e) => setFormData({...formData, percent_from: e.target.value})}
                                        placeholder="0.00"
                                        className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-xl focus:ring-indigo-500 shadow-none" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                        Percent Upto <span className="text-red-500">*</span>
                                    </Label>
                                    <Input 
                                        type="number"
                                        value={formData.percent_upto}
                                        onChange={(e) => setFormData({...formData, percent_upto: e.target.value})}
                                        placeholder="100.00"
                                        className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-xl focus:ring-indigo-500 shadow-none" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Grade Point <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    type="number"
                                    step="0.1"
                                    value={formData.grade_point}
                                    onChange={(e) => setFormData({...formData, grade_point: e.target.value})}
                                    placeholder="e.g. 4.0"
                                    className="h-11 border-gray-100 bg-gray-50/30 text-sm rounded-xl focus:ring-indigo-500 shadow-none" 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Description
                                </Label>
                                <Textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Enter grade description"
                                    className="min-h-[100px] border-gray-100 bg-gray-50/30 text-sm rounded-xl focus:ring-indigo-500 p-4" 
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                {editMode && (
                                    <Button onClick={resetForm} variant="outline" className="flex-1 h-11 rounded-full text-[11px] font-bold uppercase tracking-widest border-gray-200">
                                        Cancel
                                    </Button>
                                )}
                                <Button 
                                    onClick={handleSave} 
                                    disabled={submitting}
                                    className="btn-gradient flex-[2] text-white h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full"
                                >
                                    {submitting ? "Saving..." : editMode ? "Update" : "Save"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Grade List */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                                <GraduationCap className="h-5 w-5 text-indigo-500" />
                                Grade List
                            </h2>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <Columns className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search grades..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-50 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-gray-50/50 text-[11px] uppercase font-bold text-gray-600">
                                    <TableRow className="hover:bg-transparent border-gray-50">
                                        <TableHead className="py-4 px-6">Exam Type</TableHead>
                                        <TableHead className="py-4 px-6">Grade Name</TableHead>
                                        <TableHead className="py-4 px-6">Percent From / Upto</TableHead>
                                        <TableHead className="py-4 px-6">Grade Point</TableHead>
                                        <TableHead className="py-4 px-6">Description</TableHead>
                                        <TableHead className="py-4 px-6 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">Loading Grades...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : groupedData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-gray-400 text-sm italic">
                                                No grades found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        groupedData.map(([type, entries]) => (
                                            entries.map((entry, index) => (
                                                <TableRow key={entry.id} className="text-[13px] border-b last:border-0 border-gray-50 hover:bg-gray-50/30 group transition-colors">
                                                    {index === 0 ? (
                                                        <TableCell
                                                            rowSpan={entries.length}
                                                            className="font-bold text-gray-400 align-top border-r border-gray-50 pt-5 text-[10px] uppercase tracking-tighter w-[150px]"
                                                        >
                                                            {type}
                                                        </TableCell>
                                                    ) : null}
                                                    <TableCell className="py-4 px-6 font-bold text-indigo-600 tracking-tight">{entry.name}</TableCell>
                                                    <TableCell className="py-4 px-6">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-emerald-100">
                                                                {entry.percent_from}%
                                                            </span>
                                                            <span className="text-gray-300">→</span>
                                                            <span className="bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-rose-100">
                                                                {entry.percent_upto}%
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 font-bold text-gray-700">
                                                        <div className="flex items-center gap-1.5">
                                                            <Award className="h-3.5 w-3.5 text-amber-400" />
                                                            {entry.grade_point}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-gray-400 italic text-[11px] max-w-[200px] truncate">
                                                        {entry.description || "No description"}
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(entry)} className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md transition-all">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={() => setDeleteId(entry.id)} className="h-8 w-8 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md transition-all">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Grade</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this marks grade? This will permanently remove the grading criteria from the selected exam system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete Grade
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
