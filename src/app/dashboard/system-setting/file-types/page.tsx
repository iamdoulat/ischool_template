"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function FileTypesPage() {
    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans space-y-4">

            {/* Page Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-50">
                    <h1 className="text-[16px] font-medium text-gray-700">File Types</h1>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">

                    {/* Setting For Files Section */}
                    <div className="space-y-4">
                        <h2 className="text-[14px] font-medium text-gray-600 border-b border-gray-100 pb-2">Setting For Files</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold text-gray-700">Allowed Extension <span className="text-red-500">*</span></Label>
                                <Textarea
                                    className="min-h-[80px] text-[12px] bg-white border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-get"
                                    defaultValue="pdf, zip, jpg, jpeg, png, txt, 7z, gif, csv, docx, mp3, mp4, accdb, odt, ods, ppt, pptx, xlsx, wmv, jfif, apk, ppt, bmp, jpe, mdb, rar, xls, svg, php, html"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold text-gray-700">Allowed MIME Type <span className="text-red-500">*</span></Label>
                                <Textarea
                                    className="min-h-[100px] text-[12px] bg-white border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                                    defaultValue="application/pdf, image/zip, image/jpg, image/png, image/jpeg, text/plain, application/x-zip-compressed, application/zip, image/gif, text/csv, application/vnd.openxmlformats-officedocument.wordprocessingml.document, audio/mpeg, application/msaccess, application/vnd.oasis.opendocument.text, application/vnd.oasis.opendocument.spreadsheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, video/x-ms-wmv, video/mp4, image/jpeg, application/vnd.android.package-archive, application/x-msdownload, application/vnd.ms-powerpoint, image/bmp, image/jpeg, application/msaccess, application/vnd.ms-excel, image/svg+xml, image/php"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold text-gray-700">Upload Size (in Bytes) <span className="text-red-500">*</span></Label>
                                <Input
                                    className="h-9 text-[12px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full"
                                    defaultValue="100048576"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Setting For Image Section */}
                    <div className="space-y-4 pt-4">
                        <h2 className="text-[14px] font-medium text-gray-600 border-b border-gray-100 pb-2">Setting For Image</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold text-gray-700">Allowed Extension <span className="text-red-500">*</span></Label>
                                <Textarea
                                    className="min-h-[60px] text-[12px] bg-white border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                                    defaultValue="jfif, png, jpe, jpeg, jpg, bmp, gif, svg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold text-gray-700">Allowed MIME Type <span className="text-red-500">*</span></Label>
                                <Textarea
                                    className="min-h-[60px] text-[12px] bg-white border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                                    defaultValue="image/jpeg, image/png, image/jpg, image/jpeg, image/bmp, image/gif, image/x-ms-bmp, image/svg+xml"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[12px] font-bold text-gray-700">Upload Size (in Bytes) <span className="text-red-500">*</span></Label>
                                <Input
                                    className="h-9 text-[12px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full"
                                    defaultValue="10048576"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="flex justify-end pt-4 border-t border-gray-50 mt-4">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md border-b-2 border-indigo-700">
                            Save
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
