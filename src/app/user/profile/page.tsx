"use client";

import { useEffect, useState, Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  User,
  Download,
  Printer,
  CreditCard,
  Building2,
  Copy,
  FileSpreadsheet,
  FileText,
  Columns,
  Search,
  ArrowUpDown,
  Upload,
  Clock,
  PlayCircle,
  Newspaper,
  Calendar,
  Cake,
  Tag,
  Phone,
  Users,
  BookOpen,
  Mail,
  HeartPulse,
  StickyNote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { mockUserProfileData } from "@/lib/mock-user-profile";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Fees Types ───────────────────────────────────────────────────────────────
interface FeePayment {
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
  payments: FeePayment[];
}

// ─── Fees Mock Data ───────────────────────────────────────────────────────────
const feesData: FeeRow[] = [
  {
    id: 1,
    name: "April Month Fees",
    code: "apr-month-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 350,
    fine: 50,
    discount: 0,
    fineAmount: 0,
    paidAmount: 350,
    balance: 0,
    payments: [
      { id: "p1", paymentId: "5458/1", mode: "Cash", date: "04/01/2026", discount: 0, fine: 0, paid: 350, balance: 0 },
    ],
  },
  {
    id: 2,
    name: "Admission Fees",
    code: "admission-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 2500,
    fine: 50,
    discount: 0,
    fineAmount: 0,
    paidAmount: 2500,
    balance: 0,
    payments: [
      { id: "p2", paymentId: "5459/1", mode: "Stripe", date: "04/01/2026", discount: 0, fine: 0, paid: 2500, balance: 0 },
    ],
  },
  {
    id: 3,
    name: "May Month Fees",
    code: "may-month-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 350,
    fine: 50,
    discount: 0,
    fineAmount: 0,
    paidAmount: 350,
    balance: 0,
    payments: [
      { id: "p3", paymentId: "5463/1", mode: "Cash", date: "04/02/2026", discount: 0, fine: 0, paid: 350, balance: 0 },
    ],
  },
  {
    id: 4,
    name: "June Month Fees",
    code: "jun-month-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 350,
    fine: 50,
    discount: 0,
    fineAmount: 0,
    paidAmount: 350,
    balance: 0,
    payments: [
      { id: "p4", paymentId: "5464/1", mode: "Cash", date: "04/02/2026", discount: 0, fine: 0, paid: 350, balance: 0 },
    ],
  },
  {
    id: 5,
    name: "July Month Fees",
    code: "jul-month-fees",
    dueDate: "04/11/2026",
    status: "Partial",
    amount: 350,
    fine: 50,
    discount: 0,
    fineAmount: 0,
    paidAmount: 200,
    balance: 150,
    payments: [
      { id: "p5", paymentId: "5468/1", mode: "Cash", date: "04/02/2026", discount: 0, fine: 0, paid: 200, balance: 0 },
    ],
  },
  {
    id: 6,
    name: "August Month Fees",
    code: "aug-month-fees",
    dueDate: "04/11/2026",
    status: "Partial",
    amount: 350,
    fine: 50,
    discount: 0,
    fineAmount: 50,
    paidAmount: 300,
    balance: 50,
    payments: [
      { id: "p6", paymentId: "5473/1", mode: "Cash", date: "05/01/2026", discount: 0, fine: 50, paid: 300, balance: 0 },
    ],
  },
  {
    id: 7,
    name: "September Month Fees",
    code: "sep-month-fees",
    dueDate: "04/11/2026",
    status: "Partial",
    amount: 350,
    fine: 50,
    discount: 0,
    fineAmount: 50,
    paidAmount: 50,
    balance: 300,
    payments: [
      { id: "p7", paymentId: "5474/1", mode: "Cash", date: "05/01/2026", discount: 0, fine: 50, paid: 50, balance: 0 },
    ],
  },
  {
    id: 8,
    name: "October Month Fees",
    code: "oct-month-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 360,
    fine: 25,
    discount: 300,
    fineAmount: 25,
    paidAmount: 60,
    balance: 0,
    payments: [
      { id: "p8", paymentId: "5476/1", mode: "Cash", date: "05/01/2026", discount: 300, fine: 25, paid: 60, balance: 0 },
    ],
  },
  {
    id: 9,
    name: "November Month Fees",
    code: "nov-month-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 350,
    fine: 50,
    discount: 350,
    fineAmount: 50,
    paidAmount: 0,
    balance: 0,
    payments: [
      { id: "p9", paymentId: "5502/1", mode: "Cash", date: "06/01/2026", discount: 350, fine: 50, paid: 0, balance: 0 },
    ],
  },
  {
    id: 10,
    name: "December Month Fees",
    code: "dec-month-fees",
    dueDate: "04/11/2026",
    status: "Paid",
    amount: 350,
    fine: 50,
    discount: 0,
    fineAmount: 50,
    paidAmount: 350,
    balance: 0,
    payments: [
      { id: "p10", paymentId: "5472/1", mode: "Stripe", date: "05/01/2026", discount: 0, fine: 50, paid: 350, balance: 0 },
    ],
  },
  {
    id: 11,
    name: "January Month Fees",
    code: "jan-month-fees",
    dueDate: "04/11/2026",
    status: "Partial",
    amount: 350,
    fine: 50,
    discount: 0,
    fineAmount: 50,
    paidAmount: 300,
    balance: 50,
    payments: [
      { id: "p11", paymentId: "5461/1", mode: "Cash", date: "06/01/2026", discount: 0, fine: 50, paid: 300, balance: 0 },
    ],
  },
  // ── Installment Fees (Image 1 – top section) ──────────────────────────────
  {
    id: 12,
    name: "Nishant khare (001) -Installment-3",
    code: "Nishant khare (001) -Installment-3",
    dueDate: "06/20/2026",
    status: "Paid",
    amount: 800,
    fine: 0,
    discount: 300,
    fineAmount: 0,
    paidAmount: 500,
    balance: 0,
    payments: [
      { id: "p12", paymentId: "5495/1", mode: "Cash", date: "06/01/2026", discount: 300, fine: 0, paid: 500, balance: 0 },
    ],
  },
  {
    id: 13,
    name: "Nishant khare (001) -Installment-4",
    code: "Nishant khare (001) -Installment-4",
    dueDate: "07/20/2026",
    status: "Partial",
    amount: 800,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 500,
    balance: 300,
    payments: [
      { id: "p13", paymentId: "5496/1", mode: "Cash", date: "06/01/2026", discount: 0, fine: 0, paid: 500, balance: 0 },
    ],
  },
  {
    id: 14,
    name: "Nishant khare (001) -Installment-5",
    code: "Nishant khare (001) -Installment-5",
    dueDate: "08/20/2026",
    status: "Unpaid",
    amount: 800,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 800,
    payments: [],
  },
  {
    id: 15,
    name: "Nishant khare (001) -Installment-6",
    code: "Nishant khare (001) -Installment-6",
    dueDate: "09/20/2026",
    status: "Unpaid",
    amount: 800,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 800,
    payments: [],
  },
  // ── Transport Fees (Image 1 – bottom section) ─────────────────────────────
  {
    id: 16,
    name: "Transport Fees (April)",
    code: "transport-apr",
    dueDate: "04/20/2026",
    status: "Paid",
    amount: 600,
    fine: 50,
    discount: 600,
    fineAmount: 50,
    paidAmount: 0,
    balance: 0,
    payments: [
      { id: "p16", paymentId: "5482/1", mode: "Cash", date: "05/01/2026", discount: 600, fine: 50, paid: 0, balance: 0 },
    ],
  },
  {
    id: 17,
    name: "Transport Fees (May)",
    code: "transport-may",
    dueDate: "05/20/2026",
    status: "Partial",
    amount: 600,
    fine: 50,
    discount: 0,
    fineAmount: 0,
    paidAmount: 400,
    balance: 200,
    payments: [
      { id: "p17", paymentId: "5483/1", mode: "Cash", date: "05/01/2026", discount: 0, fine: 0, paid: 400, balance: 0 },
    ],
  },
  {
    id: 18,
    name: "Transport Fees (June)",
    code: "transport-jun",
    dueDate: "06/20/2026",
    status: "Paid",
    amount: 600,
    fine: 0,
    discount: 20,
    fineAmount: 0,
    paidAmount: 580,
    balance: 0,
    payments: [
      { id: "p18", paymentId: "5484/1", mode: "Cash", date: "05/01/2026", discount: 20, fine: 0, paid: 580, balance: 0 },
    ],
  },
  {
    id: 19,
    name: "Transport Fees (July)",
    code: "transport-jul",
    dueDate: "07/20/2026",
    status: "Unpaid",
    amount: 600,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 600,
    payments: [],
  },
  {
    id: 20,
    name: "Transport Fees (August)",
    code: "transport-aug",
    dueDate: "08/20/2026",
    status: "Unpaid",
    amount: 600,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 600,
    payments: [],
  },
  {
    id: 21,
    name: "Transport Fees (September)",
    code: "transport-sep",
    dueDate: "09/20/2026",
    status: "Unpaid",
    amount: 600,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 600,
    payments: [],
  },
  {
    id: 22,
    name: "Transport Fees (October)",
    code: "transport-oct",
    dueDate: "10/20/2026",
    status: "Unpaid",
    amount: 600,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 600,
    payments: [],
  },
  {
    id: 23,
    name: "Transport Fees (November)",
    code: "transport-nov",
    dueDate: "11/20/2026",
    status: "Unpaid",
    amount: 600,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 600,
    payments: [],
  },
  {
    id: 24,
    name: "Transport Fees (December)",
    code: "transport-dec",
    dueDate: "12/20/2026",
    status: "Unpaid",
    amount: 600,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 600,
    payments: [],
  },
  {
    id: 25,
    name: "Transport Fees (January)",
    code: "transport-jan",
    dueDate: "01/20/2027",
    status: "Unpaid",
    amount: 600,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 600,
    payments: [],
  },
  {
    id: 26,
    name: "Transport Fees (February)",
    code: "transport-feb",
    dueDate: "02/20/2027",
    status: "Unpaid",
    amount: 600,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 600,
    payments: [],
  },
  {
    id: 27,
    name: "Transport Fees (March)",
    code: "transport-mar",
    dueDate: "03/20/2027",
    status: "Unpaid",
    amount: 600,
    fine: 0,
    discount: 0,
    fineAmount: 0,
    paidAmount: 0,
    balance: 600,
    payments: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

// ─── Shared professional UI helpers ─────────────────────────────────────────────
/** A rounded, shadowed panel used to wrap each tab's content for a consistent look. */
function TabPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-3 sm:p-5 space-y-5 animate-in fade-in duration-300", className)}>
      {children}
    </div>
  );
}

/** A titled card section with a subtle gradient header bar, matching the Profile tab. */
function PanelCard({
  title,
  subtitle,
  right,
  children,
  bodyClassName,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {(title || right) && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-[#FF9800] to-[#6366F1] shrink-0" />
            <div className="min-w-0">
              {title && <h3 className="text-sm font-bold text-gray-800 truncate">{title}</h3>}
              {subtitle && <p className="text-[11px] text-gray-500 truncate">{subtitle}</p>}
            </div>
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

/** Standard export toolbar (Copy / Excel / PDF / Print / Columns) reused across tabs. */
function ExportToolbar({
  onCopy,
  onExcel,
  onPdf,
  onPrint,
}: {
  onCopy?: () => void;
  onExcel?: () => void;
  onPdf?: () => void;
  onPrint?: () => void;
}) {
  const btn =
    "h-8 w-8 hover:bg-white hover:shadow-sm rounded-md border border-transparent hover:border-gray-200 transition-all";
  return (
    <div className="flex items-center gap-1 text-gray-500">
      <Button onClick={onCopy} variant="ghost" size="icon" className={btn} title="Copy"><Copy className="h-3.5 w-3.5" /></Button>
      <Button onClick={onExcel} variant="ghost" size="icon" className={btn} title="Export Excel"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
      <Button onClick={onPdf} variant="ghost" size="icon" className={btn} title="Export PDF"><FileText className="h-3.5 w-3.5" /></Button>
      <Button onClick={onPrint} variant="ghost" size="icon" className={btn} title="Print"><Printer className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className={btn} title="Columns"><Columns className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

/** Small labelled field used inside mobile card views (stacked label : value). */
function MiniField({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className={cn("text-[12px] font-medium text-gray-700 text-right", className)}>{value}</span>
    </div>
  );
}

/** Premium info tile with an icon, used for the Profile "Basic Details" grid. Animated on hover. */
function InfoTile({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200",
        className,
      )}
    >
      {/* Top gradient accent that grows in on hover */}
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] transition-transform duration-300 group-hover:scale-x-100" />
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#4f52d4] text-white shadow-sm transition-all duration-300 group-hover:from-[#FF9800] group-hover:to-[#6366F1] group-hover:scale-105">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
          <p className="mt-0.5 text-[13px] font-semibold text-gray-800 break-words leading-snug">{value || "-"}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Fees Tab Component ────────────────────────────────────────────────────────
function FeesTab() {
  const [selected, setSelected] = useState<number[]>([]);
  const allIds = feesData.map((f) => f.id);
  const allChecked = selected.length === allIds.length;

  const toggleAll = () => setSelected(allChecked ? [] : allIds);
  const toggleOne = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const grandAmount = feesData.reduce((s, f) => s + f.amount, 0);
  const grandFine = feesData.reduce((s, f) => s + f.fine, 0);
  const grandDiscount = feesData.reduce((s, f) => s + f.discount, 0);
  const grandFineAmt = feesData.reduce((s, f) => s + f.fineAmount, 0);
  const grandPaid = feesData.reduce((s, f) => s + f.paidAmount, 0);
  const grandBalance = feesData.reduce((s, f) => s + f.balance, 0);

  return (
    <TabPanel>
      {/* Action buttons + date */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
          <button className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all">
            <Printer className="h-3.5 w-3.5" /> Print Selected
          </button>
          <button className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all">
            <CreditCard className="h-3.5 w-3.5" /> Pay Selected
          </button>
          <button className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all">
            <Building2 className="h-3.5 w-3.5" /> Offline Bank Payments
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="hidden sm:inline rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-semibold px-3 py-1">Session 2026-27</span>
          <span className="font-medium">Date: {new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}</span>
        </div>
      </div>

      <PanelCard title="Fee Statement" subtitle="Session 2026-27" right={<ExportToolbar />}>
        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="w-8 px-2 py-2.5 text-center">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded cursor-pointer accent-[#6366F1]" />
                </th>
                <th className="px-2 py-2.5 text-left font-bold text-gray-600 min-w-[160px]">Fees</th>
                <th className="px-2 py-2.5 text-left font-bold text-gray-600 whitespace-nowrap">Due Date</th>
                <th className="px-2 py-2.5 text-left font-bold text-gray-600">Status</th>
                <th className="px-2 py-2.5 text-right font-bold text-gray-600 whitespace-nowrap">Amount ($)</th>
                <th className="px-2 py-2.5 text-left font-bold text-gray-600 whitespace-nowrap">Payment ID</th>
                <th className="px-2 py-2.5 text-left font-bold text-gray-600">Mode</th>
                <th className="px-2 py-2.5 text-left font-bold text-gray-600">Date</th>
                <th className="px-2 py-2.5 text-right font-bold text-gray-600 whitespace-nowrap">Discount ($)</th>
                <th className="px-2 py-2.5 text-right font-bold text-gray-600 whitespace-nowrap">Fine ($)</th>
                <th className="px-2 py-2.5 text-right font-bold text-gray-600 whitespace-nowrap">Paid ($)</th>
                <th className="px-2 py-2.5 text-right font-bold text-gray-600 whitespace-nowrap">Balance ($)</th>
              </tr>
            </thead>
            <tbody>
              {feesData.map((fee) => {
                const isUnpaidOrPartial = fee.status === "Unpaid" || fee.status === "Partial";
                return (
                  <Fragment key={fee.id}>
                    <tr className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors">
                      <td className="px-2 py-2.5 text-center">
                        <input type="checkbox" checked={selected.includes(fee.id)} onChange={() => toggleOne(fee.id)} className="rounded cursor-pointer accent-[#6366F1]" />
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="text-[#337ab7] hover:underline cursor-pointer font-medium">{fee.name} ({fee.code})</span>
                      </td>
                      <td className="px-2 py-2.5 text-[#337ab7] whitespace-nowrap">{fee.dueDate}</td>
                      <td className="px-2 py-2.5"><StatusBadge status={fee.status} /></td>
                      <td className="px-2 py-2.5 text-right whitespace-nowrap">
                        <span className="text-gray-700">{fmt(fee.amount)}</span>
                        {fee.fine > 0 && <span className="text-orange-500 ml-1">+ {fmt(fee.fine)}</span>}
                      </td>
                      <td className="px-2 py-2.5"></td>
                      <td className="px-2 py-2.5"></td>
                      <td className="px-2 py-2.5"></td>
                      <td className="px-2 py-2.5 text-right text-gray-600">
                        {fee.discount > 0 ? <span className="text-[#337ab7] font-semibold">{fmt(fee.discount)}</span> : <span className={isUnpaidOrPartial ? "font-bold text-gray-800" : "text-gray-600"}>0.00</span>}
                      </td>
                      <td className="px-2 py-2.5 text-right text-gray-600">
                        <span className={isUnpaidOrPartial ? "font-bold text-gray-800" : "text-gray-600"}>{fmt(fee.fineAmount)}</span>
                      </td>
                      <td className="px-2 py-2.5 text-right text-gray-600">
                        <span className={isUnpaidOrPartial ? "font-bold text-gray-800" : "text-gray-600"}>{fmt(fee.paidAmount)}</span>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        {fee.balance > 0 ? <span className="font-bold text-gray-800">{fmt(fee.balance)}</span> : ""}
                      </td>
                    </tr>
                    {fee.payments.map((p) => (
                      <tr key={p.id} className="border-b border-gray-100 text-gray-500 bg-gray-50/40">
                        <td></td>
                        <td className="px-2 py-1.5 pl-4"><span className="text-gray-400 mr-1">↳</span></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td className="px-2 py-1.5 text-[#337ab7]">{p.paymentId}</td>
                        <td className="px-2 py-1.5">{p.mode}</td>
                        <td className="px-2 py-1.5 whitespace-nowrap">{p.date}</td>
                        <td className="px-2 py-1.5 text-right">{p.discount > 0 ? <span className="text-[#337ab7]">{fmt(p.discount)}</span> : "0.00"}</td>
                        <td className="px-2 py-1.5 text-right">{p.fine > 0 ? fmt(p.fine) : "0.00"}</td>
                        <td className="px-2 py-1.5 text-right">{fmt(p.paid)}</td>
                        <td className="px-2 py-1.5 text-right">{fmt(p.balance)}</td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                <td></td>
                <td className="px-2 py-2.5 text-sm font-bold text-gray-700" colSpan={3}>Grand Total</td>
                <td className="px-2 py-2.5 text-right text-gray-800 whitespace-nowrap">
                  ${fmt(grandAmount)}{grandFine > 0 && <span className="text-orange-500 ml-1">+ {fmt(grandFine)}</span>}
                </td>
                <td colSpan={3}></td>
                <td className="px-2 py-2.5 text-right text-gray-700">${fmt(grandDiscount)}</td>
                <td className="px-2 py-2.5 text-right text-gray-700">${fmt(grandFineAmt)}</td>
                <td className="px-2 py-2.5 text-right text-gray-700">${fmt(grandPaid)}</td>
                <td className="px-2 py-2.5 text-right text-gray-700">${fmt(grandBalance)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile / tablet card list */}
        <div className="lg:hidden divide-y divide-gray-100">
          {feesData.map((fee) => (
            <div key={fee.id} className="p-3.5">
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-2 min-w-0">
                  <input type="checkbox" checked={selected.includes(fee.id)} onChange={() => toggleOne(fee.id)} className="mt-0.5 rounded cursor-pointer accent-[#6366F1]" />
                  <span className="text-[13px] font-semibold text-gray-800 leading-snug">{fee.name}</span>
                </label>
                <StatusBadge status={fee.status} />
              </div>
              <div className="mt-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-1.5">
                <MiniField label="Due Date" value={fee.dueDate} className="text-[#337ab7]" />
                <MiniField label="Amount" value={<>{fmt(fee.amount)}{fee.fine > 0 && <span className="text-orange-500"> + {fmt(fee.fine)}</span>}</>} />
                <MiniField label="Discount" value={fmt(fee.discount)} className={fee.discount > 0 ? "text-[#337ab7] font-semibold" : ""} />
                <MiniField label="Fine" value={fmt(fee.fineAmount)} />
                <MiniField label="Paid" value={fmt(fee.paidAmount)} />
                <MiniField label="Balance" value={fmt(fee.balance)} className={fee.balance > 0 ? "text-red-600 font-bold" : "text-green-600"} />
              </div>
              {fee.payments.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {fee.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-[11px] text-gray-500 pl-2">
                      <span className="text-[#337ab7]">↳ {p.paymentId} · {p.mode}</span>
                      <span>{p.date} · Paid {fmt(p.paid)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {/* Mobile grand total */}
          <div className="p-3.5 bg-gray-50">
            <div className="text-sm font-bold text-gray-700 mb-1">Grand Total</div>
            <MiniField label="Amount" value={<>${fmt(grandAmount)}{grandFine > 0 && <span className="text-orange-500"> + {fmt(grandFine)}</span>}</>} />
            <MiniField label="Discount" value={`$${fmt(grandDiscount)}`} />
            <MiniField label="Fine" value={`$${fmt(grandFineAmt)}`} />
            <MiniField label="Paid" value={`$${fmt(grandPaid)}`} />
            <MiniField label="Balance" value={`$${fmt(grandBalance)}`} className="text-red-600 font-bold" />
          </div>
        </div>
      </PanelCard>
    </TabPanel>
  );
}

// ─── Exam Types ───────────────────────────────────────────────────────────────
interface ExamSubject {
  name: string;
  maxMarks: number;
  minMarks: number;
  obtained: number;
  result?: string;
  grade?: string;
  note?: string;
}

interface ExamSummary {
  percentage: number;
  rank: number;
  result: string;
  division: string;
  grandTotal: number;
  totalObtained: number;
}

interface ExamData {
  title: string;
  type: "result" | "grade";
  subjects: ExamSubject[];
  summary: ExamSummary;
}

// ─── Exam Mock Data ───────────────────────────────────────────────────────────
const examData: ExamData[] = [
  {
    title: "CBSE Monthly Test - May",
    type: "result",
    subjects: [
      { name: "English (210)", maxMarks: 100.00, minMarks: 33.00, obtained: 43.00, result: "Pass" },
      { name: "Hindi (230)", maxMarks: 100.00, minMarks: 33.00, obtained: 89.00, result: "Pass" },
      { name: "Mathematics (110)", maxMarks: 100.00, minMarks: 33.00, obtained: 76.00, result: "Pass" },
      { name: "Science (111)", maxMarks: 100.00, minMarks: 33.00, obtained: 56.00, result: "Pass" },
    ],
    summary: { percentage: 66.00, rank: 2, result: "Pass", division: "First", grandTotal: 400, totalObtained: 264 }
  },
  {
    title: "CBSE Periodic Test 1(May)",
    type: "grade",
    subjects: [
      { name: "Mathematics (110)", maxMarks: 100.00, minMarks: 33.00, obtained: 34.00, grade: "B-" },
      { name: "Science (111)", maxMarks: 100.00, minMarks: 33.00, obtained: 45.00, grade: "B" },
      { name: "English (210)", maxMarks: 100.00, minMarks: 33.00, obtained: 54.00, grade: "B+" },
    ],
    summary: { percentage: 44.33, rank: 4, result: "Pass", division: "Second", grandTotal: 300, totalObtained: 133 }
  },
  {
    title: "College Grade Test (May-2026)",
    type: "grade",
    subjects: [
      { name: "English (210)", maxMarks: 100.00, minMarks: 40.00, obtained: 56.00, grade: "B+" },
    ],
    summary: { percentage: 56.00, rank: 1, result: "Pass", division: "Second", grandTotal: 100, totalObtained: 56 }
  }
];

// ─── Exam Tab Component ────────────────────────────────────────────────────────
function ExamTab() {
  const fmt = (n: number) => n.toFixed(2);

  const handleCopy = () => {
    let text = "";
    examData.forEach(exam => {
      text += exam.title + "\n";
      text += "Subject\tMax Marks\tMin Marks\tMarks Obtained\tResult/Grade\tNote\n";
      exam.subjects.forEach(s => {
        text += `${s.name}\t${fmt(s.maxMarks)}\t${fmt(s.minMarks)}\t${fmt(s.obtained)}\t${s.result || s.grade || ""}\t${s.note || ""}\n`;
      });
      text += `Percentage: ${fmt(exam.summary.percentage)}\tRank: ${exam.summary.rank}\tResult: ${exam.summary.result}\tDivision: ${exam.summary.division}\tGrand Total: ${exam.summary.grandTotal}\tTotal Obtain: ${exam.summary.totalObtained}\n\n`;
    });
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleExportExcel = () => {
    let csv = "";
    examData.forEach(exam => {
      csv += `"${exam.title}"\n`;
      csv += "Subject,Max Marks,Min Marks,Marks Obtained,Result/Grade,Note\n";
      exam.subjects.forEach(s => {
        csv += `"${s.name}",${fmt(s.maxMarks)},${fmt(s.minMarks)},${fmt(s.obtained)},"${s.result || s.grade || ""}","${s.note || ""}"\n`;
      });
      csv += `Percentage: ${fmt(exam.summary.percentage)},Rank: ${exam.summary.rank},Result: ${exam.summary.result},Division: ${exam.summary.division},Grand Total: ${exam.summary.grandTotal},Total Obtain: ${exam.summary.totalObtained}\n\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <TabPanel>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">Examination Results</h2>
        <ExportToolbar onCopy={handleCopy} onExcel={handleExportExcel} onPdf={handleExportPDF} onPrint={handlePrint} />
      </div>

      {examData.map((exam, i) => (
        <PanelCard key={i} title={exam.title} bodyClassName="p-0">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-700">
                  <th className="px-4 py-3 font-bold min-w-[150px]">Subject</th>
                  <th className="px-4 py-3 font-bold min-w-[100px]">Max Marks</th>
                  <th className="px-4 py-3 font-bold min-w-[100px]">Min Marks</th>
                  <th className="px-4 py-3 font-bold min-w-[120px]">Marks Obtained</th>
                  <th className="px-4 py-3 font-bold min-w-[100px]">{exam.type === "result" ? "Result" : "Grade"}</th>
                  <th className="px-4 py-3 font-bold">Note</th>
                </tr>
              </thead>
              <tbody>
                {exam.subjects.map((subj, idx) => (
                  <tr key={idx} className="border-b border-gray-100 text-[#333333] hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{subj.name}</td>
                    <td className="px-4 py-2.5">{fmt(subj.maxMarks)}</td>
                    <td className="px-4 py-2.5">{fmt(subj.minMarks)}</td>
                    <td className="px-4 py-2.5 font-semibold">{fmt(subj.obtained)}</td>
                    <td className="px-4 py-2.5">
                      {exam.type === "result" ? (
                        <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded text-white", subj.result === "Pass" ? "bg-[#5cb85c]" : "bg-red-500")}>{subj.result}</span>
                      ) : (
                        <span className="font-semibold text-gray-700">{subj.grade}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">{subj.note || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-100">
            {exam.subjects.map((subj, idx) => (
              <div key={idx} className="p-3.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[13px] font-semibold text-gray-800">{subj.name}</span>
                  {exam.type === "result" ? (
                    <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded text-white", subj.result === "Pass" ? "bg-[#5cb85c]" : "bg-red-500")}>{subj.result}</span>
                  ) : (
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-indigo-50 text-indigo-600">{subj.grade}</span>
                  )}
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-1">
                  <MiniField label="Max" value={fmt(subj.maxMarks)} />
                  <MiniField label="Min" value={fmt(subj.minMarks)} />
                  <MiniField label="Obtained" value={fmt(subj.obtained)} className="text-gray-900 font-bold" />
                  {subj.note && <MiniField label="Note" value={subj.note} />}
                </div>
              </div>
            ))}
          </div>

          {/* Summary footer */}
          <div className="bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10 px-4 py-3 border-t border-gray-200 text-[12px] sm:text-[13px] font-bold text-[#333333] grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between gap-x-6 gap-y-2">
            <span>Percentage : {fmt(exam.summary.percentage)}</span>
            <span>Rank : {exam.summary.rank}</span>
            <span className="flex items-center gap-1.5">Result : <span className="bg-[#5cb85c] text-white px-2 py-0.5 text-[11px] rounded">{exam.summary.result}</span></span>
            <span>Division : {exam.summary.division}</span>
            <span>Grand Total : {exam.summary.grandTotal}</span>
            <span>Total Obtain : {exam.summary.totalObtained}</span>
          </div>
        </PanelCard>
      ))}
    </TabPanel>
  );
}

// ─── CBSE Exam Types ────────────────────────────────────────────────────────
interface CbseExamHeader {
  title: string;
  subTitle?: string;
}

interface CbseExamData {
  title: string;
  headers: {
    theory: CbseExamHeader;
    practical: CbseExamHeader;
    assignment?: CbseExamHeader;
  };
  subjects: {
    name: string;
    theory: string;
    practical: string;
    assignment?: string;
    total: string;
  }[];
  summary: {
    totalObtained: number;
    totalMax: number;
    percentage: string;
    grade: string;
    rank: number;
  };
}

// ─── CBSE Exam Mock Data ──────────────────────────────────────────────────────
const cbseExamData: CbseExamData[] = [
  {
    title: "CBSE Monthly Test (Main Subjects) - May 2026",
    headers: {
      theory: { title: "Theory (TH02)", subTitle: "(Max 100)" },
      practical: { title: "Practical (PC03)", subTitle: "(Max 75)" },
      assignment: { title: "Assignment (AS05)", subTitle: "(Max 20)" },
    },
    subjects: [
      { name: "English (210)", theory: "76.00", practical: "55.00", assignment: "12.00", total: "143.00" },
      { name: "Computer (00220)", theory: "45.00", practical: "67.00", assignment: "14.00", total: "126.00" },
      { name: "Mathematics (110)", theory: "56.00", practical: "45.00", assignment: "8.00", total: "109.00" },
      { name: "Science (111)", theory: "45.00", practical: "35.00", assignment: "11.00", total: "91.00" },
    ],
    summary: { totalObtained: 469, totalMax: 780, percentage: "60.13", grade: "B", rank: 2 }
  },
  {
    title: "CBSE Half Yearly Examination",
    headers: {
      theory: { title: "Theory (TH02)", subTitle: "(Max 100)" },
      practical: { title: "Practical (PC03)", subTitle: "(Max 75)" },
      assignment: { title: "Assignment (AS05)", subTitle: "(Max 20)" },
    },
    subjects: [
      { name: "English (210)", theory: "76.00", practical: "45.00", assignment: "20.00", total: "141.00" },
      { name: "Hindi (230)", theory: "66.00", practical: "45.00", assignment: "18.00", total: "129.00" },
      { name: "Mathematics (110)", theory: "76.00", practical: "35.00", assignment: "10.00", total: "121.00" },
      { name: "Science (111)", theory: "55.00", practical: "34.00", assignment: "13.00", total: "102.00" },
    ],
    summary: { totalObtained: 493, totalMax: 780, percentage: "63.21", grade: "B", rank: 1 }
  },
  {
    title: "CBSE Practical Examination",
    headers: {
      theory: { title: "Theory (TH02)", subTitle: "(Max 100)" },
      practical: { title: "Practical (PC03)", subTitle: "(Max 75)" },
    },
    subjects: [
      { name: "English (210)", theory: "34.00", practical: "56.00", total: "90.00" },
      { name: "Mathematics (110)", theory: "N/A", practical: "N/A", total: "0.00" },
      { name: "Science (111)", theory: "76.00", practical: "23.00", total: "99.00" },
    ],
    summary: { totalObtained: 189, totalMax: 525, percentage: "36.00", grade: "E", rank: 3 }
  },
  {
    title: "CBSE Assessment Test ( June)",
    headers: {
      theory: { title: "Theory (TH02)", subTitle: "(Max 100)" },
      practical: { title: "Practical (PC03)", subTitle: "(Max 75)" },
      assignment: { title: "Assignment (AS05)", subTitle: "(Max 20)" },
    },
    subjects: [
      { name: "English (210)", theory: "75.00", practical: "45.00", assignment: "9.00", total: "129.00" },
      { name: "Hindi (230)", theory: "77.00", practical: "56.00", assignment: "10.00", total: "143.00" },
    ],
    summary: { totalObtained: 272, totalMax: 390, percentage: "69.74", grade: "B", rank: 2 }
  },
  {
    title: "Monthly Test Examination(June)",
    headers: {
      theory: { title: "Theory (TH02)", subTitle: "(Max 100)" },
      practical: { title: "Practical (PC03)", subTitle: "(Max 75)" },
      assignment: { title: "Assignment (AS05)", subTitle: "(Max 20)" },
    },
    subjects: [
      { name: "English (210)", theory: "76.00", practical: "55.00", assignment: "15.00", total: "146.00" },
      { name: "Mathematics (110)", theory: "65.00", practical: "56.00", assignment: "8.00", total: "129.00" },
      { name: "Computer (00220)", theory: "87.00", practical: "65.00", assignment: "8.00", total: "160.00" },
    ],
    summary: { totalObtained: 435, totalMax: 585, percentage: "74.36", grade: "B+", rank: 1 }
  },
  {
    title: "Unit Test(June)",
    headers: {
      theory: { title: "Theory (TH02)", subTitle: "(Max 100)" },
      practical: { title: "Practical (PC03)", subTitle: "(Max 75)" },
      assignment: { title: "Assignment (AS05)", subTitle: "(Max 20)" },
    },
    subjects: [
      { name: "English (210)", theory: "67.00", practical: "65.00", assignment: "9.00", total: "141.00" },
      { name: "Mathematics (110)", theory: "87.00", practical: "34.00", assignment: "16.00", total: "137.00" },
      { name: "Science (111)", theory: "56.00", practical: "32.00", assignment: "15.00", total: "103.00" },
    ],
    summary: { totalObtained: 381, totalMax: 585, percentage: "65.12", grade: "B", rank: 3 }
  }
];

// ─── CBSE Exam Tab Component ──────────────────────────────────────────────────
function CbseExamTab() {
  const handleCopy = () => {
    let text = "";
    cbseExamData.forEach(exam => {
      text += exam.title + "\n";
      const hasAssignment = !!exam.headers.assignment;
      text += `Subject\t${exam.headers.theory.title}\t${exam.headers.practical.title}${hasAssignment ? '\t' + exam.headers.assignment!.title : ''}\tTotal\n`;
      exam.subjects.forEach(s => {
        text += `${s.name}\t${s.theory}\t${s.practical}${hasAssignment ? '\t' + (s.assignment || 'N/A') : ''}\t${s.total}\n`;
      });
      text += `Total Marks: ${exam.summary.totalObtained}/${exam.summary.totalMax}\tPercentage: ${exam.summary.percentage}%\tGrade: ${exam.summary.grade}\tRank: ${exam.summary.rank}\n\n`;
    });
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleExportExcel = () => {
    let csv = "";
    cbseExamData.forEach(exam => {
      csv += `"${exam.title}"\n`;
      const hasAssignment = !!exam.headers.assignment;
      csv += `"Subject","${exam.headers.theory.title}","${exam.headers.practical.title}"${hasAssignment ? ',"' + exam.headers.assignment!.title + '"' : ''},"Total"\n`;
      exam.subjects.forEach(s => {
        csv += `"${s.name}","${s.theory}","${s.practical}"${hasAssignment ? ',"' + (s.assignment || 'N/A') + '"' : ''},"${s.total}"\n`;
      });
      csv += `"Total Marks: ${exam.summary.totalObtained}/${exam.summary.totalMax}","Percentage: ${exam.summary.percentage}%","Grade: ${exam.summary.grade}","Rank: ${exam.summary.rank}"\n\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cbse_exam_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <TabPanel>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">CBSE Examinations</h2>
        <ExportToolbar onCopy={handleCopy} onExcel={handleExportExcel} onPdf={handleExportPDF} onPrint={handlePrint} />
      </div>

      {cbseExamData.map((exam, i) => (
        <PanelCard key={i} title={exam.title} bodyClassName="p-0">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-[13px] text-center border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-[#333]">
                  <th className="px-4 py-3 font-bold min-w-[150px] text-left border-r border-gray-100">Subject</th>
                  <th className="px-4 py-2 font-bold min-w-[120px] border-r border-gray-100">
                    <div>{exam.headers.theory.title}</div>
                    {exam.headers.theory.subTitle && <div className="text-[11px] font-normal text-gray-500">{exam.headers.theory.subTitle}</div>}
                  </th>
                  <th className="px-4 py-2 font-bold min-w-[120px] border-r border-gray-100">
                    <div>{exam.headers.practical.title}</div>
                    {exam.headers.practical.subTitle && <div className="text-[11px] font-normal text-gray-500">{exam.headers.practical.subTitle}</div>}
                  </th>
                  {exam.headers.assignment && (
                    <th className="px-4 py-2 font-bold min-w-[120px] border-r border-gray-100">
                      <div>{exam.headers.assignment.title}</div>
                      {exam.headers.assignment.subTitle && <div className="text-[11px] font-normal text-gray-500">{exam.headers.assignment.subTitle}</div>}
                    </th>
                  )}
                  <th className="px-4 py-3 font-bold min-w-[80px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {exam.subjects.map((subj, idx) => (
                  <tr key={idx} className="border-b border-gray-100 text-[#555] hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-2.5 text-left border-r border-gray-100 font-medium">{subj.name}</td>
                    <td className="px-4 py-2.5 border-r border-gray-100">{subj.theory}</td>
                    <td className="px-4 py-2.5 border-r border-gray-100">{subj.practical}</td>
                    {exam.headers.assignment && <td className="px-4 py-2.5 border-r border-gray-100">{subj.assignment || "N/A"}</td>}
                    <td className="px-4 py-2.5 font-bold text-[#333]">{subj.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/80 font-bold text-[#333] text-[12px] border-t border-gray-200">
                  <td className="px-4 py-2.5 text-left border-r border-gray-100">Total : {exam.summary.totalObtained}/{exam.summary.totalMax}</td>
                  <td colSpan={exam.headers.assignment ? 2 : 1} className="px-4 py-2.5 text-left border-r border-gray-100">Percentage : {exam.summary.percentage}%</td>
                  <td className="px-4 py-2.5 text-left border-r border-gray-100">Grade : <span className="text-indigo-600">{exam.summary.grade}</span></td>
                  <td className="px-4 py-2.5 text-left">Rank : {exam.summary.rank}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {exam.subjects.map((subj, idx) => (
              <div key={idx} className="p-3.5">
                <p className="text-[13px] font-semibold text-gray-800 mb-1.5">{subj.name}</p>
                <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-1">
                  <MiniField label={exam.headers.theory.title} value={subj.theory} />
                  <MiniField label={exam.headers.practical.title} value={subj.practical} />
                  {exam.headers.assignment && <MiniField label={exam.headers.assignment.title} value={subj.assignment || "N/A"} />}
                  <MiniField label="Total" value={subj.total} className="font-bold text-gray-900" />
                </div>
              </div>
            ))}
            {/* Mobile summary */}
            <div className="p-3.5 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
              <div className="text-[12px] font-bold text-gray-700 grid grid-cols-2 gap-x-4 gap-y-1">
                <span>Total: {exam.summary.totalObtained}/{exam.summary.totalMax}</span>
                <span>Percentage: {exam.summary.percentage}%</span>
                <span>Grade: <span className="text-indigo-600">{exam.summary.grade}</span></span>
                <span>Rank: {exam.summary.rank}</span>
              </div>
            </div>
          </div>
        </PanelCard>
      ))}
    </TabPanel>
  );
}

// ─── Attendance Types & Mock Data ─────────────────────────────────────────────
interface AttendanceDay {
  [month: string]: string;
}

const attendanceMonths = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];

const attendanceData: AttendanceDay[] = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  const row: AttendanceDay = {};
  
  if (day === 1) { row["April"] = "P"; row["May"] = "A"; row["June"] = "P"; }
  if (day === 2) { row["May"] = "P"; }
  if (day === 3) { row["April"] = "L"; row["May"] = "H"; }
  if (day === 4) { row["May"] = "P"; row["June"] = "A"; }
  if (day === 5) { row["April"] = "H"; row["May"] = "P"; row["June"] = "H"; }
  if (day === 6) { row["May"] = "F"; }
  if (day === 7) { row["April"] = "A"; row["May"] = "P"; row["June"] = "H"; }
  if (day === 8) { row["April"] = "P"; row["May"] = "P"; }
  if (day === 9) { row["May"] = "P"; row["June"] = "L"; }
  if (day === 10) { row["April"] = "L"; row["June"] = "P"; }
  if (day === 11) { row["April"] = "P"; row["May"] = "L"; row["June"] = "P"; }
  if (day === 12) { row["May"] = "P"; row["June"] = "P"; }
  if (day === 13) { row["April"] = "P"; row["June"] = "P"; }
  if (day === 14) { row["April"] = "P"; row["May"] = "A"; }
  if (day === 15) { row["April"] = "P"; row["May"] = "P"; }
  if (day === 16) { row["May"] = "P"; row["June"] = "P"; }
  if (day === 17) { row["April"] = "H"; row["May"] = "H"; }
  if (day === 18) { row["June"] = "L"; }
  if (day === 20) { row["April"] = "P"; row["June"] = "P"; }
  if (day === 21) { row["April"] = "P"; row["June"] = "F"; }
  if (day === 22) { row["April"] = "P"; }
  if (day === 23) { row["April"] = "A"; row["May"] = "A"; }
  if (day === 24) { row["June"] = "F"; }
  if (day === 25) { row["April"] = "P"; }
  if (day === 26) { row["June"] = "F"; }
  if (day === 27) { row["April"] = "P"; }
  if (day === 28) { row["May"] = "A"; }
  if (day === 29) { row["April"] = "P"; }
  if (day === 30) { row["May"] = "P"; row["June"] = "A"; }
  if (day === 31) { row["May"] = "H"; }
  
  return row;
});

const getAttendanceColor = (status: string) => {
  switch (status) {
    case 'P': return 'text-green-600 font-bold';
    case 'A': return 'text-red-500 font-bold';
    default: return 'text-[#555] font-bold';
  }
};

// ─── Attendance Tab Component ──────────────────────────────────────────────────
function AttendanceTab() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleCopy = () => {
    let text = "Date | Month\t" + attendanceMonths.join("\t") + "\n";
    attendanceData.forEach((row, i) => {
      text += `${i + 1}\t` + attendanceMonths.map(m => row[m] || "").join("\t") + "\n";
    });
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleExportExcel = () => {
    let csv = `"Date | Month",` + attendanceMonths.map(m => `"${m}"`).join(",") + "\n";
    attendanceData.forEach((row, i) => {
      csv += `"${i + 1}",` + attendanceMonths.map(m => `"${row[m] || ""}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  const handlePrint = () => window.print();

  return (
    <TabPanel>
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { title: "Total Present", value: "28", color: "from-green-500 to-emerald-400", icon: "P", textColor: "text-green-700" },
          { title: "Total Late", value: "5", color: "from-yellow-400 to-orange-400", icon: "L", textColor: "text-yellow-700" },
          { title: "Total Absent", value: "8", color: "from-red-500 to-rose-400", icon: "A", textColor: "text-red-700" },
          { title: "Total Half Day", value: "4", color: "from-sky-400 to-blue-500", icon: "F", textColor: "text-sky-700" },
          { title: "Total Holiday", value: "7", color: "from-purple-400 to-indigo-500", icon: "H", textColor: "text-purple-700" },
        ].map((card, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className={`h-1.5 w-full bg-gradient-to-r ${card.color}`} />
            <div className="px-3 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 mb-1 leading-none">{card.title}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
              <span className={`text-2xl font-black opacity-15 ${card.textColor}`}>{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <PanelCard
        title="Attendance Record"
        right={
          <div className="flex flex-col items-end gap-1">
            <div className="text-[10px] font-bold text-gray-500 flex flex-wrap gap-x-2">
              <span className="text-green-600">P=Present</span>
              <span className="text-gray-500">E=Late w/ Excuse</span>
              <span className="text-yellow-500">L=Late</span>
              <span className="text-red-500">A=Absent</span>
              <span className="text-gray-500">H=Holiday</span>
              <span className="text-sky-500">F=Half Day</span>
            </div>
          </div>
        }
        bodyClassName="p-0"
      >
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 w-full text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <select className="h-8 border border-gray-200 text-[12px] rounded-lg bg-white text-gray-700 px-2 outline-none focus:border-indigo-300">
              <option>50</option>
            </select>
            <ExportToolbar onCopy={handleCopy} onExcel={handleExportExcel} onPrint={handlePrint} />
          </div>
        </div>

        {/* Wide table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] text-center border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-[#333]">
                <th className="px-3 py-2.5 font-bold min-w-[90px] border-r border-gray-100 whitespace-nowrap sticky left-0 bg-gray-50 z-10">
                  Date <ArrowUpDown className="inline h-3 w-3 opacity-30 ml-1" />
                </th>
                {attendanceMonths.map(m => (
                  <th key={m} className="px-2 py-2.5 font-bold min-w-[70px] border-r border-gray-100 whitespace-nowrap">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors text-[#555]">
                  <td className="px-3 py-2 border-r border-gray-100 font-semibold text-gray-600 sticky left-0 bg-white">{i + 1}</td>
                  {attendanceMonths.map(m => (
                    <td key={m} className={`px-2 py-2 border-r border-gray-100 ${getAttendanceColor(row[m])}`}>
                      {row[m] || ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[11px] text-gray-500 px-4 py-3 border-t border-gray-100">
          <span>Showing 1 to 31 of 31 entries</span>
          <div className="flex gap-1 items-center">
            <button className="h-7 w-7 bg-white text-gray-400 rounded-[10px] border border-gray-200 flex items-center justify-center disabled:opacity-40" disabled>&lt;</button>
            <button className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-[10px] flex items-center justify-center font-bold rounded-[10px] shadow-sm">1</button>
            <button className="h-7 w-7 bg-white text-gray-400 rounded-[10px] border border-gray-200 flex items-center justify-center disabled:opacity-40" disabled>&gt;</button>
          </div>
        </div>
      </PanelCard>
    </TabPanel>
  );
}

// ─── Documents Types & Mock Data ──────────────────────────────────────────────
interface DocumentItem {
  id: number;
  title: string;
  fileName: string;
}

const documentsData: DocumentItem[] = [
  { id: 1, title: "Document", fileName: "School_Admission_Form_Sample_Template (1).pdf" },
];

// ─── Documents Tab Component ──────────────────────────────────────────────────
function DocumentsTab() {
  const handleDownload = (doc: DocumentItem) => {
    toast.success(`Downloading ${doc.fileName}`);
  };

  return (
    <TabPanel>
      <PanelCard
        title="Documents"
        subtitle="Upload and manage student documents"
        right={
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all whitespace-nowrap">
              <Upload className="h-3.5 w-3.5" /> Upload
            </button>
            <button className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all whitespace-nowrap">
              <Upload className="h-3.5 w-3.5 text-indigo-500" /> Google Drive
            </button>
          </div>
        }
        bodyClassName="p-0"
      >
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-[#333]">
                <th className="px-4 py-3 text-left font-bold min-w-[120px] border-r border-gray-100">#</th>
                <th className="px-4 py-3 text-left font-bold border-r border-gray-100">Title</th>
                <th className="px-4 py-3 text-left font-bold border-r border-gray-100">File Name</th>
                <th className="px-4 py-3 text-right font-bold w-[90px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {documentsData.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors text-[#555]">
                  <td className="px-4 py-3 border-r border-gray-100 text-gray-400 font-medium">{doc.id}</td>
                  <td className="px-4 py-3 border-r border-gray-100 font-medium text-gray-800">{doc.title}</td>
                  <td className="px-4 py-3 border-r border-gray-100 text-[#337ab7]">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      {doc.fileName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm active:scale-[0.98] transition-all"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {documentsData.map((doc) => (
            <div key={doc.id} className="p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-800">{doc.title}</p>
                <p className="text-[11px] text-[#337ab7] flex items-center gap-1 mt-0.5 truncate">
                  <FileText className="h-3 w-3 shrink-0" />{doc.fileName}
                </p>
              </div>
              <button
                onClick={() => handleDownload(doc)}
                className="shrink-0 flex items-center gap-1 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {documentsData.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No documents uploaded yet.</p>
          </div>
        )}
      </PanelCard>
    </TabPanel>
  );
}

// ─── Timeline Types & Mock Data ───────────────────────────────────────────────
interface TimelineEntry {
  id: number;
  date: string;
  title: string;
}

const timelineData: TimelineEntry[] = [
  { id: 1, date: "04/02/2026", title: "All pending work submitted" },
  { id: 2, date: "04/04/2026", title: "PLEASE PURCHESE NEW BOOKS" },
];

// ─── Timeline Tab Component ───────────────────────────────────────────────────
function TimelineTab() {
  return (
    <TabPanel>
      <PanelCard title="Student Timeline" subtitle="Activity log and announcements">
        {timelineData.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <Clock className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No timeline entries yet.</p>
          </div>
        )}

        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-[14px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#FF9800] to-[#6366F1] rounded-full" />

          {timelineData.map((entry) => (
            <div key={entry.id} className="relative mb-8 last:mb-4">
              {/* Date badge */}
              <div className="mb-3">
                <span className="inline-block bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {entry.date}
                </span>
              </div>

              {/* Icon on the line */}
              <div className="absolute left-[-22px] top-[34px] w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center shadow-md">
                <Newspaper className="h-4 w-4 text-white" />
              </div>

              {/* Content card */}
              <div className="ml-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-l-4 border-[#6366F1]">
                  <p className="text-[13px] text-[#0dcaf0] font-semibold">{entry.title}</p>
                </div>
              </div>
            </div>
          ))}

          {/* End marker */}
          <div className="absolute left-[-8px] bottom-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#FF9800] flex items-center justify-center shadow-md">
            <Clock className="h-4 w-4 text-white" />
          </div>
        </div>
      </PanelCard>
    </TabPanel>
  );
}

// ─── Student Behaviour Types & Mock Data ──────────────────────────────────────
interface BehaviourEntry {
  id: number;
  title: string;
  point: number;
  date: string;
  description: string;
  assignBy: string;
}

const behaviourData: BehaviourEntry[] = [
  { id: 1, title: "Theft", point: -15, date: "06/02/2026", description: "It's important to report cases of theft on campus so that the university or school can increase security where needed. They could also consider other options to combat incidents of theft, such as lockers.", assignBy: "" },
  { id: 2, title: "Student Good Behaviour", point: 20, date: "06/02/2026", description: "Smile & have a good attitude and good behaviour.", assignBy: "" },
  { id: 3, title: "Respect others/property.", point: 10, date: "06/02/2026", description: "Respect others/property.", assignBy: "" },
  { id: 4, title: "Improper behaviour", point: -10, date: "05/02/2026", description: "Improper behaviour could be observed in a staff member or another student. If the behaviour is threatening, concerning or inappropriate, the university or school will need to monitor the individual to ensure that the behaviour is not repetitive.", assignBy: "" },
  { id: 5, title: "Student Good Behaviour", point: 20, date: "05/02/2026", description: "Smile & have a good attitude and good behaviour.", assignBy: "" },
  { id: 6, title: "Respect others/property.", point: 10, date: "05/02/2026", description: "Respect others/property.", assignBy: "" },
  { id: 7, title: "Improper behaviour", point: -10, date: "04/01/2026", description: "Improper behaviour could be observed in a staff member or another student. If the behaviour is threatening, concerning or inappropriate, the university or school will need to monitor the individual to ensure that the behaviour is not repetitive.", assignBy: "" },
  { id: 8, title: "Student Good Behaviour", point: 20, date: "04/01/2026", description: "Smile & have a good attitude and good behaviour.", assignBy: "" },
  { id: 9, title: "Respect others/property.", point: 10, date: "04/01/2026", description: "Respect others/property.", assignBy: "" },
];

// ─── Student Behaviour Tab Component ──────────────────────────────────────────
function StudentBehaviourTab() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleCopy = () => {
    let text = "Title\tPoint\tDate\tDescription\tAssign By\n";
    behaviourData.forEach(b => {
      text += `${b.title}\t${b.point}\t${b.date}\t${b.description}\t${b.assignBy}\n`;
    });
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleExportExcel = () => {
    let csv = "Title,Point,Date,Description,Assign By\n";
    behaviourData.forEach(b => {
      csv += `"${b.title}",${b.point},"${b.date}","${b.description}","${b.assignBy}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_behaviour_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  const handlePrint = () => window.print();

  const filtered = behaviourData.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TabPanel>
      <PanelCard
        title="Student Behaviour"
        subtitle="Behaviour points and conduct records"
        right={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 w-44 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 transition-all"
              />
            </div>
            <ExportToolbar onCopy={handleCopy} onExcel={handleExportExcel} onPrint={handlePrint} />
          </div>
        }
        bodyClassName="p-0"
      >
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-[#333]">
                <th className="px-4 py-3 text-left font-bold min-w-[130px] border-r border-gray-100 whitespace-nowrap">Title <ArrowUpDown className="inline h-3 w-3 opacity-30 ml-1" /></th>
                <th className="px-4 py-3 text-center font-bold w-[80px] border-r border-gray-100">Points</th>
                <th className="px-4 py-3 text-left font-bold w-[110px] border-r border-gray-100">Date</th>
                <th className="px-4 py-3 text-left font-bold border-r border-gray-100">Description</th>
                <th className="px-4 py-3 text-center font-bold w-[90px] border-r border-gray-100">Assigned By</th>
                <th className="px-4 py-3 text-center font-bold w-[70px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const isNegative = b.point < 0;
                return (
                  <tr key={b.id} className={cn("border-b border-gray-100 transition-colors", isNegative ? "bg-red-50/60 hover:bg-red-50" : "hover:bg-indigo-50/30")}>
                    <td className={`px-4 py-2.5 border-r border-gray-100 font-semibold ${isNegative ? "text-red-700" : "text-gray-800"}`}>{b.title}</td>
                    <td className="px-4 py-2.5 text-center border-r border-gray-100">
                      <span className={cn("inline-block font-bold text-[12px] px-2 py-0.5 rounded-full", isNegative ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700")}>
                        {b.point > 0 ? "+" : ""}{b.point}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-100 text-gray-500 whitespace-nowrap">{b.date}</td>
                    <td className="px-4 py-2.5 border-r border-gray-100 text-gray-600 text-[12px] leading-relaxed">{b.description}</td>
                    <td className="px-4 py-2.5 text-center border-r border-gray-100 text-gray-500">{b.assignBy || "—"}</td>
                    <td className="px-4 py-2.5 text-center">
                      <button className="inline-flex items-center justify-center h-7 w-7 bg-gradient-to-br from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white rounded-full shadow-sm transition-all active:scale-95" title="View">
                        <PlayCircle className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map((b) => {
            const isNegative = b.point < 0;
            return (
              <div key={b.id} className={cn("p-3.5", isNegative ? "bg-red-50/60" : "bg-white")}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className={`text-[13px] font-semibold leading-snug ${isNegative ? "text-red-700" : "text-gray-800"}`}>{b.title}</p>
                  <span className={cn("shrink-0 font-bold text-[12px] px-2 py-0.5 rounded-full", isNegative ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700")}>
                    {b.point > 0 ? "+" : ""}{b.point}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mb-1">{b.date}</p>
                <p className="text-[12px] text-gray-600 leading-relaxed">{b.description}</p>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm">No records found.</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[11px] text-gray-500 px-4 py-3 border-t border-gray-100">
          <span>Showing 1 to {filtered.length} of {filtered.length} entries</span>
          <div className="flex gap-1 items-center">
            <button className="h-7 w-7 bg-white text-gray-400 rounded-[10px] border border-gray-200 flex items-center justify-center disabled:opacity-40" disabled>&lt;</button>
            <button className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-[10px] flex items-center justify-center font-bold rounded-[10px] shadow-sm">1</button>
            <button className="h-7 w-7 bg-white text-gray-400 rounded-[10px] border border-gray-200 flex items-center justify-center disabled:opacity-40" disabled>&gt;</button>
          </div>
        </div>
      </PanelCard>
    </TabPanel>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────────
type TabId = "Profile" | "Fees" | "Exam" | "CBSE Examination" | "Attendance" | "Documents" | "Timeline" | "Student Behaviour";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("Profile");

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await api.get('/user/profile');
        if (response.data && response.data.success) {
          setData(response.data.data);
        } else {
          setData(mockUserProfileData);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setData(mockUserProfileData);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  useEffect(() => {
    if (data?.basic?.barcode) {
      QRCode.toDataURL(data.basic.barcode, {
        width: 150,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      }).then(setQrDataUrl).catch(() => { });
    }
  }, [data]);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { basic, profileTab } = data || mockUserProfileData;

  const TABS: TabId[] = ["Profile", "Fees", "Exam", "CBSE Examination", "Attendance", "Documents", "Timeline", "Student Behaviour"];

  const TabButton = ({ tab }: { tab: TabId }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "relative px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors",
        activeTab === tab
          ? "text-[#6366F1]"
          : "text-gray-500 hover:text-gray-700"
      )}
    >
      {tab}
      {activeTab === tab && (
        <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1]" />
      )}
    </button>
  );

  const DetailRow = ({ label, value, valueClassName = "" }: { label: string; value: React.ReactNode; valueClassName?: string }) => (
    <div className="flex flex-col sm:flex-row border-b border-gray-100 last:border-0 py-2.5 gap-0.5 sm:gap-2 hover:bg-gray-50/60 transition-colors rounded px-1">
      <div className="w-full sm:w-[25%] font-semibold text-gray-500 text-[12px] sm:text-[13px] uppercase sm:normal-case tracking-wide sm:tracking-normal">{label}</div>
      <div className={cn("w-full sm:w-[75%] text-[13px] text-gray-800 font-medium", valueClassName)}>{value || "-"}</div>
    </div>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10 px-4 py-2.5 rounded-lg mt-6 mb-3">
      <span className="w-1 h-4 rounded-full bg-gradient-to-b from-[#FF9800] to-[#6366F1]" />
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
    </div>
  );

  const GuardianRow = ({ title, name, phone, occupation, address, email, relation, image }: any) => (
    <div className="flex border-b border-gray-100 last:border-0 py-3 relative">
      <div className="flex-1 pr-24">
        <div className="flex mb-1">
          <div className="w-[30%] sm:w-[25%] font-medium text-gray-600 text-[13px]">{title} Name</div>
          <div className="w-[70%] sm:w-[75%] text-[13px] text-gray-800">{name || "-"}</div>
        </div>
        {email !== undefined && (
          <div className="flex mb-1">
            <div className="w-[30%] sm:w-[25%] font-medium text-gray-600 text-[13px]">{title} Email</div>
            <div className="w-[70%] sm:w-[75%] text-[13px] text-gray-800">{email || "-"}</div>
          </div>
        )}
        {relation !== undefined && (
          <div className="flex mb-1">
            <div className="w-[30%] sm:w-[25%] font-medium text-gray-600 text-[13px]">{title} Relation</div>
            <div className="w-[70%] sm:w-[75%] text-[13px] text-gray-800">{relation || "-"}</div>
          </div>
        )}
        <div className="flex mb-1">
          <div className="w-[30%] sm:w-[25%] font-medium text-gray-600 text-[13px]">{title} Phone</div>
          <div className="w-[70%] sm:w-[75%] text-[13px] text-gray-800">{phone || "-"}</div>
        </div>
        <div className="flex mb-1">
          <div className="w-[30%] sm:w-[25%] font-medium text-gray-600 text-[13px]">{title} Occupation</div>
          <div className="w-[70%] sm:w-[75%] text-[13px] text-gray-800">{occupation || "-"}</div>
        </div>
        {address !== undefined && (
          <div className="flex">
            <div className="w-[30%] sm:w-[25%] font-medium text-gray-600 text-[13px]">{title} Address</div>
            <div className="w-[70%] sm:w-[75%] text-[13px] text-gray-800">{address || "-"}</div>
          </div>
        )}
      </div>
      <div className="absolute top-3 right-0 w-20 h-20 bg-gray-100 rounded border flex flex-col items-center justify-center text-gray-400">
        {image ? (
          <img src={image} alt="Guardian" className="w-full h-full object-cover rounded" />
        ) : (
          <>
            <User className="w-8 h-8 opacity-50 mb-1" />
            <span className="text-[8px] uppercase font-bold text-center leading-none">No Image<br />Available</span>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start p-4 lg:p-6 animate-in fade-in duration-500">
      {/* Left Panel */}
      <Card className="w-full lg:w-[320px] shrink-0 shadow-md border-0 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {/* Gradient banner + avatar */}
          <div className="relative">
            <div className="h-20 bg-gradient-to-r from-[#FF9800] to-[#6366F1]" />
            <div className="px-5 pb-4 -mt-10 flex flex-col items-center text-center">
              <div className="h-20 w-20 bg-white rounded-full shadow-md ring-4 ring-white flex items-center justify-center shrink-0 overflow-hidden">
                {basic.image ? (
                  <img src={basic.image} alt={basic.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-800 mt-2 truncate max-w-full">{basic.name}</h2>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
                <span>Adm: <span className="text-indigo-500 font-medium">{basic.admissionNo}</span></span>
                <span>Roll: <span className="text-indigo-500 font-medium">{basic.rollNumber}</span></span>
              </div>
            </div>
          </div>

          <div className="p-0">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Class</span>
              <span className="text-sm text-sky-500 font-medium">{basic.class}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Section</span>
              <span className="text-sm text-sky-500 font-medium">{basic.section}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Gender</span>
              <span className="text-sm text-sky-500 font-medium">{basic.gender}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">RTE</span>
              <span className="text-sm text-sky-500 font-medium">{basic.rte}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Barcode</span>
              <div className="flex flex-col items-center">
                <svg className="h-6 w-24" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <rect x="0" y="0" width="3" height="30" fill="black" />
                  <rect x="5" y="0" width="1" height="30" fill="black" />
                  <rect x="8" y="0" width="4" height="30" fill="black" />
                  <rect x="14" y="0" width="2" height="30" fill="black" />
                  <rect x="18" y="0" width="1" height="30" fill="black" />
                  <rect x="21" y="0" width="3" height="30" fill="black" />
                  <rect x="26" y="0" width="2" height="30" fill="black" />
                  <rect x="30" y="0" width="1" height="30" fill="black" />
                  <rect x="33" y="0" width="5" height="30" fill="black" />
                  <rect x="40" y="0" width="2" height="30" fill="black" />
                  <rect x="44" y="0" width="1" height="30" fill="black" />
                  <rect x="47" y="0" width="3" height="30" fill="black" />
                  <rect x="52" y="0" width="1" height="30" fill="black" />
                  <rect x="55" y="0" width="4" height="30" fill="black" />
                  <rect x="61" y="0" width="2" height="30" fill="black" />
                  <rect x="65" y="0" width="1" height="30" fill="black" />
                  <rect x="68" y="0" width="3" height="30" fill="black" />
                  <rect x="73" y="0" width="2" height="30" fill="black" />
                  <rect x="77" y="0" width="1" height="30" fill="black" />
                  <rect x="80" y="0" width="4" height="30" fill="black" />
                  <rect x="86" y="0" width="2" height="30" fill="black" />
                  <rect x="90" y="0" width="1" height="30" fill="black" />
                  <rect x="93" y="0" width="3" height="30" fill="black" />
                  <rect x="98" y="0" width="2" height="30" fill="black" />
                </svg>
                <span className="text-[10px] font-bold mt-1">{basic.barcode}</span>
              </div>
            </div>
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">QR Code</span>
              <div className="h-8 w-8 bg-white border border-gray-300 p-0.5">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="h-full w-full object-contain" />
                ) : (
                  <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                    <span className="text-[6px] text-gray-400">QR</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Behaviour Score</span>
              <span className="text-sm text-sky-500 font-medium">{basic.behaviourScore}</span>
            </div>
            <div className="p-4">
              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-sm font-semibold px-4 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity active:scale-[0.98]">
                <Download className="h-4 w-4" /> Download Resume
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Panel */}
      <Card className="flex-1 w-full shadow-md border-0 rounded-xl overflow-hidden min-w-0">
        {/* Tab Bar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50">
          <div className="flex overflow-x-auto custom-scrollbar">
            {TABS.map((tab) => (
              <TabButton key={tab} tab={tab} />
            ))}
          </div>
        </div>

        <CardContent className="p-0">
          {/* ── Profile Tab ── */}
          {activeTab === "Profile" && (
            <div className="p-4 sm:p-6">
              {/* Basic Details */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10 px-4 py-2.5 rounded-lg mb-4">
                <span className="w-1 h-4 rounded-full bg-gradient-to-b from-[#FF9800] to-[#6366F1]" />
                <h3 className="text-sm font-bold text-gray-800">Basic Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
                <InfoTile icon={Calendar} label="Admission Date" value={profileTab.basicDetails.admissionDate} />
                <InfoTile icon={Cake} label="Date Of Birth" value={profileTab.basicDetails.dateOfBirth} />
                <InfoTile icon={Tag} label="Category" value={profileTab.basicDetails.category} />
                <InfoTile icon={Phone} label="Mobile Number" value={profileTab.basicDetails.mobileNumber} />
                <InfoTile icon={Users} label="Caste" value={profileTab.basicDetails.caste} />
                <InfoTile icon={BookOpen} label="Religion" value={profileTab.basicDetails.religion} />
                <InfoTile icon={Mail} label="Email" value={profileTab.basicDetails.email} />
                <InfoTile icon={HeartPulse} label="Medical History" value={profileTab.basicDetails.medicalHistory} />
                <InfoTile icon={StickyNote} label="Note" value={profileTab.basicDetails.note} />
              </div>

              {/* Address Details */}
              <SectionHeader title="Address Details" />
              <div className="px-4">
                <DetailRow label="Current Address" value={profileTab.addressDetails.currentAddress} />
                <DetailRow label="Permanent Address" value={profileTab.addressDetails.permanentAddress} />
              </div>

              {/* Parent Guardian Detail */}
              <SectionHeader title="Parent Guardian Detail" />
              <div className="px-4">
                <GuardianRow title="Father" {...profileTab.parentGuardianDetails.father} />
                <GuardianRow title="Mother" {...profileTab.parentGuardianDetails.mother} />
                <GuardianRow title="Guardian" {...profileTab.parentGuardianDetails.guardian} />
              </div>

              {/* Transport Details */}
              <SectionHeader title="Transport Details" />
              <div className="px-4">
                <DetailRow label="Pick-up Point" value={profileTab.transportDetails.pickupPoint} />
                <DetailRow label="Route" value={profileTab.transportDetails.route} />
                <DetailRow label="Vehicle Number" value={profileTab.transportDetails.vehicleNumber} />
                <DetailRow label="Driver Name" value={profileTab.transportDetails.driverName} />
                <DetailRow label="Driver Contact" value={profileTab.transportDetails.driverContact} />
              </div>

              {/* Hostel Details */}
              <SectionHeader title="Hostel Details" />
              <div className="px-4">
                <DetailRow label="Hostel" value={profileTab.hostelDetails.hostel} />
                <DetailRow label="Room No." value={profileTab.hostelDetails.roomNo} />
                <DetailRow label="Room Type" value={profileTab.hostelDetails.roomType} />
              </div>

              {/* Miscellaneous Details */}
              <SectionHeader title="Miscellaneous Details" />
              <div className="px-4 mb-4">
                <DetailRow label="Blood Group" value={profileTab.miscellaneousDetails.bloodGroup} />
                <DetailRow label="House" value={profileTab.miscellaneousDetails.house} />
                <DetailRow label="Height" value={profileTab.miscellaneousDetails.height} />
                <DetailRow label="Weight" value={profileTab.miscellaneousDetails.weight} />
                <DetailRow label="Measurement Date" value={profileTab.miscellaneousDetails.measurementDate} />
                <DetailRow label="Previous School Details" value={profileTab.miscellaneousDetails.previousSchoolDetails} />
                <DetailRow label="National Identification Number" value={profileTab.miscellaneousDetails.nationalIdentificationNumber} />
                <DetailRow label="Local Identification Number" value={profileTab.miscellaneousDetails.localIdentificationNumber} />
                <DetailRow label="Bank Account Number" value={profileTab.miscellaneousDetails.bankAccountNumber} />
                <DetailRow label="Bank Name" value={profileTab.miscellaneousDetails.bankName} />
                <DetailRow label="IFSC Code" value={profileTab.miscellaneousDetails.ifscCode} />
              </div>
            </div>
          )}

          {/* ── Fees Tab ── */}
          {activeTab === "Fees" && <FeesTab />}

          {/* ── Exam Tab ── */}
          {activeTab === "Exam" && <ExamTab />}

          {/* ── CBSE Exam Tab ── */}
          {activeTab === "CBSE Examination" && <CbseExamTab />}

          {/* ── Attendance Tab ── */}
          {activeTab === "Attendance" && <AttendanceTab />}

          {/* ── Documents Tab ── */}
          {activeTab === "Documents" && <DocumentsTab />}

          {/* ── Timeline Tab ── */}
          {activeTab === "Timeline" && <TimelineTab />}

          {/* ── Student Behaviour Tab ── */}
          {activeTab === "Student Behaviour" && <StudentBehaviourTab />}
        </CardContent>
      </Card>
    </div>
  );
}
