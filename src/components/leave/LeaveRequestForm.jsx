import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBSIDIARIES } from "@/lib/subsidiaries";
import { differenceInCalendarDays, parseISO } from "date-fns";

const leaveTypes = ["Annual Leave", "Sick Leave", "Family Responsibility", "Study Leave", "Unpaid Leave", "Maternity Leave", "Paternity Leave"];
const departments = ["Management", "Finance", "HR", "IT", "Operations", "Empoweryst"];

export default function LeaveRequestForm({ onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState({
    leave_type: "",
    department: "",
    subsidiary: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const days = form.start_date && form.end_date
    ? Math.max(1, differenceInCalendarDays(parseISO(form.end_date), parseISO(form.start_date)) + 1)
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, days_requested: days });
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
        <CardTitle>New Leave Request</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Leave Type *</Label>
              <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department *</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select department..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subsidiary</Label>
              <Select value={form.subsidiary} onValueChange={(v) => setForm({ ...form, subsidiary: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select subsidiary..." />
                </SelectTrigger>
                <SelectContent>
                  {SUBSIDIARIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date *</Label>
              <Input type="date" className="mt-1" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div>
              <Label>End Date *</Label>
              <Input type="date" className="mt-1" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required min={form.start_date} />
            </div>
          </div>
          {days > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
              Total: <strong>{days} {days === 1 ? 'working day' : 'calendar days'}</strong>
            </div>
          )}
          <div>
            <Label>Reason *</Label>
            <Textarea
              className="mt-1"
              placeholder="Please provide a reason for your leave request..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button
              type="submit"
              disabled={isLoading || !form.leave_type || !form.start_date || !form.end_date || !form.reason || !form.department}
              className="bg-gradient-to-r from-gray-900 to-gray-700 text-white"
            >
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}