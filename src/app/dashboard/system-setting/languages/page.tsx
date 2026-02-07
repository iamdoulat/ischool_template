"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data
// Using custom flag rendering or emojis
const initialLanguages = [
    { id: 1, name: "Afrikaans", shortCode: "af", countryCode: "af", isRtl: true, isActive: false, isEnabled: false },
    { id: 2, name: "Albanian", shortCode: "sq", countryCode: "al", isRtl: false, isActive: false, isEnabled: false },
    { id: 3, name: "Amharic", shortCode: "am", countryCode: "am", isRtl: false, isActive: false, isEnabled: false },
    { id: 4, name: "Arabic", shortCode: "ar", countryCode: "sa", isRtl: true, isActive: true, isEnabled: true },
    { id: 5, name: "Azerbaijan", shortCode: "az", countryCode: "az", isRtl: false, isActive: false, isEnabled: false },
    { id: 6, name: "Basque", shortCode: "eu", countryCode: "es", isRtl: false, isActive: false, isEnabled: false },
    { id: 7, name: "Bengali", shortCode: "bn", countryCode: "in", isRtl: false, isActive: false, isEnabled: false },
    { id: 8, name: "Bosnian", shortCode: "bs", countryCode: "bs", isRtl: false, isActive: false, isEnabled: false },
    { id: 9, name: "Catalan", shortCode: "ca", countryCode: "ca", isRtl: false, isActive: false, isEnabled: false },
    { id: 10, name: "Cebuano", shortCode: "ceb", countryCode: "ph", isRtl: false, isActive: false, isEnabled: false },
    { id: 11, name: "Chinese", shortCode: "zh", countryCode: "cn", isRtl: false, isActive: false, isEnabled: false },
    { id: 12, name: "Croatia", shortCode: "hr", countryCode: "hr", isRtl: false, isActive: false, isEnabled: false },
    { id: 13, name: "Czech", shortCode: "cs", countryCode: "cz", isRtl: false, isActive: false, isEnabled: false },
];

export default function LanguagesPage() {
    const [languages, setLanguages] = useState(initialLanguages);

    const toggleRtl = (id: number) => {
        setLanguages(prev => prev.map(lang => lang.id === id ? { ...lang, isRtl: !lang.isRtl } : lang));
    };

    const toggleEnabled = (id: number) => {
        setLanguages(prev => prev.map(lang => lang.id === id ? { ...lang, isEnabled: !lang.isEnabled } : lang));
    };

    const setActive = (id: number) => {
        setLanguages(prev => prev.map(lang => ({ ...lang, isActive: lang.id === id })));
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">

            {/* Header Container */}
            <div className="bg-white rounded-t-lg shadow-sm border border-gray-100 p-4 flex justify-between items-center">
                <h1 className="text-[13px] font-medium text-gray-700">Language List</h1>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-md gap-1">
                    <Plus className="h-3 w-3" /> Add
                </Button>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-b-lg shadow-sm border border-gray-100 p-4 space-y-4">

                {/* Warning Alert */}
                <div className="bg-orange-100/50 border border-orange-200 text-orange-700 px-4 py-3 rounded text-[11px] font-medium">
                    To change language key phrases, go your language directory e.g. for English language go edit file /application/language/English/app_files/system_lang.php
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-100 rounded">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase w-12">#</TableHead>
                                <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase">Language</TableHead>
                                <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase">Short Code</TableHead>
                                <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase w-[300px]">Country Code</TableHead>
                                <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase text-center w-24">Status</TableHead>
                                <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase text-center w-24">Active</TableHead>
                                <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase text-center w-24">Is Rtl</TableHead>
                                <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase text-right w-24">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {languages.map((lang, idx) => (
                                <TableRow key={lang.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors h-12">
                                    <TableCell className="py-2 px-4 text-[11px] text-gray-500 font-medium">
                                        {idx + 1}.
                                    </TableCell>
                                    <TableCell className="py-2 px-4">
                                        <div className="flex items-center gap-2">
                                            {/* Placeholder for Flag - Using unicode flag logic or simple rect */}
                                            {/* Since unicode flags don't render well on Windows, using small colored span */}
                                            <span className="text-lg leading-none filter drop-shadow-sm select-none grayscale-[0.2]">
                                                {/* Simple mapping for flags */}
                                                {lang.countryCode === 'af' && '🇿🇦'}
                                                {lang.countryCode === 'al' && '🇦🇱'}
                                                {lang.countryCode === 'am' && '🇪🇹'}
                                                {lang.countryCode === 'sa' && '🇸🇦'}
                                                {lang.countryCode === 'az' && '🇦🇿'}
                                                {lang.countryCode === 'es' && '🇪🇸'}
                                                {lang.countryCode === 'in' && '🇮🇳'}
                                                {lang.countryCode === 'bs' && '🇧🇦'}
                                                {lang.countryCode === 'ca' && '🇨🇦'}
                                                {lang.countryCode === 'ph' && '🇵🇭'}
                                                {lang.countryCode === 'cn' && '🇨🇳'}
                                                {lang.countryCode === 'hr' && '🇭🇷'}
                                                {lang.countryCode === 'cz' && '🇨🇿'}
                                            </span>
                                            <span className="text-[11px] font-medium text-gray-700">{lang.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-[11px] text-gray-500">
                                        {lang.shortCode}
                                    </TableCell>
                                    <TableCell className="py-2 px-4">
                                        <Input
                                            defaultValue={lang.countryCode}
                                            className="h-7 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full md:w-64"
                                        />
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-center">
                                        {/* Status Column seems empty in image? Or maybe just status labels which are missing */}
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-center">
                                        <div className="flex justify-center">
                                            <RadioGroup
                                                value={lang.isActive ? "active" : ""}
                                                onValueChange={() => setActive(lang.id)}
                                                className="flex"
                                            >
                                                <RadioGroupItem
                                                    value="active"
                                                    onClick={() => setActive(lang.id)}
                                                    className={cn(
                                                        "h-4 w-4 border-gray-300 text-indigo-600 data-[state=checked]:border-indigo-600 transition-all cursor-pointer",
                                                        lang.isActive ? "border-indigo-600" : ""
                                                    )}
                                                />
                                            </RadioGroup>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-center">
                                        <div className="flex justify-center">
                                            <Checkbox
                                                checked={lang.isRtl}
                                                onCheckedChange={() => toggleRtl(lang.id)}
                                                className="h-4 w-4 border-gray-300 data-[state=checked]:bg-[#6366f1] data-[state=checked]:border-[#6366f1] rounded sm transition-all"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-right">
                                        <div className="flex justify-end">
                                            <Switch
                                                checked={lang.isEnabled}
                                                onCheckedChange={() => toggleEnabled(lang.id)}
                                                className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

            </div>
        </div>
    );
}
