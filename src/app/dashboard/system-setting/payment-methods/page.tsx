"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

// List of payment gateways
const gateways = [
    "Paypal", "Stripe", "PayU", "CCAvenue", "InstaMojo", "Paystack",
    "Razorpay", "Paytm", "Midtrans", "Pesapal", "Flutter Wave",
    "iPay Africa", "JazzCash", "Billplz", "SSLCommerz", "Walkingm",
    "Mollie", "Cashfree", "Payfast", "ToyyibPay", "Twocheckout",
    "Skrill", "Payhere", "Onepay", "DPO Pay", "MOMO Pay"
];

// Mock data for the right sidebar (can include 'None')
const activeGateways = [...gateways, "None"];

export default function PaymentMethodsPage() {
    const [activeTab, setActiveTab] = useState("Paypal");
    const [selectedGateway, setSelectedGateway] = useState("Stripe");

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans flex flex-col md:flex-row gap-6">

            {/* Left Column: Configuration Area (Tabs & Form) */}
            <div className="flex-1 space-y-4">
                <h1 className="text-sm font-medium text-gray-800 tracking-tight">Payment Methods</h1>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col min-h-[600px]">

                    {/* Top Tabs */}
                    <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
                        <div className="flex overflow-x-auto no-scrollbar pb-1 pt-1 px-1">
                            {gateways.map((gateway) => (
                                <button
                                    key={gateway}
                                    onClick={() => setActiveTab(gateway)}
                                    className={cn(
                                        "px-4 py-3 text-[11px] font-bold uppercase transition-all whitespace-nowrap border-b-2 mx-1",
                                        activeTab === gateway
                                            ? "text-indigo-600 border-indigo-500 bg-indigo-50/10"
                                            : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    {gateway}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Configuration Form */}
                    <div className="flex-1 p-8">
                        {activeTab === "Paypal" ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in fade-in duration-300">

                                {/* Form Fields */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Paypal Username <span className="text-red-500">*</span></Label>
                                        <div className="md:col-span-2 relative">
                                            <Input className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded pr-8" />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">•••</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Paypal Password <span className="text-red-500">*</span></Label>
                                        <div className="md:col-span-2 relative">
                                            <Input type="password" className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded pr-8" />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">•••</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Paypal Signature <span className="text-red-500">*</span></Label>
                                        <div className="md:col-span-2">
                                            <Input className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-4 pt-4">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase mt-1">Processing Fees Type</Label>
                                        <div className="md:col-span-2 space-y-2">
                                            <RadioGroup defaultValue="none">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="none" id="r-none" className="text-indigo-600 border-gray-300" />
                                                    <Label htmlFor="r-none" className="text-[11px] text-gray-600">None</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="percentage" id="r-percentage" className="text-indigo-600 border-gray-300" />
                                                    <Label htmlFor="r-percentage" className="text-[11px] text-gray-600">Percentage (%)</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="fix" id="r-fix" className="text-indigo-600 border-gray-300" />
                                                    <Label htmlFor="r-fix" className="text-[11px] text-gray-600">Fix Amount ($)</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Percentage/Fix Amount</Label>
                                        <div className="md:col-span-2">
                                            <Input className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                                        </div>
                                    </div>
                                </div>

                                {/* Brand Showcase */}
                                <div className="flex flex-col items-center space-y-6 pt-4 lg:pt-0 lg:border-l border-gray-100 pl-8">
                                    <p className="text-xs text-indigo-500 font-medium">Multinational Payment Gateway</p>

                                    <div className="p-4">
                                        {/* Stylized PayPal Logo Representation */}
                                        <div className="flex items-center justify-center text-4xl font-bold tracking-tighter italic text-slate-700">
                                            <span className="text-[#003087]">Pay</span><span className="text-[#009cde]">Pal</span>
                                        </div>
                                    </div>

                                    <a
                                        href="https://www.paypal.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-indigo-500 hover:underline font-medium"
                                    >
                                        https://www.paypal.com
                                    </a>
                                </div>

                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 opacity-50 animate-in fade-in duration-300">
                                <h2 className="text-sm font-bold text-gray-400 p-4 border-2 border-dashed border-gray-200 rounded-xl">
                                    {activeTab} Configuration Module Pending
                                </h2>
                            </div>
                        )}
                    </div>

                    {/* Footer Save Action */}
                    <div className="border-t border-gray-50 p-6 bg-white flex justify-center mt-auto">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md border-b-2 border-indigo-700">
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Column: Gateway Selection Sidebar */}
            <div className="w-full md:w-64 space-y-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 h-full max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar sticky top-4">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight mb-4 border-b border-gray-50 pb-2">
                        Select Payment Gateway
                    </h2>

                    <RadioGroup value={selectedGateway} onValueChange={setSelectedGateway} className="space-y-3">
                        {activeGateways.map((gateway) => (
                            <div key={`sel-${gateway}`} className="flex items-center space-x-2.5 group">
                                <RadioGroupItem
                                    value={gateway}
                                    id={`sel-${gateway}`}
                                    className="h-3.5 w-3.5 text-indigo-600 border-gray-300 data-[state=checked]:border-indigo-600"
                                />
                                <Label
                                    htmlFor={`sel-${gateway}`}
                                    className={cn(
                                        "text-[11px] font-medium cursor-pointer transition-colors",
                                        selectedGateway === gateway ? "text-indigo-600 font-bold" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    {gateway}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>

                    <div className="mt-8 flex justify-end">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-md">
                            Save
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
}
