"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, FileText, BarChart3, Trophy, UserCheck, Plus, Monitor, Eye, Copy, FileSpreadsheet, Printer, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";

const reportLinks = [
    { name: "Result Report", icon: FileText },
    { name: "Exams Report", icon: FileText },
    { name: "Student Exams Attempt Report", icon: UserCheck },
    { name: "Exams Rank Report", icon: Trophy },
];

const searchTypeOptions = [
    { value: "today", label: "Today" },
    { value: "this_week", label: "This Week" },
    { value: "last_week", label: "Last Week" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "this_year", label: "This Year" },
    { value: "last_year", label: "Last Year" },
    { value: "all", label: "All" },
];

interface OnlineExam {
    id: string;
    title: string;
}

interface SchoolClass {
    id: string;
    name: string;
    sections: { id: string; name: string }[];
}

export default function OnlineExaminationsReportPage() {
    const [activeTab, setActiveTab] = useState("Result Report");
    const [exams, setExams] = useState<OnlineExam[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedExam, setSelectedExam] = useState<string>("");
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [selectedSection, setSelectedSection] = useState<string>("");
    const [searchType, setSearchType] = useState<string>("today");
    const [dateType, setDateType] = useState<string>("all");
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSearched, setIsSearched] = useState(false);

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/reports/online-examinations/criteria');
            setExams(response.data.exams);
            setClasses(response.data.classes);
        } catch (error) {
            console.error("Failed to fetch criteria", error);
        }
    };

    const handleSearch = async () => {
        if (activeTab === "Result Report") {
            if (!selectedExam || !selectedClass || !selectedSection) return;
        }
        
        setLoading(true);
        try {
            let response;
            if (activeTab === "Result Report") {
                response = await api.get('/reports/online-examinations/result', {
                    params: {
                        online_exam_id: selectedExam,
                        school_class_id: selectedClass,
                        section_id: selectedSection,
                    }
                });
            } else if (activeTab === "Exams Report") {
                response = await api.get('/reports/online-examinations/exams', {
                    params: {
                        search_type: searchType,
                        date_type: dateType,
                    }
                });
            }
            
            if (response) {
                setReportData(response.data.data);
                setIsSearched(true);
            }
        } catch (error) {
            console.error("Failed to fetch report", error);
        } finally {
            setLoading(false);
        }
    };

    const sections = classes.find(c => c.id.toString() === selectedClass)?.sections || [];

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Online Examinations Report</h1>

            {/* Report Links Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {reportLinks.map((link) => {
                        const isActive = activeTab === link.name;
                        return (
                            <div 
                                key={link.name}
                                onClick={() => {
                                    setActiveTab(link.name);
                                    setReportData([]);
                                    setIsSearched(false);
                                }}
                                className={cn(
                                    "flex items-center gap-3 p-3 px-4 rounded-lg border transition-all duration-300 cursor-pointer group relative overflow-hidden",
                                    isActive 
                                        ? "bg-white border-gray-300 shadow-[0_10px_25px_rgba(0,0,0,0.08)] ring-1 ring-gray-400/10 -translate-y-0.5" 
                                        : "bg-white border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-gray-200 hover:-translate-y-0.5"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg transition-all duration-300",
                                    isActive ? "bg-gray-100 text-gray-900 shadow-inner" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600"
                                )}>
                                    <link.icon className="h-4 w-4" />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold tracking-tight uppercase transition-colors duration-300",
                                    isActive ? "text-gray-900" : "text-gray-500 group-hover:text-gray-700"
                                )}>
                                    {link.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                
                {activeTab === "Result Report" ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Exam <span className="text-red-500">*</span></Label>
                            <Select value={selectedExam} onValueChange={setSelectedExam}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map(exam => (
                                        <SelectItem key={exam.id} value={exam.id.toString()}>{exam.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                            <Select value={selectedClass} onValueChange={(val) => { setSelectedClass(val); setSelectedSection(""); }}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {sections.map(sec => (
                                        <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ) : activeTab === "Exams Report" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type <span className="text-red-500">*</span></Label>
                            <Select value={searchType} onValueChange={setSearchType}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {searchTypeOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Date Type</Label>
                            <Select value={dateType} onValueChange={setDateType}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 text-gray-400 italic">Criteria for this report coming soon...</div>
                )}

                {(activeTab === "Result Report" || activeTab === "Exams Report") && (
                    <div className="flex justify-end">
                        <Button 
                            onClick={handleSearch}
                            disabled={loading}
                            className="btn-gradient text-white px-6 h-9 text-xs font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? "Searching..." : "Search"}
                        </Button>
                    </div>
                )}
            </div>

            {/* Report Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="w-full bg-white border border-gray-200 rounded-md py-1.5 pl-9 pr-4 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                        />
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-3 flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Show</span>
                            <Select defaultValue="50">
                                <SelectTrigger className="h-7 w-16 border-gray-200 text-[11px] shadow-none rounded">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" title="Copy" className="h-7 w-7 text-gray-400 hover:text-indigo-600 border border-gray-100 bg-gray-50/30 rounded shadow-sm">
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Excel" className="h-7 w-7 text-gray-400 hover:text-emerald-600 border border-gray-100 bg-gray-50/30 rounded shadow-sm">
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" title="CSV" className="h-7 w-7 text-gray-400 hover:text-amber-600 border border-gray-100 bg-gray-50/30 rounded shadow-sm">
                                <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" title="PDF" className="h-7 w-7 text-gray-400 hover:text-rose-600 border border-gray-100 bg-gray-50/30 rounded shadow-sm">
                                <FileDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Print" className="h-7 w-7 text-gray-400 hover:text-gray-900 border border-gray-100 bg-gray-50/30 rounded shadow-sm">
                                <Printer className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-full">
                        <TableHeader className="bg-transparent">
                            {activeTab === "Result Report" ? (
                                <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Admission No</TableHead>
                                    <TableHead className="py-3 px-4">Student Name</TableHead>
                                    <TableHead className="py-3 px-4">Class</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Total Attempt</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Remaining Attempt</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Exam Submitted</TableHead>
                                    <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                </TableRow>
                            ) : activeTab === "Exams Report" ? (
                                <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Exam</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Attempt</TableHead>
                                    <TableHead className="py-3 px-4">Exam From</TableHead>
                                    <TableHead className="py-3 px-4">Exam To</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Duration</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Total Students</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Questions</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Exam Published</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Result Published</TableHead>
                                </TableRow>
                            ) : null}
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={activeTab === "Result Report" ? 7 : 9} className="text-center py-12">
                                        <div className="flex items-center justify-center gap-2 text-gray-400">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                                            Loading report...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : reportData.length > 0 ? (
                                reportData.map((item, index) => (
                                    <TableRow key={index} className="hover:bg-gray-50/50 border-b border-gray-100 text-[11px] text-gray-600">
                                        {activeTab === "Result Report" ? (
                                            <>
                                                <TableCell className="py-3 px-4 font-medium">{item.admission_no}</TableCell>
                                                <TableCell className="py-3 px-4 font-bold text-gray-800">{item.student_name}</TableCell>
                                                <TableCell className="py-3 px-4">{item.class}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-700">{item.total_attempt}</span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-700">{item.remaining_attempt}</span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded font-bold",
                                                        item.exam_submitted === 'Yes' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                    )}>
                                                        {item.exam_submitted}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </>
                                        ) : activeTab === "Exams Report" ? (
                                            <>
                                                <TableCell className="py-3 px-4 font-bold text-gray-800">{item.exam}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">{item.attempt}</TableCell>
                                                <TableCell className="py-3 px-4">{item.exam_from}</TableCell>
                                                <TableCell className="py-3 px-4">{item.exam_to}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">{item.duration}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">{item.total_students}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">{item.questions}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <div className="flex justify-center">
                                                        {item.exam_published ? <UserCheck className="h-4 w-4 text-emerald-500" /> : <Plus className="h-4 w-4 text-gray-300 rotate-45" />}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <div className="flex justify-center">
                                                        {item.result_published ? <UserCheck className="h-4 w-4 text-emerald-500" /> : <Plus className="h-4 w-4 text-gray-300 rotate-45" />}
                                                    </div>
                                                </TableCell>
                                            </>
                                        ) : null}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow className="hover:bg-transparent h-64">
                                    <TableCell colSpan={activeTab === "Result Report" ? 7 : 9} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                            <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest whitespace-nowrap">
                                                {isSearched ? "No results found for selected criteria" : "No data available in table"}
                                            </p>
                                            <div className="relative">
                                                <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                    <Monitor className="h-8 w-8 text-gray-200" />
                                                </div>
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                    <Plus className="h-3 w-3 text-indigo-300" />
                                                </div>
                                            </div>
                                            <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                <span className="text-lg">←</span> Add new record or search with different criteria.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                    <div>Showing {reportData.length > 0 ? 1 : 0} to {reportData.length} of {reportData.length} entries</div>
                </div>
            </div>
        </div>
    );
}
