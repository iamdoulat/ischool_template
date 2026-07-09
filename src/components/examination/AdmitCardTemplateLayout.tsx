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
    schedules: {
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
    const { student, exam, template, print_setting, schedules } = data;
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
    // DESIGN 2 — Modern Premium Layout
    // ----------------------------------------------------------------
    if (isDesign2) {
        return (
            <div
                ref={ref}
                className="admit-card-container relative"
                style={{
                    width: '1588px',
                    minHeight: '1123px',
                    fontFamily: 'Arial, sans-serif',
                    color: '#000',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
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

                <div className="relative z-10 flex flex-col h-full">
                    {/* Gradient Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 60%, #7c3aed 100%)',
                        padding: '0',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Decorative circles */}
                        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)' }} />
                        <div style={{ position: 'absolute', bottom: '-20px', left: '40%', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />

                        {/* Logo row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px 0 32px' }}>
                            {leftLogo ? (
                                <img src={leftLogo} alt="Left Logo" style={{ height: '56px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
                            ) : (
                                <div style={{ width: '56px' }} />
                            )}
                            <div style={{ textAlign: 'center', flex: 1, padding: '0 16px' }}>
                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    {settings?.school_name || 'Your School'}
                                </div>
                                <div style={{ color: '#fff', fontSize: '22px', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    ADMIT CARD
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>
                                    {template.exam_name || exam.name}
                                </div>
                            </div>
                            {rightLogo ? (
                                <img src={rightLogo} alt="Right Logo" style={{ height: '56px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
                            ) : (
                                <div style={{ width: '56px' }} />
                            )}
                        </div>

                        {/* Session & Center bar */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', padding: '10px 32px 20px', marginTop: '6px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 600 }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: '4px' }}>SESSION</span>{exam.session}
                            </span>
                            {template.exam_center && (
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 600 }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: '4px' }}>CENTER</span>{template.exam_center}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Student Info Card */}
                    <div style={{ margin: '20px 28px 0', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)', borderRadius: '12px', border: '1px solid #e0e7ff', padding: '16px 20px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px' }}>
                            {template.show_name && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2px' }}>Student Name</span>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e1b4b' }}>{student.name}</span>
                                </div>
                            )}
                            {template.show_admission_no && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2px' }}>Admission No</span>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e1b4b' }}>{student.admission_no}</span>
                                </div>
                            )}
                            {template.show_father_name && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2px' }}>Father's Name</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{student.father_name}</span>
                                </div>
                            )}
                            {template.show_roll_no && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2px' }}>Roll Number</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{student.roll_no}</span>
                                </div>
                            )}
                            {template.show_mother_name && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2px' }}>Mother's Name</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{student.mother_name}</span>
                                </div>
                            )}
                            {template.show_class && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2px' }}>Class</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{student.class}{template.show_section && student.section ? ` - ${student.section}` : ''}</span>
                                </div>
                            )}
                            {template.show_dob && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2px' }}>Date of Birth</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : ''}</span>
                                </div>
                            )}
                            {template.show_gender && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2px' }}>Gender</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{student.gender}</span>
                                </div>
                            )}
                            {template.show_address && (
                                <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '2px' }}>Address</span>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{student.address || '---'}</span>
                                </div>
                            )}
                        </div>

                        {/* Photo */}
                        {template.show_photo && (
                            <div style={{ width: '90px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 4px 16px rgba(99,102,241,0.2)' }}>
                                {student.photo ? (
                                    <img src={resolveImageUrl(student.photo)} alt="Student" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)', color: '#a5b4fc', fontSize: '9px', fontWeight: 700, textAlign: 'center' }}>
                                        PHOTO
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Schedule Section */}
                    <div style={{ margin: '16px 28px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ width: '4px', height: '18px', borderRadius: '4px', background: 'linear-gradient(180deg, #4f46e5, #7c3aed)' }} />
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e1b4b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Examination Schedule</span>
                        </div>
                        <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e0e7ff', boxShadow: '0 2px 12px rgba(99,102,241,0.08)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                <thead>
                                    <tr style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', color: '#fff' }}>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, letterSpacing: '0.05em' }}>Subject</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>Date</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>Start Time</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>Duration</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>Room No</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>Marks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules.map((schedule, idx) => (
                                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #e0e7ff' }}>
                                            <td style={{ padding: '7px 12px', fontWeight: 600, color: '#1e1b4b' }}>
                                                {schedule.subject_name}{schedule.subject_code ? ` (${schedule.subject_code})` : ''}
                                            </td>
                                            <td style={{ padding: '7px 10px', textAlign: 'center', color: '#374151' }}>{schedule.date}</td>
                                            <td style={{ padding: '7px 10px', textAlign: 'center', color: '#374151' }}>{schedule.start_time}</td>
                                            <td style={{ padding: '7px 10px', textAlign: 'center', color: '#374151' }}>{schedule.duration} min</td>
                                            <td style={{ padding: '7px 10px', textAlign: 'center', color: '#374151' }}>{schedule.room_no}</td>
                                            <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700, color: '#4f46e5' }}>{schedule.max_marks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Instructions box */}
                    <div style={{ margin: '14px 28px 0', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>Important Instructions</div>
                        <ol style={{ margin: 0, padding: '0 0 0 14px', fontSize: '10px', color: '#78350f', lineHeight: 1.8 }}>
                            <li>Candidates must bring this Admit Card to the examination hall.</li>
                            <li>Arrive at least 15 minutes before the examination starts.</li>
                            <li>Electronic devices are strictly prohibited during the examination.</li>
                            <li>This card is non-transferable and must be produced on demand.</li>
                        </ol>
                    </div>

                    {/* Signatures */}
                    <div style={{ margin: 'auto 28px 28px', paddingTop: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '48px', borderTop: '1px dashed #c7d2fe' }}>
                            <div style={{ textAlign: 'center', width: '30%' }}>
                                {leftSign && <img src={leftSign} alt="Left Sign" style={{ height: '40px', objectFit: 'contain', marginBottom: '8px' }} />}
                                <div style={{ borderTop: '2px solid #c7d2fe', paddingTop: '6px', fontSize: '9px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Class Teacher</div>
                            </div>
                            <div style={{ textAlign: 'center', width: '30%' }}>
                                {middleSign && <img src={middleSign} alt="Middle Sign" style={{ height: '40px', objectFit: 'contain', marginBottom: '8px' }} />}
                                <div style={{ borderTop: '2px solid #c7d2fe', paddingTop: '6px', fontSize: '9px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Principal</div>
                            </div>
                            <div style={{ textAlign: 'center', width: '30%' }}>
                                {rightSign && <img src={rightSign} alt="Right Sign" style={{ height: '40px', objectFit: 'contain', marginBottom: '8px' }} />}
                                <div style={{ borderTop: '2px solid #c7d2fe', paddingTop: '6px', fontSize: '9px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Exam Controller</div>
                            </div>
                        </div>
                        {template.footer_text && (
                            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '9px', color: '#9ca3af' }}>{template.footer_text}</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------------------
    // DESIGN 1 — Traditional Layout (default)
    // ----------------------------------------------------------------
    return (
        <div
            ref={ref}
            className="admit-card-container relative"
            style={{
                width: '794px',
                minHeight: '1123px',
                padding: '20px 40px 40px 40px',
                fontFamily: 'Arial, sans-serif',
                color: '#000',
                backgroundColor: '#fff'
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

            <div className="relative z-10 w-full h-full flex flex-col">
                {/* Header section */}
                {printHeaderImage ? (
                    <div className="w-full mb-4 text-center">
                        <img src={printHeaderImage} alt="Header" className="w-full h-auto max-h-[150px] object-contain" />
                        <div className="text-center py-2 font-bold text-lg uppercase mt-2" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                            Admit Card ({template.exam_name || exam.name})
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
                            Admit Card ({template.exam_name || exam.name})
                        </div>
                    </div>
                )}

                {/* Exam Title (Fallback if using image header without bar) */}
                {(!printHeaderImage && headerImage) && (
                    <div className="w-full bg-gray-900 text-white text-center py-2 mb-6 font-bold uppercase tracking-widest text-lg rounded-sm shadow-sm">
                        {template.exam_name || exam.name} ({exam.session})
                    </div>
                )}

                {/* Student Info Section */}
                <div className="flex gap-4 mb-6 items-start" style={{ fontSize: '11px' }}>
                    {/* Text Fields (Columns 1 & 2) */}
                    <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-1.5">
                        {template.show_name && (
                            <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                <span className="font-bold" style={{ width: '36%' }}>Student Name</span>
                                <span style={{ width: '64%' }}>: {student.name}</span>
                            </div>
                        )}
                        {template.show_admission_no && (
                            <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                <span className="font-bold" style={{ width: '36%' }}>Admission No</span>
                                <span style={{ width: '64%' }}>: {student.admission_no}</span>
                            </div>
                        )}
                        {template.show_father_name && (
                            <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                <span className="font-bold" style={{ width: '36%' }}>Father Name</span>
                                <span style={{ width: '64%' }}>: {student.father_name}</span>
                            </div>
                        )}
                        {template.show_roll_no && (
                            <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                <span className="font-bold" style={{ width: '36%' }}>Roll Number</span>
                                <span style={{ width: '64%' }}>: {student.roll_no}</span>
                            </div>
                        )}
                        {template.show_mother_name && (
                            <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                <span className="font-bold" style={{ width: '36%' }}>Mother Name</span>
                                <span style={{ width: '64%' }}>: {student.mother_name}</span>
                            </div>
                        )}
                        {template.show_class && (
                            <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                <span className="font-bold" style={{ width: '36%' }}>Class</span>
                                <span style={{ width: '64%' }}>: {student.class} {template.show_section && student.section ? ` - ${student.section}` : ''}</span>
                            </div>
                        )}
                        {template.show_dob && (
                            <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                <span className="font-bold" style={{ width: '36%' }}>Date of Birth</span>
                                <span style={{ width: '64%' }}>: {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : ''}</span>
                            </div>
                        )}
                        {template.show_gender && (
                            <div className="flex pb-0.5" style={{ borderBottom: '1px solid #d1d5db' }}>
                                <span className="font-bold" style={{ width: '36%' }}>Gender</span>
                                <span style={{ width: '64%' }}>: {student.gender}</span>
                            </div>
                        )}
                        {template.show_address && (
                            <div className="flex pb-0.5 col-span-2" style={{ borderBottom: '1px solid #d1d5db' }}>
                                <span className="font-bold" style={{ width: '18%' }}>Address</span>
                                <span style={{ width: '82%' }}>: {student.address || '---'}</span>
                            </div>
                        )}
                    </div>

                    {/* Photo Box (Column 3) */}
                    {template.show_photo && (
                        <div className="w-[90px] shrink-0" style={{ border: '1px solid #1f2937', padding: '3px' }}>
                            {student.photo ? (
                                <img src={resolveImageUrl(student.photo)} alt="Student Photo" className="w-full h-auto aspect-[3/4] object-cover" />
                            ) : (
                                <div className="w-full aspect-[3/4] flex items-center justify-center text-gray-400 text-[9px] text-center font-bold">
                                    PHOTO
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Exam Schedule Table */}
                <div className="w-full mb-8 flex-1">
                    <table className="w-full border-collapse border-2 border-gray-800 text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border-2 border-gray-800 p-2 text-left font-bold w-[30%]">Subject</th>
                                <th className="border-2 border-gray-800 p-2 text-center font-bold">Date</th>
                                <th className="border-2 border-gray-800 p-2 text-center font-bold">Start Time</th>
                                <th className="border-2 border-gray-800 p-2 text-center font-bold">Duration (min)</th>
                                <th className="border-2 border-gray-800 p-2 text-center font-bold">Room No</th>
                                <th className="border-2 border-gray-800 p-2 text-center font-bold">Marks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.map((schedule, idx) => (
                                <tr key={idx}>
                                    <td className="border-2 border-gray-800 p-2">{schedule.subject_name} {schedule.subject_code ? `(${schedule.subject_code})` : ''}</td>
                                    <td className="border-2 border-gray-800 p-2 text-center">{schedule.date}</td>
                                    <td className="border-2 border-gray-800 p-2 text-center">{schedule.start_time}</td>
                                    <td className="border-2 border-gray-800 p-2 text-center">{schedule.duration}</td>
                                    <td className="border-2 border-gray-800 p-2 text-center">{schedule.room_no}</td>
                                    <td className="border-2 border-gray-800 p-2 text-center">{schedule.max_marks}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer and Signatures */}
                <div className="w-full mt-auto pt-8">
                    <div className="flex justify-between items-end px-4">
                        <div className="flex flex-col items-center">
                            {leftSign && <img src={leftSign} alt="Left Sign" className="h-12 object-contain mb-2" />}
                            <div className="border-t border-gray-400 w-32"></div>
                            <span className="text-xs font-bold mt-1 text-gray-600">Class Teacher</span>
                        </div>
                        <div className="flex flex-col items-center">
                            {middleSign && <img src={middleSign} alt="Middle Sign" className="h-12 object-contain mb-2" />}
                            <div className="border-t border-gray-400 w-32"></div>
                            <span className="text-xs font-bold mt-1 text-gray-600">Principal</span>
                        </div>
                        <div className="flex flex-col items-center">
                            {rightSign && <img src={rightSign} alt="Right Sign" className="h-12 object-contain mb-2" />}
                            <div className="border-t border-gray-400 w-32"></div>
                            <span className="text-xs font-bold mt-1 text-gray-600">Exam Controller</span>
                        </div>
                    </div>
                    {template.footer_text && (
                        <div className="text-center mt-6 text-sm text-gray-600 whitespace-pre-wrap">
                            {template.footer_text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

AdmitCardTemplateLayout.displayName = 'AdmitCardTemplateLayout';
