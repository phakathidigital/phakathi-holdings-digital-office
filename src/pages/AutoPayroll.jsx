import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Calculator, Download, Send, TrendingUp, TrendingDown, AlertCircle,
  CheckCircle, Clock, Users, Receipt, CalendarCheck, ChevronDown, ChevronUp, Info
} from "lucide-react";
import { format, parseISO } from "date-fns";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Policy config — these would typically come from HR settings
const POLICY = {
  meetingAttendanceBonus: 250,       // R per meeting attended beyond 5
  meetingAbsencePenalty: 150,        // R deducted per missed mandatory meeting (flagged)
  expenseReimbursementCap: 15000,    // Max reimbursable per employee per month
  overtimeBonusThreshold: 40,        // Hours/month before bonus kicks in
  overtimeRate: 1.5,                 // 1.5x rate
  unpaidLeaveDeductionPerDay: 800,   // R per unpaid leave day
};

function fmt(n) {
  const num = Number(n) || 0;
  return `R${Math.abs(num).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
}

function AdjustmentRow({ label, value, type, note }) {
  const isPositive = type === "bonus" || type === "reimbursement";
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
      </div>
      <span className={`text-sm font-semibold ml-4 shrink-0 ${isPositive ? "text-green-600" : "text-red-500"}`}>
        {isPositive ? "+" : "-"}{fmt(value)}
      </span>
    </div>
  );
}

function EmployeePayrollCard({ row, onSelect, selected }) {
  const netDiff = row.totalAdjustment;
  const isPositive = netDiff >= 0;

  return (
    <Card className={`border-none shadow-sm cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-gray-900" : ""}`}
      onClick={() => onSelect(row)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(row.employee_name || row.employee_email || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{row.employee_name || row.employee_email}</p>
              <p className="text-xs text-gray-400">{row.department} · {row.subsidiary || "Phakathi Holdings"}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
              {isPositive ? "+" : ""}{fmt(netDiff)}
            </p>
            <p className="text-xs text-gray-400">net adjustment</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {row.expenseReimbursement > 0 && <Badge className="bg-blue-50 text-blue-700 border-0 text-xs">Expense: +{fmt(row.expenseReimbursement)}</Badge>}
          {row.meetingBonus > 0 && <Badge className="bg-green-50 text-green-700 border-0 text-xs">Attendance: +{fmt(row.meetingBonus)}</Badge>}
          {row.unpaidLeaveDeduction > 0 && <Badge className="bg-red-50 text-red-700 border-0 text-xs">Leave: -{fmt(row.unpaidLeaveDeduction)}</Badge>}
          {row.cappedExpense && <Badge className="bg-orange-50 text-orange-700 border-0 text-xs">⚠ Cap applied</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailPanel({ row, onClose }) {
  if (!row) return null;
  return (
    <Card className="border-none shadow-md sticky top-4">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Adjustment Breakdown</CardTitle>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xs">✕ close</button>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-base font-bold text-gray-900 mb-2">{row.employee_name}</p>

        <div className="p-3 bg-gray-50 rounded-xl mb-3 space-y-1">
          <div className="flex justify-between text-xs text-gray-500"><span>Base salary</span><span className="font-medium text-gray-700">{row.baseSalary ? fmt(row.baseSalary) : "Not set"}</span></div>
          <div className="flex justify-between text-xs text-gray-500"><span>Approved expenses</span><span className="text-blue-700 font-medium">{fmt(row.rawExpenses)}</span></div>
          {row.cappedExpense && <div className="flex justify-between text-xs text-orange-600"><span>⚠ Cap limit ({fmt(POLICY.expenseReimbursementCap)})</span><span>Applied</span></div>}
          <div className="flex justify-between text-xs text-gray-500"><span>Meeting attendance bonus</span><span className="text-green-700 font-medium">{fmt(row.meetingBonus)}</span></div>
          <div className="flex justify-between text-xs text-gray-500"><span>Unpaid leave deductions</span><span className="text-red-600 font-medium">-{fmt(row.unpaidLeaveDeduction)}</span></div>
        </div>

        {row.adjustments?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Line Items</p>
            {row.adjustments.map((a, i) => <AdjustmentRow key={i} {...a} />)}
          </div>
        )}

        <div className="mt-4 p-3 rounded-xl border-2 border-gray-900">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">Net Adjustment</span>
            <span className={`text-lg font-bold ${row.totalAdjustment >= 0 ? "text-green-600" : "text-red-600"}`}>
              {row.totalAdjustment >= 0 ? "+" : ""}{fmt(row.totalAdjustment)}
            </span>
          </div>
          {row.baseSalary > 0 && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">Adjusted total</span>
              <span className="text-sm font-semibold text-gray-700">{fmt(row.baseSalary + row.totalAdjustment)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AutoPayroll() {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentMonthIdx]);
  const [selectedYear] = useState(currentYear);
  const [selectedRow, setSelectedRow] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isAdmin = user?.role === "admin";

  const { data: expenses = [] } = useQuery({ queryKey: ["expenses-payroll"], queryFn: () => base44.entities.Expense.list("-created_date", 500) });
  const { data: leaves = [] } = useQuery({ queryKey: ["leaves-payroll"], queryFn: () => base44.entities.LeaveRequest.list("-created_date", 500) });
  const { data: meetings = [] } = useQuery({ queryKey: ["meetings-payroll"], queryFn: () => base44.entities.MeetingNote.list("-created_date", 200) });
  const { data: payslips = [] } = useQuery({ queryKey: ["payslips-payroll"], queryFn: () => base44.entities.Payslip.list("-created_date", 500) });
  const { data: users = [] } = useQuery({ queryKey: ["users-payroll"], queryFn: () => base44.entities.User.list() });
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles-payroll"], queryFn: () => base44.entities.UserProfile.list() });

  const monthIdx = MONTHS.indexOf(selectedMonth) + 1;
  const monthPrefix = `${selectedYear}-${String(monthIdx).padStart(2, "0")}`;

  // Build per-employee payroll rows
  const payrollRows = useMemo(() => {
    // Approved expenses this month
    const monthExp = expenses.filter(e => e.status === "approved" && e.expense_date?.startsWith(monthPrefix));
    // Approved unpaid leave this month
    const unpaidLeave = leaves.filter(l => l.status === "approved" && l.leave_type === "Unpaid Leave" && l.start_date?.startsWith(monthPrefix));
    // Meetings this month
    const monthMeetings = meetings.filter(m => m.meeting_date?.startsWith(monthPrefix));

    // Group expenses by employee
    const expByEmail = {};
    monthExp.forEach(e => {
      const key = e.employee_email || e.created_by;
      if (!expByEmail[key]) expByEmail[key] = { total: 0, items: [], name: e.employee_name, dept: e.department };
      expByEmail[key].total += Number(e.amount) || 0;
      expByEmail[key].items.push(e);
    });

    // Group unpaid leave by employee
    const leaveByEmail = {};
    unpaidLeave.forEach(l => {
      const key = l.employee_email || l.created_by;
      if (!leaveByEmail[key]) leaveByEmail[key] = 0;
      leaveByEmail[key] += Number(l.days_requested) || 0;
    });

    // Meeting attendance by employee (count meetings where email is in attendees)
    const meetingsByEmail = {};
    monthMeetings.forEach(m => {
      (m.attendees || []).forEach(email => {
        if (!meetingsByEmail[email]) meetingsByEmail[email] = 0;
        meetingsByEmail[email]++;
      });
    });

    // Collect all employee emails involved this month
    const allEmails = new Set([
      ...Object.keys(expByEmail),
      ...Object.keys(leaveByEmail),
      ...Object.keys(meetingsByEmail),
    ]);

    const rows = [];
    allEmails.forEach(email => {
      const u = users.find(u => u.email === email);
      const profile = profiles.find(p => p.user_email === email);
      const ps = payslips.find(p => p.employee_email === email && p.period_month === selectedMonth && p.period_year === selectedYear);

      const rawExpenses = expByEmail[email]?.total || 0;
      const cappedExpense = rawExpenses > POLICY.expenseReimbursementCap;
      const expenseReimbursement = Math.min(rawExpenses, POLICY.expenseReimbursementCap);

      const meetingCount = meetingsByEmail[email] || 0;
      const meetingBonus = meetingCount > 5 ? (meetingCount - 5) * POLICY.meetingAttendanceBonus : 0;

      const unpaidDays = leaveByEmail[email] || 0;
      const unpaidLeaveDeduction = unpaidDays * POLICY.unpaidLeaveDeductionPerDay;

      const totalAdjustment = expenseReimbursement + meetingBonus - unpaidLeaveDeduction;

      const adjustments = [];
      if (expenseReimbursement > 0) adjustments.push({ label: "Expense Reimbursement", value: expenseReimbursement, type: "reimbursement", note: `${expByEmail[email]?.items.length || 0} approved claim(s)${cappedExpense ? " — cap applied" : ""}` });
      if (meetingBonus > 0) adjustments.push({ label: "Meeting Attendance Bonus", value: meetingBonus, type: "bonus", note: `${meetingCount} meetings attended (${meetingCount - 5} × R${POLICY.meetingAttendanceBonus})` });
      if (unpaidLeaveDeduction > 0) adjustments.push({ label: "Unpaid Leave Deduction", value: unpaidLeaveDeduction, type: "deduction", note: `${unpaidDays} day(s) × R${POLICY.unpaidLeaveDeductionPerDay}` });

      rows.push({
        employee_email: email,
        employee_name: u?.full_name || expByEmail[email]?.name || email,
        department: expByEmail[email]?.dept || u?.department || "Unknown",
        subsidiary: profile?.subsidiary || "Phakathi Holdings",
        baseSalary: ps?.gross_amount || 0,
        rawExpenses,
        cappedExpense,
        expenseReimbursement,
        meetingBonus,
        meetingCount,
        unpaidLeaveDeduction,
        totalAdjustment,
        adjustments,
      });
    });

    return rows.sort((a, b) => Math.abs(b.totalAdjustment) - Math.abs(a.totalAdjustment));
  }, [expenses, leaves, meetings, payslips, users, profiles, monthPrefix, selectedMonth, selectedYear]);

  const totalBonus = payrollRows.reduce((s, r) => s + r.meetingBonus, 0);
  const totalReimbursement = payrollRows.reduce((s, r) => s + r.expenseReimbursement, 0);
  const totalDeductions = payrollRows.reduce((s, r) => s + r.unpaidLeaveDeduction, 0);
  const netTotal = payrollRows.reduce((s, r) => s + r.totalAdjustment, 0);

  // CSV Export
  const handleExport = async () => {
    setExporting(true);
    const headers = ["Employee","Email","Department","Subsidiary","Expense Reimbursement","Meeting Bonus","Unpaid Leave Deduction","Net Adjustment","Base Salary","Adjusted Total"];
    const rows = payrollRows.map(r => [
      `"${r.employee_name}"`, `"${r.employee_email}"`, `"${r.department}"`, `"${r.subsidiary}"`,
      r.expenseReimbursement.toFixed(2), r.meetingBonus.toFixed(2), r.unpaidLeaveDeduction.toFixed(2),
      r.totalAdjustment.toFixed(2), r.baseSalary.toFixed(2), (r.baseSalary + r.totalAdjustment).toFixed(2),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-adjustments-${selectedMonth}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  // Send email summaries to each employee
  const handleEmailAll = async () => {
    setEmailSending(true);
    for (const row of payrollRows) {
      if (!row.employee_email || !row.employee_email.includes("@")) continue;
      await base44.integrations.Core.SendEmail({
        to: row.employee_email,
        subject: `Your ${selectedMonth} ${selectedYear} Payroll Adjustment Summary`,
        body: `Dear ${row.employee_name},\n\nHere is your automated payroll adjustment summary for ${selectedMonth} ${selectedYear}:\n\n` +
          (row.expenseReimbursement > 0 ? `✅ Expense Reimbursement: +R${row.expenseReimbursement.toFixed(2)}\n` : "") +
          (row.meetingBonus > 0 ? `🏅 Meeting Attendance Bonus: +R${row.meetingBonus.toFixed(2)}\n` : "") +
          (row.unpaidLeaveDeduction > 0 ? `📉 Unpaid Leave Deduction: -R${row.unpaidLeaveDeduction.toFixed(2)}\n` : "") +
          `\n💼 Net Adjustment: R${row.totalAdjustment.toFixed(2)}\n\n` +
          `Please contact payroll@phakathiholdings.co.za if you have any queries.\n\nPhakathi Holdings Payroll`,
      }).catch(() => {});
    }
    setEmailSending(false);
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 4000);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <Card className="border-none shadow-md"><CardContent className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Access restricted to administrators only.</p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8 text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Auto Payroll</h1>
              <p className="text-gray-600 text-sm">Automated salary adjustments from expenses, meetings & leave</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40 bg-white shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m} value={m}>{m} {selectedYear}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport} disabled={exporting || payrollRows.length === 0} className="gap-2">
              <Download className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
            <Button onClick={handleEmailAll} disabled={emailSending || payrollRows.length === 0}
              className="bg-gradient-to-r from-gray-900 to-gray-700 text-white gap-2">
              <Send className="w-4 h-4" />
              {emailSending ? "Sending..." : `Email ${payrollRows.length} Employees`}
            </Button>
          </div>
        </motion.div>

        {emailSent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Payroll adjustment summaries sent successfully.
          </motion.div>
        )}

        {/* Policy info banner */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            <strong>Auto-calculation policy:</strong> Expense reimbursements (cap: R{POLICY.expenseReimbursementCap.toLocaleString()}/mo) · Meeting attendance bonus: +R{POLICY.meetingAttendanceBonus} per meeting beyond 5 · Unpaid leave deduction: R{POLICY.unpaidLeaveDeductionPerDay}/day
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Employees Affected", value: payrollRows.length, icon: Users, color: "text-gray-900" },
            { label: "Total Reimbursements", value: fmt(totalReimbursement), icon: Receipt, color: "text-blue-600" },
            { label: "Total Bonuses", value: fmt(totalBonus), icon: TrendingUp, color: "text-green-600" },
            { label: "Total Deductions", value: fmt(totalDeductions), icon: TrendingDown, color: "text-red-500" },
          ].map((s, i) => (
            <Card key={i} className="border-none shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{selectedMonth} {selectedYear}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Employee list */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Employee Adjustments</h2>
              <Badge variant="outline" className="text-xs">Net: {netTotal >= 0 ? "+" : ""}{fmt(netTotal)}</Badge>
            </div>
            {payrollRows.length === 0 ? (
              <Card className="border-none shadow-md"><CardContent className="p-12 text-center text-gray-400">
                <Calculator className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p>No adjustment data for {selectedMonth} {selectedYear}.</p>
                <p className="text-sm mt-1">Approve expenses and leave requests first.</p>
              </CardContent></Card>
            ) : (
              payrollRows.map(row => (
                <motion.div key={row.employee_email} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <EmployeePayrollCard
                    row={row}
                    onSelect={setSelectedRow}
                    selected={selectedRow?.employee_email === row.employee_email}
                  />
                </motion.div>
              ))
            )}
          </div>

          {/* Detail panel */}
          <div>
            {selectedRow ? (
              <DetailPanel row={selectedRow} onClose={() => setSelectedRow(null)} />
            ) : (
              <Card className="border-none shadow-md sticky top-4">
                <CardContent className="p-8 text-center text-gray-400">
                  <Calculator className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">Click an employee to see their detailed adjustment breakdown.</p>
                </CardContent>
              </Card>
            )}

            {/* Export preview */}
            <Card className="border-none shadow-md mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-3">CSV includes all columns for Sage / QuickBooks import.</p>
                <div className="text-xs font-mono bg-gray-50 rounded-lg p-3 overflow-x-auto text-gray-600">
                  Employee, Email, Dept, Reimb., Bonus, Deduct., Net<br/>
                  {payrollRows.slice(0, 3).map(r => (
                    <span key={r.employee_email} className="block truncate">
                      {r.employee_name.split(" ")[0]}, {r.employee_email.split("@")[0]}@..., {r.department.substring(0, 4)}, R{r.expenseReimbursement.toFixed(0)}, R{r.meetingBonus.toFixed(0)}, R{r.unpaidLeaveDeduction.toFixed(0)}, R{r.totalAdjustment.toFixed(0)}
                    </span>
                  ))}
                  {payrollRows.length > 3 && <span className="text-gray-400">...{payrollRows.length - 3} more rows</span>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}