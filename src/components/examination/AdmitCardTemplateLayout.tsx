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

    return (
        <div 
            ref={ref} 
            className="admit-card-container relative" 
            style={{ 
                width: '794px', // A4 width
                minHeight: '1123px', // A4 height
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
                {/* Print Header */}
                {printHeaderImage && (
                    <div className="w-full mb-4">
                        <img src={printHeaderImage} alt="Header" className="w-full h-auto object-contain" />
                    </div>
                )}

                {/* Template Header / Heading */}
                <div className="w-full flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-4">
                    {leftLogo ? <img src={leftLogo} alt="Left Logo" className="h-20 object-contain" /> : <div className="w-20" />}
                    <div className="flex-1 text-center px-4">
                        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">{template.heading || template.school_name}</h1>
                        <h2 className="text-lg font-bold text-gray-700 mt-1">{template.title}</h2>
                        {template.exam_center && <p className="text-sm text-gray-600 mt-1">Center: {template.exam_center}</p>}
                    </div>
                    {rightLogo ? <img src={rightLogo} alt="Right Logo" className="h-20 object-contain" /> : <div className="w-20" />}
                </div>

                {/* Exam Title */}
                <div className="w-full bg-gray-900 text-white text-center py-2 mb-6 font-bold uppercase tracking-widest text-lg rounded-sm shadow-sm">
                    {template.exam_name || exam.name} ({exam.session})
                </div>

                {/* Student Info & Photo Grid */}
                <div className="flex w-full gap-6 mb-8">
                    <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-4">
                        {template.show_name && (
                            <div className="grid grid-cols-[100px_10px_1fr] text-sm">
                                <div className="font-bold">Student Name</div>
                                <div>:</div>
                                <div>{student.name}</div>
                            </div>
                        )}
                        {template.show_admission_no && (
                            <div className="grid grid-cols-[100px_10px_1fr] text-sm">
                                <div className="font-bold">Admission No</div>
                                <div>:</div>
                                <div>{student.admission_no}</div>
                            </div>
                        )}
                        {template.show_father_name && (
                            <div className="grid grid-cols-[100px_10px_1fr] text-sm">
                                <div className="font-bold">Father Name</div>
                                <div>:</div>
                                <div>{student.father_name}</div>
                            </div>
                        )}
                        {template.show_roll_no && (
                            <div className="grid grid-cols-[100px_10px_1fr] text-sm">
                                <div className="font-bold">Roll Number</div>
                                <div>:</div>
                                <div>{student.roll_no}</div>
                            </div>
                        )}
                        {template.show_mother_name && (
                            <div className="grid grid-cols-[100px_10px_1fr] text-sm">
                                <div className="font-bold">Mother Name</div>
                                <div>:</div>
                                <div>{student.mother_name}</div>
                            </div>
                        )}
                        {template.show_class && (
                            <div className="grid grid-cols-[100px_10px_1fr] text-sm">
                                <div className="font-bold">Class</div>
                                <div>:</div>
                                <div>{student.class} {template.show_section && `- ${student.section}`}</div>
                            </div>
                        )}
                        {template.show_dob && (
                            <div className="grid grid-cols-[100px_10px_1fr] text-sm">
                                <div className="font-bold">Date of Birth</div>
                                <div>:</div>
                                <div>{student.dob}</div>
                            </div>
                        )}
                        {template.show_gender && (
                            <div className="grid grid-cols-[100px_10px_1fr] text-sm">
                                <div className="font-bold">Gender</div>
                                <div>:</div>
                                <div>{student.gender}</div>
                            </div>
                        )}
                        {template.show_address && (
                            <div className="grid grid-cols-[100px_10px_1fr] text-sm col-span-2">
                                <div className="font-bold">Address</div>
                                <div>:</div>
                                <div>{student.address || '---'}</div>
                            </div>
                        )}
                    </div>
                    {template.show_photo && (
                        <div className="w-[120px] shrink-0 flex flex-col gap-2">
                            {student.photo ? (
                                <img src={resolveImageUrl(student.photo)} alt="Student Photo" className="w-full h-[150px] object-cover border-2 border-gray-300 rounded" />
                            ) : (
                                <div className="w-full h-[150px] border-2 border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs font-bold bg-gray-50">
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
