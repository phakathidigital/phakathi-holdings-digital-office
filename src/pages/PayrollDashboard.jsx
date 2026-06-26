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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { DollarSign, Users, Calendar, FileText, Send, TrendingUp, AlertCircle } from "lucide-react";
import EmployeePayrollView from "../components/payroll/EmployeePayrollView";
import BenefitsAdminPanel from "../components/payroll/BenefitsAdminPanel";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DEPARTMENTS = ["Management","Finance","HR","IT","Operations","Empoweryst"];
const DEPT_COLORS = ["#1f2937","#374151","#4b5563","#6b7280","#9ca3af","#d1d5db"];

const LEAVE_DAYS = {
  "Annual Leave": 15,
  "Sick Leave": 10,
  "Family Responsibility": 3,
  "Study Leave": 5,
  "Maternity Leave": 90,
  "Paternity Leave": 10,
  "Unpaid Leave": 0,
};

export default function PayrollDashboard() {
  const currentYear = new Date().getFullYear();
  const currentMonth = MONTHS[new Date().getMonth()];
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear] = useState(currentYear);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isAdmin = user?.role === "admin";

  const { data: payslips = [] } = useQuery({
    queryKey: ["payslips"],
    queryFn: () => base44.entities.Payslip.list("-created_date", 500),
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ["allLeaves"],
    queryFn: () => base44.entities.LeaveRequest.list("-created_date", 500),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-created_date", 500),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  // Filter payslips for selected period
  const periodPayslips = useMemo(() =>
    payslips.filter(p => p.period_month === selectedMonth && p.period_year === selectedYear && p.status === "published"),
    [payslips, selectedMonth, selectedYear]
  );

  // Approved expenses for selected month
  const monthExpenses = useMemo(() => {
    const monthIdx = MONTHS.indexOf(selectedMonth) + 1;
    const prefix = `${selectedYear}-${String(monthIdx).padStart(2, "0")}`;
    return expenses.filter(e => e.status === "approved" && e.expense_date?.startsWith(prefix));
  }, [expenses, selectedMonth, selectedYear]);

  // Leave stats for current year
  const leaveStats = useMemo(() => {
    const yearLeaves = leaves.filter(l => l.status === "approved" && l.start_date?.startsWith(String(selectedYear)));
    const byDept = {};
    DEPARTMENTS.forEach(d => { byDept[d] = { approved: 0, pending: 0 }; });
    leaves.forEach(l => {
      if (l.department && byDept[l.department]) {
        if (l.status === "approved") byDept[l.department].approved += (l.days_requested || 0);
        if (l.status === "pending") byDept[l.department].pending += (l.days_requested || 0);
      }
    });
    return { yearLeaves, byDept };
  }, [leaves, selectedYear]);

  // Dept payroll summary
  const deptSummary = useMemo(() => {
    return DEPARTMENTS.map(dept => {
      const deptPayslips = periodPayslips.filter(p => {
        const u = users.find(u => u.email === p.employee_email);
        return u?.department === dept;
      });
      const gross = deptPayslips.reduce((s, p) => s + (p.gross_amount || 0), 0);
      const net = deptPayslips.reduce((s, p) => s + (p.net_amount || 0), 0);
      const expTotal = monthExpenses.filter(e => e.department === dept).reduce((s, e) => s + (e.amount || 0), 0);
      return { dept, headcount: deptPayslips.length, gross, net, expenses: expTotal };
    }).filter(d => d.headcount > 0 || d.expenses > 0);
  }, [periodPayslips, monthExpenses, users]);

  const totalGross = periodPayslips.reduce((s, p) => s + (p.gross_amount || 0), 0);
  const totalNet = periodPayslips.reduce((s, p) => s + (p.net_amount || 0), 0);
  const totalExpenses = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingLeaveCount = leaves.filter(l => l.status === "pending").length;

  // Batch email payslip notifications
  const handleBatchEmail = async () => {
    setSending(true);
    setSentCount(null);
    let count = 0;
    for (const ps of periodPayslips) {
      if (!ps.employee_email) continue;
      await base44.integrations.Core.SendEmail({
        to: ps.employee_email,
        subject: `Your ${selectedMonth} ${selectedYear} Payslip is Available – Phakathi Holdings`,
        body: `Dear ${ps.employee_name || ps.employee_email},\n\nYour payslip for ${selectedMonth} ${selectedYear} is now available on the Phakathi Holdings Digital Office portal.\n\n💼 Gross Pay: R${(ps.gross_amount || 0).toLocaleString()}\n💵 Net Pay: R${(ps.net_amount || 0).toLocaleString()}\n\nPlease log in to download your payslip document.\n\nKind regards,\nPhakathi Holdings Payroll Team`,
      }).catch(() => {});
      count++;
    }
    setSending(false);
    setSentCount(count);
  };

  // Department expense chart data
  const expenseChartData = DEPARTMENTS.map(d => ({
    name: d.split(" ")[0],
    expenses: monthExpenses.filter(e => e.department === d).reduce((s, e) => s + (e.amount || 0), 0),
  })).filter(d => d.expenses > 0);

  // Employee self-service portal
  if (!isAdmin) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Pay & Benefits</h1>
              <p className="text-gray-600 text-sm">View your payslips, tax documents and manage benefits enrollment</p>
            </div>
          </div>
          <EmployeePayrollView user={user} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payroll Dashboard</h1>
              <p className="text-gray-600 text-sm">Monthly summaries, leave balances, and expense reports</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40 bg-white shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m} value={m}>{m} {selectedYear}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              onClick={handleBatchEmail}
              disabled={sending || periodPayslips.length === 0}
              className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending..." : `Notify ${periodPayslips.length} Employees`}
            </Button>
          </div>
        </motion.div>

        {sentCount !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium flex items-center gap-2">
            <Send className="w-4 h-4" />
            Successfully sent payslip notifications to {sentCount} employee{sentCount !== 1 ? "s" : ""}.
          </motion.div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Gross Pay", value: `R${totalGross.toLocaleString()}`, icon: TrendingUp, color: "text-gray-900" },
            { label: "Total Net Pay", value: `R${totalNet.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
            { label: "Approved Expenses", value: `R${totalExpenses.toLocaleString()}`, icon: FileText, color: "text-orange-600" },
            { label: "Pending Leave Requests", value: pendingLeaveCount, icon: Calendar, color: "text-red-500" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{selectedMonth} {selectedYear}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="summary">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="summary">Department Summary</TabsTrigger>
            <TabsTrigger value="benefits">Benefits Overview</TabsTrigger>
            <TabsTrigger value="leave">Leave Balances</TabsTrigger>
            <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
          </TabsList>

          {/* Department Summary */}
          <TabsContent value="summary" className="mt-4">
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Payroll by Department — {selectedMonth} {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                {deptSummary.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No published payslips for this period.</p>
                    <p className="text-sm">Publish payslips in the Payslips module first.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3 font-semibold text-gray-600">Department</th>
                          <th className="pb-3 font-semibold text-gray-600 text-right">Employees</th>
                          <th className="pb-3 font-semibold text-gray-600 text-right">Gross Pay</th>
                          <th className="pb-3 font-semibold text-gray-600 text-right">Net Pay</th>
                          <th className="pb-3 font-semibold text-gray-600 text-right">Expenses</th>
                          <th className="pb-3 font-semibold text-gray-600 text-right">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {deptSummary.map((row, i) => (
                          <tr key={row.dept} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                                {row.dept}
                              </div>
                            </td>
                            <td className="py-3 text-right text-gray-600">{row.headcount}</td>
                            <td className="py-3 text-right text-gray-600">R{row.gross.toLocaleString()}</td>
                            <td className="py-3 text-right text-gray-800 font-medium">R{row.net.toLocaleString()}</td>
                            <td className="py-3 text-right text-orange-600">R{row.expenses.toLocaleString()}</td>
                            <td className="py-3 text-right text-gray-900 font-semibold">R{(row.net + row.expenses).toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-300 bg-gray-50">
                          <td className="py-3 font-bold text-gray-900">Total</td>
                          <td className="py-3 text-right font-bold">{deptSummary.reduce((s, d) => s + d.headcount, 0)}</td>
                          <td className="py-3 text-right font-bold">R{totalGross.toLocaleString()}</td>
                          <td className="py-3 text-right font-bold">R{totalNet.toLocaleString()}</td>
                          <td className="py-3 text-right font-bold text-orange-600">R{totalExpenses.toLocaleString()}</td>
                          <td className="py-3 text-right font-bold text-gray-900">R{(totalNet + totalExpenses).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Benefits Overview */}
          <TabsContent value="benefits" className="mt-4">
            <BenefitsAdminPanel />
          </TabsContent>

          {/* Leave Balances */}
          <TabsContent value="leave" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Leave Days by Department ({selectedYear})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {DEPARTMENTS.map((dept, i) => {
                      const stats = leaveStats.byDept[dept];
                      const total = stats.approved + stats.pending;
                      if (total === 0) return null;
                      return (
                        <div key={dept}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-800">{dept}</span>
                            <span className="text-gray-500">{stats.approved} approved · <span className="text-yellow-600">{stats.pending} pending</span></span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-800 rounded-full" style={{ width: `${Math.min((stats.approved / Math.max(total, 1)) * 100, 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {Object.values(leaveStats.byDept).every(d => d.approved + d.pending === 0) && (
                      <p className="text-center text-gray-400 py-4">No leave data for {selectedYear}.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Leave Entitlements (Annual Policy)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(LEAVE_DAYS).map(([type, days]) => (
                      <div key={type} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-700">{type}</span>
                        <Badge variant="outline" className="text-xs">{days === 0 ? "Unpaid" : `${days} days`}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent leave requests */}
            <Card className="border-none shadow-md mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-semibold text-gray-600">Employee</th>
                        <th className="pb-2 font-semibold text-gray-600">Type</th>
                        <th className="pb-2 font-semibold text-gray-600">Days</th>
                        <th className="pb-2 font-semibold text-gray-600">Period</th>
                        <th className="pb-2 font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leaves.slice(0, 10).map(l => (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="py-2 text-gray-800">{l.employee_name || l.employee_email}</td>
                          <td className="py-2 text-gray-600">{l.leave_type}</td>
                          <td className="py-2 text-gray-600">{l.days_requested}</td>
                          <td className="py-2 text-gray-500 text-xs">{l.start_date} → {l.end_date}</td>
                          <td className="py-2">
                            <Badge className={`text-xs border-0 ${l.status === "approved" ? "bg-green-100 text-green-700" : l.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {l.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {leaves.length === 0 && <p className="text-center text-gray-400 py-4">No leave requests.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expense Breakdown */}
          <TabsContent value="expenses" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Expenses by Department</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenseChartData.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No approved expenses this month.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={expenseChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => [`R${v.toLocaleString()}`, "Expenses"]} />
                        <Bar dataKey="expenses" radius={[4, 4, 0, 0]}>
                          {expenseChartData.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Expense Claims — {selectedMonth}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {monthExpenses.length === 0 ? (
                      <p className="text-center text-gray-400 py-8">No approved expenses this month.</p>
                    ) : monthExpenses.map(e => (
                      <div key={e.id} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{e.employee_name || e.employee_email}</p>
                          <p className="text-xs text-gray-500">{e.category} · {e.department}</p>
                        </div>
                        <span className="font-semibold text-gray-900">R{(e.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}