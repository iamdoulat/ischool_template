"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Variable, Tag } from "lucide-react";

interface VariableItem {
  label: string;
  value: string;
}

const variableGroups: { name: string; variables: VariableItem[] }[] = [
  {
    name: "Student",
    variables: [
      { label: "Full Name", value: "{name}" },
      { label: "First Name", value: "{first_name}" },
      { label: "Last Name", value: "{last_name}" },
      { label: "Admission No", value: "{admission_no}" },
      { label: "Roll No", value: "{roll_no}" },
      { label: "Class", value: "{class}" },
      { label: "Section", value: "{section}" },
      { label: "Date of Birth", value: "{dob}" },
      { label: "Gender", value: "{gender}" },
      { label: "Blood Group", value: "{blood_group}" },
      { label: "Religion", value: "{religion}" },
      { label: "Address", value: "{address}" },
      { label: "Phone", value: "{phone}" },
      { label: "Email", value: "{email}" },
    ],
  },
  {
    name: "Parent",
    variables: [
      { label: "Father Name", value: "{father_name}" },
      { label: "Father Phone", value: "{father_phone}" },
      { label: "Mother Name", value: "{mother_name}" },
      { label: "Mother Phone", value: "{mother_phone}" },
      { label: "Guardian Name", value: "{guardian_name}" },
      { label: "Guardian Phone", value: "{guardian_phone}" },
      { label: "Parent Email", value: "{parent_email}" },
    ],
  },
  {
    name: "School",
    variables: [
      { label: "School Name", value: "{school_name}" },
      { label: "School Address", value: "{school_address}" },
      { label: "School Phone", value: "{school_phone}" },
      { label: "School Email", value: "{school_email}" },
      { label: "Academic Session", value: "{academic_session}" },
      { label: "Current Date", value: "{current_date}" },
      { label: "Current Time", value: "{current_time}" },
      { label: "Today's Date", value: "{today_date}" },
    ],
  },
  {
    name: "Fee",
    variables: [
      { label: "Fee Amount", value: "{fee_amount}" },
      { label: "Due Date", value: "{due_date}" },
      { label: "Fee Type", value: "{fee_type}" },
      { label: "Balance", value: "{balance}" },
      { label: "Late Fee", value: "{late_fee}" },
      { label: "Receipt No", value: "{receipt_no}" },
      { label: "Payment Date", value: "{payment_date}" },
    ],
  },
  {
    name: "Attendance",
    variables: [
      { label: "Total Days", value: "{total_days}" },
      { label: "Present Days", value: "{present_days}" },
      { label: "Absent Days", value: "{absent_days}" },
      { label: "Attendance %", value: "{attendance_percent}" },
      { label: "Leave Type", value: "{leave_type}" },
      { label: "From Date", value: "{from_date}" },
      { label: "To Date", value: "{to_date}" },
    ],
  },
  {
    name: "Exam",
    variables: [
      { label: "Exam Name", value: "{exam_name}" },
      { label: "Subject", value: "{subject}" },
      { label: "Marks Obtained", value: "{marks_obtained}" },
      { label: "Total Marks", value: "{total_marks}" },
      { label: "Percentage", value: "{percentage}" },
      { label: "Grade", value: "{grade}" },
      { label: "Rank", value: "{rank}" },
      { label: "Result", value: "{result}" },
    ],
  },
];

interface VariablePickerProps {
  onSelect: (value: string) => void;
}

export default function VariablePicker({ onSelect }: VariablePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-[10px] font-semibold text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-md px-2"
        >
          <Variable className="h-3.5 w-3.5" />
          Variables
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-[400px] p-0">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50/50">
          <Tag className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Insert Variable</span>
          <span className="text-[9px] text-gray-400 ml-auto">Click to insert at cursor</span>
        </div>
        <ScrollArea className="h-[300px]">
          {variableGroups.map((group) => (
            <div key={group.name} className="px-3 py-2 border-b border-gray-50 last:border-0">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{group.name}</h4>
              <div className="flex flex-wrap gap-1">
                {group.variables.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => onSelect(v.value)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                    title={v.label}
                  >
                    {v.value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
