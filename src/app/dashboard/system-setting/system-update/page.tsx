"use client";

import { Info } from "lucide-react";

export default function SystemUpdatePage() {
    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans space-y-4">

            {/* Page Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-50">
                    <h1 className="text-[16px] font-medium text-gray-700">System Update</h1>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col items-center justify-center space-y-6 mt-8">

                    {/* Version Box */}
                    <div className="bg-green-50 border border-green-200 text-green-700 px-12 py-6 rounded-md text-center shadow-sm w-full max-w-md">
                        <p className="text-[13px] font-medium text-green-600/80 mb-1">Your iSchool Version</p>
                        <p className="text-xl font-bold text-green-700">7.2.0</p>
                    </div>

                    {/* Status Message */}
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <div className="bg-green-600 rounded-full p-[1px]">
                            <Info className="h-3 w-3 text-white fill-green-600" />
                        </div>
                        <span className="text-[12px] font-medium">You are using latest version.</span>
                    </div>

                    {/* Changelog Link */}
                    <p className="text-[12px] text-gray-600">
                        Please Check <span className="text-indigo-600 font-medium cursor-pointer hover:underline">Changelog</span> For Latest Version Update.
                    </p>

                </div>
            </div>
        </div>
    );
}
