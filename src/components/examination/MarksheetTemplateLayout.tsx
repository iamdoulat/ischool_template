import React from 'react';
import { useSettings } from "@/components/providers/settings-provider";
import { getImageUrl } from "@/lib/image-url";

export interface MarksheetData {
    student: {
        name: string;
        father_name: string;
        mother_name: string;
        admission_no: string;
        roll_no: string;
        dob: string;
        gender: string;
        class: string;
        section: string;
        photo?: string;
    };
    exam: {
        name: string;
        session: string;
        group: string;
    };
    template: any; // MarksheetTemplate configuration
    subjects: {
        subject_name: string;
        subject_code: string;
        max_marks: number;
        min_marks: number;
        theory_marks: number | null;
        practical_marks: number | null;
        total_marks: number | null;
        is_absent: boolean;
        note: string;
    }[];
    summary: {
        total_marks: number | null;
        rank: string | null;
        remark: string | null;
        printing_date: string | null;
    };
    print_setting?: {
        header_image: string | null;
        footer_content: string | null;
    };
}

export const MarksheetTemplateLayout = React.forwardRef<HTMLDivElement, { data: MarksheetData }>(({ data }, ref) => {
    const { student, exam, template, print_setting, subjects, summary } = data;
    const { settings } = useSettings();

    if (!template) return <div ref={ref} className="p-8">No Template Found</div>;

    // Use absolute URL for images if they exist, or placeholders
    const resolveImageUrl = (path: string) => {
        return getImageUrl(path, settings?.base_url);
    };

    const headerImage = resolveImageUrl(template.header_image);
    const leftLogo = resolveImageUrl(template.left_logo);
    const rightLogo = resolveImageUrl(template.right_logo);
    const leftSign = resolveImageUrl(template.left_sign);
    const middleSign = resolveImageUrl(template.middle_sign);
    const rightSign = resolveImageUrl(template.right_sign);
    const bgImage = resolveImageUrl(template.background_image);
    const printHeaderImage = resolveImageUrl(print_setting?.header_image || '');

    const isDesign2 = template.name && template.name.toLowerCase().includes('design 2');

    return (
        <div 
            ref={ref} 
            className="marksheet-container" 
            style={{ 
                width: '794px', // A4 width in pixels at 96 DPI
                minHeight: '1123px', // A4 height
                padding: '20px 40px 40px 40px',
                fontFamily: 'Arial, sans-serif',
                position: 'relative',
                color: '#000',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
            }}
        >
            {/* Background Image Watermark */}
            {bgImage && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.1,
                    pointerEvents: 'none',
                    zIndex: 0
                }}>
                    <img src={bgImage} alt="Background" style={{ maxWidth: '400px', maxHeight: '400px' }} />
                </div>
            )}

            <div style={{ position: 'relative', zIndex: 10 }}>
                {/* Header section */}
                {printHeaderImage ? (
                    <div className="w-full mb-4 text-center">
                        <img src={printHeaderImage} alt="Header" className="w-full h-auto max-h-[150px] object-contain" />
                        <div className="text-center py-2 font-bold text-lg uppercase mt-2" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                            {template.exam_name || exam.name}
                        </div>
                    </div>
                ) : headerImage ? (
                    <div className="w-full mb-4">
                        <img src={headerImage} alt="Header" className="w-full h-auto max-h-[150px] object-contain" />
                    </div>
                ) : (
                    <div className="w-full flex flex-col mb-6" style={{ borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>
                        <div className="flex justify-between min-h-[100px] mb-2">
                            <div className="flex flex-col justify-between items-start">
                                <div className="h-12 relative flex items-center mb-2">
                                     {settings?.print_logo ? (
                                         <img src={resolveImageUrl(settings.print_logo)} alt="Logo" style={{ maxHeight: '48px', objectFit: 'contain' }} />
                                     ) : (
                                         <div className="text-lg font-bold px-3 py-1 rounded" style={{ backgroundColor: '#22c55e', color: '#ffffff' }}>SMART SCHOOL</div>
                                     )}
                                </div>
                                <div className="text-3xl font-bold tracking-tight" style={{ color: '#000000' }}>
                                    {settings?.school_name || "Your School Name Here"}
                                </div>
                            </div>
                            <div className="text-right text-sm flex flex-col justify-end space-y-1" style={{ color: '#1f2937' }}>
                                <div><span className="font-bold">Address:</span> {settings?.address || "25 Kings Street, CA"}</div>
                                <div><span className="font-bold">Phone No.:</span> {settings?.phone || "89562423934"}</div>
                                <div><span className="font-bold">Email:</span> {settings?.email || "yourschool@gmail.com"}</div>
                                <div><span className="font-bold">Website:</span> {settings?.base_url?.replace(/^https?:\/\//, '') || "www.yoursite.in"}</div>
                            </div>
                        </div>
                        <div className="text-center py-2 font-bold text-lg uppercase" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                            {template.exam_name || exam.name}
                        </div>
                    </div>
                )}

                {/* Body Text */}
                {template.body_text && (
                    <div className="mb-6 text-center text-sm font-medium" dangerouslySetInnerHTML={{ __html: template.body_text }} />
                )}

                {isDesign2 ? (
                    // ----------------------------------------------------
                    // MODERN PREMIUM LAYOUT (DESIGN 2)
                    // ----------------------------------------------------
                    <div className="space-y-8">
                        {/* Student Info Card */}
                        <div className="bg-gradient-to-br from-[#eff6ff] to-[#f8fafc] rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-blue-100/50 flex gap-8 items-center">
                            <div className="flex-1 grid grid-cols-2 gap-y-5 gap-x-8">
                                {template.show_name && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Student Name</span>
                                        <span className="text-base font-bold text-gray-800">{student.name}</span>
                                    </div>
                                )}
                                {template.show_admission_no && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Admission No</span>
                                        <span className="text-sm font-bold text-gray-700">{student.admission_no}</span>
                                    </div>
                                )}
                                {template.show_father_name && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Father Name</span>
                                        <span className="text-sm font-semibold text-gray-700">{student.father_name}</span>
                                    </div>
                                )}
                                {template.show_roll_no && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Roll Number</span>
                                        <span className="text-sm font-semibold text-gray-700">{student.roll_no}</span>
                                    </div>
                                )}
                                {template.show_mother_name && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Mother Name</span>
                                        <span className="text-sm font-semibold text-gray-700">{student.mother_name}</span>
                                    </div>
                                )}
                                {template.show_class && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Class</span>
                                        <span className="text-sm font-semibold text-gray-700">{student.class} {template.show_section && student.section ? ` - ${student.section}` : ''}</span>
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Date of Birth</span>
                                    <span className="text-sm font-semibold text-gray-700">{student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : ''}</span>
                                </div>
                            </div>

                            {/* Photo */}
                            {template.show_photo && (
                                <div className="w-[120px] shrink-0">
                                    {student.photo ? (
                                        <img src={resolveImageUrl(student.photo)} alt="Student Photo" className="w-full h-[120px] object-cover rounded-xl shadow-md border-4 border-white" />
                                    ) : (
                                        <div className="w-full h-[120px] bg-blue-100 rounded-xl shadow-inner border-4 border-white flex items-center justify-center text-blue-300 text-xs font-bold uppercase tracking-widest">
                                            Photo
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Marks Table */}
                        <div className="rounded-2xl overflow-hidden shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-gray-100">
                            <table className="w-full border-collapse text-sm bg-white">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                                        <th className="py-3 px-4 text-left font-semibold">Subject</th>
                                        <th className="py-3 px-4 text-center font-semibold">Max</th>
                                        <th className="py-3 px-4 text-center font-semibold">Min</th>
                                        <th className="py-3 px-4 text-center font-semibold">Theory</th>
                                        <th className="py-3 px-4 text-center font-semibold">Practical</th>
                                        <th className="py-3 px-4 text-center font-semibold">Obtained</th>
                                        <th className="py-3 px-4 text-center font-semibold">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.map((sub, idx) => (
                                        <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                            <td className="py-3 px-4 font-medium text-gray-700">{sub.subject_name}</td>
                                            <td className="py-3 px-4 text-center text-gray-500">{sub.max_marks || '-'}</td>
                                            <td className="py-3 px-4 text-center text-gray-500">{sub.min_marks || '-'}</td>
                                            <td className="py-3 px-4 text-center text-gray-600">
                                                {sub.is_absent ? <span className="text-red-500 font-bold text-xs">ABS</span> : (sub.theory_marks !== null ? sub.theory_marks : '-')}
                                            </td>
                                            <td className="py-3 px-4 text-center text-gray-600">
                                                {sub.is_absent ? '-' : (sub.practical_marks !== null ? sub.practical_marks : '-')}
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-indigo-600 bg-indigo-50/30">
                                                {sub.is_absent ? '0' : (sub.total_marks !== null ? sub.total_marks : '-')}
                                            </td>
                                            <td className="py-3 px-4 text-center text-xs text-gray-400">
                                                {sub.note || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 border-t-2 border-indigo-100">
                                        <td colSpan={5} className="py-4 px-4 text-right font-bold text-indigo-900 uppercase tracking-widest text-xs">Total Marks</td>
                                        <td className="py-4 px-4 text-center font-black text-lg text-indigo-700">{summary.total_marks !== null ? summary.total_marks : '-'}</td>
                                        <td className="py-4 px-4 text-center"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Summary & Result Section */}
                        <div className="flex items-stretch justify-between gap-6 pt-4">
                            <div className="flex-1 bg-gray-50/50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center">
                                {template.show_remark && summary.remark && (
                                    <div className="mb-4">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Remarks</span>
                                        <p className="text-sm font-medium text-gray-700 italic border-l-4 border-indigo-300 pl-3 py-1 bg-white shadow-sm rounded-r-lg">{summary.remark}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Result Status</span>
                                    <div className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 font-bold text-sm rounded-full tracking-wider border border-emerald-200">
                                        PASS
                                    </div>
                                </div>
                            </div>
                            
                            {/* Rank Badge */}
                            <div className="w-56 bg-gradient-to-br from-[#FF9800] to-[#F57C00] rounded-2xl p-6 text-white shadow-[0_8px_30px_rgb(255,152,0,0.3)] flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-100 mb-2">Final Rank</h4>
                                <p className="text-4xl font-black drop-shadow-md">{summary.rank || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Footer & Signatures */}
                        <div className="mt-16 pt-8 border-t border-dashed border-gray-200">
                            {(print_setting?.footer_content || template.footer_text) && (
                                <div className="mb-16 text-center text-xs text-gray-500 max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: print_setting?.footer_content || template.footer_text || '' }} />
                            )}

                            <div className="flex justify-between items-end px-4">
                                <div className="text-center w-1/3 flex flex-col items-center">
                                    {leftSign && <img src={leftSign} alt="Left Sign" className="h-10 mb-2 object-contain mix-blend-multiply" />}
                                    <div className="w-3/4 border-t-2 border-gray-300 pt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Class Teacher</div>
                                </div>
                                <div className="text-center w-1/3 flex flex-col items-center">
                                    {middleSign && <img src={middleSign} alt="Middle Sign" className="h-10 mb-2 object-contain mix-blend-multiply" />}
                                    <div className="w-3/4 border-t-2 border-gray-300 pt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Controller of Exams</div>
                                </div>
                                <div className="text-center w-1/3 flex flex-col items-center">
                                    {rightSign && <img src={rightSign} alt="Right Sign" className="h-10 mb-2 object-contain mix-blend-multiply" />}
                                    <div className="w-3/4 border-t-2 border-gray-300 pt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Principal</div>
                                </div>
                            </div>

                            <div className="mt-10 text-center text-[10px] text-gray-400 tracking-widest uppercase">
                                {template.printing_date || `Printed on: ${new Date().toLocaleDateString()}`}
                            </div>
                        </div>
                    </div>
                ) : (
                    // ----------------------------------------------------
                    // ORIGINAL TRADITIONAL LAYOUT (DESIGN 1 / DEFAULT)
                    // ----------------------------------------------------
                    <>
                        {/* Student Info Section */}
                        <div className="flex gap-6 mb-8 text-sm items-start">
                            {/* Text Fields (Columns 1 & 2) */}
                            <div className="flex-1 grid grid-cols-2 gap-x-12 gap-y-3">
                                {template.show_name && (
                                    <div className="flex pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                                        <span className="font-bold w-1/3">Student Name</span>
                                        <span className="w-2/3">: {student.name}</span>
                                    </div>
                                )}
                                {template.show_admission_no && (
                                    <div className="flex pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                                        <span className="font-bold w-1/3">Admission No</span>
                                        <span className="w-2/3">: {student.admission_no}</span>
                                    </div>
                                )}
                                {template.show_father_name && (
                                    <div className="flex pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                                        <span className="font-bold w-1/3">Father Name</span>
                                        <span className="w-2/3">: {student.father_name}</span>
                                    </div>
                                )}
                                {template.show_roll_no && (
                                    <div className="flex pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                                        <span className="font-bold w-1/3">Roll Number</span>
                                        <span className="w-2/3">: {student.roll_no}</span>
                                    </div>
                                )}
                                {template.show_mother_name && (
                                    <div className="flex pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                                        <span className="font-bold w-1/3">Mother Name</span>
                                        <span className="w-2/3">: {student.mother_name}</span>
                                    </div>
                                )}
                                {template.show_class && (
                                    <div className="flex pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                                        <span className="font-bold w-1/3">Class</span>
                                        <span className="w-2/3">: {student.class} {template.show_section && student.section ? ` - ${student.section}` : ''}</span>
                                    </div>
                                )}
                                <div className="flex pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
                                    <span className="font-bold w-1/3">Date of Birth</span>
                                    <span className="w-2/3">: {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : ''}</span>
                                </div>
                            </div>

                            {/* Photo Box (Column 3) */}
                            {template.show_photo && (
                                <div className="w-[110px] shrink-0" style={{ border: '1px solid #1f2937', padding: '4px' }}>
                                    {student.photo ? (
                                        <img src={resolveImageUrl(student.photo)} alt="Student Photo" className="w-full h-auto aspect-[3/4] object-cover" />
                                    ) : (
                                        <div className="w-full aspect-[3/4] flex items-center justify-center text-gray-400 text-[10px] text-center font-bold">
                                            PHOTO
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Marks Table */}
                        <div className="mb-8">
                            <table className="w-full border-collapse text-sm" style={{ border: '1px solid #1f2937' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                                        <th className="py-2 px-3 text-left" style={{ border: '1px solid #1f2937' }}>Subject</th>
                                        <th className="py-2 px-3 text-center" style={{ border: '1px solid #1f2937' }}>Max Marks</th>
                                        <th className="py-2 px-3 text-center" style={{ border: '1px solid #1f2937' }}>Min Marks</th>
                                        <th className="py-2 px-3 text-center" style={{ border: '1px solid #1f2937' }}>Theory</th>
                                        <th className="py-2 px-3 text-center" style={{ border: '1px solid #1f2937' }}>Practical</th>
                                        <th className="py-2 px-3 text-center" style={{ border: '1px solid #1f2937' }}>Obtained</th>
                                        <th className="py-2 px-3 text-center" style={{ border: '1px solid #1f2937' }}>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.map((sub, idx) => (
                                        <tr key={idx}>
                                            <td className="py-2 px-3" style={{ border: '1px solid #1f2937' }}>{sub.subject_name}</td>
                                            <td className="py-2 px-3 text-center" style={{ border: '1px solid #1f2937' }}>{sub.max_marks || '-'}</td>
                                            <td className="py-2 px-3 text-center" style={{ border: '1px solid #1f2937' }}>{sub.min_marks || '-'}</td>
                                            <td className="py-2 px-3 text-center" style={{ border: '1px solid #1f2937' }}>
                                                {sub.is_absent ? 'ABS' : (sub.theory_marks !== null ? sub.theory_marks : '-')}
                                            </td>
                                            <td className="py-2 px-3 text-center" style={{ border: '1px solid #1f2937' }}>
                                                {sub.is_absent ? '-' : (sub.practical_marks !== null ? sub.practical_marks : '-')}
                                            </td>
                                            <td className="py-2 px-3 text-center font-bold" style={{ border: '1px solid #1f2937' }}>
                                                {sub.is_absent ? '0' : (sub.total_marks !== null ? sub.total_marks : '-')}
                                            </td>
                                            <td className="py-2 px-3 text-center text-xs" style={{ border: '1px solid #1f2937' }}>
                                                {sub.note || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold" style={{ backgroundColor: '#f9fafb' }}>
                                        <td colSpan={5} className="py-2 px-3 text-right uppercase" style={{ border: '1px solid #1f2937' }}>Total Marks</td>
                                        <td className="py-2 px-3 text-center" style={{ border: '1px solid #1f2937' }}>{summary.total_marks !== null ? summary.total_marks : '-'}</td>
                                        <td className="py-2 px-3 text-center" style={{ border: '1px solid #1f2937' }}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Additional Summary (Rank, Result) */}
                        <div className="flex justify-between items-end mb-16">
                            <div className="w-1/2">
                                {template.show_remark && summary.remark && (
                                    <div className="mb-2">
                                        <span className="font-bold inline-block mb-1" style={{ borderBottom: '1px solid #1f2937' }}>Remarks:</span>
                                        <p className="text-sm italic">{summary.remark}</p>
                                    </div>
                                )}
                                <div className="mb-2">
                                    <span className="font-bold inline-block mb-1" style={{ borderBottom: '1px solid #1f2937' }}>Result Status:</span>
                                    <p className="text-sm uppercase font-bold" style={{ color: '#16a34a' }}>
                                        PASS
                                    </p>
                                </div>
                            </div>
                            {/* Rank Block */}
                            <div className="p-4 rounded text-center w-48 shadow-sm" style={{ border: '2px solid #1f2937', backgroundColor: '#ffffff' }}>
                                <h4 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>Final Rank</h4>
                                <p className="text-3xl font-black" style={{ color: '#4338ca' }}>{summary.rank || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Footer Section */}
                        {(print_setting?.footer_content || template.footer_text) && (
                            <div className="mb-12 text-center text-xs whitespace-pre-wrap" style={{ color: '#4b5563' }} dangerouslySetInnerHTML={{ __html: print_setting?.footer_content || template.footer_text || '' }} />
                        )}

                        {/* Signatures */}
                        <div className="flex justify-between items-end mt-12 pt-8">
                            <div className="text-center w-1/3">
                                {leftSign && <img src={leftSign} alt="Left Sign" className="h-12 mx-auto mb-2 object-contain" />}
                                <div className="pt-1 text-xs font-bold uppercase" style={{ borderTop: '1px solid #1f2937' }}>Class Teacher</div>
                            </div>
                            <div className="text-center w-1/3">
                                {middleSign && <img src={middleSign} alt="Middle Sign" className="h-12 mx-auto mb-2 object-contain" />}
                                <div className="pt-1 text-xs font-bold uppercase" style={{ borderTop: '1px solid #1f2937' }}>Controller of Exams</div>
                            </div>
                            <div className="text-center w-1/3">
                                {rightSign && <img src={rightSign} alt="Right Sign" className="h-12 mx-auto mb-2 object-contain" />}
                                <div className="pt-1 text-xs font-bold uppercase" style={{ borderTop: '1px solid #1f2937' }}>Principal</div>
                            </div>
                        </div>

                        {/* Printing Date */}
                        <div className="mt-8 text-right text-xs" style={{ color: '#9ca3af' }}>
                            {template.printing_date || `Printed on: ${new Date().toLocaleDateString()}`}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});

MarksheetTemplateLayout.displayName = 'MarksheetTemplateLayout';
