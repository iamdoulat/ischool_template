"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Printer,
  CreditCard,
  Building2,
  Copy,
  FileSpreadsheet,
  FileText,
  Columns,
  User,
  ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Payment {
  id: string;
  paymentId: string;
  mode: string;
  date: string;
  discount: number;
  fine: number;
  paid: number;
  balance: number;
}

interface FeeRow {
  id: number;
  name: string;
  code: string;
  dueDate: string;
  status: "Paid" | "Unpaid" | "Partial";
  amount: number;
  fine: number;
  discount: number;
  fineAmount: number;
  paidAmount: number;
  balance: number;
  payments: Payment[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const student = {
  name: "Edward Thomas",
  fatherName: "Olivier Thomas",
  mobile: "98262573272",
  category: "OBC",
  classSection: "Class I (A)",
  admissionNo: "1800011",
  rollNumber: "001",
  rte: "No",
  image: null,
};

const session = "2026-27";
const today = "06/17/2026";

const feesData: FeeRow[] = [
  {
    id: 1,
    name: "April Month Fees",
    code: "apr-month-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 24500,
    fine: 3500,
    discount: 0,
    fineAmount: 0,
    paidAmount: 24500,
    balance: 0,
    payments: [
      { id: "p1", paymentId: "5458/1", mode: "Cash", date: "04/01/2026", discount: 0, fine: 0, paid: 24500, balance: 0 },
    ],
  },
  {
    id: 2,
    name: "Admission Fees",
    code: "admission-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 175000,
    fine: 3500,
    discount: 0,
    fineAmount: 0,
    paidAmount: 175000,
    balance: 0,
    payments: [
      { id: "p2", paymentId: "5459/1", mode: "Stripe", date: "04/01/2026", discount: 0, fine: 0, paid: 175000, balance: 0 },
    ],
  },
  {
    id: 3,
    name: "May Month Fees",
    code: "may-month-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 24500,
    fine: 3500,
    discount: 0,
    fineAmount: 0,
    paidAmount: 24500,
    balance: 0,
    payments: [
      { id: "p3", paymentId: "5463/1", mode: "Cash", date: "04/02/2026", discount: 0, fine: 0, paid: 24500, balance: 0 },
    ],
  },
  {
    id: 4,
    name: "June Month Fees",
    code: "jun-month-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 24500,
    fine: 3500,
    discount: 0,
    fineAmount: 0,
    paidAmount: 24500,
    balance: 0,
    payments: [
      { id: "p4", paymentId: "5464/1", mode: "Cash", date: "04/02/2026", discount: 0, fine: 0, paid: 24500, balance: 0 },
    ],
  },
  {
    id: 5,
    name: "July Month Fees",
    code: "jul-month-fees",
    dueDate: "04/11/2026",
    status: "Partial",
    amount: 24500,
    fine: 3500,
    discount: 0,
    fineAmount: 0,
    paidAmount: 14000,
    balance: 10500,
    payments: [
      { id: "p5", paymentId: "5468/1", mode: "Cash", date: "04/02/2026", discount: 0, fine: 0, paid: 14000, balance: 0 },
    ],
  },
  {
    id: 6,
    name: "August Month Fees",
    code: "aug-month-fees",
    dueDate: "04/11/2026",
    status: "Partial",
    amount: 24500,
    fine: 3500,
    discount: 0,
    fineAmount: 3500,
    paidAmount: 21000,
    balance: 3500,
    payments: [
      { id: "p6", paymentId: "5473/1", mode: "Cash", date: "05/01/2026", discount: 0, fine: 3500, paid: 21000, balance: 0 },
    ],
  },
  {
    id: 7,
    name: "September Month Fees",
    code: "sep-month-fees",
    dueDate: "04/11/2026",
    status: "Partial",
    amount: 24500,
    fine: 3500,
    discount: 0,
    fineAmount: 3500,
    paidAmount: 3500,
    balance: 21000,
    payments: [
      { id: "p7", paymentId: "5474/1", mode: "Cash", date: "05/01/2026", discount: 0, fine: 3500, paid: 3500, balance: 0 },
    ],
  },
  {
    id: 8,
    name: "October Month Fees",
    code: "oct-month-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 25200,
    fine: 1750,
    discount: 0,
    fineAmount: 1750,
    paidAmount: 21000,
    balance: 4200,
    payments: [
      { id: "p8", paymentId: "5476/1", mode: "Cash", date: "05/01/2026", discount: 0, fine: 1750, paid: 21000, balance: 0 },
    ],
  },
  {
    id: 9,
    name: "November Month Fees",
    code: "nov-month-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 24500,
    fine: 3500,
    discount: 0,
    fineAmount: 3500,
    paidAmount: 24500,
    balance: 0,
    payments: [
      { id: "p9", paymentId: "5502/1", mode: "Cash", date: "06/01/2026", discount: 24500, fine: 3500, paid: 24500, balance: 0 },
    ],
  },
  {
    id: 10,
    name: "December Month Fees",
    code: "dec-month-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 24500,
    fine: 3500,
    discount: 0,
    fineAmount: 3500,
    paidAmount: 24500,
    balance: 0,
    payments: [
      { id: "p10", paymentId: "5472/1", mode: "Stripe", date: "04/01/2026", discount: 0, fine: 3500, paid: 24500, balance: 0 },
    ],
  },
  {
    id: 11,
    name: "Transport Fees (April)",
    code: "transport-apr",
    dueDate: "04/20/2026",
    status: "Paid",
    amount: 42000,
    fine: 3500,
    discount: 0,
    fineAmount: 3500,
    paidAmount: 42000,
    balance: 0,
    payments: [
      { id: "p11", paymentId: "5482/1", mode: "Cash", date: "05/01/2026", discount: 42000, fine: 3500, paid: 42000, balance: 0 },
    ],
  },
  {
    id: 12,
    name: "Transport Fees (May)",
    code: "transport-may",
    dueDate: "05/20/2026",
    status: "Partial",
    amount: 42000,
    fine: 3500,
    discount: 0,
    fineAmount: 0,
    paidAmount: 28000,
    balance: 14000,
    payments: [
      { id: "p12", paymentId: "5483/1", mode: "Cash", date: "05/01/2026", discount: 0, fine: 0, paid: 28000, balance: 0 },
    ],
  },
  {
    id: 13,
    name: "Transport Fees (June)",
    code: "transport-jun",
    dueDate: "06/20/2026",
    status: "Paid",
    amount: 42000,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 1400,
    balance: 40600,
    payments: [
      { id: "p13", paymentId: "5484/1", mode: "Cash", date: "05/01/2026", discount: 1400, fine: 0, paid: 1400, balance: 0 },
    ],
  },
  {
    id: 14,
    name: "Transport Fees (July)",
    code: "transport-jul",
    dueDate: "07/20/2026",
    status: "Unpaid",
    amount: 42000,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 42000,
    payments: [],
  },
  {
    id: 15,
    name: "Transport Fees (August)",
    code: "transport-aug",
    dueDate: "08/20/2026",
    status: "Unpaid",
    amount: 42000,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 42000,
    payments: [],
  },
  {
    id: 16,
    name: "Transport Fees (September)",
    code: "transport-sep",
    dueDate: "09/20/2026",
    status: "Unpaid",
    amount: 42000,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 42000,
    payments: [],
  },
  {
    id: 17,
    name: "Transport Fees (October)",
    code: "transport-oct",
    dueDate: "10/20/2026",
    status: "Unpaid",
    amount: 42000,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 42000,
    payments: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    Paid: "bg-[#5cb85c] text-white",
    Unpaid: "bg-red-500 text-white",
    Partial: "bg-[#f0ad4e] text-white",
  };
  return (
    <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded uppercase", map[status] ?? "bg-gray-400 text-white")}>
      {status}
    </span>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StudentFeesPage() {
  const [selected, setSelected] = useState<number[]>([]);
  const allIds = feesData.map((f) => f.id);
  const allChecked = selected.length === allIds.length;

  const toggleAll = () => setSelected(allChecked ? [] : allIds);
  const toggleOne = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Totals
  const grandAmount = feesData.reduce((s, f) => s + f.amount, 0);
  const grandFine = feesData.reduce((s, f) => s + f.fine, 0);
  const grandDiscount = feesData.reduce((s, f) => s + f.discount, 0);
  const grandFineAmt = feesData.reduce((s, f) => s + f.fineAmount, 0);
  const grandPaid = feesData.reduce((s, f) => s + f.paidAmount, 0);
  const grandBalance = feesData.reduce((s, f) => s + f.balance, 0);

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-5 animate-in fade-in duration-300">

      {/* ── Student Info Card ─────────────────────────────── */}
      <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.18)] border-0 p-0 gap-0">
        {/* Header */}
        <div className="px-[18px] py-2 flex items-center justify-between border-b border-gray-200 bg-white rounded-t-md">
          <h3 className="text-[15px] text-[#333333] font-bold">Student Fees</h3>
          <Link
            href="/user/dashboard"
            className="flex items-center gap-1 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3 py-1 rounded transition-colors"
          >
            ← Back
          </Link>
        </div>

        <CardContent className="p-4">
          <div className="flex gap-4 items-start">
            {/* Photo */}
            <div className="h-20 w-20 shrink-0 bg-gray-100 border border-gray-300 rounded flex flex-col items-center justify-center text-gray-400">
              <User className="h-8 w-8 opacity-40 mb-1" />
              <span className="text-[8px] font-bold text-center uppercase leading-none">
                No Image<br />Available
              </span>
            </div>

            {/* Details Grid */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1 text-sm">
              <div>
                <span className="text-gray-500 text-xs">Name</span>
                <p className="text-[#337ab7] font-medium">{student.name}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Class (Section)</span>
                <p className="text-gray-800">{student.classSection}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Father Name</span>
                <p className="text-[#337ab7] font-medium">{student.fatherName}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Admission No</span>
                <p className="text-gray-800">{student.admissionNo}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Mobile Number</span>
                <p className="text-gray-800">{student.mobile}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Roll Number</span>
                <p className="text-gray-800">{student.rollNumber}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Category</span>
                <p className="text-gray-800">{student.category}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">RTE</span>
                <p className="text-red-500 font-semibold">{student.rte}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Fees Table Card ───────────────────────────────── */}
      <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.18)] border-0 p-0 gap-0">
        {/* Card Header */}
        <div className="px-[18px] py-2 flex items-center border-b border-gray-200 bg-white rounded-t-md">
          <h3 className="text-[15px] text-[#333333] font-bold">Fees Details</h3>
        </div>

        <CardContent className="p-0">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors">
                <Printer className="h-3.5 w-3.5" /> Print Selected
              </button>
              <button className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors">
                <CreditCard className="h-3.5 w-3.5" /> Pay Selected
              </button>
              <button className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors">
                <Building2 className="h-3.5 w-3.5" /> Offline Bank Payments
              </button>
            </div>
            <span className="text-sm text-gray-600 font-medium">Date: {today}</span>
          </div>

          {/* Session */}
          <div className="text-center py-2 text-sm font-semibold text-gray-700 border-b border-gray-100">
            Session : {session}
          </div>

          {/* Export Icons */}
          <div className="flex justify-end gap-2 px-4 py-2 border-b border-gray-100">
            {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, i) => (
              <button key={i} className="text-gray-500 hover:text-gray-700 transition-colors">
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              {/* Head */}
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="w-8 px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="rounded cursor-pointer"
                    />
                  </th>
                  <th className="px-2 py-2 text-left font-bold text-gray-600 min-w-[180px]">Fees</th>
                  <th className="px-2 py-2 text-left font-bold text-gray-600 whitespace-nowrap">Due Date</th>
                  <th className="px-2 py-2 text-left font-bold text-gray-600">Status</th>
                  <th className="px-2 py-2 text-right font-bold text-gray-600 whitespace-nowrap">Amount (₹)</th>
                  <th className="px-2 py-2 text-left font-bold text-gray-600 whitespace-nowrap">Payment ID</th>
                  <th className="px-2 py-2 text-left font-bold text-gray-600">Mode</th>
                  <th className="px-2 py-2 text-left font-bold text-gray-600">Date</th>
                  <th className="px-2 py-2 text-right font-bold text-gray-600 whitespace-nowrap">Discount (₹)</th>
                  <th className="px-2 py-2 text-right font-bold text-gray-600 whitespace-nowrap">Fine (₹)</th>
                  <th className="px-2 py-2 text-right font-bold text-gray-600 whitespace-nowrap">Paid (₹)</th>
                  <th className="px-2 py-2 text-right font-bold text-gray-600 whitespace-nowrap">Balance (₹)</th>
                  <th className="px-2 py-2 text-center font-bold text-gray-600">Action</th>
                </tr>
              </thead>

              <tbody>
                {feesData.map((fee) => {
                  const isUnpaidOrPartial = fee.status === "Unpaid" || fee.status === "Partial";
                  const rowBg = "bg-white";

                  return (
                    <>
                      {/* Main fee row */}
                      <tr key={fee.id} className={cn("border-b border-gray-100 hover:brightness-95 transition-all", rowBg)}>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selected.includes(fee.id)}
                            onChange={() => toggleOne(fee.id)}
                            className="rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <span className="text-[#337ab7] hover:underline cursor-pointer">
                            {fee.name} ({fee.code})
                          </span>
                        </td>
                        <td className="px-2 py-2 text-[#337ab7] whitespace-nowrap">{fee.dueDate}</td>
                        <td className="px-2 py-2">
                          <StatusBadge status={fee.status} />
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          <span className="text-gray-700">{fmt(fee.amount)}</span>
                          {fee.fine > 0 && (
                            <span className="text-orange-500 ml-1">+ {fmt(fee.fine)}</span>
                          )}
                        </td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2 text-right text-gray-600">{fee.discount > 0 ? fmt(fee.discount) : "0.00"}</td>
                        <td className="px-2 py-2 text-right text-gray-600">{fee.fineAmount > 0 ? fmt(fee.fineAmount) : "0.00"}</td>
                        <td className="px-2 py-2 text-right text-gray-600">{fee.paidAmount > 0 ? fmt(fee.paidAmount) : "0.00"}</td>
                        <td className="px-2 py-2 text-right text-gray-600">{fee.balance > 0 ? fmt(fee.balance) : ""}</td>
                        <td className="px-2 py-2 text-center">
                          {isUnpaidOrPartial && (
                            <button className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors whitespace-nowrap">
                              <CreditCard className="h-3 w-3" /> Pay ▾
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Payment sub-rows */}
                      {fee.payments.map((p) => (
                        <tr key={p.id} className={cn("border-b border-gray-100 text-gray-500", rowBg)}>
                          <td></td>
                          <td className="px-2 py-1.5 pl-6">
                            <span className="text-gray-400 mr-1">↳</span>
                          </td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td className="px-2 py-1.5 text-[#337ab7]">{p.paymentId}</td>
                          <td className="px-2 py-1.5">{p.mode}</td>
                          <td className="px-2 py-1.5 whitespace-nowrap">{p.date}</td>
                          <td className="px-2 py-1.5 text-right">
                            {p.discount > 0 ? (
                              <span className="text-[#337ab7]">{fmt(p.discount)}</span>
                            ) : "0.00"}
                          </td>
                          <td className="px-2 py-1.5 text-right">{p.fine > 0 ? fmt(p.fine) : "0.00"}</td>
                          <td className="px-2 py-1.5 text-right">{fmt(p.paid)}</td>
                          <td className="px-2 py-1.5 text-right">{fmt(p.balance)}</td>
                          <td className="px-2 py-1.5 text-center">
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}

                {/* Grand Total Row */}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td></td>
                  <td className="px-2 py-2 text-sm font-bold text-gray-700" colSpan={3}>Grand Total</td>
                  <td className="px-2 py-2 text-right text-gray-800 whitespace-nowrap">
                    ₹{fmt(grandAmount)}
                    {grandFine > 0 && (
                      <span className="text-orange-500 ml-1">+ {fmt(grandFine)}</span>
                    )}
                  </td>
                  <td colSpan={3}></td>
                  <td className="px-2 py-2 text-right text-gray-700">₹{fmt(grandDiscount)}</td>
                  <td className="px-2 py-2 text-right text-gray-700">₹{fmt(grandFineAmt)}</td>
                  <td className="px-2 py-2 text-right text-gray-700">₹{fmt(grandPaid)}</td>
                  <td className="px-2 py-2 text-right text-gray-700">₹{fmt(grandBalance)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
