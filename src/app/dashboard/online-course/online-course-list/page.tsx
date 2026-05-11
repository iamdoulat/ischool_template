"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
    Search,
    LayoutGrid,
    List,
    Plus,
    ChevronDown,
    Monitor,
    BookOpen,
    Clock,
    FileText,
    HelpCircle,
    PenTool,
    MoreVertical,
    Eye,
    Settings,
    LayoutDashboard,
    RefreshCw,
    GraduationCap,
    Info,
    Trash2,
    Edit3,
    Check,
    X,
    ShieldAlert,
    ShieldCheck,
    Target,
    Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface Course {
    id: string;
    title: string;
    description: string;
    category: string;
    instructor: { name: string, id: string, admission_no: string, avatar: string, updated_at: string };
    price: number;
    original_price: number;
    image: string;
    class_name: string;
    total_lessons: number;
    total_hours: string;
    total_exams: number;
    total_assignments: number;
    total_quizzes: number;
}

export default function OnlineCoursePage() {
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [courses, setCourses] = useState<Course[]>([]);
    const [totalEntries, setTotalEntries] = useState(0);
    
    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [formState, setFormState] = useState({
        title: "",
        category: "",
        price: "",
        original_price: "",
        description: "",
        class_name: ""
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const response = await api.get('/online-course/courses', {
                params: { search: searchQuery }
            });
            setCourses(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Registry Failure", description: "Failed to synchronize institutional course matrix.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setFormState({ title: "", category: "", price: "", original_price: "", description: "", class_name: "" });
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (course: Course) => {
        setSelectedCourse(course);
        setFormState({
            title: course.title,
            category: course.category,
            price: course.price.toString(),
            original_price: (course.original_price || "").toString(),
            description: course.description,
            class_name: course.class_name
        });
        setIsEditModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditModalOpen && selectedCourse) {
                await api.put(`/online-course/courses/${selectedCourse.id}`, formState);
                toast({ title: "Protocol Updated", description: "Course node parameters successfully re-indexed." });
            } else {
                await api.post('/online-course/courses', formState);
                toast({ title: "Node Integrated", description: "New curriculum asset successfully integrated into registry." });
            }
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            fetchCourses();
        } catch (error) {
            toast({ title: "Integration Error", description: "Transaction failed. Check analytical logs.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/online-course/courses/${deleteId}`);
            toast({ title: "Asset Purged", description: "Course node successfully de-indexed from registry." });
            fetchCourses();
        } catch (error) {
            toast({ title: "Purge Failed", description: "Failed to execute deletion protocol.", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 font-sans text-slate-800">
            {/* High-Fidelity Header */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_40px_rgb(0,0,0,0.02)] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 text-indigo-600">
                    <GraduationCap className="h-48 w-48" />
                </div>
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="h-16 w-16 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner transform -rotate-3 transition-transform group-hover:rotate-0 duration-500">
                        <LayoutDashboard className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-4">
                            Course Matrix
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.25em] mt-1.5 flex items-center gap-2">
                            <Target className="h-3 w-3 text-indigo-400" /> Institutional registry of active virtual assessment nodes
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto relative z-10">
                    <div className="relative flex-1 lg:w-80 group/search">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                        <Input
                            placeholder="Identify Nodal Asset..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchCourses()}
                            className="pl-12 h-14 rounded-lg bg-slate-50 border-transparent focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all font-bold text-sm shadow-inner"
                        />
                        <div onClick={fetchCourses} className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm hover:bg-indigo-50 cursor-pointer text-indigo-500 active:scale-90 transition-all">
                            <Search className="h-4 w-4" />
                        </div>
                    </div>

                    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg p-1.5 shadow-inner">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-11 w-11 rounded-lg transition-all duration-300", viewMode === "grid" ? "bg-white text-indigo-500 shadow-md scale-105" : "text-slate-400 hover:text-slate-600")}
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-11 w-11 rounded-lg transition-all duration-300", viewMode === "list" ? "bg-white text-indigo-500 shadow-md scale-105" : "text-slate-400 hover:text-slate-600")}
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-5 w-5" />
                        </Button>
                    </div>

                    <Button onClick={handleOpenAdd} className="h-14 px-10 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-[11px] font-black uppercase tracking-[0.2em] gap-3 shadow-2xl shadow-orange-200/50 hover:shadow-orange-300/60 active:scale-95 transition-all">
                        <Plus className="h-5 w-5" />
                        Integrate Asset
                    </Button>
                </div>
            </div>

            {/* Content Matrix */}
            {loading ? (
                <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                    <div className="h-20 w-20 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center text-indigo-500 animate-pulse shadow-inner">
                        <RefreshCw className="h-10 w-10 animate-spin" />
                    </div>
                    <div className="space-y-1 text-center">
                        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-indigo-600">Syncing Matrix Hub</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Accessing institutional registry nodes...</p>
                    </div>
                </div>
            ) : courses.length === 0 ? (
                <div className="h-[50vh] flex flex-col items-center justify-center space-y-8">
                    <div className="p-12 rounded-[3.5rem] bg-slate-50 text-slate-300 transform rotate-6 shadow-inner border border-white">
                        <GraduationCap className="h-20 w-20 opacity-20" />
                    </div>
                    <div className="space-y-3 text-center max-w-sm">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-500 bg-rose-50 px-8 py-2.5 rounded-full border border-rose-100 shadow-sm">
                            Matrix Registry Empty
                        </span>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight leading-relaxed italic">
                            No course nodes identified in the current institutional sector. Initiate asset integration to populate the matrix.
                        </p>
                    </div>
                </div>
            ) : (
                <div className={cn(
                    "grid gap-8",
                    viewMode === "grid" 
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                        : "grid-cols-1"
                )}>
                    {courses.map((course, index) => (
                        <CourseCard 
                            key={course.id} 
                            course={course} 
                            viewMode={viewMode} 
                            index={index}
                            onEdit={() => handleOpenEdit(course)}
                            onDelete={() => setDeleteId(course.id)}
                        />
                    ))}
                </div>
            )}

            {/* Matrix Pagination */}
            <div className="mt-12 p-8 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground shadow-sm">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em]">
                    Institutional Summary: <span className="text-indigo-600">{courses.length}</span> active assets identified out of <span className="text-indigo-600">{totalEntries}</span> nodes
                </p>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-lg border-gray-100 bg-white text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 active:scale-95 transition-all shadow-sm" disabled>
                        <ChevronDown className="h-5 w-5 rotate-90" />
                    </Button>
                    <Button className="h-12 w-12 rounded-lg border-none p-0 text-white font-black text-xs active:scale-95 transition-all shadow-xl shadow-indigo-200/50 bg-gradient-to-r from-indigo-500 to-indigo-700">
                        1
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-lg border-gray-100 bg-white text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 active:scale-95 transition-all shadow-sm" disabled>
                        <ChevronDown className="h-5 w-5 -rotate-90" />
                    </Button>
                </div>
            </div>

            {/* Asset Integration/Edit Dialog */}
            <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                }
            }}>
                <DialogContent className="sm:max-w-[700px] rounded-[3rem] border-none shadow-2xl overflow-hidden p-0 bg-white">
                    <DialogHeader className="p-10 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 transform rotate-12 scale-150">
                            <GraduationCap className="h-24 w-24" />
                        </div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="h-16 w-16 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                                <Plus className="h-8 w-8" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                                    {isEditModalOpen ? "Modify Nodal Asset" : "Integrate Course Protocol"}
                                </DialogTitle>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1.5 flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3" /> Execute curriculum integration and nodal registry
                                </p>
                            </div>
                        </div>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormInput 
                                label="Course Identity Title" 
                                value={formState.title}
                                icon={<BookOpen className="h-3.5 w-3.5" />}
                                onChange={(val) => setFormState({...formState, title: val})}
                                placeholder="Enter nodal title..."
                            />
                            <FormInput 
                                label="Sector Classification" 
                                value={formState.category}
                                icon={<Target className="h-3.5 w-3.5" />}
                                onChange={(val) => setFormState({...formState, category: val})}
                                placeholder="Institutional sector..."
                            />
                            <FormInput 
                                label="Commitment Price ($)" 
                                type="number"
                                value={formState.price}
                                icon={<Zap className="h-3.5 w-3.5 text-orange-500" />}
                                onChange={(val) => setFormState({...formState, price: val})}
                                placeholder="0.00"
                            />
                            <FormInput 
                                label="Institutional Class" 
                                value={formState.class_name}
                                icon={<GraduationCap className="h-3.5 w-3.5" />}
                                onChange={(val) => setFormState({...formState, class_name: val})}
                                placeholder="Class identity node..."
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1 flex items-center gap-2">
                                <Info className="h-3.5 w-3.5" /> Curriculum Insight Node
                            </label>
                            <textarea 
                                required
                                className="w-full min-h-[120px] rounded-lg border-2 border-slate-50 bg-slate-50/30 p-6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 focus-visible:bg-white transition-all font-bold text-sm shadow-inner"
                                placeholder="Provide high-fidelity description of the curriculum assets..."
                                value={formState.description}
                                onChange={(e) => setFormState({...formState, description: e.target.value})}
                            />
                        </div>
                        <div className="flex justify-end pt-4 gap-4">
                            <Button type="button" variant="outline" onClick={() => {setIsAddModalOpen(false); setIsEditModalOpen(false);}} className="h-14 px-10 rounded-full text-[10px] font-black uppercase tracking-widest border-slate-100 hover:bg-slate-50 transition-all">
                                Abort Protocol
                            </Button>
                            <Button 
                                disabled={submitting}
                                className="h-14 px-12 rounded-full bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 active:scale-95 transition-all gap-3 hover:bg-indigo-700"
                            >
                                {submitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                {isEditModalOpen ? "Commit Re-index" : "Initialize Asset"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Purge Confirmation Dialog */}
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-[3rem] border-0 shadow-2xl p-12 max-w-lg bg-white">
                    <AlertDialogHeader>
                        <div className="h-24 w-24 rounded-[2.5rem] bg-rose-50 flex items-center justify-center text-rose-500 border-2 border-rose-100 mb-10 shadow-inner transform rotate-6 animate-in zoom-in duration-300">
                            <ShieldAlert className="h-12 w-12" />
                        </div>
                        <AlertDialogTitle className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">Execute Purge Protocol?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-slate-500 leading-relaxed mt-6 font-bold uppercase tracking-tight opacity-70">
                            Warning: You are about to de-index a core curriculum node. This operation is irreversible and will purge all associated metadata from the institutional matrix.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-12 gap-4 flex-col sm:flex-row">
                        <AlertDialogCancel className="h-14 px-10 rounded-full text-[11px] font-black uppercase tracking-widest border-slate-100 hover:bg-slate-50 transition-all sm:flex-1">Abort De-index</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={executeDelete} 
                            className="bg-rose-500 hover:bg-rose-600 h-14 px-12 rounded-full text-[11px] font-black uppercase tracking-widest border-0 shadow-2xl shadow-rose-200 active:scale-95 transition-all flex gap-3 sm:flex-1"
                        >
                            <Trash2 className="h-4 w-4" />
                            Purge Asset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function CourseCard({ course, viewMode, index, onEdit, onDelete }: { course: Course, viewMode: "grid" | "list", index: number, onEdit: () => void, onDelete: () => void }) {
    return (
        <Card className={cn(
            "group border-none shadow-[0_15px_45px_rgb(0,0,0,0.03)] bg-card/50 backdrop-blur-md overflow-hidden hover:shadow-[0_25px_60px_rgb(0,0,0,0.08)] transition-all duration-500 flex relative animate-in fade-in slide-in-from-bottom-8",
            viewMode === "grid" ? "flex-col rounded-[2.5rem]" : "flex-row h-72 rounded-lg",
            `delay-[${index * 50}ms]`
        )}>
            {/* Asset Visual Node */}
            <div className={cn(
                "relative overflow-hidden shrink-0",
                viewMode === "grid" ? "aspect-[16/11]" : "w-96 h-full"
            )}>
                <img
                    src={course.image || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop&sig=${course.id}`}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 blur-[0.2px] group-hover:blur-0"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Identity Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-5 z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl p-3 rounded-lg border border-white/20 shadow-2xl">
                        <div className="h-10 w-10 rounded-lg overflow-hidden border-2 border-white/30 shadow-inner bg-indigo-500/20 flex items-center justify-center text-xs font-black text-white uppercase">
                            {course.instructor?.avatar ? <img src={course.instructor.avatar} className="w-full h-full object-cover" /> : course.instructor?.name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-white truncate leading-none uppercase tracking-tight">
                                {course.instructor?.name || 'Institutional Host'}
                            </p>
                            <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                                <ShieldCheck className="h-2.5 w-2.5" /> Verified Node
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sector Badge */}
                <div className="absolute top-5 left-5 z-10">
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] bg-indigo-500/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20 shadow-xl">
                        {course.category}
                    </span>
                </div>
            </div>

            {/* Protocol Action Menu */}
            <div className="absolute top-5 right-5 z-10 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-11 w-11 rounded-[1.2rem] bg-white/90 backdrop-blur-md border border-white shadow-2xl hover:bg-white text-slate-600 hover:text-indigo-500 active:scale-90 transition-all">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-[1.5rem] border-0 shadow-[0_20px_70px_rgb(0,0,0,0.15)] p-2 min-w-[180px] bg-white animate-in zoom-in-95 duration-200">
                        <DropdownMenuItem onClick={onEdit} className="rounded-lg px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer gap-4 text-slate-600 focus:bg-indigo-50 focus:text-indigo-600 transition-colors">
                            <Edit3 className="h-4 w-4" /> Manage Protocol
                        </DropdownMenuItem>
                        <div className="h-px bg-slate-50 my-1 mx-2" />
                        <DropdownMenuItem onClick={onDelete} className="rounded-lg px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer gap-4 text-rose-500 focus:bg-rose-50 focus:text-rose-600 transition-colors">
                            <Trash2 className="h-4 w-4" /> Purge Asset
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardContent className="p-8 flex flex-col flex-1 relative bg-white/40">
                {/* Title and Intel */}
                <div className="space-y-2 mb-6">
                    <h3 className="text-lg font-black text-slate-800 leading-[1.2] group-hover:text-indigo-600 transition-colors line-clamp-1 uppercase tracking-tight">
                        {course.title}
                    </h3>
                    <p className="text-[12px] text-slate-500/80 line-clamp-2 leading-relaxed font-bold italic">
                        "{course.description}"
                    </p>
                </div>

                {/* Analytical Matrix */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-6 border-y border-slate-100 py-6 relative">
                    <StatItem icon={Monitor} label="Node:" value={course.class_name} />
                    <StatItem icon={BookOpen} label="Asset" value={course.total_lessons} />
                    <StatItem icon={Clock} label="" value={course.total_hours} className="col-span-2 text-indigo-500" />
                    <StatItem icon={FileText} label="Matrix" value={course.total_exams} />
                    <StatItem icon={PenTool} label="Task" value={course.total_assignments} />
                </div>

                {/* Valuation */}
                <div className="flex items-baseline gap-4 mb-8">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-800 tabular-nums">${course.price}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commitment</span>
                    </div>
                    {course.original_price > 0 && <span className="text-[11px] font-bold text-slate-300 line-through tabular-nums">${course.original_price}</span>}
                </div>

                {/* Tactical Actions */}
                <div className="flex gap-4 mt-auto">
                    <Button className="flex-[1.5] h-12 rounded-full bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.25em] shadow-xl shadow-slate-200 hover:bg-slate-900 active:scale-95 transition-all">
                        Curriculum
                    </Button>
                    <Button variant="outline" className="flex-1 h-12 rounded-full border-slate-100 bg-white text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 active:scale-95 transition-all shadow-sm">
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function StatItem({ icon: Icon, label, value, className }: { icon: any, label: string, value: any, className?: string }) {
    return (
        <div className={cn("flex items-center gap-4", className)}>
            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                <Icon className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <div className="flex flex-col min-w-0">
                <p className="text-[10px] font-black text-slate-700 truncate uppercase tracking-tight">{value || 'N/A'}</p>
                {label && <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60 leading-none mt-0.5">{label}</p>}
            </div>
        </div>
    );
}

function FormInput({ label, value, onChange, placeholder, type = "text", icon }: { label: string, value: string, onChange: (val: string) => void, placeholder: string, type?: string, icon?: React.ReactNode }) {
    return (
        <div className="space-y-3 group">
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1 flex items-center gap-2 group-focus-within:text-indigo-500 transition-colors">
                {icon} {label}
            </label>
            <Input 
                required 
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-14 rounded-[1.5rem] border-2 border-slate-50 bg-slate-50/50 focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 focus-visible:bg-white transition-all font-bold text-sm px-6 shadow-inner" 
                placeholder={placeholder}
            />
        </div>
    );
}
