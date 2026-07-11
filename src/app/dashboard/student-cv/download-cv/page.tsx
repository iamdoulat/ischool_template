"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Copy, FileSpreadsheet, FileBox, Printer, Columns,
  ChevronLeft, ChevronRight, Search, ArrowUpDown, Download, ChevronDown,
  Loader2, FileUser,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentCVTemplate, type StudentCVData } from "./StudentCVTemplate";
import { downloadStudentCVAsPdf } from "./cvDownload";

interface Student {
  id: string;
  admission_no: string;
  name: string;
  dob: string;
  gender: string;
  student_category?: { category_name: string };
  phone: string;
}

export default function DownloadCVPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  // Criteria states
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [sections, setSections] = useState<any[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState("50");

  // CV download state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [cvData, setCvData] = useState<StudentCVData | null>(null);
  const [pendingDownload, setPendingDownload] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCriteria();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const cls = criteria.find(c => c.id.toString() === selectedClass);
      setSections(cls?.sections || []);
      setSelectedSection("");
    } else {
      setSections([]);
      setSelectedSection("");
    }
  }, [selectedClass, criteria]);

  // Trigger PDF generation after cvData is set + template has rendered
  useEffect(() => {
    if (!pendingDownload || !cvData || !templateRef.current) return;

    const generate = async () => {
      try {
        await downloadStudentCVAsPdf(
          templateRef.current!,
          `CV_${cvData.name?.replace(/\s+/g, "_") || "student"}.pdf`
        );
        toast.success(`CV downloaded for ${cvData.name}`);
      } catch (err) {
        console.error("PDF generation failed", err);
        toast.error("Failed to generate CV PDF");
      } finally {
        setDownloadingId(null);
        setPendingDownload(false);
        setCvData(null);
      }
    };

    // Give the browser one frame to finish rendering the template
    const raf = requestAnimationFrame(() => {
      generate();
    });
    return () => cancelAnimationFrame(raf);
  }, [pendingDownload, cvData]);

  const fetchCriteria = async () => {
    setLoading(true);
    try {
      const response = await api.get('/student-cv/criteria');
      const dataList = response.data.data || [];
      setCriteria(dataList);

      if (dataList.length > 0) {
        const class1 = dataList.find((c: any) => c.name === "Class 1");
        if (class1) {
          setSelectedClass(class1.id.toString());
          const sectionA = class1.sections?.find((s: any) => s.name === "A");
          if (sectionA) {
            setSelectedSection(sectionA.id.toString());
            fetchStudentsForClassSection(class1.id.toString(), sectionA.id.toString());
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch criteria", error);
      toast.error("Failed to load criteria");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForClassSection = async (classId: string, sectionId: string) => {
    setSearching(true);
    try {
      const response = await api.get('/student-cv/students', {
        params: { school_class_id: classId, section_id: sectionId }
      });
      setStudents(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch students", error);
      toast.error("Failed to load student list");
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedClass || !selectedSection) {
      toast.error("Please select Class and Section");
      return;
    }
    fetchStudentsForClassSection(selectedClass, selectedSection);
  };

  /** Fetch full student CV detail then trigger PDF */
  const handleDownloadCV = useCallback(async (student: Student) => {
    if (downloadingId) return; // prevent concurrent downloads

    setDownloadingId(student.id);

    try {
      // Try to fetch full CV detail from API
      let detail: StudentCVData;
      try {
        const res = await api.get(`/student-cv/detail/${student.id}`);
        const d = res.data.data || res.data;
        detail = {
          name: d.name || student.name,
          admission_no: d.admission_no || student.admission_no,
          photo_url: d.photo_url || d.student_photo || undefined,
          dob: d.dob || student.dob,
          gender: d.gender || student.gender,
          category: d.student_category?.category_name || student.student_category?.category_name,
          religion: d.religion,
          caste: d.caste,
          blood_group: d.blood_group,
          height: d.height,
          weight: d.weight,
          national_id: d.national_id || d.national_identification_number,
          local_id: d.local_id || d.local_identification_number,
          phone: d.phone || student.phone,
          email: d.email,
          address: d.address || d.present_address,
          father_name: d.father_name,
          mother_name: d.mother_name,
          father_occupation: d.father_occupation,
          mother_occupation: d.mother_occupation,
          father_phone: d.father_phone,
          mother_phone: d.mother_phone,
          guardian_name: d.guardian_name,
          guardian_relation: d.guardian_relation,
          guardian_phone: d.guardian_phone,
          guardian_email: d.guardian_email,
          guardian_occupation: d.guardian_occupation,
          guardian_address: d.guardian_address,
        };
      } catch {
        // API not yet available — fall back to list-level data
        detail = {
          name: student.name,
          admission_no: student.admission_no,
          dob: student.dob,
          gender: student.gender,
          category: student.student_category?.category_name,
          phone: student.phone,
        };
      }

      setCvData(detail);
      setPendingDownload(true); // triggers the useEffect above after re-render
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Failed to download CV");
      setDownloadingId(null);
    }
  }, [downloadingId]);

  // Filter & paginate
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admission_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDob = (dobStr: string) => {
    if (!dobStr) return "";
    try {
      const d = new Date(dobStr);
      if (isNaN(d.getTime())) return dobStr;
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
    } catch { return dobStr; }
  };

  const sizeNum = parseInt(itemsPerPage, 10) || 50;
  const totalEntries = filteredStudents.length;
  const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * sizeNum;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + sizeNum);

  return (
    <div className="p-4 bg-gray-50/10 min-h-screen font-sans text-xs space-y-4">

      {/* ── Off-screen CV Template (hidden, used only for PDF capture) ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "-9999px",
          zIndex: -1,
          pointerEvents: "none",
          visibility: pendingDownload ? "visible" : "hidden",
        }}
      >
        {cvData && <StudentCVTemplate ref={templateRef} data={cvData} />}
      </div>

      {/* ── Criteria Filtering Section ── */}
      <div className="bg-white rounded border border-gray-100 shadow-sm space-y-4 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
              <FileUser className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">Download Student CV</h1>
              <p className="text-[11px] text-gray-500 mt-1">Select class and section to download student CVs</p>
            </div>
          </div>
        </div>

        <div className="p-4 pt-0 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Class */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-gray-700">
              Class <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="flex h-9 w-full rounded border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="">Select</option>
                {criteria.map(c => (
                  <option key={c.id} value={c.id.toString()}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Section */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-gray-700">Section</Label>
            <div className="relative">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="flex h-9 w-full rounded border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="">Select</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id.toString()}>{s.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSearch}
            disabled={searching}
            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-5 h-9 text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(99,102,241,0.25)] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
          >
            <Search className="h-3.5 w-3.5" /> Search
          </Button>
        </div>
        </div>
      </div>

      {/* List Header */}
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1 pt-2">
        Student List
      </div>

      {/* Table Card */}
      <div className="bg-white rounded border border-gray-100 p-4 shadow-sm space-y-4 overflow-hidden min-h-[400px]">

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-1">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-8 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(e.target.value); setCurrentPage(1); }}
                  className="flex h-7 w-16 text-[10px] border border-gray-200 shadow-none rounded font-semibold text-gray-700 bg-white px-2 py-0.5 appearance-none cursor-pointer pr-5"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              {[Copy, FileSpreadsheet, FileBox, Printer, Columns].map((Icon, i) => (
                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-transparent border-b border-gray-100">
              <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                <TableHead className="py-3 px-4">Admission No <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                <TableHead className="py-3 px-4">Student Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                <TableHead className="py-3 px-4 text-center">Date Of Birth <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                <TableHead className="py-3 px-4 text-center">Gender <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                <TableHead className="py-3 px-4">Category <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                <TableHead className="py-3 px-4">Mobile Number <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                <TableHead className="py-3 px-4 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searching ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                      Loading Students...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedStudents.length === 0 ? (
                <TableRow className="hover:bg-transparent h-48">
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((item, idx) => (
                  <TableRow
                    key={item.id || idx}
                    className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap"
                  >
                    <TableCell className="py-3 px-4 text-gray-600 font-medium">{item.admission_no}</TableCell>
                    <TableCell className="py-3 px-4 text-[#6366f1] font-semibold">{item.name}</TableCell>
                    <TableCell className="py-3 px-4 text-center text-gray-600">{formatDob(item.dob) || "—"}</TableCell>
                    <TableCell className="py-3 px-4 text-center text-gray-600 font-medium">{item.gender}</TableCell>
                    <TableCell className="py-3 px-4 text-gray-600 font-medium">
                      {item.student_category?.category_name || "—"}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-gray-600 font-medium">{item.phone || "—"}</TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <Button
                        onClick={() => handleDownloadCV(item)}
                        disabled={downloadingId === item.id}
                        className={cn(
                          "text-white p-0 h-7 w-7 rounded shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer ml-auto border-0",
                          downloadingId === item.id
                            ? "bg-indigo-300 cursor-not-allowed"
                            : "bg-[#6366f1] hover:bg-[#5558e6]"
                        )}
                        title="Download CV as PDF"
                      >
                        {downloadingId === item.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Download className="h-3.5 w-3.5" />
                        }
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50 mt-2">
          <div>
            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
            {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
          </div>

          {totalEntries > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold",
                    safePage === page
                      ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95"
                      : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                  )}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
