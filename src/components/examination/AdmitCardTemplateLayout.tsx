import React from 'react';
import { useSettings } from "@/components/providers/settings-provider";
import { getImageUrl } from "@/lib/image-url";

export interface AdmitCardData {
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
        address?: string;
    };
    exam: {
        name: string;
        session: string;
        group: string;
    };
    template: any; // AdmitCardTemplate configuration
    schedules?: {
        subject_name: string;
        subject_code: string;
        date: string;
        start_time: string;
        duration: number;
        room_no: string;
        max_marks: number;
        min_marks: number;
    }[];
    print_setting?: {
        header_image: string | null;
        footer_content: string | null;
    };
}

export const AdmitCardTemplateLayout = React.forwardRef<HTMLDivElement, { data: AdmitCardData }>(({ data }, ref) => {
    const { student, exam, template, print_setting } = data;
    const { settings } = useSettings();

    if (!template) return <div ref={ref} className="p-8">No Template Found</div>;

    const resolveImageUrl = (path: string) => getImageUrl(path, settings?.base_url);

    const headerImage = resolveImageUrl(template.header_image);
    const leftLogo = resolveImageUrl(template.left_logo);
    const rightLogo = resolveImageUrl(template.right_logo);
    const leftSign = resolveImageUrl(template.left_sign);
    const middleSign = resolveImageUrl(template.middle_sign);
    const rightSign = resolveImageUrl(template.right_sign);
    const bgImage = resolveImageUrl(template.background_image);
    const printHeaderImage = resolveImageUrl(print_setting?.header_image || '');

    const isDesign2 = template.name && template.name.toLowerCase().includes('design 2');

    // ----------------------------------------------------------------
    // DESIGN 2 — Modern Contemporary Layout (A5 Compact)
    // ----------------------------------------------------------------
    if (isDesign2) {
        return (
            <div
                ref={ref}
                className="admit-card-container relative"
                style={{
                    width: '580px',
                    fontFamily: 'Arial, sans-serif',
                    color: '#000',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #e2e8f0',
                }}
            >
                {/* Background watermark */}
                {bgImage && (
                    <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" style={{
                        backgroundImage: `url(${bgImage})`,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '50%'
                    }} />
                )}

                <div className="relative z-10 flex flex-col w-full">
                    {/* Top Content Area */}
                    <div>
                        {/* Gradient Header Banner */}
                        <div style={{
                            background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 60%, #7c3aed 100%)',
                            position: 'relative',
                            overflow: 'hidden',
                            padding: '14px 18px 12px 18px'
                        }}>
                            {/* Decorative glow circles */}
                            <div style={{ position: 'absolute', top: '-25px', right: '-25px', width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }} />
                            <div style={{ position: 'absolute', bottom: '-20px', left: '30%', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />

                            {/* Top Logo & School row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                {leftLogo ? (
                                    <img src={leftLogo} alt="Left Logo" style={{ height: '48px', maxWidth: '75px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.95 }} />
                                ) : settings?.print_logo ? (
                                    <img src={resolveImageUrl(settings.print_logo)} alt="Logo" style={{ height: '48px', maxWidth: '75px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.95 }} />
                                ) : (
                                    <div style={{ padding: '3px 10px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '12px', fontWeight: 800 }}>iSCHOOL</div>
                                )}
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                                        {settings?.school_name || 'Your School Name'}
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '9px', marginTop: '2px' }}>
                                        {settings?.address || 'Institutional Campus'} {settings?.phone ? `• ${settings.phone}` : ''}
                                    </div>
                                </div>
                                {rightLogo ? (
                                    <img src={rightLogo} alt="Right Logo" style={{ height: '48px', maxWidth: '75px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.95 }} />
                                ) : (
                                    <div style={{ width: '48px' }} />
                                )}
                            </div>

                            {/* Title & Exam Sub-bar */}
                            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ color: '#fff', fontSize: '13px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                    ADMIT CARD
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: '9.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                                        {template.exam_name || exam.name}
                                    </span>
                                    <span style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: '9.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                                        {exam.session}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {template.exam_center && (
                            <div style={{ backgroundColor: '#eef2ff', padding: '4px 18px', borderBottom: '1px solid #e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9.5px', color: '#4338ca' }}>
                                <span style={{ fontWeight: 700 }}>Examination Center:</span>
                                <span style={{ fontWeight: 600 }}>{template.exam_center}</span>
                            </div>
                        )}

                        {/* Student Info Card */}
                        <div style={{ margin: '14px 16px 0', background: 'linear-gradient(135deg, #f8faff 0%, #faf5ff 100%)', borderRadius: '10px', border: '1px solid #e0e7ff', padding: '12px 14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 12px' }}>
                                {/* Column 1 */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {template.show_name && (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student Name</span>
                                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1e1b4b' }}>{student.name}</span>
                                        </div>
                                    )}
                                    {template.show_father_name && (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Father's Name</span>
                                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>{student.father_name || '---'}</span>
                                        </div>
                                    )}
                                    {template.show_mother_name && (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mother's Name</span>
                                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>{student.mother_name || '---'}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Column 2 */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {template.show_admission_no && (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admission No</span>
                                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1e1b4b', fontFamily: 'monospace' }}>{student.admission_no}</span>
                                        </div>
                                    )}
                                    {template.show_roll_no && (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Roll Number</span>
                                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>{student.roll_no || '---'}</span>
                                        </div>
                                    )}
                                    {template.show_class && (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Class</span>
                                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>{student.class}{template.show_section && student.section ? ` - ${student.section}` : ''}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Column 3 */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {template.show_dob && (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date of Birth</span>
                                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>{student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '---'}</span>
                                        </div>
                                    )}
                                    {template.show_gender && (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gender</span>
                                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>{student.gender || '---'}</span>
                                        </div>
                                    )}
                                    {template.show_address && (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Address</span>
                                            <span style={{ fontSize: '9.5px', fontWeight: 600, color: '#374151' }} className="truncate" title={student.address}>{student.address || '---'}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Room/Seat No.</span>
                                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>&nbsp;</span>
                                    </div>
                                </div>
                            </div>

                            {/* Photo */}
                            {template.show_photo && (
                                <div style={{ width: '80px', height: '100px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '2px solid #6366f1', boxShadow: '0 2px 8px rgba(99,102,241,0.2)', backgroundColor: '#f1f5f9' }}>
                                    {student.photo ? (
                                        <img src={resolveImageUrl(student.photo)} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)', color: '#6366f1', fontSize: '9px', fontWeight: 800, textAlign: 'center' }}>
                                            PHOTO
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Important Instructions Box */}
                        <div style={{ margin: '14px 16px 0', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px' }}>
                            <div style={{ fontSize: '9px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Candidate Instructions:</div>
                            <ol style={{ margin: 0, padding: '0 0 0 14px', fontSize: '9.5px', color: '#78350f', lineHeight: 1.6 }}>
                                <li>Candidate must bring this Admit Card to the examination hall on all exam days.</li>
                                <li>Report to the assigned examination center at least 15 minutes before the scheduled time.</li>
                                <li>Mobile phones, smartwatches, and unauthorized materials are strictly prohibited.</li>
                                <li>Any unfair means will result in immediate disqualification and cancellation of candidature.</li>
                            </ol>
                        </div>
                    </div>

                    {/* Authorized Signatures & Footer (Directly below instructions) */}
                    <div style={{ padding: '24px 16px 16px 16px', marginTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px' }}>
                            <div style={{ textAlign: 'center', width: '30%' }}>
                                {leftSign && <img src={leftSign} alt="Left Sign" style={{ height: '32px', objectFit: 'contain', margin: '0 auto 4px auto' }} />}
                                <div style={{ borderTop: '1.5px solid #6366f1', paddingTop: '4px', fontSize: '8.5px', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Class Teacher</div>
                            </div>
                            <div style={{ textAlign: 'center', width: '30%' }}>
                                {middleSign && <img src={middleSign} alt="Middle Sign" style={{ height: '32px', objectFit: 'contain', margin: '0 auto 4px auto' }} />}
                                <div style={{ borderTop: '1.5px solid #6366f1', paddingTop: '4px', fontSize: '8.5px', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exam Controller</div>
                            </div>
                            <div style={{ textAlign: 'center', width: '30%' }}>
                                {rightSign && <img src={rightSign} alt="Right Sign" style={{ height: '32px', objectFit: 'contain', margin: '0 auto 4px auto' }} />}
                                <div style={{ borderTop: '1.5px solid #6366f1', paddingTop: '4px', fontSize: '8.5px', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Principal</div>
                            </div>
                        </div>
                        {template.footer_text && (
                            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '8.5px', color: '#64748b' }}>{template.footer_text}</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------------------
    // DESIGN 1 — Traditional / Clean Academic Layout (A5 Compact)
    // ----------------------------------------------------------------
    return (
        <div
            ref={ref}
            className="admit-card-container relative"
            style={{
                width: '580px',
                padding: '16px 20px 20px 20px',
                fontFamily: 'Arial, sans-serif',
                color: '#000',
                backgroundColor: '#fff',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #1f2937',
            }}
        >
            {bgImage && (
                <div
                    className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `url(${bgImage})`,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '50%'
                    }}
                />
            )}

            <div className="relative z-10 w-full flex flex-col">
                {/* Top Content Area */}
                <div>
                    {/* Header section */}
                    {printHeaderImage ? (
                        <div className="w-full mb-3 text-center">
                            <img src={printHeaderImage} alt="Header" className="w-full h-auto max-h-[85px] object-contain" />
                            <div className="text-center py-1 font-bold text-xs uppercase mt-1" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                                ADMIT CARD • {template.exam_name || exam.name} ({exam.session})
                            </div>
                        </div>
                    ) : headerImage ? (
                        <div className="w-full mb-3">
                            <img src={headerImage} alt="Header" className="w-full h-auto max-h-[85px] object-contain" />
                            <div className="text-center py-1 font-bold text-xs uppercase mt-1" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                                ADMIT CARD • {template.exam_name || exam.name} ({exam.session})
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col mb-3" style={{ borderBottom: '1.5px solid #1f2937', paddingBottom: '8px' }}>
                            <div className="flex justify-between items-start mb-1.5">
                                <div className="flex items-center gap-3">
                                    {leftLogo ? (
                                        <img src={leftLogo} alt="Logo" style={{ maxHeight: '48px', maxWidth: '75px', objectFit: 'contain' }} />
                                    ) : settings?.print_logo ? (
                                        <img src={resolveImageUrl(settings.print_logo)} alt="Logo" style={{ maxHeight: '48px', maxWidth: '75px', objectFit: 'contain' }} />
                                    ) : (
                                        <div className="text-xs font-bold px-2.5 py-1 rounded" style={{ backgroundColor: '#22c55e', color: '#ffffff' }}>iSCHOOL</div>
                                    )}
                                    <div>
                                        <div className="text-base font-bold tracking-tight leading-none" style={{ color: '#000000' }}>
                                            {settings?.school_name || "Your School Name Here"}
                                        </div>
                                        <div className="text-[9px] text-gray-600 mt-1">
                                            {settings?.address || "25 Kings Street, CA"}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right text-[9px] space-y-0.5" style={{ color: '#1f2937' }}>
                                    <div><span className="font-bold">Phone:</span> {settings?.phone || "89562423934"}</div>
                                    <div><span className="font-bold">Email:</span> {settings?.email || "yourschool@gmail.com"}</div>
                                    <div><span className="font-bold">Website:</span> {(settings?.frontend_url || (typeof window !== 'undefined' ? window.location.host : '') || process.env.NEXT_PUBLIC_FRONTEND_URL || "localhost:3000")?.replace(/^https?:\/\//, '')}</div>
                                </div>
                            </div>
                            <div className="text-center py-1 font-bold text-xs uppercase tracking-wider" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                                ADMIT CARD • {template.exam_name || exam.name} ({exam.session})
                            </div>
                        </div>
                    )}

                    {template.exam_center && (
                        <div className="mb-2.5 px-2.5 py-1 bg-gray-100 border border-gray-300 text-[9.5px] flex justify-between">
                            <span className="font-bold text-gray-700">Examination Center:</span>
                            <span className="font-semibold text-gray-900">{template.exam_center}</span>
                        </div>
                    )}

                    {/* Student Info Section */}
                    <div className="flex gap-3 mb-3 items-start" style={{ fontSize: '10px' }}>
                        {/* Text Fields (Columns 1 & 2) */}
                        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1">
                            {template.show_name && (
                                <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                    <span className="font-bold" style={{ width: '38%' }}>Student Name</span>
                                    <span style={{ width: '62%' }}>: {student.name}</span>
                                </div>
                            )}
                            {template.show_admission_no && (
                                <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                    <span className="font-bold" style={{ width: '38%' }}>Admission No</span>
                                    <span style={{ width: '62%', fontFamily: 'monospace' }}>: {student.admission_no}</span>
                                </div>
                            )}
                            {template.show_father_name && (
                                <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                    <span className="font-bold" style={{ width: '38%' }}>Father Name</span>
                                    <span style={{ width: '62%' }}>: {student.father_name || '---'}</span>
                                </div>
                            )}
                            {template.show_roll_no && (
                                <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                    <span className="font-bold" style={{ width: '38%' }}>Roll Number</span>
                                    <span style={{ width: '62%' }}>: {student.roll_no || '---'}</span>
                                </div>
                            )}
                            {template.show_mother_name && (
                                <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                    <span className="font-bold" style={{ width: '38%' }}>Mother Name</span>
                                    <span style={{ width: '62%' }}>: {student.mother_name || '---'}</span>
                                </div>
                            )}
                            {template.show_class && (
                                <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                    <span className="font-bold" style={{ width: '38%' }}>Class</span>
                                    <span style={{ width: '62%' }}>: {student.class}{template.show_section && student.section ? ` - ${student.section}` : ''}</span>
                                </div>
                            )}
                            {template.show_dob && (
                                <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                    <span className="font-bold" style={{ width: '38%' }}>Date of Birth</span>
                                    <span style={{ width: '62%' }}>: {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '---'}</span>
                                </div>
                            )}
                            {template.show_gender && (
                                <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                    <span className="font-bold" style={{ width: '38%' }}>Gender</span>
                                    <span style={{ width: '62%' }}>: {student.gender || '---'}</span>
                                </div>
                            )}
                            {template.show_address && (
                                <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                    <span className="font-bold" style={{ width: '38%' }}>Address</span>
                                    <span style={{ width: '62%' }}>: {student.address || '---'}</span>
                                </div>
                            )}
                            <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                <span className="font-bold" style={{ width: '38%' }}>Room/Seat No.</span>
                                <span style={{ width: '62%' }}>: </span>
                            </div>
                        </div>

                        {/* Photo Box (Column 3) */}
                        {template.show_photo && (
                            <div className="w-[80px] h-[100px] shrink-0" style={{ border: '1.5px solid #1f2937', padding: '2px', backgroundColor: '#f8fafc' }}>
                                {student.photo ? (
                                    <img src={resolveImageUrl(student.photo)} alt="Student Photo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8.5px] text-center font-bold">
                                        PHOTO
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Examination Rules & Instructions */}
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 mb-2">
                        <div className="text-[9px] font-bold text-slate-800 uppercase tracking-wider mb-1">Important Instructions:</div>
                        <ul className="list-disc pl-4 text-[9px] text-slate-600 space-y-0.5">
                            <li>Candidates must bring this Admit Card to the examination hall on all exam days.</li>
                            <li>Arrive at the examination hall at least 15 minutes before the start time.</li>
                            <li>Electronic devices, smartwatches, and notes are strictly prohibited.</li>
                            <li>Do not write anything on the admit card except for authorized signatures.</li>
                        </ul>
                    </div>
                </div>

                {/* Footer and Signatures (Directly below instructions) */}
                <div className="w-full mt-4 pt-2">
                    <div className="flex justify-between items-end px-2">
                        <div className="flex flex-col items-center">
                            {leftSign && <img src={leftSign} alt="Left Sign" className="h-8 object-contain mb-1" />}
                            <div className="border-t border-gray-800 w-24"></div>
                            <span className="text-[8.5px] font-bold mt-0.5 text-gray-700">Class Teacher</span>
                        </div>
                        <div className="flex flex-col items-center">
                            {middleSign && <img src={middleSign} alt="Middle Sign" className="h-8 object-contain mb-1" />}
                            <div className="border-t border-gray-800 w-24"></div>
                            <span className="text-[8.5px] font-bold mt-0.5 text-gray-700">Exam Controller</span>
                        </div>
                        <div className="flex flex-col items-center">
                            {rightSign && <img src={rightSign} alt="Right Sign" className="h-8 object-contain mb-1" />}
                            <div className="border-t border-gray-800 w-24"></div>
                            <span className="text-[8.5px] font-bold mt-0.5 text-gray-700">Principal</span>
                        </div>
                    </div>
                    {template.footer_text && (
                        <div className="text-center mt-2.5 text-[8.5px] text-gray-500 whitespace-pre-wrap">
                            {template.footer_text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

AdmitCardTemplateLayout.displayName = 'AdmitCardTemplateLayout';
