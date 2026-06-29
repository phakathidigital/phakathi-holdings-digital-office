import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarPlus, Clock, Users, Building2 } from "lucide-react";
import { SUBSIDIARIES, MONDAY_ALIGNMENT_AGENDA, MONDAY_ALIGNMENT_ATTENDEES, getNextMonday } from "@/lib/subsidiaries";


const MEETING_TYPES = [
  "Weekly Monday Alignment", "Strategy Review", "Team Standup", "1-on-1", "Board Meeting",
  "Project Kickoff", "Client Meeting", "HR Review", "Quarterly Business Review", "Other"
];

export default function MeetingScheduler({ open, onClose, onScheduled }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    title: "", meeting_date: today, start_time: "09:00", end_time: "10:00",
    meeting_type: "", subsidiary: "", attendees_raw: "", agenda: "",
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data) => {
      const attendees = data.attendees_raw.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
      const attendeeEmails = attendees.filter(a => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));
      const record = await api.entities.MeetingStudio.create({
        title: data.title,
        meeting_date: data.meeting_date,
        subsidiary: data.subsidiary,
        attendees,
        transcript: "",
        meeting_type: data.meeting_type,
        recurrence: data.meeting_type === "Weekly Monday Alignment" ? "Weekly on Monday" : "",
        structured_notes: data.agenda ? `RECURRENCE: Weekly Monday alignment meeting\nAGENDA:\n${data.agenda}` : "",
        status: "pending",
      });
      // Send calendar invites to attendees
      if (attendeeEmails.length > 0 && data.agenda) {
        for (const email of attendeeEmails) {
          await api.integrations.Core.SendEmail({
            to: email,
            subject: `Meeting Invitation: ${data.title} — ${data.meeting_date}`,
            body: `You have been invited to the following meeting:\n\n📅 ${data.title}\n🗓 Date: ${data.meeting_date}\n🕐 Time: ${data.start_time} – ${data.end_time}\n🏢 Organisation: ${data.subsidiary || "Phakathi Holdings"}\n👥 Attendees: ${attendees.join(", ")}\n\n📋 Agenda:\n${data.agenda}\n\nPlease add this to your calendar.\n\nPhakathi Holdings Digital Office`,
          }).catch(() => {});
        }
      }
      return record;
    },
    onSuccess: (record) => {
      qc.invalidateQueries({ queryKey: ["meeting-studios"] });
      onScheduled?.(record);
      onClose();
      setForm({ title: "", meeting_date: today, start_time: "09:00", end_time: "10:00", meeting_type: "", subsidiary: "", attendees_raw: "", agenda: "" });
    },
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const applyMondayTemplate = () => {
    const groupedAttendees = Object.entries(MONDAY_ALIGNMENT_ATTENDEES).map(([company, names]) => `${company}: ${names.join(", ")}`).join("\n");
    setForm(f => ({ ...f, title: "Weekly Monday Group Alignment", meeting_date: getNextMonday(), start_time: "10:00", end_time: "11:00", meeting_type: "Weekly Monday Alignment", subsidiary: "Phakathi Holdings", attendees_raw: groupedAttendees, agenda: MONDAY_ALIGNMENT_AGENDA }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-4 h-4" /> Schedule Meeting
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button type="button" variant="outline" onClick={applyMondayTemplate} className="w-full justify-start gap-2">
            <CalendarPlus className="w-4 h-4" /> Use weekly Monday alignment template
          </Button>

          <div className="space-y-1.5">
            <Label>Meeting Title *</Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Q2 Strategy Review" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.meeting_type} onValueChange={v => set("meeting_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{MEETING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subsidiary</Label>
              <Select value={form.subsidiary} onValueChange={v => set("subsidiary", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{SUBSIDIARIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><CalendarPlus className="w-3 h-3" />Date *</Label>
              <Input type="date" value={form.meeting_date} onChange={e => set("meeting_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><Clock className="w-3 h-3" />Start</Label>
              <Input type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="time" value={form.end_time} onChange={e => set("end_time", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><Users className="w-3 h-3" />Attendees (emails or names)</Label>
            <Input value={form.attendees_raw} onChange={e => set("attendees_raw", e.target.value)}
              placeholder="Lorraine Sekwati, Meriam Malatji, sarah.ngwenya@phakathiholdings.local" />
            <p className="text-xs text-gray-400">Comma-separated. Only valid email addresses receive invitations.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Agenda</Label>
            <textarea rows={3} value={form.agenda} onChange={e => set("agenda", e.target.value)}
              className="w-full border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="1. Welcome & introductions&#10;2. Review Q2 results&#10;3. Planning for Q3&#10;4. AOB" />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={() => scheduleMutation.mutate(form)}
              disabled={!form.title || !form.meeting_date || scheduleMutation.isPending}
              className="flex-1 bg-gray-900 hover:bg-gray-700 text-white gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              {scheduleMutation.isPending ? "Scheduling..." : "Schedule & Invite"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
