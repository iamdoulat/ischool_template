"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
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
    Pencil,
    Trash2,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Plus,
    X,
    BookText
} from "lucide-react";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

interface OptionItem {
    id: string | number;
    name?: string;
    group_name?: string;
    school_class_id?: string | number;
}

interface TopicEntry {
    id: string; // Used for identifying the group (first topic ID)
    className: string;
    section: string;
    subjectGroup: string;
    subject: string;
    lesson: string;
    topics: { id: string; name: string; is_completed: boolean; completion_date: string | null }[];
    topic_ids: string[];
}

export default function TopicPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [topicInputs, setTopicInputs] = useState([{ id: Date.now(), value: "" }]);
    const [topicsList, setTopicsList] = useState<TopicEntry[]>([]);
    const [classes, setClasses] = useState<OptionItem[]>([]);
    const [sections, setSections] = useState<OptionItem[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<OptionItem[]>([]);
    const [subjects, setSubjects] = useState<OptionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Pagination & Export
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    // Form State
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        class_name: "",
        section: "",
        subject_group: "",
        subject: "",
        lesson: ""
    });

    // Dialog State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [classesRes, groupsRes, subjectsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subject-groups?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subjects?no_paginate=true').catch(() => ({ data: [] }))
            ]);

            const extractData = (res: { data?: unknown }): OptionItem[] => {
                const data = res.data as { data?: unknown } | unknown[] | undefined;
                if (Array.isArray(data)) return data as OptionItem[];
                if (data && Array.isArray((data as { data?: unknown }).data)) {
                    return (data as { data: OptionItem[] }).data;
                }
                return [];
            };

            setClasses(extractData(classesRes));
            setSubjectGroups(extractData(groupsRes));
            setSubjects(extractData(subjectsRes));
        } catch (error) {
            console.error("Failed to load initial dropdowns", error);
        }
        fetchTopics();
    };

    // Fetch sections filtered by selected class ID
    const fetchSectionsByClass = async (classId: string) => {
        if (!classId) { setSections([]); return; }
        try {
            const res = await api.get('/academics/sections?with_class=true&no_paginate=true');
            const all: OptionItem[] = res.data?.data || res.data || [];
            const filtered = all.filter((s) => String(s.school_class_id) === String(classId));
            setSections(filtered);
        } catch {
            setSections([]);
        }
    };

    const fetchTopics = async () => {
        setLoading(true);
        try {
            const response = await api.get('/lesson-plan/topics');
            setTopicsList(response.data);
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            console.error(err);
            toast({ title: "Error", description: "Failed to fetch topics", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.class_name || !formData.section || !formData.subject_group || !formData.subject || !formData.lesson) {
            toast({ title: "Validation Error", description: "Please select all required fields", variant: "destructive" });
            return;
        }

        const validTopics = topicInputs.map(t => t.value).filter(v => v.trim() !== "");
        if (validTopics.length === 0) {
            toast({ title: "Validation Error", description: "Please enter at least one topic", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                topics: validTopics,
                topic_ids: editMode && selectedId ? topicsList.find(t => t.id === selectedId)?.topic_ids : []
            };

            if (editMode && selectedId) {
                await api.put(`/lesson-plan/topics/${selectedId}`, payload);
                toast({ title: "Success", description: "Topics updated successfully" });
            } else {
                await api.post('/lesson-plan/topics', payload);
                toast({ title: "Success", description: "Topics created successfully" });
            }

            resetForm();
            fetchTopics();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            console.error(err);
            toast({ title: "Error", description: "Failed to save topics", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (entry: TopicEntry) => {
        const cls = classes.find((c) => c.name === entry.className);
        if (cls) fetchSectionsByClass(cls.id.toString());
        setFormData({
            class_name: entry.className,
            section: entry.section,
            subject_group: entry.subjectGroup,
            subject: entry.subject,
            lesson: entry.lesson
        });
        setTopicInputs(entry.topics.length > 0 ? entry.topics.map((t, i) => ({ id: Date.now() + i, value: t.name })) : [{ id: Date.now(), value: "" }]);
        setSelectedId(entry.id);
        setEditMode(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/lesson-plan/topics/${deleteId}`);
            toast({ title: "Success", description: "Topics deleted successfully" });
            fetchTopics();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            console.error(err);
            toast({ title: "Error", description: "Failed to delete topics", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData({
            class_name: "",
            section: "",
            subject_group: "",
            subject: "",
            lesson: ""
        });
        setTopicInputs([{ id: Date.now(), value: "" }]);
        setEditMode(false);
        setSelectedId(null);
    };

    const addMoreTopic = () => {
        setTopicInputs([...topicInputs, { id: Date.now(), value: "" }]);
    };

    const updateTopicInput = (id: number, value: string) => {
        setTopicInputs(topicInputs.map(t => t.id === id ? { ...t, value } : t));
    };

    const removeTopicInput = (id: number) => {
        const newInputs = topicInputs.filter(t => t.id !== id);
        if (newInputs.length === 0) {
            setTopicInputs([{ id: Date.now(), value: "" }]);
        } else {
            setTopicInputs(newInputs);
        }
    };

    // Filter & Pagination logic
    const filteredTopics = topicsList.filter(entry =>
        entry.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTopics.length / itemsPerPage);
    const paginatedTopics = filteredTopics.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleAction = (action: string) => {
        if (action === 'print') {
            window.print();
        } else if (action === 'copy') {
            navigator.clipboard.writeText(JSON.stringify(filteredTopics, null, 2));
            toast({ title: "Success", description: "Copied to clipboard" });
        } else {
            toast({ title: "Success", description: `Data exported as ${action.toUpperCase()}` });
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 font-sans bg-gray-50/10 min-h-screen">
            {/* Left Column: Add Topic Form */}
            <div className="w-full lg:w-1/4">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BookText className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {editMode ? "Edit Topic" : "Add Topic"}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{topicsList.length} total lesson{topicsList.length === 1 ? '' : 's'}</p>
                        </div>
                    </CardHeader>

                    <CardContent className="px-4 pb-4">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Class <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.class_name}
                                    onValueChange={(val) => {
                                        const cls = classes.find((c) => c.name === val);
                                        setFormData({ ...formData, class_name: val, section: '' });
                                        fetchSectionsByClass(cls?.id?.toString() ?? '');
                                    }}
                                >
                                    <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.length > 0 ? classes.map(c => (
                                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                        )) : (
                                            <>
                                                <SelectItem value="Class 1">Class 1</SelectItem>
                                                <SelectItem value="Class 5">Class 5</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Section <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.section}
                                    onValueChange={(val) => setFormData({ ...formData, section: val })}
                                    disabled={!formData.class_name}
                                >
                                    <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.length > 0 ? sections.map(s => (
                                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                        )) : (
                                            <>
                                                <SelectItem value="A">A</SelectItem>
                                                <SelectItem value="B">B</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Subject Group <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.subject_group} onValueChange={(val) => setFormData({...formData, subject_group: val})}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjectGroups.length > 0 ? subjectGroups.map(g => (
                                            <SelectItem key={g.id} value={g.name || g.group_name}>{g.name || g.group_name}</SelectItem>
                                        )) : (
                                            <>
                                                <SelectItem value="Class 1st Subject Group">Class 1st Subject Group</SelectItem>
                                                <SelectItem value="Class 5th Subject Group">Class 5th Subject Group</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Subject <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.subject} onValueChange={(val) => setFormData({...formData, subject: val})}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.length > 0 ? subjects.map(s => (
                                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                        )) : (
                                            <>
                                                <SelectItem value="English (210)">English (210)</SelectItem>
                                                <SelectItem value="Mathematics (110)">Mathematics (110)</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Lesson <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.lesson} onValueChange={(val) => setFormData({...formData, lesson: val})}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Alice in Wonderland">Alice in Wonderland</SelectItem>
                                        <SelectItem value="First Day at School">First Day at School</SelectItem>
                                        <SelectItem value="Tables and Shares">Tables and Shares</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                        Topic Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Button
                                        onClick={addMoreTopic}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-4 text-[11px] font-bold uppercase btn-gradient flex items-center gap-2 rounded-full shadow-lg shadow-orange-200/50"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add
                                    </Button>
                                </div>

                                {topicInputs.map((input) => (
                                    <div key={input.id} className="flex gap-2 items-center group">
                                        <Input
                                            value={input.value}
                                            onChange={(e) => updateTopicInput(input.id, e.target.value)}
                                            className="h-10 border-gray-100 bg-gray-50/30 text-xs shadow-none focus-visible:ring-indigo-500 rounded-lg"
                                        />
                                        <button onClick={() => removeTopicInput(input.id)} className="text-rose-400 hover:text-rose-600 transition-colors p-1">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-4 gap-2">
                                {editMode && (
                                    <Button onClick={resetForm} variant="outline" className="h-9 text-xs shadow-sm rounded border-gray-200">
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    onClick={handleSave}
                                    disabled={submitting}
                                    className="btn-gradient text-white px-10 h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full"
                                >
                                    {submitting ? "Saving..." : editMode ? "Update" : "Save"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Topic List */}
            <div className="w-full lg:w-3/4">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BookText className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Topic List</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{filteredTopics.length} total lesson{filteredTopics.length === 1 ? '' : 's'}</p>
                        </div>
                    </CardHeader>

                    <CardContent className="px-4 pb-4 space-y-4 overflow-x-auto">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative w-full md:w-64">
                                    <Input
                                        placeholder="Search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-3 h-10 text-xs border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg"
                                    />
                                </div>
                                <Button className="btn-gradient h-10 px-6 rounded-full flex items-center gap-2 text-[11px] font-bold uppercase shadow-lg shadow-orange-200/50">
                                    <Search className="h-4 w-4" /> Search
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <Select value={String(itemsPerPage)} onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 shadow-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button onClick={() => handleAction('copy')} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 cursor-pointer">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={() => handleAction('excel')} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 cursor-pointer">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={() => handleAction('pdf')} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 cursor-pointer">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={() => handleAction('print')} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 cursor-pointer">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 cursor-pointer">
                                        <Columns className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border border-gray-100 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-600">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="py-3 px-3">Class</TableHead>
                                        <TableHead className="py-3 px-3">Section</TableHead>
                                        <TableHead className="py-3 px-3">Subject Group</TableHead>
                                        <TableHead className="py-3 px-3">Subject</TableHead>
                                        <TableHead className="py-3 px-3">Lesson</TableHead>
                                        <TableHead className="py-3 px-3 text-right pr-6">Topic</TableHead>
                                        <TableHead className="py-3 px-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={7} />
                                    ) : filteredTopics.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                No topics found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedTopics.map((entry) => (
                                            <TableRow key={entry.id} className="text-[11px] text-gray-600 hover:bg-gray-50/50 group border-b border-gray-50 transition-colors">
                                                <TableCell className="py-4 px-3 align-top font-medium">{entry.className}</TableCell>
                                                <TableCell className="py-4 px-3 align-top">{entry.section}</TableCell>
                                                <TableCell className="py-4 px-3 align-top">{entry.subjectGroup}</TableCell>
                                                <TableCell className="py-4 px-3 align-top">{entry.subject}</TableCell>
                                                <TableCell className="py-4 px-3 align-top">{entry.lesson}</TableCell>
                                                <TableCell className="py-4 px-3 align-top text-right pr-6">
                                                    <div className="flex flex-col gap-1.5 items-end">
                                                        {entry.topics.map((topic, idx) => (
                                                            <div key={idx} className="leading-tight bg-gray-100/50 px-2 py-0.5 rounded text-[10px]">{topic.name}</div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-3 align-top text-right">
                                                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                        <Button size="icon" variant="ghost" onClick={() => handleEdit(entry)} className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-all shadow-sm">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(entry.id)} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all shadow-sm">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-2">
                            <div>
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTopics.length)} of {filteredTopics.length} entries
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    size="sm"
                                    className="h-8 px-2 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white rounded-[10px] disabled:opacity-50"
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" className="h-8 min-w-[32px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white rounded-[10px] transition-all">
                                    {currentPage}
                                </Button>
                                <Button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    size="sm"
                                    className="h-8 px-2 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white rounded-[10px] disabled:opacity-50"
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Lesson Topics</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete all topics associated with this lesson? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600 h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete Topics
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
