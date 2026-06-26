import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, TrendingUp, Users, Calendar } from "lucide-react";
import { format, parseISO, startOfMonth, isFuture } from "date-fns";

const DEPT_COLORS = ["#1f2937", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb"];

export default function Analytics() {
  const { data: leaves = [] } = useQuery({
    queryKey: ["allLeaves"],
    queryFn: () => base44.entities.LeaveRequest.list("-created_date", 200),
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetingNotes"],
    queryFn: () => base44.entities.MeetingNote.list("-meeting_date", 200),
  });

  // Leave by department
  const leaveByDept = Object.entries(
    leaves.reduce((acc, l) => {
      const dept = l.department || "Unknown";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([dept, count]) => ({ dept, count }))
    .sort((a, b) => b.count - a.count);

  // Meetings per month (last 6 months)
  const monthMap = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthMap[format(d, "MMM yyyy")] = 0;
  }
  meetings.forEach((m) => {
    if (!m.meeting_date) return;
    const key = format(parseISO(m.meeting_date), "MMM yyyy");
    if (key in monthMap) monthMap[key]++;
  });
  const meetingData = Object.entries(monthMap).map(([month, count]) => ({ month, count }));

  // Upcoming action items (from all meeting notes)
  const allActions = meetings.flatMap((m) =>
    (m.action_items || []).map((action) => ({
      action,
      meeting: m.title,
      date: m.meeting_date,
    }))
  ).slice(0, 10);

  // Summary stats
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const approvedLeaves = leaves.filter((l) => l.status === "approved").length;
  const totalMeetings = meetings.length;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">Operations Analytics</h1>
          <p className="text-gray-600">High-level visibility into office operations for management</p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Total Leave Requests", value: leaves.length, icon: Calendar, color: "text-gray-900" },
            { label: "Pending Approval", value: pendingLeaves, icon: Users, color: "text-yellow-600" },
            { label: "Approved Leaves", value: approvedLeaves, icon: CheckSquare, color: "text-green-600" },
            { label: "Meetings Recorded", value: totalMeetings, icon: TrendingUp, color: "text-blue-600" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-md">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 leading-tight">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Leave by Department */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-none shadow-md h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Leave Requests by Department</CardTitle>
                <p className="text-sm text-gray-500">All-time distribution across departments</p>
              </CardHeader>
              <CardContent>
                {leaveByDept.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No leave data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={leaveByDept} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                        formatter={(v) => [v, "Requests"]}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {leaveByDept.map((_, i) => (
                          <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Meeting Frequency */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-none shadow-md h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Meeting Frequency</CardTitle>
                <p className="text-sm text-gray-500">Meetings recorded per month (last 6 months)</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={meetingData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                      formatter={(v) => [v, "Meetings"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#1f2937"
                      strokeWidth={2.5}
                      dot={{ fill: "#1f2937", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Leave Status Breakdown + Action Items */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Leave Status */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Leave Status Breakdown</CardTitle>
                <p className="text-sm text-gray-500">Current status of all leave requests</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Pending", status: "pending", color: "bg-yellow-500", textColor: "text-yellow-700", bg: "bg-yellow-50" },
                  { label: "Approved", status: "approved", color: "bg-green-500", textColor: "text-green-700", bg: "bg-green-50" },
                  { label: "Rejected", status: "rejected", color: "bg-red-500", textColor: "text-red-700", bg: "bg-red-50" },
                ].map((s) => {
                  const count = leaves.filter((l) => l.status === s.status).length;
                  const pct = leaves.length ? Math.round((count / leaves.length) * 100) : 0;
                  return (
                    <div key={s.status} className={`p-4 rounded-xl ${s.bg}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-semibold text-sm ${s.textColor}`}>{s.label}</span>
                        <span className={`font-bold ${s.textColor}`}>{count} <span className="font-normal text-xs">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-white/60 rounded-full h-2">
                        <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {leaves.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No leave requests yet</p>}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Action Items */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Action Items from Meetings</CardTitle>
                <p className="text-sm text-gray-500">Outstanding items logged in meeting notes</p>
              </CardHeader>
              <CardContent>
                {allActions.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">No action items recorded yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {allActions.map((item, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 leading-snug">{item.action}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            From: {item.meeting}
                            {item.date && ` · ${format(parseISO(item.date), "d MMM yyyy")}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}