"use client";

import { useState } from "react";
import {
    Upload,
    Save,
    Plus,
    ChevronDown,
    UserPlus,
    Users,
    House,
    MapPin,
    GraduationCap,
    Wallet,
    Calendar,
    Phone,
    Mail,
    Stethoscope,
    Scale,
    Weight,
    Dna
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function StudentAdmissionPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Student Admission</h1>
                        <p className="text-sm text-muted-foreground">Fill in the details to admit a new student</p>
                    </div>
                </div>
                <Button variant="gradient" className="h-10 px-6">
                    <Upload className="h-4 w-4" />
                    Import Student
                </Button>
            </div>

            {/* Individual Sections */}
            <form className="space-y-8">
                {/* Student Admission Card */}
                <SectionCard title="Student Admission" icon={GraduationCap}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InputField label="Admission No" required />
                        <InputField label="Roll Number" />
                        <SelectField label="Class" required options={["Class 1", "Class 2"]} />
                        <SelectField label="Section" required options={["A", "B"]} />

                        <InputField label="First Name" required />
                        <InputField label="Last Name" />
                        <SelectField label="Gender" required options={["Male", "Female", "Other"]} />
                        <InputField label="Date Of Birth" type="date" required />

                        <SelectField label="Category" options={["General", "OBC", "SC", "ST"]} />
                        <InputField label="Religion" />
                        <InputField label="Caste" />
                        <InputField label="Mobile Number" />

                        <InputField label="Email" type="email" />
                        <InputField label="Admission Date" type="date" value="2026-01-31" />
                        <div className="lg:col-span-2">
                            <FileUploadField label="Student Photo (100px X 100px)" />
                        </div>

                        <SelectField label="Blood Group" options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]} />
                        <SelectField label="House" options={["Red", "Blue", "Green", "Yellow"]} />
                        <InputField label="Height" />
                        <InputField label="Weight" />

                        <InputField label="Measurement Date" type="date" value="2026-01-31" />
                        <div className="lg:col-span-1 pt-8 flex items-center">
                            <button type="button" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
                                <Plus className="h-4 w-4" /> Add Sibling
                            </button>
                        </div>
                        <div className="lg:col-span-4">
                            <TextAreaField label="Medical History" rows={2} />
                        </div>
                    </div>
                </SectionCard>

                {/* Parent Guardian Detail Card */}
                <SectionCard title="Parent Guardian Detail" icon={Users}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InputField label="Father Name" />
                        <InputField label="Father Phone" />
                        <InputField label="Father Occupation" />
                        <FileUploadField label="Father Photo (100px X 100px)" />

                        <InputField label="Mother Name" />
                        <InputField label="Mother Phone" />
                        <InputField label="Mother Occupation" />
                        <FileUploadField label="Mother Photo (100px X 100px)" />

                        <div className="lg:col-span-4 py-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                                If Guardian Is <span className="text-destructive">*</span>
                            </label>
                            <div className="flex gap-6">
                                {["Father", "Mother", "Other"].map((role) => (
                                    <label key={role} className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input type="radio" name="guardian_type" className="peer sr-only" />
                                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 peer-checked:border-primary transition-all"></div>
                                            <div className="absolute h-2.5 w-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-all"></div>
                                        </div>
                                        <span className="text-sm font-semibold group-hover:text-primary transition-colors">{role}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <InputField label="Guardian Name" required />
                        <InputField label="Guardian Relation" />
                        <InputField label="Guardian Email" />
                        <FileUploadField label="Guardian Photo (100px X 100px)" />

                        <InputField label="Guardian Phone" required />
                        <InputField label="Guardian Occupation" />
                        <div className="lg:col-span-2">
                            <TextAreaField label="Guardian Address" rows={2} />
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-muted/30">
                        <button type="button" className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors py-2 px-1">
                            <span className="font-bold text-sm">Add More Details</span>
                            <Plus className="h-5 w-5 bg-muted rounded-full p-1" />
                        </button>
                    </div>
                </SectionCard>

                {/* Transport & Hostel Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SectionCard title="Transport Details" icon={MapPin}>
                        <div className="grid grid-cols-1 gap-6">
                            <SelectField label="Route List" options={["Select"]} />
                            <SelectField label="Pickup Point" options={["Select"]} />
                            <SelectField label="Fees Month" options={["Select Month"]} />
                        </div>
                    </SectionCard>
                    <SectionCard title="Hostel Details" icon={House}>
                        <div className="grid grid-cols-1 gap-6">
                            <SelectField label="Hostel" options={["Select"]} />
                            <SelectField label="Room No." options={["Select"]} />
                        </div>
                    </SectionCard>
                </div>

                {/* Fees Details */}
                <SectionCard title="Fees Details" icon={Wallet}>
                    <div className="space-y-4">
                        {[
                            { label: "Class 1 General", price: "6,700.00" },
                            { label: "Class 1 Lump Sum", price: "150.00" },
                            { label: "Class 1-I Installment", price: "300.00" },
                            { label: "Class 2 General", price: "6,550.00" },
                            { label: "Class 2 Lump Sum", price: "350.00" },
                            { label: "Balance Master", price: "0.00" },
                            { label: "Class 3 General", price: "7,800.00" },
                            { label: "Class 4 General", price: "8,900.00" },
                            { label: "Exam", price: "250.00" },
                            { label: "Fees", price: "0.00" },
                            { label: "Class 5 General", price: "10,100.00" },
                            { label: "Edword Fees Group 2", price: "500.00" },
                            { label: "RKS Fees Test One", price: "600.00" }
                        ].map((fee, idx) => (
                            <FeeRow key={idx} label={fee.label} value={fee.price} />
                        ))}
                    </div>
                </SectionCard>

                {/* Discount Details */}
                <SectionCard title="Fees Discount Details" icon={Scale}>
                    <div className="space-y-4">
                        {[
                            { label: "RKS Discount 1 - rksdisc01" },
                            { label: "Sibling Discount - sibling-disc" },
                            { label: "Handicapped Discount - handicap-disc" },
                            { label: "Class Topper Discount - cls-top-disc" }
                        ].map((discount, idx) => (
                            <FeeRow key={idx} label={discount.label} />
                        ))}
                    </div>
                </SectionCard>

                <div className="flex justify-end pt-6">
                    <Button variant="gradient" type="submit" className="h-12 px-12 text-lg">
                        <Save className="h-5 w-5 mr-2" />
                        Save
                    </Button>
                </div>
            </form>
        </div>
    );
}

// Helper Components
function SectionCard({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
    return (
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-muted/50 flex items-center gap-3 bg-muted/20">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-bold text-lg tracking-tight">{title}</h2>
            </div>
            <CardContent className="p-8">
                {children}
            </CardContent>
        </Card>
    );
}

function InputField({ label, required, type = "text", value = "", placeholder = "" }: { label: string, required?: boolean, type?: string, value?: string, placeholder?: string }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            <Input
                type={type}
                defaultValue={value}
                placeholder={placeholder}
                className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
            />
        </div>
    );
}

function SelectField({ label, required, options }: { label: string, required?: boolean, options: string[] }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            <div className="relative">
                <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer">
                    <option value="">Select</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
            </div>
        </div>
    );
}

function TextAreaField({ label, required, rows = 3 }: { label: string, required?: boolean, rows?: number }) {
    return (
        <div className="space-y-2 group h-full">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            <textarea
                rows={rows}
                className="flex w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all resize-none placeholder:text-muted-foreground/50"
            />
        </div>
    );
}

function FileUploadField({ label }: { label: string }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                {label}
            </label>
            <div className="relative h-11 border border-dashed border-muted-foreground/30 rounded-xl bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all group/upload overflow-hidden">
                <div className="flex items-center gap-2 px-4 pointer-events-none">
                    <Upload className="h-4 w-4 text-muted-foreground group-hover/upload:text-primary transition-colors" />
                    <span className="text-xs font-semibold text-muted-foreground group-hover/upload:text-foreground">Drag and drop a file here or click</span>
                </div>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
        </div>
    );
}

function FeeRow({ label, value }: { label: string, value?: string }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl border border-muted/50 bg-muted/10 hover:bg-muted/20 transition-colors group">
            <div className="flex items-center gap-3">
                <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <Checkbox id={label} />
                <label htmlFor={label} className="text-sm font-semibold cursor-pointer">{label}</label>
            </div>
            {value && <span className="text-sm font-bold">{value}</span>}
        </div>
    );
}
