"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/language-provider";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Copy, FileSpreadsheet, FileBox, FileText, Printer,
  ChevronLeft, ChevronRight, Search, Download,
  Loader2, FileUser, Users, Eye, Phone, Calendar,
  GraduationCap, AlertCircle, Settings
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  cn,
  toLocaleNumber,
  translateClassName,
  translateSectionName,
  translateGender,
  translateStudentCategory,
} from "@/lib/utils";
import { StudentCVTemplate, generateDefaultAvatarDataUri, type StudentCVData } from "./StudentCVTemplate";
import { downloadStudentCVAsPdf } from "./cvDownload";
import { getImageUrl } from "@/lib/image-url";
import Link from "next/link";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

async function convertImageToBase64(url: string | null | undefined): Promise<string | undefined> {
  if (!url || !url.trim()) return undefined;
  if (url.startsWith("data:")) return url;

  try {
    const response = await fetch(url);
    if (response.ok) {
      const blob = await response.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string" && reader.result.startsWith("data:image")) {
            resolve(reader.result);
          } else {
            resolve(url);
          }
        };
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn("Fetch base64 conversion failed", err);
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 150;
        canvas.height = img.naturalHeight || img.height || 150;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");
          if (dataUrl && dataUrl.startsWith("data:image")) {
            return resolve(dataUrl);
          }
        }
      } catch (e) {
        console.warn("Canvas base64 error", e);
      }
      resolve(url);
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

interface Student {
  id: string | number;
  admission_no: string;
  name: string;
  last_name?: string;
  dob: string;
  gender: string;
  avatar?: string;
  student_photo?: string;
  photo_url?: string;
  student_category?: { category_name: string };
  category?: string;
  phone: string;
  school_class?: { name: string };
  section?: { name: string };
  roll_no?: string;
}

export default function DownloadCVPage() {
  const { t, language } = useLanguage();
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

  // CV download & preview state
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);
  const [cvData, setCvData] = useState<StudentCVData | null>(null);
  const [pendingDownload, setPendingDownload] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  // Preview Modal
  const [previewStudent, setPreviewStudent] = useState<StudentCVData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchStudentsForClassSection = useCallback(async (classId: string, sectionId: string) => {
    setSearching(true);
    try {
      const response = await api.get('/student-cv/students', {
        params: { school_class_id: classId, section_id: sectionId }
      });
      setStudents(response.data.data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch students", error);
      toast.error(t("failed_to_load_students") || "Failed to load student list");
    } finally {
      setSearching(false);
    }
  }, [t]);

  const fetchCriteria = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/student-cv/criteria');
      const dataList = response.data.data || [];
      setCriteria(dataList);

      if (dataList.length > 0) {
        const firstCls = dataList[0];
        setSelectedClass(firstCls.id.toString());
        setSections(firstCls.sections || []);
        if (firstCls.sections && firstCls.sections.length > 0) {
          setSelectedSection(firstCls.sections[0].id.toString());
          fetchStudentsForClassSection(firstCls.id.toString(), firstCls.sections[0].id.toString());
        }
      }
    } catch (error) {
      console.error("Failed to fetch criteria", error);
      toast.error(t("failed_to_load_classes") || "Failed to load criteria");
    } finally {
      setLoading(false);
    }
  }, [fetchStudentsForClassSection, t]);

  useEffect(() => {
    fetchCriteria();
  }, [fetchCriteria]);

  useEffect(() => {
    if (selectedClass) {
      const cls = criteria.find(c => c.id.toString() === selectedClass);
      setSections(cls?.sections || []);
      if (cls?.sections && cls.sections.length > 0) {
        setSelectedSection(cls.sections[0].id.toString());
      } else {
        setSelectedSection("");
      }
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
        toast.success(
          t("cv_downloaded_for_student", { name: cvData.name }) ||
          `CV downloaded for ${cvData.name}`
        );
      } catch (err) {
        console.error("PDF generation failed", err);
        toast.error(t("failed_to_generate_cv_pdf") || "Failed to generate CV PDF");
      } finally {
        setDownloadingId(null);
        setPendingDownload(false);
        setCvData(null);
      }
    };

    const raf = requestAnimationFrame(() => {
      generate();
    });
    return () => cancelAnimationFrame(raf);
  }, [pendingDownload, cvData, t]);

  const handleSearch = async () => {
    if (!selectedClass) {
      toast.error(t("please_select_all_criteria") || "Please select Class");
      return;
    }
    fetchStudentsForClassSection(selectedClass, selectedSection);
  };

  const prepareCvDetail = async (student: Student): Promise<StudentCVData> => {
    try {
      const res = await api.get(`/student-cv/detail/${student.id}`);
      const d = res.data.data || res.data;
      const studentFullName = d.full_name || (d.first_name ? [d.first_name, d.middle_name, d.last_name].filter(Boolean).join(" ") : d.name) || student.name || "Student";
      const rawPhoto = d.avatar || d.student_photo || d.photo_url || d.photo || student.avatar || student.student_photo || student.photo_url;

      let photoUrl: string | undefined = undefined;
      if (rawPhoto && typeof rawPhoto === "string" && rawPhoto.trim() !== "") {
        const resolved = getImageUrl(rawPhoto);
        const base64 = await convertImageToBase64(resolved);
        photoUrl = base64 || resolved;
      }

      if (!photoUrl) {
        photoUrl = generateDefaultAvatarDataUri(studentFullName);
      }

      return {
        name: d.name || student.name,
        full_name: studentFullName,
        admission_no: d.admission_no || student.admission_no,
        roll_no: d.roll_no || d.roll_number || (student as any).roll_no || "101",
        class_name: d.school_class?.name || d.class_name || (student as any).school_class?.name || "Class 1",
        section_name: d.section?.name || d.section_name || (student as any).section?.name || "Section A",
        photo_url: photoUrl,
        dob: d.dob || student.dob,
        gender: d.gender || student.gender,
        category: d.student_category?.category_name || student.student_category?.category_name || student.category,
        religion: d.religion || "Islam",
        caste: d.caste || "None",
        blood_group: d.blood_group || "B+",
        height: d.height,
        weight: d.weight,
        nationality: d.nationality || "Bangladeshi",
        birth_place: d.birth_place || "Dhaka",
        mother_tongue: d.mother_tongue || "Bengali",
        national_id: d.national_id || d.national_identification_number || d.national_identification_no,
        address: d.address || d.current_address || d.present_address,
        current_address: d.current_address || d.present_address || d.address,
        permanent_address: d.permanent_address || d.address,
        phone: d.phone || student.phone,
        email: d.email || (student as any).email,
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
        previous_academic_record: d.previous_academic_record || (student as any).previous_academic_record,
      };
    } catch {
      const studentFullName = (student as any).full_name || student.name || "Student";
      const rawPhoto = student.avatar || student.student_photo || student.photo_url;
      let photoUrl: string | undefined = undefined;
      if (rawPhoto && typeof rawPhoto === "string" && rawPhoto.trim() !== "") {
        const resolved = getImageUrl(rawPhoto);
        const base64 = await convertImageToBase64(resolved);
        photoUrl = base64 || resolved;
      }

      if (!photoUrl) {
        photoUrl = generateDefaultAvatarDataUri(studentFullName);
      }

      return {
        name: student.name,
        full_name: studentFullName,
        admission_no: student.admission_no,
        roll_no: (student as any).roll_no || "101",
        class_name: (student as any).school_class?.name || "Class 1",
        section_name: (student as any).section?.name || "Section A",
        photo_url: photoUrl,
        dob: student.dob,
        gender: student.gender,
        category: student.student_category?.category_name || student.category,
        phone: student.phone,
        nationality: "Bangladeshi",
        birth_place: "Dhaka",
        mother_tongue: "Bengali",
        current_address: "House#50/A, Road#10, Sector 10, Uttara",
        permanent_address: "House#50/A, Road#10, Sector 10, Uttara",
      };
    }
  };

  /** Fetch full student CV detail then trigger PDF */
  const handleDownloadCV = useCallback(async (student: Student) => {
    if (downloadingId) return;

    setDownloadingId(student.id);

    try {
      const detail = await prepareCvDetail(student);
      setCvData(detail);
      setPendingDownload(true);
    } catch (err) {
      console.error("Download failed", err);
      toast.error(t("failed_to_download_cv") || "Failed to download CV");
      setDownloadingId(null);
    }
  }, [downloadingId, t]);

  /** Preview CV in interactive modal */
  const handlePreviewCV = async (student: Student) => {
    setLoadingPreview(true);
    setPreviewOpen(true);
    try {
      const detail = await prepareCvDetail(student);
      setPreviewStudent(detail);
    } catch {
      toast.error(t("failed_to_load_cv_preview") || "Failed to load CV preview");
      setPreviewOpen(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Filter & paginate
  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admission_no.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const formatDob = (dobStr: string) => {
    if (!dobStr) return "—";
    try {
      const d = new Date(dobStr);
      if (isNaN(d.getTime())) return dobStr;
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatted = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
      return toLocaleNumber(formatted, language?.short_code);
    } catch { return dobStr; }
  };

  const sizeNum = parseInt(itemsPerPage, 10) || 50;
  const totalEntries = filteredStudents.length;
  const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * sizeNum;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + sizeNum);

  // Copy table to clipboard
  const handleCopyTable = () => {
    if (filteredStudents.length === 0) {
      toast.error(t("no_data_available_in_table") || "No data to copy");
      return;
    }
    const header = `${t("admission_no") || "Admission No"}\t${t("student_profile") || "Student Name"}\t${t("date_of_birth") || "Date Of Birth"}\t${t("gender") || "Gender"}\t${t("category") || "Category"}\t${t("mobile_number") || "Mobile Number"}\n`;
    const rows = filteredStudents.map(s =>
      `${s.admission_no}\t${s.name}\t${formatDob(s.dob)}\t${translateGender(s.gender, language?.short_code)}\t${translateStudentCategory(s.student_category?.category_name || s.category, language?.short_code) || s.student_category?.category_name || s.category || '-'}\t${s.phone ? toLocaleNumber(s.phone, language?.short_code) : '-'}`
    ).join("\n");
    navigator.clipboard.writeText(header + rows);
    toast.success(t("student_directory_copied_to_clipboard") || "Student directory copied to clipboard!");
  };

  // Export Excel / CSV
  const handleExportExcel = (isCsv = false) => {
    if (filteredStudents.length === 0) {
      toast.error(t("no_data_available_in_table") || "No data to export");
      return;
    }
    const mapped = filteredStudents.map(s => ({
      [t("admission_no") || "Admission No"]: s.admission_no,
      [t("student_profile") || "Student Name"]: `${s.name} ${s.last_name || ""}`.trim(),
      [t("date_of_birth") || "Date Of Birth"]: formatDob(s.dob),
      [t("gender") || "Gender"]: translateGender(s.gender, language?.short_code),
      [t("category") || "Category"]: translateStudentCategory(s.student_category?.category_name || s.category, language?.short_code) || s.student_category?.category_name || s.category || "-",
      [t("mobile_number") || "Mobile Number"]: s.phone ? toLocaleNumber(s.phone, language?.short_code) : "-",
      [t("class") || "Class"]: s.school_class?.name ? translateClassName(s.school_class.name, language?.short_code) : "-",
      [t("section") || "Section"]: s.section?.name ? translateSectionName(s.section.name, language?.short_code) : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(mapped);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student CV List");
    if (isCsv) {
      XLSX.writeFile(wb, `student_cv_list_${new Date().toISOString().slice(0, 10)}.csv`, { bookType: "csv" });
      toast.success(t("csv_file_downloaded") || "CSV file downloaded!");
    } else {
      XLSX.writeFile(wb, `student_cv_list_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(t("excel_downloaded") || "Excel file downloaded!");
    }
  };

  // Export PDF
  const handleExportPdf = () => {
    if (filteredStudents.length === 0) {
      toast.error(t("no_data_available_in_table") || "No data to export");
      return;
    }
    const doc = new jsPDF();
    const head = [[
      t("admission_no") || "Admission No",
      t("student_profile") || "Student Name",
      t("date_of_birth") || "Date Of Birth",
      t("gender") || "Gender",
      t("category") || "Category",
      t("mobile_number") || "Mobile Number",
    ]];
    const body = filteredStudents.map(s => [
      s.admission_no,
      `${s.name} ${s.last_name || ""}`.trim(),
      formatDob(s.dob),
      translateGender(s.gender, language?.short_code),
      translateStudentCategory(s.student_category?.category_name || s.category, language?.short_code) || s.student_category?.category_name || s.category || "-",
      s.phone ? toLocaleNumber(s.phone, language?.short_code) : "-",
    ]);
    autoTable(doc, { head, body, theme: "grid" });
    doc.save(`student_cv_list_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success(t("pdf_downloaded") || "PDF downloaded");
  };

  return (
    <div className="w-full space-y-4 pb-12">

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

      {/* ── Master Page Header Banner ── */}
      <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
              <FileUser className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-bold tracking-tight text-gray-800 leading-none flex items-center gap-2 flex-wrap">
                {t("download_student_cv_title") || "Download Student Curriculum Vitae (CV)"}
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  {t("academic_portfolios") || "Academic Portfolios"}
                </span>
              </h1>
              <p className="text-[11px] text-gray-500 mt-1">
                {t("download_student_cv_description") || "Filter by academic class and section to generate, preview, and download standardized student resumes & portfolios."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Link href="/dashboard/student-cv/build-cv">
              <Button
                variant="outline"
                className="h-8 px-3 text-xs font-semibold rounded-lg border-gray-200 bg-white hover:bg-gray-50 text-gray-700 gap-1.5 cursor-pointer shadow-xs"
              >
                <Eye className="h-3.5 w-3.5 text-indigo-600" />
                <span>{t("build_cv") || "Build CV"}</span>
              </Button>
            </Link>
            <Link href="/dashboard/student-cv/setting">
              <Button
                className="h-8 px-3.5 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-xs gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>{t("cv_settings") || "CV Settings"}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Criteria Selection Card ── */}
      <div className="border border-gray-100 shadow-sm rounded-lg bg-white overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
            <GraduationCap className="h-4 w-4" />
          </span>
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-800">
            {t("filter_selection_criteria") || "Filter Selection Criteria"}
          </h2>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            {/* Class Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                {t("class") || "Class"} <span className="text-rose-500">*</span>
              </Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-9 text-xs bg-white border-gray-200 focus:ring-indigo-500 rounded-lg">
                  <SelectValue placeholder={t("select_class") || "Select Class"} />
                </SelectTrigger>
                <SelectContent>
                  {criteria.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {translateClassName(c.name, language?.short_code)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                {t("section") || "Section"}
              </Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="h-9 text-xs bg-white border-gray-200 focus:ring-indigo-500 rounded-lg">
                  <SelectValue placeholder={t("select_section") || "Select Section"} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s: any) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {translateSectionName(s.name, language?.short_code)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Button in 3rd Column */}
            <div>
              <Button
                onClick={handleSearch}
                disabled={searching || !selectedClass}
                className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white h-9 text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
              >
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                {t("search_students") || "Search Students"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="border border-gray-100 shadow-sm rounded-lg bg-white overflow-hidden flex flex-col justify-between min-h-[460px]">
        <div>
          {/* Table Header / Toolbar */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                <Users className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-gray-800">
                {t("student_directory_list") || "Student Directory List"} ({toLocaleNumber(filteredStudents.length, language?.short_code)})
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Input */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder={t("search_by_name_or_admission_no") || "Search by name or admission no..."}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-8 h-8 text-xs bg-white border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                />
              </div>

              {/* Per page */}
              <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 w-20 text-xs bg-white border-gray-200">
                  <SelectValue placeholder="50" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">{toLocaleNumber(10, language?.short_code)}</SelectItem>
                  <SelectItem value="25">{toLocaleNumber(25, language?.short_code)}</SelectItem>
                  <SelectItem value="50">{toLocaleNumber(50, language?.short_code)}</SelectItem>
                  <SelectItem value="100">{toLocaleNumber(100, language?.short_code)}</SelectItem>
                </SelectContent>
              </Select>

              {/* Multi-format export toolbar */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
                <button
                  type="button"
                  onClick={handleCopyTable}
                  className="p-1.5 hover:bg-gray-100 text-gray-600 border-r border-gray-200 transition-all cursor-pointer"
                  title={t("copy") || "Copy Table"}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExportExcel(false)}
                  className="p-1.5 hover:bg-gray-100 text-gray-600 border-r border-gray-200 transition-all cursor-pointer"
                  title={t("export_excel") || "Export Excel"}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExportExcel(true)}
                  className="p-1.5 hover:bg-gray-100 text-gray-600 border-r border-gray-200 transition-all cursor-pointer"
                  title={t("export_csv") || "Export CSV"}
                >
                  <FileBox className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="p-1.5 hover:bg-gray-100 text-gray-600 border-r border-gray-200 transition-all cursor-pointer"
                  title={t("export_pdf") || "Export PDF"}
                >
                  <FileText className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 hover:bg-gray-100 text-gray-600 transition-all cursor-pointer"
                  title={t("print") || "Print List"}
                >
                  <Printer className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto custom-scrollbar px-4">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-gray-50/80 border-b border-gray-200">
                <TableRow>
                  <TableHead className="py-3 px-4 text-xs font-bold text-gray-700">{t("admission_no") || "Admission No"}</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-bold text-gray-700">{t("student_profile") || "Student Profile"}</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-bold text-gray-700">{t("date_of_birth") || "Date Of Birth"}</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-bold text-gray-700">{t("gender") || "Gender"}</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-bold text-gray-700">{t("category") || "Category"}</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-bold text-gray-700">{t("mobile_number") || "Mobile Number"}</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-bold text-gray-700 text-right pr-6">{t("cv_actions") || "CV Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100">
                {searching ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-500" />
                      <p className="text-xs font-medium text-gray-500">{t("loading_student_directory") || "Loading student directory..."}</p>
                    </TableCell>
                  </TableRow>
                ) : paginatedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs font-bold text-gray-600">{t("no_students_found") || "No students found"}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{t("select_different_class_or_section") || "Select a different class or section above."}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map((item, idx) => (
                    <TableRow
                      key={item.id || idx}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      {/* Admission No */}
                      <TableCell className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                          {item.admission_no}
                        </span>
                      </TableCell>

                      {/* Student Profile & Avatar */}
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-gray-200 shadow-xs">
                            <AvatarImage src={getImageUrl(item.avatar || item.student_photo || item.photo_url)} className="object-cover" />
                            <AvatarFallback className="text-xs font-bold bg-indigo-50 text-indigo-700">
                              {item.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-bold text-gray-800 leading-snug group-hover:text-indigo-600 transition-colors">
                              {item.name} {item.last_name || ""}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {item.school_class?.name ? `${translateClassName(item.school_class.name, language?.short_code)} (${translateSectionName(item.section?.name || 'A', language?.short_code)})` : t("student") || 'Student'}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Date of Birth */}
                      <TableCell className="py-3 px-4 text-xs text-gray-600 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {formatDob(item.dob)}
                        </span>
                      </TableCell>

                      {/* Gender */}
                      <TableCell className="py-3 px-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          item.gender?.toLowerCase() === "male"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : item.gender?.toLowerCase() === "female"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                        )}>
                          {translateGender(item.gender, language?.short_code)}
                        </span>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="py-3 px-4 text-xs text-gray-600 font-medium">
                        <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[10px]">
                          {translateStudentCategory(item.student_category?.category_name || item.category, language?.short_code) || item.student_category?.category_name || item.category || t("general") || "General"}
                        </span>
                      </TableCell>

                      {/* Mobile Phone */}
                      <TableCell className="py-3 px-4 text-xs text-gray-600 font-medium">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Phone className="h-3 w-3 text-indigo-500" />
                          {item.phone ? toLocaleNumber(item.phone, language?.short_code) : "—"}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview CV Modal */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewCV(item)}
                            className="h-7 px-2.5 text-xs border-gray-200 hover:bg-gray-100 text-gray-700 gap-1 rounded-lg cursor-pointer"
                            title={t("preview_cv_portfolio") || "Preview CV Portfolio"}
                          >
                            <Eye className="h-3.5 w-3.5 text-indigo-600" />
                            <span className="hidden sm:inline">{t("preview") || "Preview"}</span>
                          </Button>

                          {/* Download CV PDF */}
                          <Button
                            size="sm"
                            onClick={() => handleDownloadCV(item)}
                            disabled={downloadingId === item.id}
                            className="h-7 px-2.5 text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-xs gap-1 border-0 rounded-lg cursor-pointer"
                            title={t("download_cv_as_pdf") || "Download CV as PDF"}
                          >
                            {downloadingId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline">{t("pdf") || "PDF"}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pinned Bottom Footer / Pagination */}
        <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
          <div>
            {t("showing_x_to_y_of_z", {
              x: toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, language?.short_code),
              y: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), language?.short_code),
              z: toLocaleNumber(totalEntries, language?.short_code),
            }) || (
              <>Showing {totalEntries > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries</>
            )}
          </div>

          {totalEntries > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="h-8 w-8 bg-white hover:bg-gray-100 text-gray-600 rounded-lg transition-all border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-8 w-8 transition-all text-xs flex items-center justify-center cursor-pointer font-bold rounded-lg",
                    safePage === page
                      ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                      : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                  )}
                >
                  {toLocaleNumber(page, language?.short_code)}
                </button>
              ))}

              <button
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="h-8 w-8 bg-white hover:bg-gray-100 text-gray-600 rounded-lg transition-all border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CV Preview Modal ── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
              <FileUser className="h-5 w-5 text-indigo-600" />
              {t("student_curriculum_vitae_preview") || "Student Curriculum Vitae Preview"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {t("institutional_resume_preview_desc") || "Institutional resume preview before exporting to PDF"}
            </DialogDescription>
          </DialogHeader>

          {loadingPreview ? (
            <div className="py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-2" />
              <p className="text-xs text-gray-500">{t("compiling_cv_data") || "Compiling CV data..."}</p>
            </div>
          ) : previewStudent ? (
            <div className="space-y-4 py-2">
              {/* Header Card */}
              <div className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                  <AvatarImage src={previewStudent.photo_url} className="object-cover" />
                  <AvatarFallback className="text-xl font-bold bg-indigo-100 text-indigo-700">
                    {previewStudent.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{previewStudent.full_name || previewStudent.name}</h3>
                  <p className="text-xs text-indigo-700 font-semibold">
                    {translateClassName(previewStudent.class_name || "", language?.short_code)} — {translateSectionName(previewStudent.section_name || "", language?.short_code)} ({t("roll_num", { roll: toLocaleNumber(previewStudent.roll_no || "", language?.short_code) }) || `Roll #${previewStudent.roll_no}`})
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    {t("admission_no") || "Admission No"}: {previewStudent.admission_no}
                  </p>
                </div>
              </div>

              {/* Personal Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t("date_of_birth") || "Date of Birth"}</p>
                  <p className="font-semibold text-gray-800">{previewStudent.dob ? formatDob(previewStudent.dob) : "—"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t("gender_and_category") || "Gender & Category"}</p>
                  <p className="font-semibold text-gray-800">
                    {translateGender(previewStudent.gender, language?.short_code) || "—"} / {translateStudentCategory(previewStudent.category, language?.short_code) || previewStudent.category || t("general") || "General"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t("contact_phone_and_email") || "Contact Phone & Email"}</p>
                  <p className="font-semibold text-gray-800">{previewStudent.phone ? toLocaleNumber(previewStudent.phone, language?.short_code) : "—"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t("blood_group_and_nationality") || "Blood Group & Nationality"}</p>
                  <p className="font-semibold text-gray-800">
                    {previewStudent.blood_group || "B+"} / {
                      previewStudent.nationality?.toLowerCase() === "bangladeshi" ? (t("bangladeshi") || "Bangladeshi") :
                      previewStudent.nationality?.toLowerCase() === "bangladesh" ? (t("bangladesh") || "Bangladesh") :
                      (previewStudent.nationality || t("bangladeshi") || "Bangladeshi")
                    }
                  </p>
                </div>
              </div>

              {/* Guardian Info */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">{t("parent_guardian_detail") || "Parent / Guardian"}</p>
                <p className="font-semibold text-gray-800">
                  {t("father") || "Father"}: {previewStudent.father_name || "—"} | {t("mother") || "Mother"}: {previewStudent.mother_name || "—"}
                </p>
                <p className="text-[11px] text-gray-500">
                  {t("address") || "Address"}: {toLocaleNumber(previewStudent.current_address || previewStudent.address || "—", language?.short_code)}
                </p>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPreviewOpen(false)} className="text-xs rounded-lg cursor-pointer">
              {t("close_preview") || "Close Preview"}
            </Button>
            {previewStudent && (
              <Button
                onClick={() => {
                  setPreviewOpen(false);
                  const s = students.find(item => item.admission_no === previewStudent.admission_no || String(item.id) === String((previewStudent as any).id));
                  if (s) handleDownloadCV(s);
                  else {
                    setCvData(previewStudent);
                    setPendingDownload(true);
                  }
                }}
                className="text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs gap-1 rounded-lg cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> {t("download_full_pdf") || "Download Full PDF"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
