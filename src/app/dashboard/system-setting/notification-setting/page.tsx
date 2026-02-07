"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pencil,
    MessageSquare,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationEvent {
    event: string;
    destinations: string[]; // ['Email', 'SMS', 'Mobile App', 'WhatsApp']
    recipients: string[]; // ['Student', 'Guardian', 'Staff']
    smsTemplateId?: string;
    whatsAppTemplateId?: string;
    sampleMessage: string;
}

const notificationEvents: NotificationEvent[] = [
    {
        event: "Online Admission Fees Submission",
        destinations: ["Email", "SMS", "Mobile App", "WhatsApp"],
        recipients: ["Student", "Guardian"],
        whatsAppTemplateId: "HXD7195c2d239676124c4e08f58232104a",
        sampleMessage: "Dear {{firstname}} {{lastname}} your online admission form is Submitted successfully and the payment of {{paid_amount}} has received successfully on date {{date}}. Your Reference number is {{reference_no}}. Please remember your reference number for further process."
    },
    {
        event: "Behaviour Incident Assigned",
        destinations: ["Email", "SMS", "Mobile App", "WhatsApp"],
        recipients: ["Student", "Guardian"],
        whatsAppTemplateId: "HXD7195c2d239676124c4e08f58232104a",
        sampleMessage: "A new {{incident_title}} behaviour incident with {{incident_point}} point is assigned on you. {{student_name}} ({{class}}) ({{section}}) ({{admission_no}}) ({{mobileno}}) ({{email}}) ({{guardian_name}}) ({{guardian_phone}}) ({{guardian_email}})"
    },
    {
        event: "CBSE Exam Result",
        destinations: ["Email", "SMS", "Mobile App", "WhatsApp"],
        recipients: ["Student", "Guardian"],
        whatsAppTemplateId: "HX81ee1977fb43981e9e9a6ada5cb9a54f",
        sampleMessage: "Dear {{student_name}} ({{roll_no}}), your {{exam}} result has been published."
    },
    {
        event: "CBSE Exam Marksheet Pdf",
        destinations: ["Email", "SMS", "Mobile App"],
        recipients: ["Student", "Guardian"],
        sampleMessage: "Dear {{student_name}} ({{admission_no}}) ({{class}}) Section ({{section}}) We have mailed you the marksheet with Roll no.({{roll_no}})"
    },
    {
        event: "Online Course Guest User Sign Up",
        destinations: ["Email"],
        recipients: ["Student"],
        sampleMessage: "Dear {{guest_user_name}} you have successfully sign up with Email: {{email}} Url: {{url}}"
    },
    {
        event: "Online Course Purchase For Guest User",
        destinations: ["Email", "SMS"],
        recipients: ["Student"],
        sampleMessage: "Thanks for purchasing course {{title}} discount: {{discount}} amount {{price}} purchase date {{purchase_date}}"
    },
    {
        event: "Email PDF Exam Marksheet",
        destinations: ["Email"],
        recipients: ["Student", "Guardian"],
        sampleMessage: "Dear {{student_name}} ({{admission_no}}) ({{class}}) Section ({{section}}) We have mailed you the marksheet of Exam {{exam}} Roll no.({{roll_no}})"
    },
    {
        event: "Student Apply Leave",
        destinations: ["Email", "SMS", "WhatsApp"],
        recipients: ["Guardian", "Staff"],
        sampleMessage: "My Name is {{student_name}} Class {{class}} section {{section}} I have to apply leave on {{apply_date}} and from {{from_date}} to {{to_date}} {{message}} please provide."
    },
    {
        event: "Online Admission Fees Processing",
        destinations: ["Email", "SMS", "Mobile App", "WhatsApp"],
        recipients: ["Student", "Guardian"],
        sampleMessage: "Dear {{firstname}} {{lastname}} your online admission form is Submitted successfully and the payment of {{paid_amount}} has processing on date {{date}}. Your Reference number is {{reference_no}} and your transaction id: {{transaction_id}}. Please remember your reference number for further process."
    },
    {
        event: "Fee Processing",
        destinations: ["Email", "SMS", "Mobile App", "WhatsApp"],
        recipients: ["Student", "Guardian"],
        sampleMessage: "Dear parents, we have received Fees Amount {{fee_amount}} for {{student_name}} by Your School Name ({{class}}) ({{section}}) ({{email}}) ({{contact_no}}) student_name: {{class}} ({{section}}) {{email}} {{contact_no}} transaction_id {{transaction_id}} {{fee_amount}}"
    },
    {
        event: "Staff Login Credential",
        destinations: ["Email", "SMS", "WhatsApp"],
        recipients: ["Staff"],
        sampleMessage: "Hello {{first_name}} {{last_name}} your login details for Url: {{url}} Username: {{username}} Password: {{password}} Employee ID: {{employee_id}}"
    },
    {
        event: "Student Login Credential",
        destinations: ["Email", "SMS", "WhatsApp"],
        recipients: ["Student", "Guardian"],
        sampleMessage: "Hello {{display_name}} your login details for Url: {{url}} Username: {{username}} Password: {{password}} admission No: {{admission_no}}"
    },
    {
        event: "Online Course Purchase",
        destinations: ["Email", "SMS", "Mobile App", "WhatsApp"],
        recipients: ["Student", "Guardian"],
        whatsAppTemplateId: "HX81ee1977fb43981e9e9a6ada5cb9a54f",
        sampleMessage: "Thanks for purchasing course {{title}} amount {{price}} purchase date {{purchase_date}} class {{class}} section {{section}} and assign for {{assign_teacher}}"
    }
];

const destinationOptions = ["Email", "SMS", "Mobile App", "WhatsApp"];
const recipientOptions = ["Student", "Guardian", "Staff"];

export default function NotificationSettingPage() {
    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Notification Setting</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden relative pb-20">
                <div className="overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1500px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent text-[10px] font-bold uppercase text-gray-500 bg-gray-50/30">
                                <TableHead className="py-3 px-4 w-[200px]">Event</TableHead>
                                <TableHead className="py-3 px-4 w-[180px]">Destination</TableHead>
                                <TableHead className="py-3 px-4 w-[150px]">Recipient</TableHead>
                                <TableHead className="py-3 px-4 w-[180px]">SMS Template ID</TableHead>
                                <TableHead className="py-3 px-4 w-[220px]">WhatsApp Template Id</TableHead>
                                <TableHead className="py-3 px-4">Sample Message</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {notificationEvents.map((item, idx) => (
                                <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors align-top">
                                    <TableCell className="py-4 px-4 font-medium text-gray-700 leading-relaxed">
                                        {item.event}
                                    </TableCell>

                                    <TableCell className="py-4 px-4">
                                        <div className="space-y-2">
                                            {destinationOptions.map((option) => (
                                                <div key={option} className="flex items-center gap-2 group">
                                                    <Checkbox
                                                        id={`${idx}-${option}`}
                                                        defaultChecked={item.destinations.includes(option)}
                                                        className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-sm"
                                                    />
                                                    <label
                                                        htmlFor={`${idx}-${option}`}
                                                        className="text-[10px] text-gray-500 font-medium cursor-pointer group-hover:text-indigo-600 transition-colors"
                                                    >
                                                        {option}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-4 px-4">
                                        <div className="space-y-2">
                                            {recipientOptions.map((option) => {
                                                // Only show relevant recipients
                                                const isVisible = item.recipients.includes(option);
                                                return (
                                                    <div key={option} className={cn("flex items-center gap-2 group", !isVisible && "opacity-20 pointer-events-none")}>
                                                        <Checkbox
                                                            id={`${idx}-rec-${option}`}
                                                            defaultChecked={isVisible}
                                                            className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-sm"
                                                        />
                                                        <label
                                                            htmlFor={`${idx}-rec-${option}`}
                                                            className="text-[10px] text-gray-500 font-medium cursor-pointer"
                                                        >
                                                            {option}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-4 px-4 text-gray-400 font-mono text-[10px] truncate max-w-[150px]">
                                        {item.smsTemplateId || "-"}
                                    </TableCell>

                                    <TableCell className="py-4 px-4 text-gray-400 font-mono text-[10px] truncate max-w-[200px]">
                                        {item.whatsAppTemplateId || "-"}
                                    </TableCell>

                                    <TableCell className="py-4 px-4">
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-gray-500 leading-normal line-clamp-3 italic opacity-80">
                                                {item.sampleMessage}
                                            </p>
                                            <div className="flex gap-1.5 pt-1">
                                                <Button variant="outline" size="icon" className="h-6 w-6 border-transparent bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm">
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button variant="outline" size="icon" className="h-6 w-6 border-transparent bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm">
                                                    <MessageSquare className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Floating Save Button at bottom of table card */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-gray-100 flex justify-end z-10 shadow-inner">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md border-b-2 border-indigo-700">
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
