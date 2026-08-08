"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowRightSquare,
    ArrowUpDown,
    Users,
    BookPlus,
    Loader2,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LibraryMember {
    id: number;
    member_id: string;
    library_card_no: string;
    member_type: string;
    user_id?: number;
    user?: {
        name: string;
        admission_no?: string;
        phone?: string;
        staff_id?: string;
        school_class_id?: number;
        section_id?: number;
        school_class?: { id?: number; name: string };
        schoolClass?: { id?: number; name: string };
        section?: { id?: number; name: string };
    };
}

interface BookOption {
    id: number;
    title: string;
    book_number: string;
    available: number;
}

interface ClassOption {
    id: number | string;
    name: string;
}

interface SectionOption {
    id: number | string;
    name: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const TABLE_COLS = 7;

function SkeletonRows({ rows = 6, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div
                                className="h-3 rounded bg-gray-200/70 animate-pulse"
                                style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function LibraryMembersPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [members, setMembers] = useState<LibraryMember[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState("50");

    // Issue Book Modal State
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [sections, setSections] = useState<SectionOption[]>([]);
    const [selectedClass, setSelectedClass] = useState("all");
    const [selectedSection, setSelectedSection] = useState("all");

    const [allMembers, setAllMembers] = useState<LibraryMember[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<LibraryMember[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState("");

    const [availableBooks, setAvailableBooks] = useState<BookOption[]>([]);
    const [selectedBookId, setSelectedBookId] = useState("");

    const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
    const [dueDate, setDueDate] = useState("");
    const [remark, setRemark] = useState("");

    const [modalLoading, setModalLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchMembers = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/library/members?only_members=1&page=${page}&search=${searchTerm}&limit=${limit}`);
            setMembers(response.data.data ?? response.data ?? []);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching members:", error);
            tt.error("failed_to_fetch_library_members");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit]);

    const openIssueModal = async (memberToPreselect?: LibraryMember) => {
        setIsIssueModalOpen(true);
        setModalLoading(true);
        try {
            // Fetch classes
            const classRes = await api.get("/academics/classes?no_paginate=true").catch(() => null);
            if (classRes?.data?.data) {
                setClasses(classRes.data.data);
            }

            // Fetch available books
            const bookRes = await api.get("/library/books?no_paginate=true").catch(() => null);
            const rawBooks = bookRes?.data?.data ?? bookRes?.data ?? [];
            if (Array.isArray(rawBooks)) {
                setAvailableBooks(rawBooks.filter((b: BookOption) => (b.available ?? 1) > 0));
            }

            // Fetch all members for modal selection dropdown
            const memRes = await api.get("/library/members?no_paginate=true").catch(() => null);
            const rawMems = memRes?.data?.data ?? memRes?.data ?? members;
            const memList = Array.isArray(rawMems) && rawMems.length > 0 ? rawMems : members;
            setAllMembers(memList);
            setFilteredMembers(memList);

            if (memberToPreselect) {
                setSelectedMemberId(String(memberToPreselect.id));
            } else {
                setSelectedMemberId("");
            }
            setSelectedClass("all");
            setSelectedSection("all");
            setSelectedBookId("");
            setIssueDate(new Date().toISOString().split("T")[0]);
            setDueDate("");
            setRemark("");
        } catch (err) {
            console.error("Error opening issue modal:", err);
        } finally {
            setModalLoading(false);
        }
    };

    const handleClassChange = async (classId: string) => {
        setSelectedClass(classId);
        setSelectedSection("all");
        setSelectedMemberId("");

        if (classId === "all") {
            setSections([]);
            setFilteredMembers(allMembers);
            return;
        }

        try {
            const res = await api.get(`/academics/sections?school_class_id=${classId}&no_paginate=true`).catch(() => null);
            if (res?.data?.data) {
                setSections(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching sections:", err);
        }

        const filtered = allMembers.filter((m) => {
            const clsId = m.user?.school_class_id || m.user?.schoolClass?.id || m.user?.school_class?.id;
            return String(clsId) === String(classId);
        });
        setFilteredMembers(filtered.length > 0 ? filtered : allMembers);
    };

    const handleSectionChange = (sectionId: string) => {
        setSelectedSection(sectionId);
        setSelectedMemberId("");

        if (sectionId === "all") {
            const filtered = allMembers.filter((m) => {
                const clsId = m.user?.school_class_id || m.user?.schoolClass?.id || m.user?.school_class?.id;
                return selectedClass === "all" || String(clsId) === String(selectedClass);
            });
            setFilteredMembers(filtered.length > 0 ? filtered : allMembers);
            return;
        }

        const filtered = allMembers.filter((m) => {
            const secId = m.user?.section_id || m.user?.section?.id;
            return String(secId) === String(sectionId);
        });
        setFilteredMembers(filtered.length > 0 ? filtered : allMembers);
    };

    const handleIssueSubmit = async () => {
        if (!selectedMemberId) {
            tt.error("please_select_member");
            return;
        }
        if (!selectedBookId) {
            tt.error("please_select_book");
            return;
        }
        if (!dueDate) {
            tt.error("please_select_due_date");
            return;
        }

        setSubmitting(true);
        try {
            await api.post("/library/book-issues", {
                member_id: selectedMemberId,
                book_id: Number(selectedBookId),
                issue_date: issueDate,
                due_date: dueDate,
                remark: remark,
            });
            tt.success("book_issued_successfully");
            setIsIssueModalOpen(false);
            fetchMembers(1);
        } catch (err) {
            console.error("Error issuing book:", err);
            tt.error("failed_to_issue_book");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchMembers(1);
    };

    const handleCopy = () => {
        const text = members.map(m => `${m.user?.name}\t${m.member_id}\t${m.member_type}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const handleExportCSV = () => {
        const headers = ["Member ID", "Card No", "Admission No", "Name", "Type", "Phone"];
        const rows = members.map(m => [m.member_id, m.library_card_no || "-", m.user?.admission_no || "-", m.user?.name, m.member_type, m.user?.phone || "-"]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "library_members.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="space-y-6">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                <div className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Users className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("library_members")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("members_registered_count", { count: pagination?.total ?? members.length })}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => openIssueModal()}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                        <BookPlus className="h-4 w-4" />
                        {t("issue_books")}
                    </Button>
                </div>
                <CardContent className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder={t("search_by_name_member_id")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                                <Search className="h-4 w-4" /> {t("search")}
                            </Button>
                        </form>

                        <div className="flex items-center gap-2">
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="w-[70px] h-9 text-xs">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                {toolbarActions.map((action, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        onClick={action.onClick}
                                        title={action.title}
                                        className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                    >
                                        <action.Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Members Table */}
                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[800px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("member_id")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("library_card_no")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("admission_no")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("name")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("member_type")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("phone")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows rows={6} cols={TABLE_COLS} />
                                ) : members.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            {t("no_members_found")}
                                        </TableCell>
                                    </TableRow>
                                ) : members.map((member) => (
                                    <TableRow key={member.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                        <TableCell className="py-3 text-gray-500">{member.member_id}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{member.library_card_no || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{member.user?.admission_no || member.user?.staff_id || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-700 font-medium">{member.user?.name}</TableCell>
                                        <TableCell className="py-3 text-gray-500 capitalize">{member.member_type}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{member.user?.phone || "-"}</TableCell>
                                        <TableCell className="py-3 text-right flex justify-end gap-1.5">
                                            <Button
                                                size="sm"
                                                onClick={() => openIssueModal(member)}
                                                className="h-7 px-2.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all text-[10px] font-bold gap-1"
                                                title={t("issue_books")}
                                            >
                                                <BookPlus className="h-3.5 w-3.5" />
                                                <span>{t("issue_books")}</span>
                                            </Button>
                                            <Link href={`/dashboard/library/member/issue/${member.member_id}`}>
                                                <Button size="sm" variant="outline" className="h-7 w-7 rounded p-0 shadow-sm active:scale-95 transition-all" title={t("view_issued_books")}>
                                                    <ArrowRightSquare className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                        <div>
                            {t("showing_x_to_y_of_z", { from: pagination?.from || 0, to: pagination?.to || 0, total: pagination?.total || 0 })}
                        </div>
                        <div className="flex gap-1 items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination || pagination.current_page === 1}
                                onClick={() => fetchMembers(pagination!.current_page - 1)}
                                className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                <Button
                                    key={i + 1}
                                    size="sm"
                                    onClick={() => fetchMembers(i + 1)}
                                    className={cn(
                                        "h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all",
                                        pagination?.current_page === i + 1
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md"
                                            : "bg-white text-gray-600 border border-gray-200"
                                    )}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination || pagination.current_page === pagination.last_page}
                                onClick={() => fetchMembers(pagination!.current_page + 1)}
                                className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Issue Book Modal */}
            <Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-xl">
                    <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10 border-b border-gray-100 flex flex-row items-center gap-3 space-y-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BookPlus className="h-5 w-5" />
                        </span>
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-800">{t("issue_books")}</DialogTitle>
                            <p className="text-xs text-gray-500 mt-0.5">{t("lend_book_to_student_or_member")}</p>
                        </div>
                    </DialogHeader>

                    {modalLoading ? (
                        <div className="flex items-center justify-center p-8 text-gray-500 gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                            <span className="text-xs font-medium">{t("loading_issue_details")}...</span>
                        </div>
                    ) : (
                        <div className="p-6 space-y-4 text-xs">
                            {/* Class & Section Filter */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("class")}</Label>
                                    <Select value={selectedClass} onValueChange={handleClassChange}>
                                        <SelectTrigger className="h-9 border-gray-200 text-xs rounded">
                                            <SelectValue placeholder={t("all_classes")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t("all_classes")}</SelectItem>
                                            {classes.map((cls) => (
                                                <SelectItem key={cls.id} value={String(cls.id)}>
                                                    {cls.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("section")}</Label>
                                    <Select value={selectedSection} onValueChange={handleSectionChange} disabled={selectedClass === "all"}>
                                        <SelectTrigger className="h-9 border-gray-200 text-xs rounded">
                                            <SelectValue placeholder={t("all_sections")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t("all_sections")}</SelectItem>
                                            {sections.map((sec) => (
                                                <SelectItem key={sec.id} value={String(sec.id)}>
                                                    {sec.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Member Selection */}
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                    {t("select_member_student")} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded">
                                        <SelectValue placeholder={t("select_student_or_staff")} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[220px]">
                                        {filteredMembers.map((m) => (
                                            <SelectItem key={m.id} value={String(m.id)}>
                                                {m.user?.name || `Member #${m.member_id}`} ({m.member_type?.toUpperCase()}) - Card: {m.library_card_no || m.member_id}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Book Selection */}
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                    {t("select_book")} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded">
                                        <SelectValue placeholder={t("select_available_book")} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[220px]">
                                        {availableBooks.length === 0 ? (
                                            <SelectItem value="none" disabled>{t("no_available_books")}</SelectItem>
                                        ) : (
                                            availableBooks.map((b) => (
                                                <SelectItem key={b.id} value={String(b.id)}>
                                                    {b.title} (#{b.book_number}) — Available: {b.available ?? 1}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("issue_date")}</Label>
                                    <Input
                                        type="date"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                        className="h-9 border-gray-200 text-xs rounded"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                        {t("due_return_date")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        min={issueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="h-9 border-gray-200 text-xs rounded"
                                    />
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("remark_notes")}</Label>
                                <Input
                                    placeholder={t("optional_remarks_or_notes")}
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                    className="h-9 border-gray-200 text-xs rounded"
                                />
                            </div>

                            <DialogFooter className="pt-2 flex justify-end gap-2">
                                <Button variant="outline" type="button" onClick={() => setIsIssueModalOpen(false)} className="h-8 px-4 text-xs font-semibold">
                                    {t("cancel")}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleIssueSubmit}
                                    disabled={submitting || !selectedMemberId || !selectedBookId || !dueDate}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white h-8 px-5 text-xs font-bold uppercase rounded shadow-sm"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                            {t("issuing")}...
                                        </>
                                    ) : (
                                        t("issue_book")
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

