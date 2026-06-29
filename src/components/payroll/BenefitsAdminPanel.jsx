import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, Bell, Search, Heart } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG = {
  draft:     { label: "Draft",     color: "bg-gray-100 text-gray-600" },
  submitted: { label: "Submitted", color: "bg-yellow-100 text-yellow-700" },
  approved:  { label: "Approved",  color: "bg-green-100 text-green-700" },
};

const BENEFIT_KEYS = [
  { key: "retirement_fund",      label: "Retirement" },
  { key: "group_life_cover",     label: "Life Cover" },
  { key: "disability_cover",     label: "Disability" },
  { key: "funeral_cover",        label: "Funeral" },
  { key: "travel_allowance",     label: "Travel" },
  { key: "cell_phone_allowance", label: "Cell Phone" },
];

export default function BenefitsAdminPanel() {
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const { data: enrollments = [] } = useQuery({
    queryKey: ["benefits-all"],
    queryFn: () => api.entities.BenefitsEnrollment.filter({ period_year: currentYear }),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, email, name }) => {
      const updated = await api.entities.BenefitsEnrollment.update(id, { status: "approved" });
      await api.integrations.Core.SendEmail({
        to: email,
        subject: `Benefits Enrollment Approved — ${currentYear}`,
        body: `Hi ${name},\n\nYour benefits enrollment for ${currentYear} has been approved by HR.\n\nYour selected benefits are now active. Please log in to view details.\n\nPhakathi Holdings HR`,
      }).catch(() => {});
      return updated;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["benefits-all"] }),
  });

  const sendReminders = async () => {
    setSending(true);
    const { data: allUsers } = await api.entities.User.list().then(u => ({ data: u })).catch(() => ({ data: [] }));
    const enrolled = new Set(enrollments.map(e => e.employee_email));
    const unenrolled = (allUsers || []).filter(u => !enrolled.has(u.email) && u.email);
    for (const u of unenrolled) {
      await api.integrations.Core.SendEmail({
        to: u.email,
        subject: `Reminder: Benefits Enrollment Closing Soon — ${currentYear}`,
        body: `Hi ${u.full_name || "there"},\n\nThis is a reminder that you have not yet enrolled in your benefits for ${currentYear}.\n\nBenefits enrollment closes at the end of January. Please log in to the Phakathi Holdings Digital Office and complete your enrollment under "My Pay & Benefits".\n\nPhakathi Holdings HR`,
      }).catch(() => {});
    }
    setSending(false);
  };

  const filtered = enrollments.filter(e => {
    const q = search.toLowerCase();
    return !q || (e.employee_name || "").toLowerCase().includes(q) || (e.employee_email || "").toLowerCase().includes(q);
  });

  const submitted = enrollments.filter(e => e.status === "submitted").length;
  const approved = enrollments.filter(e => e.status === "approved").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Enrolled", value: enrollments.length, color: "text-gray-900" },
          { label: "Pending Approval", value: submitted, color: "text-yellow-600" },
          { label: "Approved", value: approved, color: "text-green-600" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search enrollments..." className="pl-8" />
        </div>
        <Button variant="outline" onClick={sendReminders} disabled={sending} className="gap-2 shrink-0">
          <Bell className="w-4 h-4" />{sending ? "Sending..." : "Send Enrollment Reminders"}
        </Button>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" /> Benefits Enrollments — {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No enrollments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-semibold text-gray-600">Employee</th>
                    <th className="pb-2 font-semibold text-gray-600">Medical Aid</th>
                    <th className="pb-2 font-semibold text-gray-600">Benefits</th>
                    <th className="pb-2 font-semibold text-gray-600">Status</th>
                    <th className="pb-2 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <p className="font-medium text-gray-800">{e.employee_name}</p>
                        <p className="text-xs text-gray-500">{e.employee_email}</p>
                      </td>
                      <td className="py-3 capitalize text-gray-600">{e.medical_aid}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {BENEFIT_KEYS.filter(b => e[b.key]).map(b => (
                            <Badge key={b.key} variant="outline" className="text-xs">{b.label}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge className={`border-0 text-xs ${STATUS_CONFIG[e.status]?.color}`}>
                          {STATUS_CONFIG[e.status]?.label}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {e.status === "submitted" && (
                          <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                            onClick={() => approveMutation.mutate({ id: e.id, email: e.employee_email, name: e.employee_name })}>
                            <CheckCircle className="w-3 h-3" /> Approve
                          </Button>
                        )}
                        {e.status === "approved" && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}