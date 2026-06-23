"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Plus,
    Search,
    FileSpreadsheet,
    FileText,
    FileDigit,
    Printer,
    Trash2,
    FileUp,
    ChevronDown,
    Loader2,
    Copy,
    RefreshCw,
    Edit3,
    MoreVertical,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

interface Question {
    id: number;
    class_name: string;
    question_type: string;
    level: string;
    question: string;
    creator?: { name: string };
}

export default function QuestionBankPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [viewEntries, setViewEntries] = useState(100);
    const [searchQuery, setSearchQuery] = useState("");
    const [criteria, setCriteria] = useState<{
        tags: string[],
        types: string[],
        levels: string[],
        creators: { id: number, name: string }[]
    }>({ tags: [], types: [], levels: [], creators: [] });

    // Filter State
    const [filters, setFilters] = useState({
        tag: "",
        type: "",
        level: "",
        created_by: ""
    });

    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [totalEntries, setTotalEntries] = useState(0);

    useEffect(() => {
        fetchCriteria();
        fetchQuestions();
    }, []);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/online-course/questions/criteria');
            setCriteria(response.data);
        } catch (error) {
            console.error("Failed to fetch analytical criteria");
        }
    };

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const response = await api.get('/online-course/questions', {
                params: {
                    ...filters,
                    search: searchQuery,
                    per_page: viewEntries
                }
            });
            setQuestions(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: t("error"), description: t("failed_to_fetch_question_bank"), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t("are_you_sure_delete_this_question"))) return;
        try {
            await api.delete(`/online-course/questions/${id}`);
            toast({ title: t("success"), description: t("question_removed_from_bank") });
            fetchQuestions();
        } catch (error) {
            toast({ title: t("error"), description: t("failed_to_delete_question"), variant: "destructive" });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(t("are_you_sure_delete_x_questions", { count: selectedIds.length }))) return;

        try {
            await api.post('/online-course/questions/bulk-delete', { ids: selectedIds });
            toast({ title: t("success"), description: t("selected_questions_deleted") });
            setSelectedIds([]);
            fetchQuestions();
        } catch (error) {
            toast({ title: t("error"), description: t("bulk_deletion_failed"), variant: "destructive" });
        }
    };

    const toggleAll = () => {
        if (selectedIds.length === questions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(questions.map(q => q.id));
        }
    };

    const toggleOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
            {/* Select Criteria Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <HelpCircle className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("question_strategy_engine")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("build_and_filter_question_bank")}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button className="h-9 px-6 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg active:scale-95 transition-all">
                            <Plus className="h-4 w-4" />
                            {t("add_tag")}
                        </Button>
                        <Button className="h-9 px-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg active:scale-95 transition-all">
                            <Plus className="h-4 w-4" />
                            {t("add_question")}
                        </Button>
                        <Button className="h-9 px-6 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg active:scale-95 transition-all">
                            <FileUp className="h-4 w-4" />
                            {t("import")}
                        </Button>
                        <Button
                            onClick={handleBulkDelete}
                            disabled={selectedIds.length === 0}
                            className="h-9 px-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            {t("bulk_delete")} ({selectedIds.length})
                        </Button>
                    </div>
                </div>
                <CardContent className="p-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                        <CriteriaSelect
                            label={t("question_tag")}
                            options={criteria.tags.map(t => ({ id: t, name: t }))}
                            value={filters.tag}
                            onChange={(val) => setFilters({...filters, tag: val})}
                            placeholder={t("select_registry_node")}
                        />
                        <CriteriaSelect
                            label={t("question_type")}
                            options={criteria.types.map(t => ({ id: t, name: t }))}
                            value={filters.type}
                            onChange={(val) => setFilters({...filters, type: val})}
                            placeholder={t("select_registry_node")}
                        />
                        <CriteriaSelect
                            label={t("question_level")}
                            options={criteria.levels.map(t => ({ id: t, name: t }))}
                            value={filters.level}
                            onChange={(val) => setFilters({...filters, level: val})}
                            placeholder={t("select_registry_node")}
                        />
                        <CriteriaSelect
                            label={t("created_by")}
                            options={criteria.creators}
                            value={filters.created_by}
                            onChange={(val) => setFilters({...filters, created_by: val})}
                            placeholder={t("select_registry_node")}
                        />

                        <div className="lg:col-start-4 flex justify-end">
                            <Button
                                onClick={fetchQuestions}
                                disabled={loading}
                                className="h-14 px-12 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-[11px] font-black uppercase tracking-[0.2em] gap-3 shadow-2xl shadow-orange-200/50 active:scale-95 transition-all group"
                            >
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                                {t("filter_questions")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Question Bank Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-muted/50">
                    <CardTitle className="text-lg font-black tracking-tight text-slate-700 uppercase">{t("institutional_question_registry")}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Table Tools */}
                    <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-muted/10 bg-gray-50/30">
                        <div className="relative w-full md:w-[400px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder={t("search_through_question_nodes")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
                                className="pl-12 h-12 rounded-lg bg-white border-gray-100 focus-visible:ring-indigo-500/20 transition-all shadow-none text-sm font-bold tracking-tight"
                            />
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="flex items-center bg-white border border-gray-100 rounded-lg px-4 h-12 shadow-sm">
                                <select
                                    value={viewEntries}
                                    onChange={(e) => setViewEntries(Number(e.target.value))}
                                    className="bg-transparent text-[11px] font-black uppercase border-none focus:ring-0 cursor-pointer min-w-[80px]"
                                >
                                    <option value={100}>{t("x_nodes", { count: 100 })}</option>
                                    <option value={50}>{t("x_nodes", { count: 50 })}</option>
                                    <option value={20}>{t("x_nodes", { count: 20 })}</option>
                                </select>
                                <ChevronDown className="h-3 w-3 text-muted-foreground ml-2 pointer-events-none" />
                            </div>
                            <div className="flex items-center gap-1.5 ml-2">
                                <TableToolButton icon={Copy} />
                                <TableToolButton icon={FileSpreadsheet} />
                                <TableToolButton icon={FileText} />
                                <TableToolButton icon={FileDigit} />
                                <TableToolButton icon={Printer} />
                            </div>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto relative min-h-[500px]">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-muted/30 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] border-b border-muted/50">
                                <tr>
                                    <th className="px-8 py-5 w-12 text-center">
                                        <Checkbox
                                            checked={questions.length > 0 && selectedIds.length === questions.length}
                                            onCheckedChange={toggleAll}
                                            className="rounded-md border-gray-300"
                                        />
                                    </th>
                                    <th className="px-6 py-5">{t("q_identity")}</th>
                                    <th className="px-6 py-5">{t("tag_node")}</th>
                                    <th className="px-6 py-5">{t("classification")}</th>
                                    <th className="px-6 py-5 text-center">{t("difficulty")}</th>
                                    <th className="px-6 py-5 w-[400px]">{t("content_insight")}</th>
                                    <th className="px-6 py-5">{t("curator")}</th>
                                    <th className="px-8 py-5 text-right">{t("utility")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr className="hover:bg-transparent">
                                        <td colSpan={8} className="px-6 py-32 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-6">
                                                <div className="relative">
                                                    <Loader2 className="h-16 w-16 text-indigo-500/20 animate-spin" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse shadow-lg shadow-indigo-100" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.3em] animate-pulse">{t("executing_question_audit")}</p>
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest italic">{t("decrypting_question_bank_nodes")}</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : questions.length === 0 ? (
                                    <tr className="hover:bg-transparent">
                                        <td colSpan={8} className="px-6 py-32 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-6">
                                                <div className="p-10 rounded-[3rem] bg-indigo-50/50 text-indigo-300 transform -rotate-3 shadow-inner">
                                                    <HelpCircle className="h-16 w-16 opacity-30" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-rose-500/60 font-black text-[10px] uppercase tracking-[0.3em] bg-rose-50 px-6 py-2 rounded-full border border-rose-100">{t("no_data_nodes_available")}</p>
                                                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-tighter italic">{t("initiate_search_to_populate_registry")}</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    questions.map((q, index) => (
                                        <tr key={q.id} className={cn(
                                            "border-b border-muted/10 hover:bg-indigo-50/30 transition-all group",
                                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'
                                        )}>
                                            <td className="px-8 py-5 text-center">
                                                <Checkbox
                                                    checked={selectedIds.includes(q.id)}
                                                    onCheckedChange={() => toggleOne(q.id)}
                                                    className="rounded-md border-gray-300"
                                                />
                                            </td>
                                            <td className="px-6 py-5 font-black text-indigo-600 text-[11px] tracking-widest tabular-nums uppercase">#{q.id}</td>
                                            <td className="px-6 py-5">
                                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest border border-slate-200">{q.class_name || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-5 text-slate-600 text-[10px] font-bold uppercase tracking-tight">{q.question_type}</td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                    q.level === 'Easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    q.level === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                                )}>
                                                    {q.level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-slate-700 text-[11px] font-bold line-clamp-2 leading-relaxed tracking-tight" dangerouslySetInnerHTML={{ __html: q.question }} />
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 font-black text-[8px] uppercase">{q.creator?.name?.[0]}</div>
                                                    <span className="text-slate-500 text-[10px] font-bold">{q.creator?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-lg border-gray-100 shadow-2xl p-2 min-w-[160px]">
                                                        <DropdownMenuItem className="rounded-lg px-4 py-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer gap-3 text-indigo-600 focus:bg-indigo-50">
                                                            <Edit3 className="h-3.5 w-3.5" /> {t("edit_node")}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(q.id)} className="rounded-lg px-4 py-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer gap-3 text-rose-600 focus:bg-rose-50">
                                                            <Trash2 className="h-3.5 w-3.5" /> {t("purge_entry")}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-8 py-6 bg-muted/10 border-t border-muted/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                            {t("showing_x_to_y_of_z", { from: questions.length > 0 ? 1 : 0, to: questions.length, total: totalEntries })}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg border-muted/50 text-muted-foreground hover:bg-card transition-all" disabled>
                                <ChevronDown className="h-4 w-4 rotate-90" />
                            </Button>
                            <Button className="h-10 w-10 rounded-lg border-none p-0 text-white font-black text-xs active:scale-95 transition-all shadow-xl shadow-orange-500/10 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                                1
                            </Button>
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg border-muted/50 text-muted-foreground hover:bg-card transition-all" disabled>
                                <ChevronDown className="h-4 w-4 -rotate-90" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function CriteriaSelect({ label, options, value, onChange, placeholder }: { label: string, options: any[], value: string, onChange: (val: string) => void, placeholder: string }) {
    return (
        <div className="space-y-3 group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-primary transition-colors">
                {label}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex h-12 w-full rounded-lg border border-muted/50 bg-white px-6 py-2 text-[11px] font-black uppercase tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer shadow-none"
                >
                    <option value="">{placeholder}</option>
                    {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
        </div>
    );
}

function TableToolButton({ icon: Icon }: { icon: any }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 active:scale-90 transition-all shadow-sm"
        >
            <Icon className="h-4 w-4" />
        </Button>
    );
}
