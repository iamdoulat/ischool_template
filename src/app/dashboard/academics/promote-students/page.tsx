"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";

interface Student {
    id: number;
    admission_no: string;
    name: string;
    father_name: string;
    dob: string;
    result?: "pass" | "fail";
    status?: "continue" | "leave";
}

interface AcademicSession {
    id: number;
    session: string;
    is_active: boolean;
}

interface SchoolClass {
    id: number;
    name: string;
}

interface Section {
    id: number;
    name: string;
}

export default function PromoteStudentsPage() {
    const { toast } = useToast();
    // Dropdown Data
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<Section[]>([]);

    // Search Criteria
    const [currentSessionId, setCurrentSessionId] = useState<string>("");
    const [currentClassId, setCurrentClassId] = useState<string>("");
    const [currentSectionId, setCurrentSectionId] = useState<string>("");

    // Promotion Criteria
    const [promoteSessionId, setPromoteSessionId] = useState<string>("");
    const [promoteClassId, setPromoteClassId] = useState<string>("");
    const [promoteSectionId, setPromoteSectionId] = useState<string>("");

    // Results
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [promoting, setPromoting] = useState(false);

    // Load prerequisites
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [sessionRes, classRes, sectionRes] = await Promise.all([
                    api.get("/system-setting/sessions"),
                    api.get("/academics/classes?no_paginate=true"),
                    api.get("/academics/sections?no_paginate=true")
                ]);
                setSessions(sessionRes.data.data || []);
                setClasses(classRes.data.data?.data || classRes.data.data || []);
                setSections(sectionRes.data.data?.data || sectionRes.data.data || []);

                // Set default session if active one exists
                const activeSession = sessionRes.data.data?.find((s: any) => s.is_active);
                if (activeSession) {
                    setCurrentSessionId(activeSession.id.toString());
                }
            } catch (error) {
                console.error("Error fetching prerequisites:", error);
                toast("error", "Failed to load prerequisite data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSearch = async () => {
        if (!currentSessionId || !currentClassId || !currentSectionId) {
            toast("error", "Please select all search criteria");
            return;
        }

        setSearching(true);
        try {
            const response = await api.get("/academics/promote-students", {
                params: {
                    academic_session_id: currentSessionId,
                    school_class_id: currentClassId,
                    section_id: currentSectionId
                }
            });
            const fetchedStudents = (response.data.data || []).map((s: any) => ({
                ...s,
                result: "pass", // Default Pass
                status: "continue" // Default Continue
            }));
            setStudents(fetchedStudents);
            setSelectedStudentIds(fetchedStudents.map((s: any) => s.id));
        } catch (error) {
            console.error("Error searching students:", error);
            toast("error", "Failed to fetch students");
        } finally {
            setSearching(false);
        }
    };

    const handlePromote = async () => {
        if (selectedStudentIds.length === 0) {
            toast("error", "Please select at least one student");
            return;
        }
        if (!promoteSessionId || !promoteClassId || !promoteSectionId) {
            toast("error", "Please select all promotion criteria");
            return;
        }

        const payload = {
            promote_session_id: parseInt(promoteSessionId),
            promote_class_id: parseInt(promoteClassId),
            promote_section_id: parseInt(promoteSectionId),
            students: students
                .filter(s => selectedStudentIds.includes(s.id))
                .map(s => ({
                    id: s.id,
                    result: s.result,
                    status: s.status
                }))
        };

        setPromoting(true);
        try {
            await api.post("/academics/promote-students", payload);
            toast("success", "Students promoted successfully");
            setStudents([]);
            setSelectedStudentIds([]);
        } catch (error: any) {
            console.error("Error promoting students:", error);
            toast("error", error.response?.data?.message || "Failed to promote students");
        } finally {
            setPromoting(false);
        }
    };

    const handleResultChange = (id: number, value: "pass" | "fail") => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, result: value } : s));
    };

    const handleStatusChange = (id: number, value: "continue" | "leave") => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, status: value } : s));
    };

    const toggleSelectAll = () => {
        if (selectedStudentIds.length === students.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(students.map(s => s.id));
        }
    };

    const toggleSelectStudent = (id: number) => {
        if (selectedStudentIds.includes(id)) {
            setSelectedStudentIds(prev => prev.filter(sid => sid !== id));
        } else {
            setSelectedStudentIds(prev => [...prev, id]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">
                            Academic Session <span className="text-red-500">*</span>
                        </Label>
                        <Select value={currentSessionId} onValueChange={setCurrentSessionId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Session" />
                            </SelectTrigger>
                            <SelectContent>
                                {sessions.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.session}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select value={currentClassId} onValueChange={setCurrentClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select value={currentSectionId} onValueChange={setCurrentSectionId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Promote Students In Next Session Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Promote Students In Next Session</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">
                            Promote In Session <span className="text-red-500">*</span>
                        </Label>
                        <Select value={promoteSessionId} onValueChange={setPromoteSessionId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Session" />
                            </SelectTrigger>
                            <SelectContent>
                                {sessions.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.session}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select value={promoteClassId} onValueChange={setPromoteClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select value={promoteSectionId} onValueChange={setPromoteSectionId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end pt-2 border-t mt-4">
                    <Button
                        onClick={handleSearch}
                        disabled={searching || loading}
                        className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-6 h-9 text-xs gap-2 transition-all duration-300 shadow-md"
                    >
                        {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                        Search
                    </Button>
                </div>
            </div>

            {/* Student List Section */}
            {students.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4 font-sans animate-in fade-in slide-in-from-top-4 duration-500">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Student List</h2>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50 text-[11px] uppercase">
                                <TableRow>
                                    <TableHead className="w-[40px] px-4">
                                        <Checkbox
                                            checked={selectedStudentIds.length === students.length && students.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-gray-300"
                                        />
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-600">Admission No</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Student Name</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Father Name</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Date Of Birth</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Current Result</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Next Session Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student) => (
                                    <TableRow key={student.id} className="text-[13px] hover:bg-gray-50/50">
                                        <TableCell className="px-4">
                                            <Checkbox
                                                checked={selectedStudentIds.includes(student.id)}
                                                onCheckedChange={() => toggleSelectStudent(student.id)}
                                                className="border-gray-300"
                                            />
                                        </TableCell>
                                        <TableCell className="text-gray-600">{student.admission_no}</TableCell>
                                        <TableCell className="text-gray-900 font-medium">{student.name}</TableCell>
                                        <TableCell className="text-gray-600">{student.father_name}</TableCell>
                                        <TableCell className="text-gray-600">{student.dob}</TableCell>
                                        <TableCell>
                                            <RadioGroup
                                                value={student.result}
                                                onValueChange={(val) => handleResultChange(student.id, val as "pass" | "fail")}
                                                className="flex gap-4"
                                            >
                                                <div className="flex items-center space-x-1.5">
                                                    <RadioGroupItem value="pass" id={`result-pass-${student.id}`} className="h-4 w-4 border-indigo-300 text-indigo-600" />
                                                    <Label htmlFor={`result-pass-${student.id}`} className="text-xs font-medium text-gray-700">Pass</Label>
                                                </div>
                                                <div className="flex items-center space-x-1.5">
                                                    <RadioGroupItem value="fail" id={`result-fail-${student.id}`} className="h-4 w-4 border-indigo-300 text-indigo-600" />
                                                    <Label htmlFor={`result-fail-${student.id}`} className="text-xs font-medium text-gray-700">Fail</Label>
                                                </div>
                                            </RadioGroup>
                                        </TableCell>
                                        <TableCell>
                                            <RadioGroup
                                                value={student.status}
                                                onValueChange={(val) => handleStatusChange(student.id, val as "continue" | "leave")}
                                                className="flex gap-4"
                                            >
                                                <div className="flex items-center space-x-1.5">
                                                    <RadioGroupItem value="continue" id={`status-cont-${student.id}`} className="h-4 w-4 border-indigo-300 text-indigo-600" />
                                                    <Label htmlFor={`status-cont-${student.id}`} className="text-xs font-medium text-gray-700">Continue</Label>
                                                </div>
                                                <div className="flex items-center space-x-1.5">
                                                    <RadioGroupItem value="leave" id={`status-leave-${student.id}`} className="h-4 w-4 border-indigo-300 text-indigo-600" />
                                                    <Label htmlFor={`status-leave-${student.id}`} className="text-xs font-medium text-gray-700">Leave</Label>
                                                </div>
                                            </RadioGroup>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handlePromote}
                            disabled={promoting || selectedStudentIds.length === 0}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-8 h-9 text-xs shadow-md transition-all duration-300"
                        >
                            {promoting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                            Promote
                        </Button>
                    </div>
                </div>
            )}

            {students.length === 0 && !searching && (
                <div className="bg-white rounded-lg shadow-sm border p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-indigo-50 rounded-full">
                        <Search className="h-8 w-8 text-indigo-400 opacity-50" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-gray-700">No Students Found</h3>
                        <p className="text-xs text-gray-500 max-w-xs">Select criteria and search to find students for promotion.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
