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
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Copy } from "lucide-react";

interface Topic {
    id: string;
    name: string;
}

interface Lesson {
    id: string;
    name: string;
    topics: Topic[];
}

export default function CopyOldLessonsPage() {
    const { toast } = useToast();
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    
    const [sourceLessons, setSourceLessons] = useState<Lesson[]>([]);
    const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [copying, setCopying] = useState(false);

    // Filter States
    const [fromCriteria, setFromCriteria] = useState({
        session: "2025-26",
        class_name: "",
        section: "",
        subject_group: "",
        subject: ""
    });

    const [toCriteria, setToCriteria] = useState({
        class_name: "",
        section: "",
        subject_group: "",
        subject: ""
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [classesRes, sectionsRes, groupsRes, subjectsRes, sessionsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/sections?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subject-groups?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subjects?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/system-setting/sessions').catch(() => ({ data: { data: [] } }))
            ]);
            
            const extractData = (res: any) => {
                if (Array.isArray(res.data)) return res.data;
                if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
                return [];
            };

            setClasses(extractData(classesRes));
            setSections(extractData(sectionsRes));
            setSubjectGroups(extractData(groupsRes));
            setSubjects(extractData(subjectsRes));
            setSessions(extractData(sessionsRes));
        } catch (error) {
            console.error("Failed to load initial dropdowns", error);
        }
    };

    const handleSearch = async () => {
        if (!fromCriteria.class_name || !fromCriteria.section || !fromCriteria.subject_group || !fromCriteria.subject) {
            toast({ title: "Error", description: "Please select all 'From' criteria", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/lesson-plan/topics');
            const allTopics: any[] = response.data;
            
            // Filter based on fromCriteria
            const filtered = allTopics.filter(t => 
                t.className === fromCriteria.class_name &&
                t.section === fromCriteria.section &&
                t.subjectGroup === fromCriteria.subject_group &&
                t.subject === fromCriteria.subject
            ).map(t => ({
                id: t.id,
                name: t.lesson,
                topics: t.topics.map((topic: any) => ({
                    id: topic.id,
                    name: topic.name
                }))
            }));

            setSourceLessons(filtered);
            setSelectedTopicIds([]);
            if (filtered.length === 0) {
                toast({ title: "Info", description: "No lessons found for selected criteria" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch source lessons", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const toggleTopic = (id: string) => {
        setSelectedTopicIds(prev => 
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    const handleCopy = async () => {
        if (selectedTopicIds.length === 0) {
            toast({ title: "Validation Error", description: "Please select at least one topic to copy", variant: "destructive" });
            return;
        }

        if (!toCriteria.class_name || !toCriteria.section || !toCriteria.subject_group || !toCriteria.subject) {
            toast({ title: "Validation Error", description: "Please select all 'To' criteria", variant: "destructive" });
            return;
        }

        setCopying(true);
        try {
            await api.post('/lesson-plan/copy-topics', {
                from_class: fromCriteria.class_name,
                from_section: fromCriteria.section,
                from_subject_group: fromCriteria.subject_group,
                from_subject: fromCriteria.subject,
                to_class: toCriteria.class_name,
                to_section: toCriteria.section,
                to_subject_group: toCriteria.subject_group,
                to_subject: toCriteria.subject,
                topic_ids: selectedTopicIds
            });

            toast({ title: "Success", description: "Lessons and topics copied successfully" });
            setSelectedTopicIds([]);
        } catch (error) {
            toast({ title: "Error", description: "Failed to copy lessons", variant: "destructive" });
        } finally {
            setCopying(false);
        }
    };

    return (
        <div className="space-y-2 font-sans p-2 bg-transparent min-h-screen">
            {/* Top Section: Select Old Session Details */}
            <div className="bg-transparent rounded-lg shadow-none border border-slate-200/60 p-6">
                <h2 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-widest">Select Source Session Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Session <span className="text-red-500">*</span>
                        </Label>
                        <Select value={fromCriteria.session} onValueChange={(val) => setFromCriteria({...fromCriteria, session: val})}>
                            <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {sessions.length > 0 ? sessions.map(s => (
                                    <SelectItem key={s.id} value={s.session}>{s.session}</SelectItem>
                                )) : (
                                    <SelectItem value="2025-26">2025-26</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select value={fromCriteria.class_name} onValueChange={(val) => setFromCriteria({...fromCriteria, class_name: val})}>
                            <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => (
                                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select value={fromCriteria.section} onValueChange={(val) => setFromCriteria({...fromCriteria, section: val})}>
                            <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(s => (
                                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Subject Group <span className="text-red-500">*</span>
                        </Label>
                        <Select value={fromCriteria.subject_group} onValueChange={(val) => setFromCriteria({...fromCriteria, subject_group: val})}>
                            <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjectGroups.map(g => (
                                    <SelectItem key={g.id} value={g.name || g.group_name}>{g.name || g.group_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Subject <span className="text-red-500">*</span>
                        </Label>
                        <Select value={fromCriteria.subject} onValueChange={(val) => setFromCriteria({...fromCriteria, subject: val})}>
                            <SelectTrigger className="h-10 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map(s => (
                                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Button 
                        onClick={handleSearch}
                        disabled={loading}
                        className="btn-gradient text-white gap-2 h-11 px-10 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full"
                    >
                        {loading ? "Searching..." : <><Search className="h-4 w-4" /> Search</>}
                    </Button>
                </div>
            </div>

            {sourceLessons.length > 0 && (
                <>
                    <div className="text-sm font-bold text-gray-500 mt-8 mb-4 flex items-center gap-2 uppercase tracking-widest">
                        Source Lessons For: <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">{fromCriteria.subject}</span>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Left Column: Lesson & Topics Selection */}
                        <div className="w-full lg:w-2/3">
                            <div className="bg-transparent rounded-lg shadow-none border border-slate-200/60 overflow-hidden">
                                <div className="p-4 border-b bg-gray-50/50">
                                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Available Lessons & Topics</h3>
                                </div>

                                <div className="divide-y divide-gray-50">
                                    <div className="grid grid-cols-[40px_1fr] bg-gray-100/30 text-[10px] font-bold uppercase text-gray-400 p-3">
                                        <div>#</div>
                                        <div>Lesson Topic Structure</div>
                                    </div>

                                    {sourceLessons.map((lesson, index) => (
                                        <div key={lesson.id} className="grid grid-cols-[40px_1fr] p-4 group hover:bg-gray-50/30 transition-all border-b border-gray-50">
                                            <div className="text-[11px] text-gray-400 font-bold">{index + 1}</div>
                                            <div className="space-y-4">
                                                <div className="text-xs font-bold text-gray-800 uppercase tracking-tight flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                    {lesson.name}
                                                </div>
                                                <div className="pl-6 space-y-3">
                                                    {lesson.topics.map((topic) => (
                                                        <div key={topic.id} className="flex items-center gap-3 group/item">
                                                            <Checkbox 
                                                                id={topic.id} 
                                                                checked={selectedTopicIds.includes(topic.id)}
                                                                onCheckedChange={() => toggleTopic(topic.id)}
                                                                className="h-4 w-4 rounded-md border-gray-200 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 shadow-sm transition-all" 
                                                            />
                                                            <Label 
                                                                htmlFor={topic.id} 
                                                                className="text-[12px] text-gray-500 font-medium cursor-pointer group-hover/item:text-indigo-600 transition-colors"
                                                            >
                                                                {topic.name}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Target Subject Selection */}
                        <div className="w-full lg:w-1/3">
                            <div className="bg-transparent rounded-lg shadow-none border border-slate-200/60 p-6 space-y-4 sticky top-4">
                                <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-4 uppercase tracking-widest">Target Selection</h3>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                        Class <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={toCriteria.class_name} onValueChange={(val) => setToCriteria({...toCriteria, class_name: val})}>
                                        <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                        Section <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={toCriteria.section} onValueChange={(val) => setToCriteria({...toCriteria, section: val})}>
                                        <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map(s => (
                                                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                        Subject Group <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={toCriteria.subject_group} onValueChange={(val) => setToCriteria({...toCriteria, subject_group: val})}>
                                        <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjectGroups.map(g => (
                                                <SelectItem key={g.id} value={g.name || g.group_name}>{g.name || g.group_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                        Subject <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={toCriteria.subject} onValueChange={(val) => setToCriteria({...toCriteria, subject: val})}>
                                        <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map(s => (
                                                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-4">
                                    <Button 
                                        onClick={handleCopy}
                                        disabled={copying || selectedTopicIds.length === 0}
                                        className="btn-gradient w-full text-white h-12 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex items-center gap-3"
                                    >
                                        {copying ? "Copying..." : <><Copy className="h-4 w-4" /> Copy Selected ({selectedTopicIds.length})</>}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {!loading && sourceLessons.length === 0 && (
                <div className="bg-transparent rounded-lg border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center mt-6">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <Search className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest">Select source criteria</h3>
                    <p className="text-gray-300 text-[11px] uppercase tracking-tighter mt-1">Class, Section, Subject Group, and Subject required to search old lessons</p>
                </div>
            )}
        </div>
    );
}
