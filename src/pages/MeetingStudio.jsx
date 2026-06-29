import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Upload, Sparkles, Send, ChevronDown, ChevronRight,
  Clock, Users, CheckSquare, FileText, Mail, X, Plus,
  AlertCircle, CheckCircle2, Loader2, Calendar, CalendarPlus, Kanban
} from "lucide-react";
import MeetingScheduler from "../components/meeting/MeetingScheduler";
import AudioRecorder from "../components/meeting/AudioRecorder";
import KanbanSyncPanel from "../components/meeting/KanbanSyncPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBSIDIARIES, MONDAY_ALIGNMENT_AGENDA, getNextMonday } from "@/lib/subsidiaries";


function StatusBadge({ status }) {
  const map = {
    pending: { color: "bg-gray-100 text-gray-600", icon: Clock, label: "Pending" },
    processing: { color: "bg-blue-50 text-blue-700", icon: Loader2, label: "Processing..." },
    completed: { color: "bg-green-50 text-green-700", icon: CheckCircle2, label: "Completed" },
  };
  const { color, icon: Icon, label } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      <Icon className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

function MeetingCard({ meeting, onView }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(meeting)}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{meeting.title}</h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{meeting.meeting_date}
                </span>
                {meeting.subsidiary && <Badge variant="outline" className="text-xs">{meeting.subsidiary}</Badge>}
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />{meeting.attendees?.length || 0} attendees
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={meeting.status} />
              {meeting.emails_sent && (
                <span className="text-xs text-green-600 flex items-center gap-1"><Mail className="w-3 h-3" />Sent</span>
              )}
              {meeting.tasks_synced && (
                <span className="text-xs text-purple-600 flex items-center gap-1"><Kanban className="w-3 h-3" />Tasks synced</span>
              )}
              {meeting.extracted_tasks?.length > 0 && !meeting.tasks_synced && (
                <span className="text-xs text-orange-500 flex items-center gap-1"><Kanban className="w-3 h-3" />{meeting.extracted_tasks.length} tasks ready</span>
              )}
            </div>
          </div>
          {meeting.summary && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{meeting.summary}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MeetingDetailModal({ meeting, onClose }) {
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailsSent, setEmailsSent] = useState(meeting.emails_sent);
  const [localMeeting, setLocalMeeting] = useState(meeting);
  const qc = useQueryClient();

  const sendEmailsMutation = useMutation({
    mutationFn: async () => {
      if (!meeting.attendees?.length) return;
      const attendeeEmails = meeting.attendees.filter(a => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));
      if (!attendeeEmails.length) return;
      const summaries = meeting.individual_summaries || {};
      for (const email of attendeeEmails) {
        const personalSummary = summaries[email] || meeting.summary || "";
        await api.integrations.Core.SendEmail({
          to: email,
          subject: `Meeting Notes: ${meeting.title} — ${meeting.meeting_date}`,
          body: `
<h2>Meeting Notes: ${meeting.title}</h2>
<p><strong>Date:</strong> ${meeting.meeting_date}</p>
<p><strong>Attendees:</strong> ${meeting.attendees.join(", ")}</p>

<h3>📋 Summary</h3>
<p>${meeting.summary || "N/A"}</p>

${meeting.decisions?.length ? `<h3>✅ Key Decisions</h3><ul>${meeting.decisions.map(d => `<li>${d}</li>`).join("")}</ul>` : ""}

${meeting.action_items?.length ? `<h3>📌 Action Items</h3><ul>${meeting.action_items.map(a => `<li>${a}</li>`).join("")}</ul>` : ""}

${personalSummary ? `<h3>🎯 Your Personal Summary</h3><p>${personalSummary}</p>` : ""}

<hr/>
<p style="color:#888;font-size:12px">Generated by Phakathi Holdings AI Meeting Studio</p>
          `,
        });
      }
      await api.entities.MeetingStudio.update(meeting.id, { emails_sent: true });
    },
    onSuccess: () => {
      setEmailsSent(true);
      qc.invalidateQueries({ queryKey: ["meeting-studios"] });
    },
  });

  const sections = [
    { key: "summary", label: "📋 Summary", icon: FileText, content: meeting.summary },
    { key: "decisions", label: "✅ Key Decisions", icon: CheckSquare, content: meeting.decisions?.join("\n") },
    { key: "action_items", label: "📌 Action Items", icon: CheckSquare, content: meeting.action_items?.join("\n") },
    { key: "notes", label: "📝 Full Notes", icon: FileText, content: meeting.structured_notes },
  ].filter(s => s.content);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
      <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-t-2xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{meeting.title}</h2>
              <p className="text-white/60 text-sm mt-1">{meeting.meeting_date} · {meeting.subsidiary || "Phakathi Holdings"}</p>
              {meeting.attendees?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {meeting.attendees.map(a => (
                    <span key={a} className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* AI Sections */}
          {sections.map(({ key, label, content }) => (
            <div key={key}>
              <h3 className="font-semibold text-gray-800 mb-2">{label}</h3>
              {key === "action_items" || key === "decisions" ? (
                <ul className="space-y-1.5">
                  {(key === "action_items" ? meeting.action_items : meeting.decisions)?.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
              )}
            </div>
          ))}

          {/* Individual summaries */}
          {meeting.individual_summaries && Object.keys(meeting.individual_summaries).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🎯 Individual Summaries</h3>
              <div className="space-y-2">
                {Object.entries(meeting.individual_summaries).map(([email, summary]) => (
                  <div key={email} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">{email}</p>
                    <p className="text-sm text-gray-700">{summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kanban Sync */}
          {localMeeting.extracted_tasks?.length > 0 && (
            <div className="border rounded-xl p-4 bg-gray-50">
              <KanbanSyncPanel
                meeting={localMeeting}
                onSynced={() => setLocalMeeting(m => ({ ...m, tasks_synced: true }))}
              />
            </div>
          )}

          {/* Send emails */}
          <div className="border-t pt-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {emailsSent ? "✅ Summaries sent to all attendees" : `Send AI notes to ${(meeting.attendees || []).filter(a => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)).length} email attendee(s)`}
            </p>
            <Button
              onClick={() => sendEmailsMutation.mutate()}
              disabled={emailsSent || sendEmailsMutation.isPending || !(meeting.attendees || []).some(a => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a))}
              className="gap-2 bg-gray-900 hover:bg-gray-800"
            >
              {sendEmailsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {emailsSent ? "Already Sent" : "Send to Attendees"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MeetingStudioPage() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("list"); // list | new
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const qc = useQueryClient();

  // Form state
  const [form, setForm] = useState({
    title: "", meeting_date: new Date().toISOString().split("T")[0],
    subsidiary: "", attendees_raw: "", transcript: "",
  });

  React.useEffect(() => { api.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meeting-studios"],
    queryFn: () => api.entities.MeetingStudio.list("-meeting_date"),
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, transcript: ev.target.result }));
    reader.readAsText(file);
  };

  const applyMondayTemplate = () => {
    setForm(f => ({ ...f, title: "Weekly Monday Group Alignment", meeting_date: getNextMonday(), subsidiary: "Phakathi Holdings", transcript: f.transcript || `Weekly Monday alignment meeting\n\nAgenda:\n${MONDAY_ALIGNMENT_AGENDA}\n\nNotes:\n` }));
  };

  const handleGenerate = async () => {
    if (!form.transcript.trim() || !form.title) return;
    setProcessing(true);

    const attendees = form.attendees_raw
      .split(/[,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    // Create record first
    const record = await api.entities.MeetingStudio.create({
      title: form.title,
      meeting_date: form.meeting_date,
      subsidiary: form.subsidiary,
      attendees,
      transcript: form.transcript,
      status: "processing",
    });

    try {
      // Build attendees block for per-person summaries
      const attendeesBlock = attendees.length
        ? `Attendees: ${attendees.join(", ")}`
        : "";

      const result = await api.integrations.Core.InvokeLLM({
        prompt: `You are an expert corporate meeting analyst for Phakathi Holdings, a diversified South African investment group.

Analyse the following meeting transcript and produce comprehensive, professional meeting documentation.

Meeting Title: ${form.title}
Date: ${form.meeting_date}
${attendeesBlock}

TRANSCRIPT:
${form.transcript}

Return a JSON object with these exact keys:
- summary: A concise executive summary (2-4 paragraphs)
- decisions: Array of strings, each a key decision made
- action_items: Array of strings, each formatted as "OWNER: Action — Deadline (if mentioned)"
- structured_notes: Full structured meeting notes with sections for Agenda, Discussion Points, and Outcomes
- individual_summaries: Object where each key is an attendee email and value is a personalised summary focusing on what's relevant to that person
- extracted_tasks: Array of task objects extracted from the meeting. Each task must have: title (string, required), description (string), assigned_to (email string — match against the attendee list if possible, else empty string), priority ("low"|"medium"|"high"|"critical"), due_date (ISO date string if mentioned, else empty string). Only include concrete, actionable tasks with a clear owner or outcome.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            decisions: { type: "array", items: { type: "string" } },
            action_items: { type: "array", items: { type: "string" } },
            structured_notes: { type: "string" },
            individual_summaries: { type: "object" },
            extracted_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  assigned_to: { type: "string" },
                  priority: { type: "string" },
                  due_date: { type: "string" },
                },
              },
            },
          },
        },
        model: "claude_sonnet_4_6",
      });

      await api.entities.MeetingStudio.update(record.id, {
        summary: result.summary,
        decisions: result.decisions,
        action_items: result.action_items,
        structured_notes: result.structured_notes,
        individual_summaries: result.individual_summaries,
        extracted_tasks: result.extracted_tasks || [],
        status: "completed",
      });

      qc.invalidateQueries({ queryKey: ["meeting-studios"] });

      // Auto-show the result
      const updated = { ...record, ...result, extracted_tasks: result.extracted_tasks || [], status: "completed", attendees };
      setSelectedMeeting(updated);
      setView("list");
    } catch (err) {
      await api.entities.MeetingStudio.update(record.id, { status: "pending" });
    } finally {
      setProcessing(false);
      setForm({ title: "", meeting_date: new Date().toISOString().split("T")[0], subsidiary: "", attendees_raw: "", transcript: "" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Mic className="w-7 h-7" /> AI Meeting Studio
            </h1>
            <p className="text-gray-500 mt-1">Upload or paste your transcript — AI generates full notes, action items, and sends summaries to every attendee</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowScheduler(true)} variant="outline" className="gap-2">
              <CalendarPlus className="w-4 h-4" /> Schedule
            </Button>
            <Button onClick={() => setView(view === "new" ? "list" : "new")}
              className={`gap-2 ${view === "new" ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-gray-900 hover:bg-gray-800 text-white"}`}>
              {view === "new" ? <><X className="w-4 h-4" /> Cancel</> : <><Mic className="w-4 h-4" /> Add Transcript</>}
            </Button>
          </div>
        </div>

        {/* New Meeting Form */}
        <AnimatePresence>
          {view === "new" && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="border border-gray-100 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">New Meeting</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Button type="button" variant="outline" onClick={applyMondayTemplate} className="mb-2 gap-2">
                        <CalendarPlus className="w-4 h-4" /> Use weekly Monday alignment template
                      </Button>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Meeting Title *</label>
                      <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Q2 Strategy Review" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Date</label>
                      <Input type="date" value={form.meeting_date} onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Subsidiary</label>
                      <Select value={form.subsidiary} onValueChange={v => setForm(f => ({ ...f, subsidiary: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select subsidiary" /></SelectTrigger>
                        <SelectContent>{SUBSIDIARIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Attendees (emails or names, comma-separated)</label>
                      <Input value={form.attendees_raw} onChange={e => setForm(f => ({ ...f, attendees_raw: e.target.value }))}
                        placeholder="Lorraine Sekwati, Meriam Malatji, sarah.ngwenya@phakathiholdings.local" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Meeting Transcript *</label>
                      <label className="cursor-pointer flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                        <Upload className="w-3.5 h-3.5" /> Upload .txt file
                        <input type="file" accept=".txt,.text" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>
                    <AudioRecorder onTranscriptReady={(t) => setForm(f => ({ ...f, transcript: t }))} />
                    <div className="mt-2" />
                    <Textarea
                      value={form.transcript}
                      onChange={e => setForm(f => ({ ...f, transcript: e.target.value }))}
                      placeholder="Paste your meeting transcript here, or upload a .txt file above...

Example:
John: Good morning everyone. Let's start with the Q2 review.
Sarah: Our revenue was up 12% this quarter.
John: Great. Sarah, can you prepare a full report by Friday?
..."
                      className="h-52 font-mono text-sm resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">{form.transcript.length.toLocaleString()} characters</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5" />
                      Powered by Claude AI — uses more credits for best quality
                    </div>
                    <Button
                      onClick={handleGenerate}
                      disabled={!form.title || !form.transcript.trim() || processing}
                      className="gap-2 bg-gray-900 hover:bg-gray-800 text-white min-w-40"
                    >
                      {processing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Generate Notes</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Meetings List */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {meetings.length} Meeting{meetings.length !== 1 ? "s" : ""}
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : meetings.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="p-12 text-center">
                <Mic className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No meetings yet</p>
                <p className="text-gray-300 text-sm">Create your first meeting to get AI-generated notes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {meetings.map(m => (
                <MeetingCard key={m.id} meeting={m} onView={setSelectedMeeting} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMeeting && (
          <MeetingDetailModal meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} />
        )}
      </AnimatePresence>

      {/* Scheduler Modal */}
      <MeetingScheduler
        open={showScheduler}
        onClose={() => setShowScheduler(false)}
        onScheduled={(record) => setSelectedMeeting(null)}
      />
    </div>
  );
}
