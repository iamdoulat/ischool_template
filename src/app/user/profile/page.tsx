"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { isPortalMenuVisible } from "@/lib/portal-menu-permissions";
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
  StickyNote,
  MapPin,
  Globe,
  Languages,
  Star,
  GraduationCap,
  AtSign,
  KeyRound,
  School,
  Percent,
  MapPinned,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { mockUserProfileData } from "@/lib/mock-user-profile";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    Paid: "bg-[#5cb85c] text-white",
    Unpaid: "bg-red-500 text-white",
    Partial: "bg-[#f0ad4e] text-white",
  };
  return (
    <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded uppercase", map[status] ?? "bg-gray-400 text-white")}>
      {t(status.toLowerCase())}
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
  const { t } = useTranslation();
  const btn =
    "h-8 w-8 hover:bg-white hover:shadow-sm rounded-md border border-transparent hover:border-gray-200 transition-all";
  return (
    <div className="flex items-center gap-1 text-gray-500">
      <Button onClick={onCopy} variant="ghost" size="icon" className={btn} title={t("copy")}><Copy className="h-3.5 w-3.5" /></Button>
      <Button onClick={onExcel} variant="ghost" size="icon" className={btn} title={t("export_excel")}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
      <Button onClick={onPdf} variant="ghost" size="icon" className={btn} title={t("export_pdf")}><FileText className="h-3.5 w-3.5" /></Button>
      <Button onClick={onPrint} variant="ghost" size="icon" className={btn} title={t("print")}><Printer className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className={btn} title={t("columns")}><Columns className="h-3.5 w-3.5" /></Button>
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
  const { t } = useTranslation();
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [session, setSession] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchFees = async () => {
      try {
        setLoading(true);
        const res = await api.get('/user/fees');
        const d = res.data?.data || res.data;
        if (isMounted && d) {
          if (d.session) setSession(d.session);
          if (Array.isArray(d.fees) && d.fees.length > 0) {
            setFees(d.fees.map((f: Record<string, unknown>) => ({
              id: Number(f.id),
              name: String(f.name || ''),
              code: String(f.code || ''),
              dueDate: String(f.due_date || f.dueDate || ''),
              status: String(f.status || 'Unpaid'),
              amount: parseFloat(String(f.amount || 0)) || 0,
              fine: parseFloat(String(f.fine || 0)) || 0,
              discount: parseFloat(String(f.discount || 0)) || 0,
              fineAmount: parseFloat(String(f.fine_amount ?? f.fineAmount ?? 0)),
              paidAmount: parseFloat(String(f.paid_amount ?? f.paidAmount ?? 0)),
              balance: parseFloat(String(f.balance || 0)) || 0,
              payments: (Array.isArray(f.payments) ? f.payments : []).map((p: Record<string, unknown>) => ({
                id: String(p.id || ''),
                paymentId: String(p.payment_id || p.paymentId || p.id || ''),
                mode: String(p.mode || 'Cash'),
                date: String(p.date || ''),
                discount: parseFloat(String(p.discount || 0)) || 0,
                fine: parseFloat(String(p.fine || 0)) || 0,
                paid: parseFloat(String(p.paid || 0)) || 0,
                balance: parseFloat(String(p.balance || 0)) || 0,
              })),
            })));
          } else {
            setFees([]);
          }
        }
      } catch (err) {
        console.error("Error fetching student fees:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchFees();
    return () => { isMounted = false; };
  }, []);

  const allIds = fees.map((f) => f.id);
  const allChecked = allIds.length > 0 && selected.length === allIds.length;

  const toggleAll = () => setSelected(allChecked ? [] : allIds);
  const toggleOne = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const grandAmount = fees.reduce((s, f) => s + f.amount, 0);
  const grandFine = fees.reduce((s, f) => s + f.fine, 0);
  const grandDiscount = fees.reduce((s, f) => s + f.discount, 0);
  const grandFineAmt = fees.reduce((s, f) => s + f.fineAmount, 0);
  const grandPaid = fees.reduce((s, f) => s + f.paidAmount, 0);
  const grandBalance = fees.reduce((s, f) => s + f.balance, 0);

  if (loading) {
    return (
      <TabPanel>
        <div className="py-16 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm">{t("loading")}</p>
        </div>
      </TabPanel>
    );
  }

  return (
    <TabPanel>
      {/* Action buttons + date */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
          <button className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all">
            <Printer className="h-3.5 w-3.5" /> {t("print_selected")}
          </button>
          <button className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all">
            <CreditCard className="h-3.5 w-3.5" /> {t("pay_selected")}
          </button>
          <button className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all">
            <Building2 className="h-3.5 w-3.5" /> {t("offline_bank_payments")}
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {session && (
            <span className="hidden sm:inline rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-semibold px-3 py-1">{t("session")} {session}</span>
          )}
          <span className="font-medium">{t("date")}: {new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}</span>
        </div>
      </div>

      <PanelCard title={t("fee_statement")} subtitle={session ? `${t("session")} ${session}` : undefined} right={<ExportToolbar />}>
        {fees.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t("no_fees_records") || "No fee records found"}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="w-8 px-2 py-2.5 text-center">
                      <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded cursor-pointer accent-[#6366F1]" />
                    </th>
                    <th className="px-2 py-2.5 text-left font-bold text-gray-600 min-w-[160px]">{t("fees")}</th>
                    <th className="px-2 py-2.5 text-left font-bold text-gray-600 whitespace-nowrap">{t("due_date")}</th>
                    <th className="px-2 py-2.5 text-left font-bold text-gray-600">{t("status")}</th>
                    <th className="px-2 py-2.5 text-right font-bold text-gray-600 whitespace-nowrap">{t("amount")} ($)</th>
                    <th className="px-2 py-2.5 text-left font-bold text-gray-600 whitespace-nowrap">{t("payment_id")}</th>
                    <th className="px-2 py-2.5 text-left font-bold text-gray-600">{t("mode")}</th>
                    <th className="px-2 py-2.5 text-left font-bold text-gray-600">{t("date")}</th>
                    <th className="px-2 py-2.5 text-right font-bold text-gray-600 whitespace-nowrap">{t("discount")} ($)</th>
                    <th className="px-2 py-2.5 text-right font-bold text-gray-600 whitespace-nowrap">{t("fine")} ($)</th>
                    <th className="px-2 py-2.5 text-right font-bold text-gray-600 whitespace-nowrap">{t("paid")} ($)</th>
                    <th className="px-2 py-2.5 text-right font-bold text-gray-600 whitespace-nowrap">{t("balance")} ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee) => {
                    const isUnpaidOrPartial = fee.status === "Unpaid" || fee.status === "Partial";
                    return (
                      <Fragment key={fee.id}>
                        <tr className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors">
                          <td className="px-2 py-2.5 text-center">
                            <input type="checkbox" checked={selected.includes(fee.id)} onChange={() => toggleOne(fee.id)} className="rounded cursor-pointer accent-[#6366F1]" />
                          </td>
                          <td className="px-2 py-2.5">
                            <span className="text-[#337ab7] hover:underline cursor-pointer font-medium">{fee.name} {fee.code ? `(${fee.code})` : ''}</span>
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
                    <td className="px-2 py-2.5 text-sm font-bold text-gray-700" colSpan={3}>{t("grand_total")}</td>
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
              {fees.map((fee) => (
                <div key={fee.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-start gap-2 min-w-0">
                      <input type="checkbox" checked={selected.includes(fee.id)} onChange={() => toggleOne(fee.id)} className="mt-0.5 rounded cursor-pointer accent-[#6366F1]" />
                      <span className="text-[13px] font-semibold text-gray-800 leading-snug">{fee.name}</span>
                    </label>
                    <StatusBadge status={fee.status} />
                  </div>
                  <div className="mt-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-1.5">
                    <MiniField label={t("due_date")} value={fee.dueDate} className="text-[#337ab7]" />
                    <MiniField label={t("amount")} value={<>{fmt(fee.amount)}{fee.fine > 0 && <span className="text-orange-500"> + {fmt(fee.fine)}</span>}</>} />
                    <MiniField label={t("discount")} value={fmt(fee.discount)} className={fee.discount > 0 ? "text-[#337ab7] font-semibold" : ""} />
                    <MiniField label={t("fine")} value={fmt(fee.fineAmount)} />
                    <MiniField label={t("paid")} value={fmt(fee.paidAmount)} />
                    <MiniField label={t("balance")} value={fmt(fee.balance)} className={fee.balance > 0 ? "text-red-600 font-bold" : "text-green-600"} />
                  </div>
                  {fee.payments.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      {fee.payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-[11px] text-gray-500 pl-2">
                          <span className="text-[#337ab7]">↳ {p.paymentId} · {p.mode}</span>
                          <span>{p.date} · {t("paid")} {fmt(p.paid)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {/* Mobile grand total */}
              <div className="p-3.5 bg-gray-50">
                <div className="text-sm font-bold text-gray-700 mb-1">{t("grand_total")}</div>
                <MiniField label={t("amount")} value={<>${fmt(grandAmount)}{grandFine > 0 && <span className="text-orange-500"> + {fmt(grandFine)}</span>}</>} />
                <MiniField label={t("discount")} value={`$${fmt(grandDiscount)}`} />
                <MiniField label={t("fine")} value={`$${fmt(grandFineAmt)}`} />
                <MiniField label={t("paid")} value={`$${fmt(grandPaid)}`} />
                <MiniField label={t("balance")} value={`$${fmt(grandBalance)}`} className="text-red-600 font-bold" />
              </div>
            </div>
          </>
        )}
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

// ─── Exam Tab Component ────────────────────────────────────────────────────────
function ExamTab() {
  const { t } = useTranslation();
  const [exams, setExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const fmt = (n: number) => n.toFixed(2);

  useEffect(() => {
    let isMounted = true;
    const fetchExams = async () => {
      try {
        setLoading(true);
        const res = await api.get('/user/exam-results');
        const list = res.data?.data || res.data;
        if (isMounted && Array.isArray(list)) {
          setExams(list.map((e: Record<string, unknown>) => ({
            title: String(e.exam_name || e.title || 'Exam'),
            type: e.is_grading ? 'grade' : 'result',
            subjects: (Array.isArray(e.subjects) ? e.subjects : []).map((s: Record<string, unknown>) => ({
              name: String(s.name || ''),
              maxMarks: parseFloat(String(s.max || 100)) || 100,
              minMarks: parseFloat(String(s.min || 33)) || 33,
              obtained: s.obtained === 'Absent' ? 0 : (parseFloat(String(s.obtained || 0)) || 0),
              result: String(s.result || 'Pass'),
              grade: String(s.grade || ''),
              note: String(s.note || ''),
            })),
            summary: e.summary && typeof e.summary === 'object' ? {
              percentage: parseFloat(String((e.summary as Record<string, unknown>).percentage || 0)) || 0,
              rank: parseInt(String((e.summary as Record<string, unknown>).rank || 1), 10) || 1,
              result: String((e.summary as Record<string, unknown>).result || 'Pass'),
              division: String((e.summary as Record<string, unknown>).division || 'First'),
              grandTotal: parseFloat(String((e.summary as Record<string, unknown>).grand_total || 0)) || 0,
              totalObtained: parseFloat(String((e.summary as Record<string, unknown>).total_obtained || 0)) || 0,
            } : { percentage: 0, rank: 1, result: 'Pass', division: '-', grandTotal: 0, totalObtained: 0 },
          })));
        }
      } catch (err) {
        console.error("Error fetching exam results:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchExams();
    return () => { isMounted = false; };
  }, []);

  const handleCopy = () => {
    let text = "";
    exams.forEach(exam => {
      text += exam.title + "\n";
      text += "Subject\tMax Marks\tMin Marks\tMarks Obtained\tResult/Grade\tNote\n";
      exam.subjects.forEach(s => {
        text += `${s.name}\t${fmt(s.maxMarks)}\t${fmt(s.minMarks)}\t${fmt(s.obtained)}\t${s.result || s.grade || ""}\t${s.note || ""}\n`;
      });
      text += `Percentage: ${fmt(exam.summary.percentage)}\tRank: ${exam.summary.rank}\tResult: ${exam.summary.result}\tDivision: ${exam.summary.division}\tGrand Total: ${exam.summary.grandTotal}\tTotal Obtain: ${exam.summary.totalObtained}\n\n`;
    });
    navigator.clipboard.writeText(text);
    toast.success(t("copied_to_clipboard"));
  };

  const handleExportExcel = () => {
    let csv = "";
    exams.forEach(exam => {
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
    toast.success(t("exported_to_csv"));
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <TabPanel>
        <div className="py-16 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm">{t("loading")}</p>
        </div>
      </TabPanel>
    );
  }

  return (
    <TabPanel>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">{t("examination_results")}</h2>
        <ExportToolbar onCopy={handleCopy} onExcel={handleExportExcel} onPdf={handleExportPDF} onPrint={handlePrint} />
      </div>

      {exams.length === 0 ? (
        <PanelCard title={t("examination_results")}>
          <div className="py-12 text-center text-gray-400">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t("no_exam_records") || "No published examination results found"}</p>
          </div>
        </PanelCard>
      ) : (
        exams.map((exam, i) => (
          <PanelCard key={i} title={exam.title} bodyClassName="p-0">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-700">
                    <th className="px-4 py-3 font-bold min-w-[150px]">{t("subject")}</th>
                    <th className="px-4 py-3 font-bold min-w-[100px]">{t("max_marks")}</th>
                    <th className="px-4 py-3 font-bold min-w-[100px]">{t("min_marks")}</th>
                    <th className="px-4 py-3 font-bold min-w-[120px]">{t("marks_obtained")}</th>
                    <th className="px-4 py-3 font-bold min-w-[100px]">{exam.type === "result" ? t("result") : t("grade")}</th>
                    <th className="px-4 py-3 font-bold">{t("note")}</th>
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
                          <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded text-white", subj.result === "Pass" ? "bg-[#5cb85c]" : "bg-red-500")}>{t((subj.result || "").toLowerCase())}</span>
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
                      <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded text-white", subj.result === "Pass" ? "bg-[#5cb85c]" : "bg-red-500")}>{t((subj.result || "").toLowerCase())}</span>
                    ) : (
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-indigo-50 text-indigo-600">{subj.grade}</span>
                    )}
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-1">
                    <MiniField label={t("max")} value={fmt(subj.maxMarks)} />
                    <MiniField label={t("min")} value={fmt(subj.minMarks)} />
                    <MiniField label={t("obtained")} value={fmt(subj.obtained)} className="text-gray-900 font-bold" />
                    {subj.note && <MiniField label={t("note")} value={subj.note} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary footer */}
            <div className="bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10 px-4 py-3 border-t border-gray-200 text-[12px] sm:text-[13px] font-bold text-[#333333] grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between gap-x-6 gap-y-2">
              <span>{t("percentage")} : {fmt(exam.summary.percentage)}</span>
              <span>{t("rank")} : {exam.summary.rank}</span>
              <span className="flex items-center gap-1.5">{t("result")} : <span className="bg-[#5cb85c] text-white px-2 py-0.5 text-[11px] rounded">{t(exam.summary.result.toLowerCase())}</span></span>
              <span>{t("division")} : {exam.summary.division}</span>
              <span>{t("grand_total")} : {exam.summary.grandTotal}</span>
              <span>{t("total_obtain")} : {exam.summary.totalObtained}</span>
            </div>
          </PanelCard>
        ))
      )}
    </TabPanel>
  );
}

// ─── CBSE Exam Types ──────────────────────────────────────────────────────────
interface CbseColumn {
  name: string;
  max?: number;
}

interface CbseSubject {
  name: string;
  scores?: (string | number)[];
  theory?: string | number;
  total?: string | number;
}

interface CbseSummary {
  totalMarks?: string | number;
  percentage?: string | number;
  grade?: string;
  rank?: string | number;
}

interface CbseExamRecord {
  examName?: string;
  columns?: CbseColumn[];
  subjects?: CbseSubject[];
  summary?: CbseSummary;
}

// ─── CBSE Exam Tab Component ──────────────────────────────────────────────────
function CbseExamTab() {
  const { t } = useTranslation();
  const [cbseExams, setCbseExams] = useState<CbseExamRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCbse = async () => {
      try {
        setLoading(true);
        const res = await api.get('/user/cbse-exam-result');
        const list = res.data?.data || res.data;
        if (isMounted && Array.isArray(list)) {
          setCbseExams(list);
        }
      } catch (err) {
        console.error("Error fetching cbse exam results:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCbse();
    return () => { isMounted = false; };
  }, []);

  const handleCopy = () => {
    let text = "";
    cbseExams.forEach(exam => {
      text += (exam.examName || "CBSE Exam") + "\n";
      const cols = exam.columns || [];
      text += `Subject\t${cols.map((c: CbseColumn) => c.name).join('\t')}\tTotal\n`;
      (exam.subjects || []).forEach((s: CbseSubject) => {
        text += `${s.name}\t${(s.scores || []).join('\t')}\t${s.total}\n`;
      });
      if (exam.summary) {
        text += `Total Marks: ${exam.summary.totalMarks}\tPercentage: ${exam.summary.percentage}%\tGrade: ${exam.summary.grade}\tRank: ${exam.summary.rank}\n\n`;
      }
    });
    navigator.clipboard.writeText(text);
    toast.success(t("copied_to_clipboard"));
  };

  const handleExportExcel = () => {
    let csv = "";
    cbseExams.forEach(exam => {
      csv += `"${exam.examName || "CBSE Exam"}"\n`;
      const cols = exam.columns || [];
      csv += `"Subject",${cols.map((c: CbseColumn) => `"${c.name}"`).join(',')},"Total"\n`;
      (exam.subjects || []).forEach((s: CbseSubject) => {
        csv += `"${s.name}",${(s.scores || []).map((sc: string | number) => `"${sc}"`).join(',')},"${s.total}"\n`;
      });
      if (exam.summary) {
        csv += `"Total Marks: ${exam.summary.totalMarks}","Percentage: ${exam.summary.percentage}%","Grade: ${exam.summary.grade}","Rank: ${exam.summary.rank}"\n\n`;
      }
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cbse_exam_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(t("exported_to_excel"));
  };

  const handleExportPdf = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <TabPanel>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl mb-4">
        <h2 className="text-sm font-bold text-gray-800">{t("cbse_examinations")}</h2>
        <ExportToolbar onCopy={handleCopy} onExcel={handleExportExcel} onPdf={handleExportPdf} onPrint={handlePrint} />
      </div>

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : cbseExams.length === 0 ? (
        <PanelCard title={t("cbse_examinations")}>
          <div className="py-8 text-center text-gray-400">
            <p className="text-sm">{t("no_cbse_records") || "No CBSE examination records found"}</p>
          </div>
        </PanelCard>
      ) : (
        cbseExams.map((exam, i) => {
          const cols: CbseColumn[] = exam.columns || [{ name: "Marks" }];
          return (
            <PanelCard key={i} title={exam.examName || "CBSE Examination"} bodyClassName="p-0">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-[13px] text-center border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80 text-[#333]">
                      <th className="px-4 py-3 font-bold min-w-[150px] text-left border-r border-gray-100">{t("subject")}</th>
                      {cols.map((col, cIdx) => (
                        <th key={cIdx} className="px-4 py-2 font-bold min-w-[120px] border-r border-gray-100">
                          <div>{col.name}</div>
                          {col.max && <div className="text-[11px] font-normal text-gray-500">(Max {col.max})</div>}
                        </th>
                      ))}
                      <th className="px-4 py-3 font-bold min-w-[80px]">{t("total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(exam.subjects || []).map((subj: CbseSubject, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 text-[#555] hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-2.5 text-left border-r border-gray-100 font-medium">{subj.name}</td>
                        {cols.map((_, cIdx) => (
                          <td key={cIdx} className="px-4 py-2.5 border-r border-gray-100">
                            {subj.scores && subj.scores[cIdx] !== undefined ? subj.scores[cIdx] : (subj.theory || "N/A")}
                          </td>
                        ))}
                        <td className="px-4 py-2.5 font-bold text-[#333]">{subj.total}</td>
                      </tr>
                    ))}
                  </tbody>
                  {exam.summary && (
                    <tfoot>
                      <tr className="bg-gray-50/80 font-bold text-[#333] text-[12px] border-t border-gray-200">
                        <td className="px-4 py-2.5 text-left border-r border-gray-100">{t("total")} : {exam.summary.totalMarks}</td>
                        <td colSpan={Math.max(1, cols.length - 2)} className="px-4 py-2.5 text-left border-r border-gray-100">{t("percentage")} : {exam.summary.percentage}%</td>
                        <td className="px-4 py-2.5 text-left border-r border-gray-100">{t("grade")} : <span className="text-indigo-600">{exam.summary.grade}</span></td>
                        <td className="px-4 py-2.5 text-left">{t("rank")} : {exam.summary.rank}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {(exam.subjects || []).map((subj: CbseSubject, idx: number) => (
                  <div key={idx} className="p-3.5">
                    <p className="text-[13px] font-semibold text-gray-800 mb-1.5">{subj.name}</p>
                    <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-1">
                      {cols.map((col, cIdx) => (
                        <MiniField
                          key={cIdx}
                          label={col.name}
                          value={subj.scores && subj.scores[cIdx] !== undefined ? subj.scores[cIdx] : "N/A"}
                        />
                      ))}
                      <MiniField label={t("total")} value={subj.total} className="font-bold text-gray-900" />
                    </div>
                  </div>
                ))}
                {/* Mobile summary */}
                {exam.summary && (
                  <div className="p-3.5 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="text-[12px] font-bold text-gray-700 grid grid-cols-2 gap-x-4 gap-y-1">
                      <span>{t("total")}: {exam.summary.totalMarks}</span>
                      <span>{t("percentage")}: {exam.summary.percentage}%</span>
                      <span>{t("grade")}: <span className="text-indigo-600">{exam.summary.grade}</span></span>
                      <span>{t("rank")}: {exam.summary.rank}</span>
                    </div>
                  </div>
                )}
              </div>
            </PanelCard>
          );
        })
      )}
    </TabPanel>
  );
}

// ─── Attendance Types ─────────────────────────────────────────────────────────
interface AttendanceDay {
  [month: string]: string;
}

const attendanceMonths = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];

const getAttendanceColor = (status: string) => {
  switch (status) {
    case 'P': return 'text-green-600 font-bold';
    case 'A': return 'text-red-500 font-bold';
    case 'L': return 'text-yellow-600 font-bold';
    case 'F': return 'text-sky-500 font-bold';
    case 'H': return 'text-purple-600 font-bold';
    default: return 'text-[#555] font-bold';
  }
};

// ─── Attendance Tab Component ──────────────────────────────────────────────────
function AttendanceTab({ studentId }: { studentId?: number }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_present: 0,
    total_late: 0,
    total_absent: 0,
    total_half_day: 0,
    total_holiday: 0,
  });
  const [attendanceRows, setAttendanceRows] = useState<AttendanceDay[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchRealAttendance = async () => {
      setLoading(true);
      try {
        const response = await api.get("/user/attendance", {
          params: studentId ? { student_id: studentId } : {},
        });
        const payload = response.data?.data || response.data;
        if (isMounted && payload) {
          if (payload.summary) {
            setSummary({
              total_present: payload.summary.total_present || 0,
              total_late: payload.summary.total_late || 0,
              total_absent: payload.summary.total_absent || 0,
              total_half_day: payload.summary.total_half_day || 0,
              total_holiday: payload.summary.total_holiday || 0,
            });
          }
          if (Array.isArray(payload.records) && payload.records.length > 0) {
            setAttendanceRows(payload.records);
          } else {
            // Generate empty 31 rows
            const emptyRows = Array.from({ length: 31 }, () => {
              const row: AttendanceDay = {};
              attendanceMonths.forEach(m => { row[m] = ''; });
              return row;
            });
            setAttendanceRows(emptyRows);
          }
        }
      } catch (error) {
        console.error("Failed to fetch real student attendance data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRealAttendance();
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  const handleCopy = () => {
    let text = "Date | Month\t" + attendanceMonths.join("\t") + "\n";
    attendanceRows.forEach((row, i) => {
      text += `${i + 1}\t` + attendanceMonths.map(m => row[m] || "").join("\t") + "\n";
    });
    navigator.clipboard.writeText(text);
    toast.success(t("copied_to_clipboard"));
  };

  const handleExportExcel = () => {
    let csv = `"Date | Month",` + attendanceMonths.map(m => `"${m}"`).join(",") + "\n";
    attendanceRows.forEach((row, i) => {
      csv += `"${i + 1}",` + attendanceMonths.map(m => `"${row[m] || ""}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success(t("exported_to_csv"));
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <TabPanel>
        <div className="py-16 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm">{t("loading")}</p>
        </div>
      </TabPanel>
    );
  }

  return (
    <TabPanel>
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { title: t("total_present"), value: String(summary.total_present), color: "from-green-500 to-emerald-400", icon: "P", textColor: "text-green-700 dark:text-green-400" },
          { title: t("total_late"), value: String(summary.total_late), color: "from-yellow-400 to-orange-400", icon: "L", textColor: "text-yellow-700 dark:text-yellow-400" },
          { title: t("total_absent"), value: String(summary.total_absent), color: "from-red-500 to-rose-400", icon: "A", textColor: "text-red-700 dark:text-red-400" },
          { title: t("total_half_day"), value: String(summary.total_half_day), color: "from-sky-400 to-blue-500", icon: "F", textColor: "text-sky-700 dark:text-sky-400" },
          { title: t("total_holiday"), value: String(summary.total_holiday), color: "from-purple-400 to-indigo-500", icon: "H", textColor: "text-purple-700 dark:text-purple-400" },
        ].map((card, i) => (
          <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className={`h-1.5 w-full bg-gradient-to-r ${card.color}`} />
            <div className="px-3 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 leading-none">{card.title}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
              <span className={`text-2xl font-black opacity-15 ${card.textColor}`}>{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <PanelCard
        title={t("attendance_record")}
        right={
          <div className="flex flex-col items-end gap-1">
            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-2">
              <span className="text-green-600 dark:text-green-400">P={t("present")}</span>
              <span className="text-gray-500 dark:text-gray-400">E={t("late_with_excuse")}</span>
              <span className="text-yellow-500 dark:text-yellow-400">L={t("late")}</span>
              <span className="text-red-500 dark:text-red-400">A={t("absent")}</span>
              <span className="text-purple-500 dark:text-purple-400">H={t("holiday")}</span>
              <span className="text-sky-500 dark:text-sky-400">F={t("half_day")}</span>
            </div>
          </div>
        }
        bodyClassName="p-0"
      >
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder={t("search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 w-full text-[13px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-foreground rounded-lg focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <ExportToolbar onCopy={handleCopy} onExcel={handleExportExcel} onPrint={handlePrint} />
          </div>
        </div>

        {/* Wide table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] text-center border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-slate-800/80 text-foreground">
                <th className="px-3 py-2.5 font-bold min-w-[90px] border-r border-gray-100 dark:border-gray-800 whitespace-nowrap sticky left-0 bg-gray-50 dark:bg-slate-800 z-10">
                  {t("date")} <ArrowUpDown className="inline h-3 w-3 opacity-30 ml-1" />
                </th>
                {attendanceMonths.map(m => (
                  <th key={m} className="px-2 py-2.5 font-bold min-w-[70px] border-r border-gray-100 dark:border-gray-800 whitespace-nowrap">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition-colors text-foreground">
                  <td className="px-3 py-2 border-r border-gray-100 dark:border-gray-800 font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-white dark:bg-slate-900">{i + 1}</td>
                  {attendanceMonths.map(m => (
                    <td key={m} className={`px-2 py-2 border-r border-gray-100 dark:border-gray-800 ${getAttendanceColor(row[m])}`}>
                      {row[m] || ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <span>{t("showing")} 1 {t("to")} {attendanceRows.length} {t("of")} {attendanceRows.length} {t("entries")}</span>
          <div className="flex gap-1 items-center">
            <button className="h-7 w-7 bg-white dark:bg-slate-900 text-gray-400 rounded-[10px] border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-40" disabled>&lt;</button>
            <button className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-[10px] flex items-center justify-center font-bold rounded-[10px] shadow-sm">1</button>
            <button className="h-7 w-7 bg-white dark:bg-slate-900 text-gray-400 rounded-[10px] border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-40" disabled>&gt;</button>
          </div>
        </div>
      </PanelCard>
    </TabPanel>
  );
}

interface DocumentRecord {
  id?: string | number;
  title?: string;
  fileName?: string;
  fileUrl?: string;
}

// ─── Documents Tab Component ──────────────────────────────────────────────────
function DocumentsTab({ documents = [] }: { documents?: DocumentRecord[] }) {
  const { t } = useTranslation();
  const handleDownload = (doc: DocumentRecord) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    } else {
      toast.success(`${t("downloading")} ${doc.fileName || doc.title}`);
    }
  };

  return (
    <TabPanel>
      <PanelCard
        title={t("documents")}
        subtitle={t("upload_manage_documents")}
        right={
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all whitespace-nowrap">
              <Upload className="h-3.5 w-3.5" /> {t("upload")}
            </button>
          </div>
        }
        bodyClassName="p-0"
      >
        {documents.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[#333]">
                    <th className="px-4 py-3 text-left font-bold min-w-[120px] border-r border-gray-100">#</th>
                    <th className="px-4 py-3 text-left font-bold border-r border-gray-100">{t("title")}</th>
                    <th className="px-4 py-3 text-left font-bold border-r border-gray-100">{t("file_name")}</th>
                    <th className="px-4 py-3 text-right font-bold w-[90px]">{t("action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc: DocumentRecord, index: number) => (
                    <tr key={doc.id || index} className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors text-[#555]">
                      <td className="px-4 py-3 border-r border-gray-100 text-gray-400 font-medium">{index + 1}</td>
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
                          title={t("download")}
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
              {documents.map((doc: DocumentRecord, index: number) => (
                <div key={doc.id || index} className="p-3.5 flex items-center justify-between gap-3">
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
          </>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t("no_documents_uploaded")}</p>
          </div>
        )}
      </PanelCard>
    </TabPanel>
  );
}

interface TimelineRecord {
  id?: string | number;
  title?: string;
  date?: string;
  description?: string;
}

// ─── Timeline Tab Component ───────────────────────────────────────────────────
function TimelineTab({ timeline = [] }: { timeline?: TimelineRecord[] }) {
  const { t } = useTranslation();

  return (
    <TabPanel>
      <PanelCard title={t("student_timeline")} subtitle={t("activity_log_announcements")}>
        {timeline.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Clock className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t("no_timeline_entries")}</p>
          </div>
        ) : (
          <div className="p-6 sm:p-8 pl-8 sm:pl-10">
            {timeline.map((entry: TimelineRecord, index: number) => {
              const isLast = index === timeline.length - 1;
              return (
                <div key={entry.id || index} className="relative pl-12 sm:pl-14 pb-8">
                  {/* Vertical line segment */}
                  <div
                    className={cn(
                      "absolute left-[15px] top-4 w-[2px] bg-gradient-to-b from-[#FF9800] to-[#6366F1] rounded-full z-0",
                      isLast ? "h-12" : "bottom-0"
                    )}
                  />

                  {/* Circular File Icon overlaying directly on top of vertical line */}
                  <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center shadow-md z-10">
                    <Newspaper className="h-4 w-4 text-white" />
                  </div>

                  {/* Horizontal connector line */}
                  <div className="absolute left-[16px] top-4 w-7 h-[2px] bg-gradient-to-r from-[#FF9800] to-[#6366F1]/50 z-0" />

                  {/* Date badge */}
                  <div className="mb-2.5 flex items-center">
                    <span className="inline-block bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                      {entry.date}
                    </span>
                  </div>

                  {/* History Content Card */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="px-4 py-3 border-l-4 border-[#6366F1]">
                      <p className="text-[13px] text-[#0dcaf0] font-semibold">{entry.title}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* End marker */}
            <div className="relative pl-12 sm:pl-14">
              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#FF9800] flex items-center justify-center shadow-md z-10">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        )}
      </PanelCard>
    </TabPanel>
  );
}

// ─── Student Behaviour Types ──────────────────────────────────────────────────
interface BehaviourEntry {
  id: number;
  title: string;
  point: number;
  date: string;
  description: string;
  assignBy: string;
}

// ─── Student Behaviour Tab Component ──────────────────────────────────────────
function StudentBehaviourTab() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [behaviourList, setBehaviourList] = useState<BehaviourEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBehaviour = async () => {
      try {
        setLoading(true);
        const res = await api.get('/user/behaviour');
        const d = res.data?.data || res.data;
        if (isMounted && d) {
          if (Array.isArray(d.incidents)) {
            setBehaviourList(d.incidents.map((b: Record<string, unknown>) => ({
              id: Number(b.id || 0),
              title: String(b.title || 'Incident'),
              point: Number(b.point || 0),
              date: b.incident_date ? new Date(String(b.incident_date)).toLocaleDateString('en-US') : '',
              description: String(b.description || ''),
              assignBy: String(b.assigned_by || ''),
            })));
          }
        }
      } catch (err) {
        console.error("Error fetching student behaviour:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchBehaviour();
    return () => { isMounted = false; };
  }, []);

  const handleCopy = () => {
    let text = "Title\tPoint\tDate\tDescription\tAssign By\n";
    behaviourList.forEach(b => {
      text += `${b.title}\t${b.point}\t${b.date}\t${b.description}\t${b.assignBy}\n`;
    });
    navigator.clipboard.writeText(text);
    toast.success(t("copied_to_clipboard"));
  };

  const handleExportExcel = () => {
    let csv = "Title,Point,Date,Description,Assign By\n";
    behaviourList.forEach(b => {
      csv += `"${b.title}",${b.point},"${b.date}","${b.description}","${b.assignBy}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_behaviour_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success(t("exported_to_csv"));
  };

  const handlePrint = () => window.print();

  const filtered = behaviourList.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <TabPanel>
        <div className="py-16 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm">{t("loading")}</p>
        </div>
      </TabPanel>
    );
  }

  return (
    <TabPanel>
      <PanelCard
        title={t("student_behaviour")}
        subtitle={t("behaviour_points_conduct_records")}
        right={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder={t("search")}
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
                <th className="px-4 py-3 text-left font-bold min-w-[130px] border-r border-gray-100 whitespace-nowrap">{t("title")} <ArrowUpDown className="inline h-3 w-3 opacity-30 ml-1" /></th>
                <th className="px-4 py-3 text-center font-bold w-[80px] border-r border-gray-100">{t("points")}</th>
                <th className="px-4 py-3 text-left font-bold w-[110px] border-r border-gray-100">{t("date")}</th>
                <th className="px-4 py-3 text-left font-bold border-r border-gray-100">{t("description")}</th>
                <th className="px-4 py-3 text-center font-bold w-[90px] border-r border-gray-100">{t("assigned_by")}</th>
                <th className="px-4 py-3 text-center font-bold w-[70px]">{t("action")}</th>
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
                      <button className="inline-flex items-center justify-center h-7 w-7 bg-gradient-to-br from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white rounded-full shadow-sm transition-all active:scale-95" title={t("view")}>
                        <PlayCircle className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">{t("no_records")}</td></tr>
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
            <div className="py-10 text-center text-gray-400 text-sm">{t("no_records")}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[11px] text-gray-500 px-4 py-3 border-t border-gray-100">
          <span>{t("showing")} 1 {t("to")} {filtered.length} {t("of")} {filtered.length} {t("entries")}</span>
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

const ALL_PROFILE_TABS: TabId[] = ["Profile", "Fees", "Exam", "CBSE Examination", "Attendance", "Documents", "Timeline", "Student Behaviour"];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserProfilePage() {
  const { t } = useTranslation();
  const [data, setData] = useState<typeof mockUserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("Profile");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [fetchingPermissions, setFetchingPermissions] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [response, profilePerms] = await Promise.allSettled([
          api.get('/user/profile'),
          api.get('/profile'),
        ]);

        if (response.status === "fulfilled" && response.value.data && response.value.data.success) {
          setData(response.value.data.data);
        } else {
          setData(mockUserProfileData);
        }

        if (profilePerms.status === "fulfilled") {
          setPermissions(profilePerms.value.data?.data?.permissions || []);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setData(mockUserProfileData);
      } finally {
        setLoading(false);
        setFetchingPermissions(false);
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

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const TABS = useMemo(() => {
    if (fetchingPermissions) return ALL_PROFILE_TABS;
    return ALL_PROFILE_TABS.filter((tab) => {
      if (tab === "CBSE Examination") {
        return isPortalMenuVisible("cbse_examination", permissionSet);
      }
      if (tab === "Fees") {
        return isPortalMenuVisible("fees", permissionSet);
      }
      if (tab === "Exam") {
        return isPortalMenuVisible("examinations", permissionSet);
      }
      if (tab === "Attendance") {
        return isPortalMenuVisible("attendance", permissionSet);
      }
      if (tab === "Student Behaviour") {
        return isPortalMenuVisible("behaviour", permissionSet);
      }
      return true;
    });
  }, [permissionSet, fetchingPermissions]);

  useEffect(() => {
    if (!fetchingPermissions && !TABS.includes(activeTab)) {
      setActiveTab("Profile");
    }
  }, [TABS, activeTab, fetchingPermissions]);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const mock = mockUserProfileData;
  const merged = data
    ? {
      basic: { ...mock.basic, ...data.basic },
      profileTab: {
        basicDetails: { ...mock.profileTab.basicDetails, ...data.profileTab?.basicDetails },
        addressDetails: { ...mock.profileTab.addressDetails, ...data.profileTab?.addressDetails },
        parentGuardianDetails: data.profileTab?.parentGuardianDetails ?? mock.profileTab.parentGuardianDetails,
        transportDetails: { ...mock.profileTab.transportDetails, ...data.profileTab?.transportDetails },
        hostelDetails: { ...mock.profileTab.hostelDetails, ...data.profileTab?.hostelDetails },
        miscellaneousDetails: { ...mock.profileTab.miscellaneousDetails, ...data.profileTab?.miscellaneousDetails },
        previousAcademicRecord: (data.profileTab?.previousAcademicRecord as { id: number; title: string; year: string; result: string }[]) ?? mock.profileTab.previousAcademicRecord,
      },
    }
    : mock;
  const { basic, profileTab } = merged;
  const customFields: { id: number; name: string; type: string; value: string }[] = data?.customFields || [];

  const tabLabels: Record<TabId, string> = {
    "Profile": "profile",
    "Fees": "fees",
    "Exam": "exam",
    "CBSE Examination": "cbse_examination",
    "Attendance": "attendance",
    "Documents": "documents",
    "Timeline": "timeline",
    "Student Behaviour": "student_behaviour",
  };

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
      {t(tabLabels[tab])}
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

  interface GuardianRowProps {
    titleKey: string;
    name?: string;
    phone?: string;
    occupation?: string;
    address?: string;
    email?: string;
    relation?: string;
    image?: string | null;
  }

  const GuardianRow = ({ titleKey, name, phone, occupation, address, email, relation, image }: GuardianRowProps) => {
    const tt = t(titleKey);
    return (
      <div className="flex border-b border-gray-100 last:border-0 py-3 relative">
        <div className="flex-1 pr-24">
          <div className="flex mb-1">
            <div className="w-[30%] sm:w-[25%] font-medium text-gray-600 text-[13px]">{tt} {t("name")}</div>
            <div className="w-[70%] sm:w-[75%] text-[13px] text-gray-800">{name || "-"}</div>
          </div>
          {email !== undefined && (
            <div className="flex mb-1">
              <div className="w-[30%] sm:w-[25%] font-medium text-gray-600 text-[13px]">{tt} {t("email")}</div>
              <div className="w-[70%] sm:w-[75%] text-[13px] text-gray-800">{email || "-"}</div>
            </div>
          )}
          {relation !== undefined && (
            <div className="flex mb-1">
              <div className="w-[30%] sm:w-[25%] font-medium text-gray-600 text-[13px]">{tt} {t("relation")}</div>
              <div className="w-[70%] sm:w-[75%] text-[13px] text-gray-800">{relation || "-"}</div>
            </div>
          )}
          <div className="flex mb-1">
            <div className="w-[30%] sm:w-[25%] font-medium text-gray-600 text-[13px]">{tt} {t("phone")}</div>
            <div className="w-[70%] sm:w-[75%] text-[13px] text-gray-800">{phone || "-"}</div>
          </div>
          <div className="flex mb-1">
            <div className="w-[30%] sm:w-[25%] font-medium text-gray-600 text-[13px]">{tt} {t("occupation")}</div>
            <div className="w-[70%] sm:w-[75%] text-[13px] text-gray-800">{occupation || "-"}</div>
          </div>
          {address !== undefined && (
            <div className="flex">
              <div className="w-[30%] sm:w-[25%] font-medium text-gray-600 text-[13px]">{tt} {t("address")}</div>
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
              <span className="text-[8px] uppercase font-bold text-center leading-none">{t("no_image")}<br />{t("available")}</span>
            </>
          )}
        </div>
      </div>
    );
  };

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
                <span>{t("adm")}: <span className="text-indigo-500 font-medium">{basic.admissionNo}</span></span>
                <span>{t("roll")}: <span className="text-indigo-500 font-medium">{basic.rollNumber}</span></span>
              </div>
            </div>
          </div>

          <div className="p-0">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">{t("class")}</span>
              <span className="text-sm text-sky-500 font-medium">{basic.class}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">{t("section")}</span>
              <span className="text-sm text-sky-500 font-medium">{basic.section}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">{t("gender")}</span>
              <span className="text-sm text-sky-500 font-medium">{basic.gender}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">{t("rte")}</span>
              <span className="text-sm text-sky-500 font-medium">{basic.rte}</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">{t("barcode")}</span>
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
              <span className="text-sm font-semibold text-gray-700">{t("qr_code")}</span>
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
              <span className="text-sm font-semibold text-gray-700">{t("behaviour_score")}</span>
              <span className="text-sm text-sky-500 font-medium">{basic.behaviourScore}</span>
            </div>
            <div className="p-4">
              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-sm font-semibold px-4 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity active:scale-[0.98]">
                <Download className="h-4 w-4" /> {t("download_resume")}
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
                <h3 className="text-sm font-bold text-gray-800">{t("basic_details")}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
                <InfoTile icon={Calendar} label={t("admission_date")} value={profileTab.basicDetails.admissionDate} />
                <InfoTile icon={Cake} label={t("date_of_birth")} value={profileTab.basicDetails.dateOfBirth} />
                <InfoTile icon={Tag} label={t("category")} value={profileTab.basicDetails.category} />
                <InfoTile icon={Phone} label={t("mobile_number")} value={profileTab.basicDetails.mobileNumber} />
                <InfoTile icon={Users} label={t("caste")} value={profileTab.basicDetails.caste} />
                <InfoTile icon={BookOpen} label={t("religion")} value={profileTab.basicDetails.religion} />
                <InfoTile icon={Mail} label={t("email")} value={profileTab.basicDetails.email} />
                <InfoTile icon={StickyNote} label={t("note")} value={profileTab.basicDetails.note} />
                <InfoTile icon={AtSign} label={t("username")} value={profileTab.basicDetails.username} />
                <InfoTile icon={KeyRound} label={t("parent_username")} value={profileTab.basicDetails.parentUsername} />
                <InfoTile icon={MapPin} label={t("birth_place")} value={profileTab.basicDetails.birthPlace} />
                <InfoTile icon={MapPinned} label={t("state")} value={profileTab.basicDetails.state} />
                <InfoTile icon={Globe} label={t("nationality")} value={profileTab.basicDetails.nationality} />
                <InfoTile icon={Languages} label={t("mother_tongue")} value={profileTab.basicDetails.motherTongue} />
                <InfoTile icon={Languages} label={t("second_language")} value={profileTab.basicDetails.secondLanguage} />
              </div>

              {/* Address Details */}
              <SectionHeader title={t("address_details")} />
              <div className="px-4">
                <DetailRow label={t("current_address")} value={profileTab.addressDetails.currentAddress} />
                <DetailRow label={t("permanent_address")} value={profileTab.addressDetails.permanentAddress} />
                <DetailRow label={t("postal_code")} value={profileTab.addressDetails.postalCode} />
              </div>

              {/* Parent Guardian Detail */}
              <SectionHeader title={t("parent_guardian_detail")} />
              <div className="px-4">
                <GuardianRow titleKey="father" {...profileTab.parentGuardianDetails.father} />
                <GuardianRow titleKey="mother" {...profileTab.parentGuardianDetails.mother} />
                <GuardianRow titleKey="guardian" {...profileTab.parentGuardianDetails.guardian} />
              </div>

              {/* Transport Details */}
              <SectionHeader title={t("transport_details")} />
              <div className="px-4">
                <DetailRow label={t("pickup_point")} value={profileTab.transportDetails.pickupPoint} />
                <DetailRow label={t("route")} value={profileTab.transportDetails.route} />
                <DetailRow label={t("vehicle_number")} value={profileTab.transportDetails.vehicleNumber} />
                <DetailRow label={t("driver_name")} value={profileTab.transportDetails.driverName} />
                <DetailRow label={t("driver_contact")} value={profileTab.transportDetails.driverContact} />
              </div>

              {/* Hostel Details */}
              <SectionHeader title={t("hostel_details")} />
              <div className="px-4">
                <DetailRow label={t("hostel")} value={profileTab.hostelDetails.hostel} />
                <DetailRow label={t("room_no")} value={profileTab.hostelDetails.roomNo} />
                <DetailRow label={t("room_type")} value={profileTab.hostelDetails.roomType} />
              </div>

              {/* Miscellaneous Details */}
              <SectionHeader title={t("miscellaneous_details")} />
              <div className="px-4 mb-4">
                <DetailRow label={t("medical_history")} value={profileTab.miscellaneousDetails.medicalHistory} />
                <DetailRow label={t("blood_group")} value={profileTab.miscellaneousDetails.bloodGroup} />
                <DetailRow label={t("house")} value={profileTab.miscellaneousDetails.house} />
                <DetailRow label={t("height")} value={profileTab.miscellaneousDetails.height} />
                <DetailRow label={t("weight")} value={profileTab.miscellaneousDetails.weight} />
                <DetailRow label={t("measurement_date")} value={profileTab.miscellaneousDetails.measurementDate} />

                <DetailRow label={t("national_identification_number")} value={profileTab.miscellaneousDetails.nationalIdentificationNumber} />

                <DetailRow label={t("bank_account_number")} value={profileTab.miscellaneousDetails.bankAccountNumber} />
                <DetailRow label={t("bank_name")} value={profileTab.miscellaneousDetails.bankName} />
                <DetailRow label={t("ifsc_code")} value={profileTab.miscellaneousDetails.ifscCode} />
                <DetailRow label={t("identification_marks")} value={profileTab.miscellaneousDetails.identificationMarks} />
                <DetailRow label={t("appraisal_achievements")} value={profileTab.miscellaneousDetails.appraisalAchievements} />
                <DetailRow label={t("general_behaviour")} value={profileTab.miscellaneousDetails.generalBehaviour} />
              </div>

              {/* Previous Academic Record */}
              {profileTab.previousAcademicRecord && profileTab.previousAcademicRecord.length > 0 && (
                <>
                  <SectionHeader title={t("previous_academic_record")} />
                  <div className="px-4 mb-4">
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10 border-b border-gray-200">
                            <th className="px-4 py-2.5 text-left font-bold text-gray-700 whitespace-nowrap">
                              <span className="flex items-center gap-1.5"><School className="h-3.5 w-3.5 text-indigo-400" />{t("school_name")}</span>
                            </th>
                            <th className="px-4 py-2.5 text-left font-bold text-gray-700">
                              <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-indigo-400" />{t("class")}</span>
                            </th>
                            <th className="px-4 py-2.5 text-left font-bold text-gray-700">
                              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-indigo-400" />{t("year")}</span>
                            </th>
                            <th className="px-4 py-2.5 text-left font-bold text-gray-700">
                              <span className="flex items-center gap-1.5"><Percent className="h-3.5 w-3.5 text-indigo-400" />{t("percentage")}</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(profileTab.previousAcademicRecord || []).map((rec: { schoolName?: string; class?: string; year?: string; percentage?: string | number }, idx: number) => (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-indigo-50/30 transition-colors">
                              <td className="px-4 py-2.5 font-medium text-gray-800">{rec.schoolName || "-"}</td>
                              <td className="px-4 py-2.5 text-gray-600">{rec.class || "-"}</td>
                              <td className="px-4 py-2.5 text-gray-600">{rec.year || "-"}</td>
                              <td className="px-4 py-2.5">
                                <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full text-[12px]">
                                  <Star className="h-3 w-3" />{rec.percentage || "-"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile cards */}
                    <div className="sm:hidden space-y-3">
                      {(profileTab.previousAcademicRecord || []).map((rec: { schoolName?: string; class?: string; year?: string; percentage?: string | number }, idx: number) => (
                        <div key={idx} className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#4f52d4] text-white">
                              <School className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-gray-800 text-[13px]">{rec.schoolName || "-"}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">{t("class")}</p>
                              <p className="text-[12px] font-semibold text-gray-800">{rec.class || "-"}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">{t("year")}</p>
                              <p className="text-[12px] font-semibold text-gray-800">{rec.year || "-"}</p>
                            </div>
                            <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-2 py-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-400 mb-0.5">{t("percentage")}</p>
                              <p className="text-[12px] font-semibold text-indigo-600">{rec.percentage || "-"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Custom Fields (configured in System Setting → Custom Fields) */}
              {customFields.length > 0 && (
                <>
                  <SectionHeader title={t("custom_fields")} />
                  <div className="px-4 mb-4">
                    {customFields.map((field) => (
                      <DetailRow key={field.id} label={field.name} value={field.value} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Fees Tab ── */}
          {activeTab === "Fees" && <FeesTab />}

          {/* ── Exam Tab ── */}
          {activeTab === "Exam" && <ExamTab />}

          {/* ── CBSE Exam Tab ── */}
          {activeTab === "CBSE Examination" && <CbseExamTab />}

          {/* ── Attendance Tab ── */}
          {activeTab === "Attendance" && <AttendanceTab studentId={data?.id || data?.basic?.id} />}

          {/* ── Documents Tab ── */}
          {activeTab === "Documents" && <DocumentsTab documents={data?.documents} />}

          {/* ── Timeline Tab ── */}
          {activeTab === "Timeline" && <TimelineTab timeline={data?.timeline} />}

          {/* ── Student Behaviour Tab ── */}
          {activeTab === "Student Behaviour" && <StudentBehaviourTab />}
        </CardContent>
      </Card>
    </div>
  );
}
