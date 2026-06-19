"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Mail, User, Clock } from "lucide-react";
import QRCode from "qrcode";
import { Progress } from "@/components/ui/progress";
import { mockUserDashboardData } from "@/lib/mock-user-dashboard";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export default function UserDashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const [selectedNotice, setSelectedNotice] = useState<any>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Try fetching from the API endpoint
                const response = await api.get('/user/dashboard');
                if (response.data && response.data.success) {
                    setData(response.data.data);
                } else {
                    setData(mockUserDashboardData);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                // Fallback to mock data if API fails
                setData(mockUserDashboardData);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (data?.profile?.barcode) {
            QRCode.toDataURL(data.profile.barcode, {
                width: 150,
                margin: 1,
                color: { dark: "#000000", light: "#ffffff" },
            }).then(setQrDataUrl).catch(() => {});
        }
    }, [data]);

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const {
        profile,
        notices,
        subjectProgress,
        upcomingClasses,
        homework,
        teachers,
        visitors,
        libraryBooks
    } = data || mockUserDashboardData;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Welcome Card */}
                <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.18)] rounded-sm overflow-hidden border-0 w-full p-0 gap-0">
                    <CardContent className="p-3 flex gap-4 items-start bg-white">
                        {/* Avatar Box */}
                        <div className="h-[90px] w-[90px] bg-gradient-to-b from-[#f2f2f2] to-[#d4d4d4] rounded shadow-[inset_0px_0px_10px_rgba(0,0,0,0.15)] flex items-center justify-center shrink-0 border border-gray-300">
                            {profile.image ? (
                                <img src={profile.image} alt={profile.name} className="h-full w-full object-cover rounded" />
                            ) : (
                                <User className="h-[60px] w-[60px] text-gray-500/80" />
                            )}
                        </div>
                        {/* Text and Barcode */}
                        <div className="flex flex-col flex-1 py-0.5">
                            <h2 className="text-[17px] font-bold text-[#333333] mb-1">
                                Welcome, {profile.name}! Keep Going.
                            </h2>
                            <p className="text-[14px] text-[#333333] mb-2">
                                Your current attendance is {profile.attendance_percentage}% which is{" "}
                                <span className={cn(
                                    "font-semibold",
                                    Number(profile.attendance_percentage) >= Number(profile.minimum_attendance)
                                        ? "text-[#2fb12e]"
                                        : "text-red-500"
                                )}>
                                    {Number(profile.attendance_percentage) >= Number(profile.minimum_attendance) ? "above" : "below"}
                                </span>{" "}
                                {profile.minimum_attendance}% of minimum attendance mark.
                            </p>
                            <div className="flex items-end gap-5">
                                {/* QR Code */}
                                <div className="h-9 w-9 bg-white">
                                    {qrDataUrl ? (
                                        <img src={qrDataUrl} alt="QR Code" className="h-full w-full object-contain" />
                                    ) : (
                                        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                            <span className="text-[6px] text-gray-400">QR</span>
                                        </div>
                                    )}
                                </div>
                                {/* Dummy Barcode */}
                                <div className="flex flex-col items-center">
                                    <svg className="h-[22px] w-[100px]" viewBox="0 0 100 30" preserveAspectRatio="none">
                                        <rect x="0" y="0" width="2" height="30" fill="black" />
                                        <rect x="3" y="0" width="1" height="30" fill="black" />
                                        <rect x="6" y="0" width="3" height="30" fill="black" />
                                        <rect x="11" y="0" width="2" height="30" fill="black" />
                                        <rect x="15" y="0" width="1" height="30" fill="black" />
                                        <rect x="18" y="0" width="4" height="30" fill="black" />
                                        <rect x="24" y="0" width="1" height="30" fill="black" />
                                        <rect x="27" y="0" width="3" height="30" fill="black" />
                                        <rect x="32" y="0" width="2" height="30" fill="black" />
                                        <rect x="36" y="0" width="1" height="30" fill="black" />
                                        <rect x="39" y="0" width="3" height="30" fill="black" />
                                        <rect x="44" y="0" width="1" height="30" fill="black" />
                                        <rect x="47" y="0" width="4" height="30" fill="black" />
                                        <rect x="53" y="0" width="2" height="30" fill="black" />
                                        <rect x="57" y="0" width="1" height="30" fill="black" />
                                        <rect x="60" y="0" width="3" height="30" fill="black" />
                                        <rect x="65" y="0" width="2" height="30" fill="black" />
                                        <rect x="69" y="0" width="1" height="30" fill="black" />
                                        <rect x="72" y="0" width="4" height="30" fill="black" />
                                        <rect x="78" y="0" width="1" height="30" fill="black" />
                                        <rect x="81" y="0" width="3" height="30" fill="black" />
                                        <rect x="86" y="0" width="2" height="30" fill="black" />
                                        <rect x="90" y="0" width="1" height="30" fill="black" />
                                        <rect x="93" y="0" width="3" height="30" fill="black" />
                                        <rect x="98" y="0" width="2" height="30" fill="black" />
                                    </svg>
                                    <span className="text-[9px] font-bold font-mono tracking-widest leading-none mt-[2px]">{profile.barcode}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notice Board */}
                <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.18)] rounded-sm overflow-hidden border-0 w-full p-0 gap-0">
                    <div className="px-[18px] py-2 flex items-center border-b border-gray-200 bg-white rounded-t-md">
                        <h3 className="text-[15px] text-[#333333] font-semibold">Notice Board</h3>
                    </div>
                    <CardContent className="py-[10px] px-[5px] bg-white h-full">
                        <div className="divide-y divide-gray-100">
                            {notices.map((notice: any) => (
                                <button
                                    key={notice.id}
                                    type="button"
                                    onClick={() => setSelectedNotice(notice)}
                                    className="w-full text-left px-5 py-[4px] flex items-center gap-[10px] hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <Mail className="h-[15px] w-[15px] text-[#5cb85c] mt-[1px] shrink-0" />
                                    <p className="text-[13px] text-[#666666] flex items-center flex-wrap">
                                        <span className="mr-1 hover:text-[#337ab7] hover:underline">{notice.title}</span>
                                        <span className="text-[#337ab7] flex items-center">
                                            (<svg className="h-[13px] w-[13px] mr-[3px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            {notice.date})
                                        </span>
                                    </p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Subject Progress */}
                <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.18)] flex flex-col h-[320px] p-0 gap-0 border-0">
                    <div className="px-[18px] py-2 flex items-center border-b border-gray-200 bg-white rounded-t-md">
                        <h3 className="text-[15px] text-[#333333] font-semibold">Subject Progress</h3>
                    </div>
                    <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left font-bold text-gray-600 pb-2">Subject</th>
                                        <th className="text-left font-bold text-gray-600 pb-2 w-1/3">Progress</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjectProgress.map((item: any) => (
                                        <tr key={item.id} className="border-b border-gray-100 last:border-0">
                                            <td className="py-3 text-gray-600 truncate pr-2 max-w-[120px]" title={item.subject}>{item.subject}</td>
                                            <td className="py-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-gray-500">{item.progress}%</span>
                                                    <Progress value={item.progress} className="h-1.5 [&>div]:bg-[#2fb12e] bg-gray-200" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {subjectProgress.length === 0 && (
                                <p className="text-center text-xs text-gray-400 py-8">No subject progress data available.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Class */}
                <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.18)] flex flex-col h-[320px] p-0 gap-0 border-0">
                    <div className="px-[18px] py-2 flex items-center border-b border-gray-200 bg-white rounded-t-md">
                        <h3 className="text-[15px] text-[#333333] font-semibold">Upcoming Class</h3>
                    </div>
                    <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="divide-y divide-gray-100">
                            {upcomingClasses.map((item: any) => (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <User className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-700 truncate">{item.teacher}{item.code ? ` (${item.code})` : ""}</p>
                                            <p className="text-xs text-gray-500 truncate">{item.subject}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <p className="text-sm text-gray-700">Room No:{item.room}</p>
                                        <p className="text-xs text-gray-400">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {upcomingClasses.length === 0 && (
                            <p className="text-center text-xs text-gray-400 py-8">No upcoming classes scheduled.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Homework */}
                <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.18)] flex flex-col h-[320px] p-0 gap-0 border-0">
                    <div className="px-[18px] py-2 flex items-center border-b border-gray-200 bg-white rounded-t-md">
                        <h3 className="text-[15px] text-[#333333] font-semibold">Homework</h3>
                    </div>
                    <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="divide-y divide-gray-100">
                            {homework.map((item: any) => (
                                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <p className="text-sm font-medium text-gray-700 mb-1">{item.subject}</p>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                                        <span>Homework Date: {item.date},</span>
                                        <span>Submission Date: {item.submission},</span>
                                        <span>Status:
                                            <span className={cn(
                                                "ml-1 px-1.5 py-0.5 text-[10px] rounded font-bold text-white uppercase",
                                                item.status === "Pending" ? "bg-red-500" : "bg-orange-400"
                                            )}>
                                                {item.status}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {homework.length === 0 && (
                            <p className="text-center text-xs text-gray-400 py-8">No homework assigned.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Teacher List */}
                <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.18)] flex flex-col h-[320px] p-0 gap-0 border-0">
                    <div className="px-[18px] py-2 flex items-center border-b border-gray-200 bg-white rounded-t-md">
                        <h3 className="text-[15px] text-[#333333] font-semibold">Teacher List</h3>
                    </div>
                    <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="divide-y divide-gray-100">
                            {teachers.map((item: any) => (
                                <div key={item.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        <User className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div className="min-w-0 flex flex-col items-start">
                                        <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-xs text-gray-600">({item.code})</span>
                                            {item.isClassTeacher && (
                                                <span className="bg-[#5cb85c] text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">
                                                    Class Teacher
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {teachers.length === 0 && (
                            <p className="text-center text-xs text-gray-400 py-8">No teachers assigned.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Visitor List */}
                <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.18)] flex flex-col h-[320px] p-0 gap-0 border-0">
                    <div className="px-[18px] py-2 flex items-center border-b border-gray-200 bg-white rounded-t-md">
                        <h3 className="text-[15px] text-[#333333] font-semibold">Visitor List</h3>
                    </div>
                    <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="divide-y divide-gray-100">
                            {visitors.map((item: any) => (
                                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <p className="text-sm font-medium text-gray-700">{item.name}</p>
                                    <p className="text-xs text-gray-500 mb-1">(Purpose: {item.purpose})</p>
                                    <p className="text-xs text-gray-400">{item.date}</p>
                                </div>
                            ))}
                        </div>
                        {visitors.length === 0 && (
                            <p className="text-center text-xs text-gray-400 py-8">No recent visitors.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Library Book Issue List */}
                <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.18)] flex flex-col h-[320px] p-0 gap-0 border-0">
                    <div className="px-[18px] py-2 flex items-center border-b border-gray-200 bg-white rounded-t-md">
                        <h3 className="text-[15px] text-[#333333] font-semibold">Library Book Issue List</h3>
                    </div>
                    <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-4">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left font-semibold text-gray-600 pb-2">Book No.</th>
                                        <th className="text-left font-semibold text-gray-600 pb-2">Book Title</th>
                                        <th className="text-left font-semibold text-gray-600 pb-2">Issue Date</th>
                                        <th className="text-left font-semibold text-gray-600 pb-2">Due Return</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {libraryBooks.map((item: any) => (
                                        <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                            <td className="py-3 text-gray-600 pr-2">{item.no}</td>
                                            <td className="py-3 pr-2">
                                                <p className="text-gray-700 truncate max-w-[120px]" title={item.title}>{item.title}</p>
                                                <p className="text-gray-500">({item.author})</p>
                                            </td>
                                            <td className="py-3 text-gray-600 whitespace-nowrap pr-2">{item.issueDate}</td>
                                            <td className="py-3 text-gray-600 whitespace-nowrap">{item.returnDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {libraryBooks.length === 0 && (
                                <p className="text-center text-xs text-gray-400 py-8">No books issued.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notice Detail Modal */}
            <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-start gap-2 text-[#333333]">
                            <Mail className="h-5 w-5 text-[#5cb85c] mt-0.5 shrink-0" />
                            <span>{selectedNotice?.title}</span>
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-1 text-[#337ab7] pt-1">
                            <Clock className="h-[14px] w-[14px]" />
                            {selectedNotice?.date || selectedNotice?.notice_date}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedNotice?.message ? (
                        <div
                            className="prose prose-sm w-full max-w-full break-words whitespace-normal overflow-x-hidden overflow-y-auto max-h-[60vh] prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:whitespace-normal prose-p:break-words prose-a:text-indigo-600 prose-a:break-all prose-img:max-w-full prose-img:h-auto prose-pre:whitespace-pre-wrap prose-pre:break-words"
                            dangerouslySetInnerHTML={{ __html: selectedNotice.message }}
                        />
                    ) : (
                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-words">
                            {selectedNotice?.description || "No additional details available for this notice."}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
