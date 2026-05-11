"use client";

import { useState, useEffect } from "react";
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
import { Search, FileText, PieChart, Users, UserPlus, ClipboardList, BookOpen, Key, CalendarCheck, Ghost, GraduationCap, ChevronLeft, ChevronRight, MenuIcon, Pencil, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const reportLinks = [
    {
        group: [
            { name: "Student Report", icon: FileText, active: true },
            { name: "Student History", icon: ClipboardList },
            { name: "Class Subject Report", icon: BookOpen },
            { name: "Student Profile", icon: UserPlus },
            { name: "Online Admission Report", icon: GraduationCap },
        ]
    },
    {
        group: [
            { name: "Class & Section Report", icon: ClipboardList },
            { name: "Student Login Credential", icon: Key },
            { name: "Admission Report", icon: FileText },
            { name: "Student Gender Ratio Report", icon: PieChart },
        ]
    },
    {
        group: [
            { name: "Guardian Report", icon: Users },
            { name: "Parent Login Credential", icon: Key },
            { name: "Sibling Report", icon: Users },
            { name: "Student Teacher Ratio Report", icon: Users },
        ]
    }
];

export default function StudentInformationReportPage() {
    const { toast } = useToast();
    
    // Data states
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    
    // Filter states
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedGender, setSelectedGender] = useState("all");
    const [selectedRte, setSelectedRte] = useState("all");

    // Pagination & Loading
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const itemsPerPageNum = 50;

    // View Modal
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    // Active Tab
    const [activeReportTab, setActiveReportTab] = useState("Student Report");

    // Class & Section Report State
    const [classSectionData, setClassSectionData] = useState<any[]>([]);
    const [classSectionSearch, setClassSectionSearch] = useState("");
    const [classSectionLoading, setClassSectionLoading] = useState(false);

    // Guardian Report State
    const [guardianStudents, setGuardianStudents] = useState<any[]>([]);
    const [guardianLoading, setGuardianLoading] = useState(false);
    const [guardianSearchText, setGuardianSearchText] = useState("");
    const [guardianCurrentPage, setGuardianCurrentPage] = useState(1);
    const [guardianTotalPages, setGuardianTotalPages] = useState(0);
    const [guardianTotalEntries, setGuardianTotalEntries] = useState(0);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (activeReportTab === "Class & Section Report") {
            fetchClassSectionReport();
        }
    }, [activeReportTab]);

    const fetchInitialData = async () => {
        try {
            const [classesRes, categoriesRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true'),
                api.get('/student-categories?no_paginate=true')
            ]);
            const classesData = classesRes.data?.data;
            const categoriesData = categoriesRes.data?.data;
            setClasses(Array.isArray(classesData) ? classesData : classesData?.data || []);
            setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData?.data || []);
        } catch (error) {
            console.error("Failed to fetch initial data", error);
            setClasses([]);
            setCategories([]);
        }
    };

    const fetchClassSectionReport = async () => {
        setClassSectionLoading(true);
        try {
            const params = new URLSearchParams();
            if (classSectionSearch) params.append('search', classSectionSearch);
            params.append('limit', '50');
            const res = await api.get(`/student-reports/class-section?${params.toString()}`);
            setClassSectionData(res.data.data.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch class & section report data.",
                variant: "destructive"
            });
        } finally {
            setClassSectionLoading(false);
        }
    };

    const handleClassSectionSearch = () => {
        fetchClassSectionReport();
    };

    const handleClassChange = async (classId: string) => {
        setSelectedClass(classId);
        setSelectedSection("all");
        setSections([]);
        if (!classId || classId === "all") return;
        
        try {
            const res = await api.get(`/academics/classes/${classId}`);
            // The class show endpoint returns the class object with its sections eagerly loaded
            const sectionsData = res.data?.data?.sections;
            setSections(Array.isArray(sectionsData) ? sectionsData : []);
        } catch (error) {
            console.error("Failed to fetch sections", error);
            setSections([]);
        }
    };

    // Student History State
    const [historyStudents, setHistoryStudents] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedAdmissionYear, setSelectedAdmissionYear] = useState("all");
    const [admissionYears, setAdmissionYears] = useState<string[]>([]);

    useEffect(() => {
        fetchInitialData();
        // Generate last 10 years for admission year dropdown
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 15 }, (_, i) => (currentYear - i).toString());
        setAdmissionYears(years);
    }, []);

    const handleHistorySearch = async () => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: "Validation Error",
                description: "Please select a Class.",
                variant: "destructive"
            });
            return;
        }

        setHistoryLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('school_class_id', selectedClass);
            if (selectedAdmissionYear !== "all") params.append('admission_year', selectedAdmissionYear);
            params.append('limit', '100'); // Higher limit for history

            const res = await api.get(`/students?${params.toString()}`);
            setHistoryStudents(res.data.data.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch student history data.",
                variant: "destructive"
            });
        } finally {
            setHistoryLoading(false);
        }
    };

    // Student Login Credential State
    const [credentialStudents, setCredentialStudents] = useState<any[]>([]);
    const [credentialLoading, setCredentialLoading] = useState(false);

    const handleCredentialSearch = async () => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: "Validation Error",
                description: "Please select a Class.",
                variant: "destructive"
            });
            return;
        }

        setCredentialLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('school_class_id', selectedClass);
            if (selectedSection !== "all") params.append('section_id', selectedSection);
            params.append('limit', '100');

            const res = await api.get(`/students?${params.toString()}`);
            setCredentialStudents(res.data.data.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch student credentials.",
                variant: "destructive"
            });
        } finally {
            setCredentialLoading(false);
        }
    };

    // Parent Login Credential State
    const [parentCredentialStudents, setParentCredentialStudents] = useState<any[]>([]);
    const [parentCredentialLoading, setParentCredentialLoading] = useState(false);

    const handleParentCredentialSearch = async () => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: "Validation Error",
                description: "Please select a Class.",
                variant: "destructive"
            });
            return;
        }

        setParentCredentialLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('school_class_id', selectedClass);
            if (selectedSection !== "all") params.append('section_id', selectedSection);
            params.append('limit', '100');

            const res = await api.get(`/students?${params.toString()}`);
            setParentCredentialStudents(res.data.data.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch parent credentials.",
                variant: "destructive"
            });
        } finally {
            setParentCredentialLoading(false);
        }
    };

    // Class Subject Report State
    const [classSubjectData, setClassSubjectData] = useState<any[]>([]);
    const [classSubjectLoading, setClassSubjectLoading] = useState(false);
    const [classSubjectSearch, setClassSubjectSearch] = useState("");

    const handleClassSubjectSearch = async () => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: "Validation Error",
                description: "Please select a Class.",
                variant: "destructive"
            });
            return;
        }

        setClassSubjectLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('school_class_id', selectedClass);
            if (selectedSection !== "all") params.append('section_id', selectedSection);
            
            const res = await api.get(`/academics/class-timetables?${params.toString()}`);
            // Transform timetable data into the format expected by the report table
            const data = res.data?.data?.data || [];
            const transformed = data.map((item: any) => ({
                id: item.id,
                class: item.school_class?.name,
                section: item.section?.name,
                subject: item.subject?.name,
                teacher: `${item.staff?.first_name || ''} ${item.staff?.last_name || ''}`.trim() || 'N/A',
                time: `${item.start_time || ''} - ${item.end_time || ''}`,
                room_no: item.room_no || 'N/A'
            }));
            setClassSubjectData(transformed);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch class subject data.",
                variant: "destructive"
            });
        } finally {
            setClassSubjectLoading(false);
        }
    };

    // Admission Report State
    const [admissionData, setAdmissionData] = useState<any[]>([]);
    const [admissionLoading, setAdmissionLoading] = useState(false);
    const [selectedSearchType, setSelectedSearchType] = useState("all");

    const searchTypes = [
        { id: "today", name: "Today" },
        { id: "this_week", name: "This Week" },
        { id: "last_week", name: "Last Week" },
        { id: "this_month", name: "This Month" },
        { id: "last_month", name: "Last Month" },
        { id: "this_year", name: "This Year" },
        { id: "last_year", name: "Last Year" },
    ];

    const handleAdmissionSearch = async () => {
        if (!selectedSearchType || selectedSearchType === "all") {
            toast({
                title: "Validation Error",
                description: "Please select a Search Type.",
                variant: "destructive"
            });
            return;
        }

        setAdmissionLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('search_type', selectedSearchType);
            params.append('limit', '100');

            const res = await api.get(`/students?${params.toString()}`);
            setAdmissionData(res.data.data.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch admission report.",
                variant: "destructive"
            });
        } finally {
            setAdmissionLoading(false);
        }
    };

    // Sibling Report State
    const [siblingData, setSiblingData] = useState<any[]>([]);
    const [siblingLoading, setSiblingLoading] = useState(false);
    const [siblingSearch, setSiblingSearch] = useState("");

    const handleSiblingSearch = async () => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: "Validation Error",
                description: "Please select a Class.",
                variant: "destructive"
            });
            return;
        }

        setSiblingLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('school_class_id', selectedClass);
            if (selectedSection !== "all") params.append('section_id', selectedSection);
            params.append('with_siblings', 'true');
            params.append('limit', '100');

            const res = await api.get(`/students?${params.toString()}`);
            // Logic: A student has a sibling if there are other students with the same guardian phone
            // For now, we fetch students and their sibling info if available from the backend
            setSiblingData(res.data.data.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch sibling report.",
                variant: "destructive"
            });
        } finally {
            setSiblingLoading(false);
        }
    };

    // Student Profile Report State
    const [profileData, setProfileData] = useState<any[]>([]);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSearch, setProfileSearch] = useState("");
    const [selectedProfileSearchType, setSelectedProfileSearchType] = useState("all");

    const handleProfileSearch = async () => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: "Validation Error",
                description: "Please select a Class.",
                variant: "destructive"
            });
            return;
        }

        setProfileLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('school_class_id', selectedClass);
            if (selectedSection !== "all") params.append('section_id', selectedSection);
            if (selectedProfileSearchType !== "all") params.append('search_type', selectedProfileSearchType);
            params.append('limit', '100');

            const res = await api.get(`/students?${params.toString()}`);
            setProfileData(res.data.data.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch student profile report.",
                variant: "destructive"
            });
        } finally {
            setProfileLoading(false);
        }
    };

    // Student Gender Ratio Report State
    const [genderRatioData, setGenderRatioData] = useState<any[]>([]);
    const [genderRatioLoading, setGenderRatioLoading] = useState(false);
    const [genderRatioSearch, setGenderRatioSearch] = useState("");

    const fetchGenderRatioReport = async () => {
        setGenderRatioLoading(true);
        try {
            const res = await api.get('/student-reports/gender-ratio');
            setGenderRatioData(res.data.data.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch gender ratio report.",
                variant: "destructive"
            });
        } finally {
            setGenderRatioLoading(false);
        }
    };

    useEffect(() => {
        if (activeReportTab === "Student Gender Ratio Report") {
            fetchGenderRatioReport();
        }
    }, [activeReportTab]);

    // Student Teacher Ratio Report State
    const [teacherRatioData, setTeacherRatioData] = useState<any[]>([]);
    const [teacherRatioLoading, setTeacherRatioLoading] = useState(false);
    const [teacherRatioSearch, setTeacherRatioSearch] = useState("");

    const fetchTeacherRatioReport = async () => {
        setTeacherRatioLoading(true);
        try {
            const res = await api.get('/student-reports/student-teacher-ratio');
            setTeacherRatioData(res.data.data.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch student teacher ratio report.",
                variant: "destructive"
            });
        } finally {
            setTeacherRatioLoading(false);
        }
    };

    useEffect(() => {
        if (activeReportTab === "Student Teacher Ratio Report") {
            fetchTeacherRatioReport();
        }
    }, [activeReportTab]);

    // Online Admission Report State
    const [onlineAdmissionData, setOnlineAdmissionData] = useState<any[]>([]);
    const [onlineAdmissionLoading, setOnlineAdmissionLoading] = useState(false);
    const [selectedOnlineStatus, setSelectedOnlineStatus] = useState("all");

    const handleOnlineAdmissionSearch = async () => {
        setOnlineAdmissionLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedClass !== "all") params.append('school_class_id', selectedClass);
            if (selectedSection !== "all") params.append('section_id', selectedSection);
            if (selectedOnlineStatus !== "all") params.append('status', selectedOnlineStatus);
            params.append('limit', '100');

            const res = await api.get(`/online-admissions?${params.toString()}`);
            setOnlineAdmissionData(res.data.data.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch online admission report.",
                variant: "destructive"
            });
        } finally {
            setOnlineAdmissionLoading(false);
        }
    };

    const handleGuardianSearch = async (page = 1) => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: "Validation Error",
                description: "Please select a Class.",
                variant: "destructive"
            });
            return;
        }

        setGuardianLoading(true);
        setGuardianCurrentPage(page);
        try {
            const params = new URLSearchParams();
            params.append('school_class_id', selectedClass);
            if (selectedSection !== "all") params.append('section_id', selectedSection);
            if (guardianSearchText) params.append('search', guardianSearchText);
            params.append('page', page.toString());
            params.append('limit', itemsPerPageNum.toString());

            const res = await api.get(`/students?${params.toString()}`);
            setGuardianStudents(res.data.data.data || []);
            setGuardianTotalPages(res.data.data.last_page || 0);
            setGuardianTotalEntries(res.data.data.total || 0);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch guardian report data.",
                variant: "destructive"
            });
        } finally {
            setGuardianLoading(false);
        }
    };

    const handleSearch = async (page = 1) => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: "Validation Error",
                description: "Please select a Class.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        setCurrentPage(page);
        try {
            const params = new URLSearchParams();
            params.append('school_class_id', selectedClass);
            if (selectedSection !== "all") params.append('section_id', selectedSection);
            if (selectedCategory !== "all") params.append('category', selectedCategory);
            if (selectedGender !== "all") params.append('gender', selectedGender);
            if (selectedRte !== "all") params.append('rte', selectedRte);
            params.append('page', page.toString());
            params.append('limit', itemsPerPageNum.toString());

            const res = await api.get(`/students?${params.toString()}`);
            setStudents(res.data.data.data || []);
            setTotalPages(res.data.data.last_page || 0);
            setTotalEntries(res.data.data.total || 0);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch student report data.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Actions
    const handleView = (student: any) => {
        setSelectedStudent(student);
        setIsViewDialogOpen(true);
    };

    const handleEdit = (student: any) => {
        toast({
            title: "Redirecting",
            description: `Redirecting to edit profile for ${student.name}...`,
        });
    };

    const startIndex = (currentPage - 1) * itemsPerPageNum;

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Student Information Report</h1>

            {/* Report Links Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {reportLinks.flatMap(col => col.group).map((link) => {
                        const isActive = activeReportTab === link.name;
                        return (
                            <div 
                                key={link.name}
                                onClick={() => setActiveReportTab(link.name)}
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


            {activeReportTab === "Student Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select Class</SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sections</SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Category</Label>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.category_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Gender</Label>
                                <Select value={selectedGender} onValueChange={setSelectedGender}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">RTE</Label>
                                <Select value={selectedRte} onValueChange={setSelectedRte}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button 
                                onClick={() => handleSearch(1)} 
                                disabled={loading} 
                                variant="gradient"
                                className="h-9 px-8 text-[11px] uppercase tracking-wider shadow-lg shadow-orange-500/20"
                            >
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Student Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Student Report</h2>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1500px]">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Section</TableHead>
                                        <TableHead className="py-3 px-4">Admission No</TableHead>
                                        <TableHead className="py-3 px-4">Student Name</TableHead>
                                        <TableHead className="py-3 px-4">Father Name</TableHead>
                                        <TableHead className="py-3 px-4">Date Of Birth</TableHead>
                                        <TableHead className="py-3 px-4">Gender</TableHead>
                                        <TableHead className="py-3 px-4">Category</TableHead>
                                        <TableHead className="py-3 px-4">Mobile Number</TableHead>
                                        <TableHead className="py-3 px-4">Local Identification Number</TableHead>
                                        <TableHead className="py-3 px-4">National Identification Number</TableHead>
                                        <TableHead className="py-3 px-4">RTE</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={12} className="text-center py-12 text-gray-400">
                                                Searching records...
                                            </TableCell>
                                        </TableRow>
                                    ) : students.length > 0 ? (
                                        students.map((student, idx) => (
                                            <TableRow key={student.id} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-600">{student.section?.name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-600 font-medium">{student.admission_no}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{student.name} {student.last_name || ''}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.father_name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.dob || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.gender || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.student_category?.category_name || student.category || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.phone || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.local_identification_no || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.national_identification_no || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.rte || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 pr-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button onClick={() => handleView(student)} size="icon" className="h-7 w-7 rounded-md bg-[#10b981] hover:bg-[#059669] text-white shadow-sm">
                                                            <MenuIcon className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button onClick={() => handleEdit(student)} size="icon" className="h-7 w-7 rounded-md bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-sm">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={12} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Users className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                    </div>
                                                    <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                        <span className="text-lg">←</span> Search with different criteria.
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                            <div>
                                {totalEntries > 0 ? (
                                    `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPageNum, totalEntries)} of ${totalEntries} entries`
                                ) : (
                                    "Showing 0 to 0 of 0 entries"
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg border-gray-100 shadow-sm text-gray-400 hover:text-gray-600 bg-white"
                                    onClick={() => handleSearch(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1 || loading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <Button
                                        key={i}
                                        variant={currentPage === i + 1 ? "pagination-active" : "pagination-inactive"}
                                        onClick={() => handleSearch(i + 1)}
                                        disabled={loading}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg border-gray-100 shadow-sm text-gray-400 hover:text-gray-600 bg-white"
                                    onClick={() => handleSearch(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0 || loading}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeReportTab === "Class & Section Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Class & Section Report</h2>

                    <div className="flex justify-between items-center mb-4">
                        <div className="relative w-64">
                            <input 
                                type="text"
                                placeholder="Search" 
                                className="w-full h-8 px-3 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={classSectionSearch}
                                onChange={(e) => setClassSectionSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleClassSectionSearch()}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Select defaultValue="50">
                                <SelectTrigger className="h-8 w-16 text-[11px] border-none shadow-none focus:ring-0">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2 text-gray-400">
                                <FileText className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                <PieChart className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                <Users className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-full">
                            <TableHeader className="bg-transparent">
                                <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4 w-16">S.No.</TableHead>
                                    <TableHead className="py-3 px-4">Class</TableHead>
                                    <TableHead className="py-3 px-4">Students</TableHead>
                                    <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classSectionLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                                            Loading report...
                                        </TableCell>
                                    </TableRow>
                                ) : classSectionData.length > 0 ? (
                                    classSectionData.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                            <TableCell className="py-3 px-4 text-gray-600">{row.s_no}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.class_name} ({row.section_name})</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{row.students_count}</TableCell>
                                            <TableCell className="py-3 px-4 pr-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button size="icon" className="h-6 w-6 rounded-md bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-sm">
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={4} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {activeReportTab === "Guardian Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select Class</SelectItem>
                                        {classes.map((cls) => (
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
                                        <SelectItem value="all">Select Section</SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button 
                                onClick={() => handleGuardianSearch(1)} 
                                disabled={guardianLoading} 
                                variant="gradient"
                                className="h-9 px-8 text-[11px] uppercase tracking-wider shadow-lg shadow-orange-500/20"
                            >
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Guardian Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Guardian Report</h2>

                        <div className="flex justify-between items-center mb-4">
                            <div className="relative w-64">
                                <input 
                                    type="text"
                                    placeholder="Search" 
                                    className="w-full h-8 px-3 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={guardianSearchText}
                                    onChange={(e) => setGuardianSearchText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGuardianSearch(1)}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Select defaultValue="50">
                                    <SelectTrigger className="h-8 w-16 text-[11px] border-none shadow-none focus:ring-0">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 text-gray-400">
                                    <FileText className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <PieChart className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <Users className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Class (Section)</TableHead>
                                        <TableHead className="py-3 px-4">Admission No</TableHead>
                                        <TableHead className="py-3 px-4">Student Name</TableHead>
                                        <TableHead className="py-3 px-4">Mobile Number</TableHead>
                                        <TableHead className="py-3 px-4">Guardian Name</TableHead>
                                        <TableHead className="py-3 px-4">Guardian Relation</TableHead>
                                        <TableHead className="py-3 px-4">Guardian Phone</TableHead>
                                        <TableHead className="py-3 px-4">Father Name</TableHead>
                                        <TableHead className="py-3 px-4">Father Phone</TableHead>
                                        <TableHead className="py-3 px-4">Mother Name</TableHead>
                                        <TableHead className="py-3 px-4">Mother Phone</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {guardianLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center py-12 text-gray-400">
                                                Loading report...
                                            </TableCell>
                                        </TableRow>
                                    ) : guardianStudents.length > 0 ? (
                                        guardianStudents.map((student, idx) => (
                                            <TableRow key={student.id} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{student.school_class?.name || 'N/A'} ({student.section?.name || 'N/A'})</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-600 font-medium">{student.admission_no || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{student.name} {student.last_name || ''}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.phone || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.guardian_name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.guardian_relation || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.guardian_phone || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.father_name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.father_phone || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.mother_name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.mother_phone || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={11} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Users className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                            <div>
                                {guardianTotalEntries > 0 ? (
                                    `Showing ${(guardianCurrentPage - 1) * itemsPerPageNum + 1} to ${Math.min(guardianCurrentPage * itemsPerPageNum, guardianTotalEntries)} of ${guardianTotalEntries} entries`
                                ) : (
                                    "Showing 0 to 0 of 0 entries"
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg border-gray-100 shadow-sm text-gray-400 hover:text-gray-600 bg-white"
                                    onClick={() => handleGuardianSearch(Math.max(1, guardianCurrentPage - 1))}
                                    disabled={guardianCurrentPage === 1 || guardianLoading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {Array.from({ length: guardianTotalPages }).map((_, i) => (
                                    <Button
                                        key={i}
                                        variant={guardianCurrentPage === i + 1 ? "pagination-active" : "pagination-inactive"}
                                        onClick={() => handleGuardianSearch(i + 1)}
                                        disabled={guardianLoading}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg border-gray-100 shadow-sm text-gray-400 hover:text-gray-600 bg-white"
                                    onClick={() => handleGuardianSearch(Math.min(guardianTotalPages, guardianCurrentPage + 1))}
                                    disabled={guardianCurrentPage === guardianTotalPages || guardianTotalPages === 0 || guardianLoading}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeReportTab === "Student History" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select Class</SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Admission Year</Label>
                                <Select value={selectedAdmissionYear} onValueChange={setSelectedAdmissionYear}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select Year</SelectItem>
                                        {admissionYears.map((year) => (
                                            <SelectItem key={year} value={year}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button 
                                onClick={handleHistorySearch} 
                                disabled={historyLoading} 
                                variant="gradient"
                                className="h-9 px-8 text-[11px] uppercase tracking-wider shadow-lg shadow-orange-500/20"
                            >
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Student History Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Student History</h2>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Admission No</TableHead>
                                        <TableHead className="py-3 px-4">Student Name</TableHead>
                                        <TableHead className="py-3 px-4">Admission Date</TableHead>
                                        <TableHead className="py-3 px-4">Class (Start - End)</TableHead>
                                        <TableHead className="py-3 px-4">Session (Start - End)</TableHead>
                                        <TableHead className="py-3 px-4">Years</TableHead>
                                        <TableHead className="py-3 px-4">Mobile Number</TableHead>
                                        <TableHead className="py-3 px-4">Guardian Name</TableHead>
                                        <TableHead className="py-3 px-4">Guardian Phone</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historyLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                                                Loading history...
                                            </TableCell>
                                        </TableRow>
                                    ) : historyStudents.length > 0 ? (
                                        historyStudents.map((student, idx) => (
                                            <TableRow key={student.id} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4 text-indigo-600 font-medium">{student.admission_no || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{student.name} {student.last_name || ''}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.admission_date || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.school_class?.name || 'N/A'} - {student.school_class?.name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.academic_session?.session || 'N/A'} - {student.academic_session?.session || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.admission_date ? (new Date().getFullYear() - new Date(student.admission_date).getFullYear()) : 'N/A'}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.phone || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.guardian_name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.guardian_phone || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={9} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Users className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {activeReportTab === "Student Login Credential" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select Class</SelectItem>
                                        {classes.map((cls) => (
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
                                        <SelectItem value="all">Select Section</SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button 
                                onClick={handleCredentialSearch} 
                                disabled={credentialLoading} 
                                variant="gradient"
                                className="h-9 px-8 text-[11px] uppercase tracking-wider shadow-lg shadow-orange-500/20"
                            >
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Student Login Credential Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Student Login Credential Report</h2>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Admission No</TableHead>
                                        <TableHead className="py-3 px-4">Student Name</TableHead>
                                        <TableHead className="py-3 px-4">Username</TableHead>
                                        <TableHead className="py-3 px-4">Password</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {credentialLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                                                Loading credentials...
                                            </TableCell>
                                        </TableRow>
                                    ) : credentialStudents.length > 0 ? (
                                        credentialStudents.map((student, idx) => (
                                            <TableRow key={student.id} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4 text-indigo-600 font-medium">{student.admission_no || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{student.name} {student.last_name || ''}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.email || student.admission_no || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">********</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={4} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Key className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {activeReportTab === "Parent Login Credential" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select Class</SelectItem>
                                        {classes.map((cls) => (
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
                                        <SelectItem value="all">Select Section</SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button 
                                onClick={handleParentCredentialSearch} 
                                disabled={parentCredentialLoading} 
                                variant="gradient"
                                className="h-9 px-8 text-[11px] uppercase tracking-wider shadow-lg shadow-orange-500/20"
                            >
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Parent Login Credential Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Parent Login Credential Report</h2>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Admission No</TableHead>
                                        <TableHead className="py-3 px-4">Student Name</TableHead>
                                        <TableHead className="py-3 px-4">Parent Username</TableHead>
                                        <TableHead className="py-3 px-4">Parent Password</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parentCredentialLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                                                Loading credentials...
                                            </TableCell>
                                        </TableRow>
                                    ) : parentCredentialStudents.length > 0 ? (
                                        parentCredentialStudents.map((student, idx) => (
                                            <TableRow key={student.id} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4 text-indigo-600 font-medium">{student.admission_no || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{student.name} {student.last_name || ''}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">parent_{student.admission_no || student.id}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">********</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={4} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Key className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {activeReportTab === "Class Subject Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select Class</SelectItem>
                                        {classes.map((cls) => (
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
                                        <SelectItem value="all">Select Section</SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button 
                                onClick={handleClassSubjectSearch} 
                                disabled={classSubjectLoading} 
                                variant="gradient"
                                className="h-9 px-8 text-[11px] uppercase tracking-wider shadow-lg shadow-orange-500/20"
                            >
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Class Subject Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Class Subject Report</h2>

                        <div className="flex justify-between items-center mb-4">
                            <div className="relative w-64">
                                <input 
                                    type="text"
                                    placeholder="Search" 
                                    className="w-full h-8 px-3 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={classSubjectSearch}
                                    onChange={(e) => setClassSubjectSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Select defaultValue="50">
                                    <SelectTrigger className="h-8 w-16 text-[11px] border-none shadow-none focus:ring-0">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 text-gray-400">
                                    <FileText className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <PieChart className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <Users className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Class</TableHead>
                                        <TableHead className="py-3 px-4">Section</TableHead>
                                        <TableHead className="py-3 px-4">Subject</TableHead>
                                        <TableHead className="py-3 px-4">Teacher</TableHead>
                                        <TableHead className="py-3 px-4">Time</TableHead>
                                        <TableHead className="py-3 px-4">Room No.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classSubjectLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                                                Loading subjects...
                                            </TableCell>
                                        </TableRow>
                                    ) : classSubjectData.length > 0 ? (
                                        classSubjectData.filter(item => 
                                            item.subject?.toLowerCase().includes(classSubjectSearch.toLowerCase()) ||
                                            item.teacher?.toLowerCase().includes(classSubjectSearch.toLowerCase())
                                        ).map((row, idx) => (
                                            <TableRow key={row.id} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.class || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.section || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.subject || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.teacher || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.time || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.room_no || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={6} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <BookOpen className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {activeReportTab === "Admission Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type <span className="text-red-500">*</span></Label>
                                <Select value={selectedSearchType} onValueChange={setSelectedSearchType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        {searchTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button 
                                onClick={handleAdmissionSearch} 
                                disabled={admissionLoading} 
                                variant="gradient"
                                className="h-9 px-8 text-[11px] uppercase tracking-wider shadow-lg shadow-orange-500/20"
                            >
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Admission Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Admission Report</h2>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Admission No</TableHead>
                                        <TableHead className="py-3 px-4">Student Name</TableHead>
                                        <TableHead className="py-3 px-4">Class</TableHead>
                                        <TableHead className="py-3 px-4">Father Name</TableHead>
                                        <TableHead className="py-3 px-4">Date Of Birth</TableHead>
                                        <TableHead className="py-3 px-4">Admission Date</TableHead>
                                        <TableHead className="py-3 px-4">Gender</TableHead>
                                        <TableHead className="py-3 px-4">Category</TableHead>
                                        <TableHead className="py-3 px-4">Mobile Number</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {admissionLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                                                Loading admission report...
                                            </TableCell>
                                        </TableRow>
                                    ) : admissionData.length > 0 ? (
                                        admissionData.map((student, idx) => (
                                            <TableRow key={student.id} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4 text-indigo-600 font-medium">{student.admission_no || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{student.name} {student.last_name || ''}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{student.school_class?.name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.father_name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.dob || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.admission_date || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.gender || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.category_name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.phone || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={9} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Users className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {activeReportTab === "Sibling Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select Class</SelectItem>
                                        {classes.map((cls) => (
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
                                        <SelectItem value="all">Select Section</SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button 
                                onClick={handleSiblingSearch} 
                                disabled={siblingLoading} 
                                variant="gradient"
                                className="h-9 px-8 text-[11px] uppercase tracking-wider shadow-lg shadow-orange-500/20"
                            >
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Sibling Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Sibling Report</h2>

                        <div className="flex justify-between items-center mb-4">
                            <div className="relative w-64">
                                <input 
                                    type="text"
                                    placeholder="Search" 
                                    className="w-full h-8 px-3 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={siblingSearch}
                                    onChange={(e) => setSiblingSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Select defaultValue="50">
                                    <SelectTrigger className="h-8 w-16 text-[11px] border-none shadow-none focus:ring-0">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 text-gray-400">
                                    <FileText className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <PieChart className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <Users className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Father Name</TableHead>
                                        <TableHead className="py-3 px-4">Mother Name</TableHead>
                                        <TableHead className="py-3 px-4">Guardian Name</TableHead>
                                        <TableHead className="py-3 px-4">Guardian Phone</TableHead>
                                        <TableHead className="py-3 px-4">Student Name (Sibling)</TableHead>
                                        <TableHead className="py-3 px-4">Class</TableHead>
                                        <TableHead className="py-3 px-4">Admission Date</TableHead>
                                        <TableHead className="py-3 px-4">Gender</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {siblingLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                                                Loading sibling report...
                                            </TableCell>
                                        </TableRow>
                                    ) : siblingData.length > 0 ? (
                                        siblingData.filter(student => 
                                            student.name?.toLowerCase().includes(siblingSearch.toLowerCase()) ||
                                            student.guardian_name?.toLowerCase().includes(siblingSearch.toLowerCase())
                                        ).map((student, idx) => (
                                            <TableRow key={student.id} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-500">{student.father_name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.mother_name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.guardian_name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.guardian_phone || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{student.name} {student.last_name || ''}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{student.school_class?.name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.admission_date || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.gender || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={8} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Users className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {activeReportTab === "Student Profile" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search By Admission Date</Label>
                                <Select value={selectedProfileSearchType} onValueChange={setSelectedProfileSearchType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        {searchTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select Class</SelectItem>
                                        {classes.map((cls) => (
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
                                        <SelectItem value="all">Select Section</SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button 
                                onClick={handleProfileSearch} 
                                disabled={profileLoading} 
                                variant="gradient"
                                className="h-9 px-8 text-[11px] uppercase tracking-wider shadow-lg shadow-orange-500/20"
                            >
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Student Profile Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Student Profile</h2>

                        <div className="flex justify-between items-center mb-4">
                            <div className="relative w-64">
                                <input 
                                    type="text"
                                    placeholder="Search" 
                                    className="w-full h-8 px-3 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={profileSearch}
                                    onChange={(e) => setProfileSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Select defaultValue="50">
                                    <SelectTrigger className="h-8 w-16 text-[11px] border-none shadow-none focus:ring-0">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 text-gray-400">
                                    <FileText className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <PieChart className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <Users className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[2000px]">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Admission No</TableHead>
                                        <TableHead className="py-3 px-4">Roll Number</TableHead>
                                        <TableHead className="py-3 px-4">Class</TableHead>
                                        <TableHead className="py-3 px-4">Section</TableHead>
                                        <TableHead className="py-3 px-4">First Name</TableHead>
                                        <TableHead className="py-3 px-4">Last Name</TableHead>
                                        <TableHead className="py-3 px-4">Gender</TableHead>
                                        <TableHead className="py-3 px-4">Date Of Birth</TableHead>
                                        <TableHead className="py-3 px-4">Category</TableHead>
                                        <TableHead className="py-3 px-4">Religion</TableHead>
                                        <TableHead className="py-3 px-4">Caste</TableHead>
                                        <TableHead className="py-3 px-4">Mobile Number</TableHead>
                                        <TableHead className="py-3 px-4">Email</TableHead>
                                        <TableHead className="py-3 px-4">Admission Date</TableHead>
                                        <TableHead className="py-3 px-4">Blood Group</TableHead>
                                        <TableHead className="py-3 px-4">House</TableHead>
                                        <TableHead className="py-3 px-4">Height</TableHead>
                                        <TableHead className="py-3 px-4">Weight</TableHead>
                                        <TableHead className="py-3 px-4">Measurement Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {profileLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={19} className="text-center py-12 text-gray-400">
                                                Loading student profiles...
                                            </TableCell>
                                        </TableRow>
                                    ) : profileData.length > 0 ? (
                                        profileData.filter(student => 
                                            student.name?.toLowerCase().includes(profileSearch.toLowerCase()) ||
                                            student.admission_no?.toLowerCase().includes(profileSearch.toLowerCase())
                                        ).map((student, idx) => (
                                            <TableRow key={student.id} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4 text-indigo-600 font-medium">{student.admission_no || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.roll_no || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{student.school_class?.name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.section?.name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{student.name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{student.last_name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.gender || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.dob || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.category_name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.religion || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.caste || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.phone || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.email || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.admission_date || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.blood_group || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.school_house_name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.height || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.weight || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{student.measurement_date || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={19} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Users className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {activeReportTab === "Student Gender Ratio Report" && (
                <>
                    {/* Student Gender Ratio Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Student Gender Ratio Report</h2>

                        <div className="flex justify-between items-center mb-4">
                            <div className="relative w-64">
                                <input 
                                    type="text"
                                    placeholder="Search" 
                                    className="w-full h-8 px-3 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={genderRatioSearch}
                                    onChange={(e) => setGenderRatioSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Select defaultValue="50">
                                    <SelectTrigger className="h-8 w-16 text-[11px] border-none shadow-none focus:ring-0">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 text-gray-400">
                                    <FileText className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <PieChart className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <Users className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Class (Section)</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Total Boys</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Total Girls</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Total Students</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Boys - Girls Ratio</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {genderRatioLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                                                Loading gender ratio report...
                                            </TableCell>
                                        </TableRow>
                                    ) : genderRatioData.length > 0 ? (
                                        genderRatioData.filter(item => 
                                            item.class_section?.toLowerCase().includes(genderRatioSearch.toLowerCase())
                                        ).map((row, idx) => (
                                            <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.class_section}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600">{row.total_boys}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600">{row.total_girls}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-indigo-600 font-bold">{row.total_students}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-500 font-medium tracking-wider">{row.ratio}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={5} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Users className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {activeReportTab === "Student Teacher Ratio Report" && (
                <>
                    {/* Student Teacher Ratio Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Student Teacher Ratio Report</h2>

                        <div className="flex justify-between items-center mb-4">
                            <div className="relative w-64">
                                <input 
                                    type="text"
                                    placeholder="Search" 
                                    className="w-full h-8 px-3 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={teacherRatioSearch}
                                    onChange={(e) => setTeacherRatioSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Select defaultValue="50">
                                    <SelectTrigger className="h-8 w-16 text-[11px] border-none shadow-none focus:ring-0">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 text-gray-400">
                                    <FileText className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <PieChart className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <Users className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Class (Section)</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Total Students</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Total Assigned Teachers</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Student - Teacher Ratio</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teacherRatioLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                                                Loading teacher ratio report...
                                            </TableCell>
                                        </TableRow>
                                    ) : teacherRatioData.length > 0 ? (
                                        teacherRatioData.filter(item => 
                                            item.class_section?.toLowerCase().includes(teacherRatioSearch.toLowerCase())
                                        ).map((row, idx) => (
                                            <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.class_section}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600">{row.total_students}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600">{row.total_teachers}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-500 font-medium tracking-wider">{row.ratio}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={4} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Users className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {activeReportTab === "Online Admission Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class</Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select Class</SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select Section</SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Status</Label>
                                <Select value={selectedOnlineStatus} onValueChange={setSelectedOnlineStatus}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button 
                                onClick={handleOnlineAdmissionSearch} 
                                disabled={onlineAdmissionLoading} 
                                variant="gradient"
                                className="h-9 px-8 text-[11px] uppercase tracking-wider shadow-lg shadow-orange-500/20"
                            >
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Online Admission Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Online Admission Report</h2>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1500px]">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Reference No</TableHead>
                                        <TableHead className="py-3 px-4">Admission No</TableHead>
                                        <TableHead className="py-3 px-4">Student Name</TableHead>
                                        <TableHead className="py-3 px-4">Class</TableHead>
                                        <TableHead className="py-3 px-4">Mobile Number</TableHead>
                                        <TableHead className="py-3 px-4">Date Of Birth</TableHead>
                                        <TableHead className="py-3 px-4">Gender</TableHead>
                                        <TableHead className="py-3 px-4">Form Status</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Payment Status</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Enrolled</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {onlineAdmissionLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center py-12 text-gray-400">
                                                Loading online admission report...
                                            </TableCell>
                                        </TableRow>
                                    ) : onlineAdmissionData.length > 0 ? (
                                        onlineAdmissionData.map((row, idx) => (
                                            <TableRow key={row.id} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.reference_no}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.admission_no || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.first_name} {row.last_name || ''}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.school_class?.name || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.mobile_no || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.dob || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{row.gender || 'N/A'}</TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                                        row.status === 'approved' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                        row.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                        'bg-orange-50 text-orange-600 border border-orange-100'
                                                    }`}>
                                                        {row.status || 'Pending'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-500">{row.payment_status || 'Unpaid'}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span className={`text-[10px] font-bold ${row.is_enrolled ? 'text-green-600' : 'text-red-400'}`}>
                                                        {row.is_enrolled ? 'YES' : 'NO'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-800 font-medium">{row.paid_amount || '0.00'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={11} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <FileText className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 rounded bg-white overflow-hidden">
                    <DialogHeader className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                        <DialogTitle className="text-lg font-bold text-indigo-900">Student Details</DialogTitle>
                    </DialogHeader>
                    {selectedStudent && (
                        <div className="p-6 space-y-4 text-sm text-gray-700">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Admission No</span>
                                    <p className="font-semibold text-gray-800">{selectedStudent.admission_no || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Student Name</span>
                                    <p className="font-semibold text-gray-800">{selectedStudent.name} {selectedStudent.last_name || ''}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Class & Section</span>
                                    <p className="font-semibold text-gray-800">{selectedStudent.school_class?.name || 'N/A'} - {selectedStudent.section?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Date of Birth</span>
                                    <p className="font-semibold text-gray-800">{selectedStudent.dob || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Gender</span>
                                    <p className="font-semibold text-gray-800">{selectedStudent.gender || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Category</span>
                                    <p className="font-semibold text-gray-800">{selectedStudent.student_category?.category_name || selectedStudent.category || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Contact Phone</span>
                                    <p className="font-semibold text-gray-800">{selectedStudent.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">RTE</span>
                                    <p className="font-semibold text-gray-800">{selectedStudent.rte || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
