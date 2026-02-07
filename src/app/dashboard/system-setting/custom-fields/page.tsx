"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data for Custom Fields Categories
const initialCategories = [
    {
        id: "student",
        name: "Student",
        isOpen: true,
        fields: [
            { id: 1, name: "Medical History", type: "Textarea" }
        ]
    },
    {
        id: "staff",
        name: "Staff",
        isOpen: false,
        fields: []
    },
    {
        id: "transfer_certificate",
        name: "Transfer Certificate",
        isOpen: false,
        fields: []
    },
];

export default function CustomFieldsPage() {
    const [categories, setCategories] = useState(initialCategories);

    const toggleCategory = (id: string) => {
        setCategories(prev => prev.map(cat =>
            cat.id === id ? { ...cat, isOpen: !cat.isOpen } : cat
        ));
    };

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* Left Column: Add Custom Field Form */}
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-50 p-4">
                        <h2 className="text-[14px] font-medium text-gray-700">Add Custom Field</h2>
                    </div>

                    <div className="p-5 space-y-5">

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-600">Field Belongs To <span className="text-red-500">*</span></Label>
                            <Select>
                                <SelectTrigger className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="transfer_certificate">Transfer Certificate</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-600">Field Type <span className="text-red-500">*</span></Label>
                            <Select>
                                <SelectTrigger className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="input">Input</SelectItem>
                                    <SelectItem value="textarea">Textarea</SelectItem>
                                    <SelectItem value="select">Select</SelectItem>
                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                    <SelectItem value="date">Date Picker</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-600">Field Name <span className="text-red-500">*</span></Label>
                            <Input className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-600">Grid (Bootstrap Column eg. 6) - Max is 12</Label>
                            <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                                <div className="bg-gray-50 px-3 py-2 text-[11px] text-gray-500 border-r border-gray-200">col-md-</div>
                                <Input defaultValue="12" className="h-9 text-[11px] border-none shadow-none focus-visible:ring-0 rounded-none w-full" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-600">Field Values (Separate By Comma)</Label>
                            <Textarea className="min-h-[60px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y" />
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label className="text-[11px] font-bold text-gray-600">Validation</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="required" className="h-4 w-4 border-gray-300 text-indigo-600 data-[state=checked]:bg-indigo-600 rounded-[2px]" />
                                <label htmlFor="required" className="text-[11px] text-gray-600 font-medium cursor-pointer">Required</label>
                            </div>
                        </div>

                        <div className="space-y-3 pt-1">
                            <Label className="text-[11px] font-bold text-gray-600">Visibility</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="on_table" className="h-4 w-4 border-gray-300 text-indigo-600 data-[state=checked]:bg-indigo-600 rounded-[2px]" />
                                <label htmlFor="on_table" className="text-[11px] text-gray-600 font-medium cursor-pointer">On Table</label>
                            </div>
                        </div>

                    </div>

                    <div className="border-t border-gray-50 p-4 bg-white flex justify-end">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md">
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Column: Custom Field List */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="border-b border-gray-50 p-4">
                        <h2 className="text-[14px] font-medium text-gray-700">Custom Field List</h2>
                    </div>

                    <div className="p-4 space-y-3">
                        {categories.map((category) => (
                            <div key={category.id} className="border border-gray-200 rounded overflow-hidden">
                                {/* Category Header */}
                                <div
                                    className="flex justify-between items-center px-4 py-3 bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors"
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <h3 className={cn("text-[12px] font-medium transition-colors", category.isOpen ? "text-blue-500" : "text-gray-600")}>
                                        {category.name}
                                    </h3>
                                    <button className="text-gray-500 hover:text-gray-700">
                                        {category.isOpen ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                    </button>
                                </div>

                                {/* Category Content */}
                                {category.isOpen && (
                                    <div className="bg-white border-t border-gray-200 p-2">
                                        {category.fields.length > 0 ? (
                                            <div className="space-y-2">
                                                {category.fields.map((field) => (
                                                    <div key={field.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition-all group">
                                                        <div className="flex items-center gap-2">
                                                            <Plus className="h-3 w-3 text-gray-400 group-hover:text-gray-600" />
                                                            <span className="text-[11px] font-medium text-gray-600">{field.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 pr-2">
                                                            <button className="text-indigo-400 hover:text-indigo-600 transition-colors" title="Edit">
                                                                <Pencil className="h-3 w-3" />
                                                            </button>
                                                            <button className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-[10px] text-gray-400 italic">No custom fields found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                </div>
            </div>

        </div>
    );
}
