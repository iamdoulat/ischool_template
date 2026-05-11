"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Plus,
    Search,
    Pencil,
    Eye,
    ChevronLeft,
    ChevronRight,
    CircleSlash,
    Clock,
    MapPin,
    ClipboardList,
    FileText,
    Calendar as CalendarIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface LessonPlanItem {
    id: string; // Timetable ID
    subject: string;
    subjectCode: string;
    className: string;
    timeRange: string;
    roomNo: string;
    plan: {
        id: string;
        lesson: string;
        topic: string;
        sub_topic: string;
    } | null;
    actions: ("add" | "edit" | "report" | "view")[];
}

interface DayPlan {
    day: string;
    date: string;
    lessons: LessonPlanItem[];
}

export default function ManageLessonPlanPage() {
    const { toast } = useToast();
    const [teachers, setTeachers] = useState<any[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
    const [startDate, setStartDate] = useState<Date>(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        return new Date(d.setDate(diff));
    });
    const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);
    const [loading, setLoading] = useState(false);

    // Form Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [formData, setFormData] = useState({
        lesson: "",
        topic: "",
        sub_topic: "",
        presentation: "",
        objectives: ""
    });

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const response = await api.get('/hr/staff-directory', {
                params: { role: 'Teacher', no_paginate: true, active: 'all' }
            });
            let data: any[] = response.data?.data || response.data || [];
            // Enforce Teacher-only filter on client side as a safety net
            data = data.filter((u: any) => u.role === 'Teacher');
            setTeachers(data);
            if (data.length > 0) setSelectedTeacherId(data[0].id.toString());
        } catch (error) {
            console.error("Failed to fetch teachers", error);
        }
    };

    const fetchWeekPlan = async () => {
        if (!selectedTeacherId) return;
        setLoading(true);
        try {
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            
            const response = await api.get('/lesson-plan/manage-lesson-plan', {
                params: {
                    staff_id: selectedTeacherId,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0]
                }
            });
            setWeekPlan(response.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch lesson plan", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTeacherId) fetchWeekPlan();
    }, [selectedTeacherId, startDate]);

    const handleNavigate = (direction: 'next' | 'prev') => {
        const newDate = new Date(startDate);
        newDate.setDate(startDate.getDate() + (direction === 'next' ? 7 : -7));
        setStartDate(newDate);
    };

    const openDialog = (mode: "add" | "edit" | "view", dayPlan: DayPlan, lesson: LessonPlanItem) => {
        setDialogMode(mode);
        setSelectedSlot({ dayPlan, lesson });
        if (mode === "add") {
            setFormData({ lesson: "", topic: "", sub_topic: "", presentation: "", objectives: "" });
        } else {
            setFormData({
                lesson: lesson.plan?.lesson || "",
                topic: lesson.plan?.topic || "",
                sub_topic: lesson.plan?.sub_topic || "",
                presentation: (lesson.plan as any)?.presentation || "", 
                objectives: (lesson.plan as any)?.objectives || ""
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.lesson || !formData.topic) {
            toast({ title: "Validation Error", description: "Lesson and Topic are required", variant: "destructive" });
            return;
        }

        try {
            const payload = {
                ...formData,
                class_timetable_id: selectedSlot.lesson.id,
                date: new Date(selectedSlot.dayPlan.date).toISOString().split('T')[0]
            };

            if (dialogMode === "edit" && selectedSlot.lesson.plan?.id) {
                await api.put(`/lesson-plan/manage-lesson-plan/${selectedSlot.lesson.plan.id}`, payload);
            } else {
                await api.post('/lesson-plan/manage-lesson-plan', payload);
            }

            toast({ title: "Success", description: "Lesson plan saved successfully" });
            setIsDialogOpen(false);
            fetchWeekPlan();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save lesson plan", variant: "destructive" });
        }
    };

    const getWeekRangeString = () => {
        const end = new Date(startDate);
        end.setDate(startDate.getDate() + 6);
        return `${startDate.toLocaleDateString()} To ${end.toLocaleDateString()}`;
    };

    return (
        <div className="p-4 space-y-6 font-sans bg-gray-50/30 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Manage Lesson Plan</h1>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-4">
                <div className="space-y-3 max-w-2xl">
                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        Teachers <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-3 items-center">
                        <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                            <SelectTrigger className="w-full h-11 border-gray-100 bg-gray-50/30 text-sm rounded-lg focus:ring-indigo-500">
                                <SelectValue placeholder="Select Teacher" />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map(t => (
                                    <SelectItem key={t.id} value={t.id.toString()}>{t.name} ({t.staff_id})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={fetchWeekPlan} className="btn-gradient text-white gap-2 h-11 px-8 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full">
                            <Search className="h-4 w-4" /> Search
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 overflow-x-auto">
                <div className="flex justify-center items-center gap-8 mb-8 bg-gray-50/50 p-4 rounded-lg border border-gray-50">
                    <Button onClick={() => handleNavigate('prev')} variant="ghost" size="icon" className="h-10 w-10 text-gray-400 rounded-full hover:bg-white hover:text-indigo-600 transition-all shadow-sm bg-white">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-3">
                        <CalendarIcon className="h-5 w-5 text-indigo-500" />
                        {getWeekRangeString()}
                    </div>
                    <Button onClick={() => handleNavigate('next')} variant="ghost" size="icon" className="h-10 w-10 text-gray-400 rounded-full hover:bg-white hover:text-indigo-600 transition-all shadow-sm bg-white">
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 min-w-[1400px]">
                    {weekPlan.map((dayPlan) => (
                        <div key={dayPlan.day} className="space-y-4">
                            <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100 text-center shadow-sm">
                                <div className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">{dayPlan.day}</div>
                                <div className="text-[10px] text-indigo-400 font-bold mt-1 tracking-tighter">{dayPlan.date}</div>
                            </div>

                            {dayPlan.lessons.length > 0 ? (
                                <div className="space-y-4">
                                    {dayPlan.lessons.map((lesson) => (
                                        <div key={lesson.id} className="bg-white border border-gray-50 rounded-lg shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group border-l-4 border-l-indigo-500">
                                            <div className="absolute top-0 right-0 p-2 flex gap-1 transform translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-300">
                                                {lesson.plan ? (
                                                    <>
                                                        <Button onClick={() => openDialog("edit", dayPlan, lesson)} size="icon" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button onClick={() => openDialog("view", dayPlan, lesson)} size="icon" className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button onClick={() => openDialog("add", dayPlan, lesson)} size="icon" className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-md">
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="p-4 pt-6 space-y-3">
                                                <div className="flex items-start gap-2">
                                                    <div className="bg-indigo-50 p-1.5 rounded-lg">
                                                        <ClipboardList className="h-4 w-4 text-indigo-500" />
                                                    </div>
                                                    <div className="text-[11px] leading-tight pt-1">
                                                        <div className="font-bold text-gray-800 uppercase tracking-tight">{lesson.subject}</div>
                                                        <div className="text-indigo-400 font-bold text-[9px]">{lesson.subjectCode}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2">
                                                    <div className="bg-emerald-50 p-1.5 rounded-lg">
                                                        <Clock className="h-4 w-4 text-emerald-500" />
                                                    </div>
                                                    <div className="text-[11px] leading-tight pt-1">
                                                        <div className="font-bold text-gray-700">{lesson.className}</div>
                                                        <div className="text-gray-400 font-medium mt-1">{lesson.timeRange}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2">
                                                    <div className="bg-rose-50 p-1.5 rounded-lg">
                                                        <MapPin className="h-4 w-4 text-rose-500" />
                                                    </div>
                                                    <div className="text-[11px] leading-tight pt-1">
                                                        <span className="font-bold text-gray-700">Room:</span>{" "}
                                                        <span className="text-rose-500 font-bold">{lesson.roomNo}</span>
                                                    </div>
                                                </div>

                                                {lesson.plan && (
                                                    <div className="mt-2 pt-2 border-t border-dashed border-gray-100">
                                                        <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                                            PLAN ADDED
                                                        </div>
                                                        <div className="text-[9px] text-gray-400 mt-1 truncate italic">
                                                            {lesson.plan.topic}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-red-50/30 border border-dashed border-red-100 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-center min-h-[150px]">
                                    <CircleSlash className="h-6 w-6 text-red-300" />
                                    <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Off Day</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Add/Edit Lesson Plan Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl rounded-lg border-0 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 btn-gradient text-white">
                        <DialogTitle className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
                            <FileText className="h-6 w-6" />
                            {dialogMode === "view" ? "View Lesson Plan" : dialogMode === "edit" ? "Edit Lesson Plan" : "Add Lesson Plan"}
                        </DialogTitle>
                        <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-tighter mt-1 opacity-80">
                            {selectedSlot?.dayPlan.day}, {selectedSlot?.dayPlan.date} | {selectedSlot?.lesson.subject} | {selectedSlot?.lesson.className}
                        </p>
                    </DialogHeader>

                    <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto bg-white">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Lesson <span className="text-red-500">*</span></Label>
                                <Input 
                                    readOnly={dialogMode === "view"}
                                    value={formData.lesson} 
                                    onChange={(e) => setFormData({...formData, lesson: e.target.value})}
                                    placeholder="Enter lesson name" 
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Topic <span className="text-red-500">*</span></Label>
                                <Input 
                                    readOnly={dialogMode === "view"}
                                    value={formData.topic} 
                                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                                    placeholder="Enter topic name" 
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Sub Topic</Label>
                            <Input 
                                readOnly={dialogMode === "view"}
                                value={formData.sub_topic} 
                                onChange={(e) => setFormData({...formData, sub_topic: e.target.value})}
                                placeholder="Enter sub topic" 
                                className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Presentation</Label>
                            <Textarea 
                                readOnly={dialogMode === "view"}
                                value={formData.presentation} 
                                onChange={(e) => setFormData({...formData, presentation: e.target.value})}
                                placeholder="How will you present this lesson?" 
                                className="min-h-[100px] border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 p-4"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Lesson Summary / Objectives</Label>
                            <Textarea 
                                readOnly={dialogMode === "view"}
                                value={formData.objectives} 
                                onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                                placeholder="What should students achieve?" 
                                className="min-h-[100px] border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 p-4"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-gray-50/50 flex justify-end gap-3">
                        <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="h-11 px-8 rounded-full text-[11px] font-bold uppercase tracking-widest border-gray-200">
                            Close
                        </Button>
                        {dialogMode !== "view" && (
                            <Button onClick={handleSave} className="btn-gradient text-white h-11 px-12 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-orange-200/50">
                                Save Plan
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
