import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const meetingTypes = ["Management Meeting", "Department Meeting", "Project Review", "Client Meeting", "One-on-One", "BBBEE Consultation", "Other"];
const departments = ["Management", "Finance", "HR", "IT", "Operations", "Empoweryst", "Cross-Department"];

export default function MeetingNoteForm({ note, onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState({
    title: "", meeting_date: new Date().toISOString().split('T')[0], meeting_type: "",
    venue: "", agenda: "", minutes: "", department: "", is_confidential: false,
    attendees: [], action_items: [],
  });
  const [newAttendee, setNewAttendee] = useState("");
  const [newAction, setNewAction] = useState("");

  useEffect(() => {
    if (note) setForm({ ...form, ...note });
  }, [note]);

  const addAttendee = () => {
    if (newAttendee.trim()) {
      setForm({ ...form, attendees: [...(form.attendees || []), newAttendee.trim()] });
      setNewAttendee("");
    }
  };

  const addAction = () => {
    if (newAction.trim()) {
      setForm({ ...form, action_items: [...(form.action_items || []), newAction.trim()] });
      setNewAction("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
        <CardTitle>{note ? "Edit Meeting Note" : "New Meeting Note"}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Meeting Title *</Label>
              <Input className="mt-1" placeholder="e.g. Q1 Management Review" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" className="mt-1" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} required />
            </div>
            <div>
              <Label>Meeting Type *</Label>
              <Select value={form.meeting_type} onValueChange={(v) => setForm({ ...form, meeting_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>{meetingTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Venue / Platform</Label>
              <Input className="mt-1" placeholder="e.g. Boardroom / Google Meet" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            </div>
          </div>

          {/* Attendees */}
          <div>
            <Label>Attendees</Label>
            <div className="flex gap-2 mt-1">
              <Input placeholder="Name or email" value={newAttendee} onChange={(e) => setNewAttendee(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())} />
              <Button type="button" variant="outline" onClick={addAttendee}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.attendees?.map((a, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {a}
                  <button type="button" onClick={() => setForm({ ...form, attendees: form.attendees.filter((_, j) => j !== i) })}><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Agenda</Label>
            <Textarea className="mt-1" rows={2} placeholder="Meeting agenda items..." value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} />
          </div>

          <div>
            <Label>Meeting Minutes *</Label>
            <Textarea className="mt-1" rows={5} placeholder="Write the meeting minutes here — discussions, decisions, outcomes..." value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} required />
          </div>

          {/* Action Items */}
          <div>
            <Label>Action Items</Label>
            <div className="flex gap-2 mt-1">
              <Input placeholder="e.g. John to send report by Friday" value={newAction} onChange={(e) => setNewAction(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAction())} />
              <Button type="button" variant="outline" onClick={addAction}><Plus className="w-4 h-4" /></Button>
            </div>
            <ul className="mt-2 space-y-1">
              {form.action_items?.map((a, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700 p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">→</span>
                  <span className="flex-1">{a}</span>
                  <button type="button" onClick={() => setForm({ ...form, action_items: form.action_items.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.is_confidential} onCheckedChange={(v) => setForm({ ...form, is_confidential: v })} />
            <Label className="cursor-pointer">Mark as Confidential (Management only)</Label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !form.title || !form.minutes || !form.meeting_type} className="bg-gradient-to-r from-gray-900 to-gray-700 text-white">
              {isLoading ? "Saving..." : note ? "Update Note" : "Save Meeting Note"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}