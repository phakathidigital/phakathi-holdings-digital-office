import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Users, TrendingDown, Building2, Award } from "lucide-react";

const DEPT_COLORS_MAP = {
  Management: "#1f2937", Finance: "#1d4ed8", HR: "#7c3aed",
  IT: "#0891b2", Operations: "#d97706", Empoweryst: "#15803d", Other: "#9ca3af",
};

const SUBSIDIARY_COLORS = [
  "#1f2937","#1d4ed8","#7c3aed","#0891b2","#d97706","#15803d","#dc2626","#0f766e","#b45309","#6d28d9"
];

export default function OrgAnalytics({ users, profiles }) {
  const enriched = useMemo(() => users.map(u => {
    const profile = profiles.find(p => p.user_email === u.email) || {};
    return { ...u, ...profile };
  }), [users, profiles]);

  // Headcount by department
  const deptHeadcount = useMemo(() => {
    const map = {};
    enriched.forEach(u => {
      const d = u.department || "Other";
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [enriched]);

  // Headcount by subsidiary
  const subHeadcount = useMemo(() => {
    const map = {};
    enriched.forEach(u => {
      const s = u.subsidiary || "Unassigned";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [enriched]);

  // Department distribution by subsidiary
  const subDeptMatrix = useMemo(() => {
    const subs = [...new Set(enriched.map(u => u.subsidiary).filter(Boolean))];
    const depts = [...new Set(enriched.map(u => u.department).filter(Boolean))];
    return subs.map(sub => {
      const row = { subsidiary: sub.split(" ")[0] };
      depts.forEach(dept => {
        row[dept] = enriched.filter(u => u.subsidiary === sub && u.department === dept).length;
      });
      return row;
    });
  }, [enriched]);

  const allDepts = [...new Set(enriched.map(u => u.department).filter(Boolean))];

  // Role breakdown
  const roleBreakdown = useMemo(() => {
    const admins = enriched.filter(u => u.role === "admin").length;
    const users2 = enriched.filter(u => u.role !== "admin").length;
    return [
      { name: "Staff", value: users2, color: "#1f2937" },
      { name: "Admin / Management", value: admins, color: "#d97706" },
    ].filter(r => r.value > 0);
  }, [enriched]);

  // Employees with full profiles vs not
  const profileCompleteness = useMemo(() => {
    const withProfile = enriched.filter(u => profiles.some(p => p.user_email === u.email && p.job_title)).length;
    const withoutProfile = enriched.length - withProfile;
    return [
      { name: "Complete Profile", value: withProfile, color: "#15803d" },
      { name: "Incomplete Profile", value: withoutProfile, color: "#9ca3af" },
    ].filter(r => r.value > 0);
  }, [enriched, profiles]);

  const totalHeadcount = enriched.length;
  const subsidiaryCount = new Set(enriched.map(u => u.subsidiary).filter(Boolean)).size;
  const deptCount = new Set(enriched.map(u => u.department).filter(Boolean)).size;
  const adminCount = enriched.filter(u => u.role === "admin").length;

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Headcount", value: totalHeadcount, icon: Users, color: "text-gray-900" },
          { label: "Subsidiaries", value: subsidiaryCount, icon: Building2, color: "text-blue-600" },
          { label: "Departments", value: deptCount, icon: Award, color: "text-purple-600" },
          { label: "Admin / Leaders", value: adminCount, icon: TrendingDown, color: "text-orange-600" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-md">
            <CardContent className="p-5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Headcount by Department */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Headcount by Department</CardTitle>
          </CardHeader>
          <CardContent>
            {deptHeadcount.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No department data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptHeadcount} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v) => [v, "Employees"]} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {deptHeadcount.map((d, i) => (
                      <Cell key={i} fill={DEPT_COLORS_MAP[d.name] || "#9ca3af"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Headcount by Subsidiary */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Headcount by Subsidiary</CardTitle>
          </CardHeader>
          <CardContent>
            {subHeadcount.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No subsidiary data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={subHeadcount} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name.split(" ")[0]}: ${value}`} labelLine={false} fontSize={10}>
                    {subHeadcount.map((_, i) => <Cell key={i} fill={SUBSIDIARY_COLORS[i % SUBSIDIARY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subsidiary x Department Matrix */}
      {subDeptMatrix.length > 0 && allDepts.length > 0 && (
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Department Mix by Subsidiary</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={subDeptMatrix} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="subsidiary" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {allDepts.map(dept => (
                  <Bar key={dept} dataKey={dept} stackId="a" fill={DEPT_COLORS_MAP[dept] || "#9ca3af"} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Role distribution */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={roleBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                    {roleBreakdown.map((r, i) => <Cell key={i} fill={r.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subsidiary headcount table */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subsidiary Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subHeadcount.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: SUBSIDIARY_COLORS[i % SUBSIDIARY_COLORS.length] }} />
                  <p className="text-sm text-gray-700 flex-1 truncate">{s.name}</p>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden mx-2">
                    <div className="h-full bg-gray-700 rounded-full" style={{ width: `${(s.value / totalHeadcount) * 100}%` }} />
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{s.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile completeness insight */}
      {profileCompleteness.length > 0 && (
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Employee Directory Completeness
              <Badge className="bg-blue-50 text-blue-700 border-0 text-xs">
                {Math.round(((profileCompleteness.find(p => p.name === "Complete Profile")?.value || 0) / totalHeadcount) * 100)}% complete
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={profileCompleteness} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
                    {profileCompleteness.map((r, i) => <Cell key={i} fill={r.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {profileCompleteness.map(r => (
                  <div key={r.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-sm text-gray-600">{r.name}:</span>
                    <span className="text-sm font-semibold text-gray-900">{r.value} employees</span>
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-2">Employees with job title set are counted as "complete".</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}