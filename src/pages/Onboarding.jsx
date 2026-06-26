import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserCheck, Plus, ChevronDown, ChevronUp, Bell, CheckCircle, Users, Camera, Filter } from "lucide-react";
import CameraScanner from "../components/shared/CameraScanner";
import { buildChecklist, buildEmptyChecklist, overallProgress, sectionProgress } from "../components/onboarding/DepartmentChecklist";
import { SUBSIDIARIES } from "@/lib/subsidiaries";
import { format, parseISO } from "date-fns";

const DEPARTMENTS = ["Management","Finance","HR","IT","Operations","Empoweryst"];

function ProgressBar({ pct, color = "bg-gray-800" }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function OnboardingCard({ record, isAdmin, onUpdate, onSendReminder }) {
  const [expanded, setExpanded] = useState(false);
  const checklist = buildChecklist(record.department, record.subsidiary);
  const pct = overallProgress(record, checklist);
  const statusColor = pct === 100 ? "bg-green-100 text-green-700" : pct > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600";
  const statusLabel = pct === 100 ? "Completed" : pct > 0 ? "In Progress" : "Not Started";

  const toggle = async (sectionKey, itemKey, val, sectionItems) => {
    const updatedSection = { ...(record[sectionKey] || {}), [itemKey]: val };
    const updatedRecord = { ...record, [sectionKey]: updatedSection };
    const prog = overallProgress(updatedRecord, checklist);
    const secPct = sectionProgress(updatedRecord, sectionKey, sectionItems);

    onUpdate(record.id, {
      [sectionKey]: updatedSection,
      status: prog === 100 ? "completed" : prog > 0 ? "in_progress" : "not_started",
    });

    // Milestone notification when a section hits 100%
    if (secPct === 100 && record.manager_email) {
      const section = checklist.find(s => s.key === sectionKey);
      await base44.integrations.Core.SendEmail({
        to: record.manager_email,
        subject: `Onboarding Milestone: ${section?.milestoneLabel} — ${record.employee_name}`,
        body: `Hi ${record.manager_name || "Manager"},\n\nGreat news! The "${section?.label}" section of ${record.employee_name}'s onboarding has been completed (100%).\n\nOverall progress: ${prog}%\n\nLog in to view the full onboarding checklist.\n\nPhakathi Holdings HR`,
      }).catch(() => {});
    }

    // Full completion notification
    if (prog === 100 && record.employee_email) {
      await base44.integrations.Core.SendEmail({
        to: record.employee_email,
        subject: `🎉 Onboarding Complete — Welcome to the team, ${record.employee_name}!`,
        body: `Hi ${record.employee_name},\n\nCongratulations! Your onboarding is now 100% complete. All documents, accounts, training, and facilities have been set up.\n\nYou're all set to hit the ground running. Welcome to ${record.subsidiary || "Phakathi Holdings"}!\n\nHR Team`,
      }).catch(() => {});
    }
  };

  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-lg">
              {record.employee_name?.charAt(0) || "?"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{record.employee_name}</p>
              <p className="text-sm text-gray-500">
                {record.department}
                {record.subsidiary ? ` · ${record.subsidiary}` : ""}
                {record.start_date ? ` · Starts ${format(parseISO(record.start_date), "d MMM yyyy")}` : ""}
              </p>
              {record.manager_name && <p className="text-xs text-gray-400">Manager: {record.manager_name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`${statusColor} border-0 text-xs`}>{statusLabel}</Badge>
            <Button variant="ghost" size="sm" onClick={() => onSendReminder(record)}>
              <Bell className="w-4 h-4 text-gray-400 hover:text-gray-700" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Overall Progress</span><span>{pct}%</span>
          </div>
          <ProgressBar pct={pct} />
        </div>

        {/* Section mini-progress bars */}
        <div className="mt-2 grid grid-cols-4 gap-1">
          {checklist.map(section => {
            const sp = sectionProgress(record, section.key, section.items);
            return (
              <div key={section.key} className="text-center">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-0.5">
                  <div className="h-full bg-gray-700 rounded-full transition-all" style={{ width: `${sp}%` }} />
                </div>
                <p className="text-xs text-gray-400 truncate leading-tight">{section.label.split(" ")[0]}</p>
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-4">
              {checklist.map(section => {
                const secPct = sectionProgress(record, section.key, section.items);
                return (
                  <div key={section.key} className={`p-4 rounded-xl border ${section.color}`}>
                    <div className="flex justify-between items-center mb-2">
                      <p className={`font-semibold text-sm ${section.headerColor}`}>{section.label}</p>
                      <span className="text-xs text-gray-500">{secPct}%</span>
                    </div>
                    <ProgressBar pct={secPct} />
                    <div className="mt-3 space-y-2">
                      {section.items.map(item => {
                        const checked = record[section.key]?.[item.key] || false;
                        return (
                          <label key={item.key} className="flex items-center gap-2.5 cursor-pointer group">
                            <button
                              onClick={() => toggle(section.key, item.key, !checked, section.items)}
                              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${checked ? "bg-gray-900 text-white" : "border-2 border-gray-300 hover:border-gray-500"}`}
                            >
                              {checked && <CheckCircle className="w-3.5 h-3.5" />}
                            </button>
                            <span className={`text-sm transition-colors ${checked ? "line-through text-gray-400" : "text-gray-700"}`}>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    {secPct === 100 && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {section.milestoneLabel} — milestone email sent to manager
                      </p>
                    )}
                  </div>
                );
              })}
              {record.notes && (
                <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Notes: </span>{record.notes}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default function Onboarding() {
  const [showCreate, setShowCreate] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [form, setForm] = useState({
    employee_name: "", employee_email: "", department: "", subsidiary: "",
    start_date: "", manager_name: "", manager_email: "", notes: ""
  });

  const handleDocScan = (data) => {
    setShowScanner(false);
    if (data.employee_name) setForm(f => ({ ...f, employee_name: data.employee_name }));
    if (data.employee_email) setForm(f => ({ ...f, employee_email: data.employee_email }));
    if (data.start_date) setForm(f => ({ ...f, start_date: data.start_date }));
    if (data.notes || data.document_type) setForm(f => ({ ...f, notes: [data.document_type, data.notes].filter(Boolean).join(": ") }));
  };

  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isAdmin = user?.role === "admin";

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["onboarding"],
    queryFn: () => base44.entities.OnboardingRecord.list("-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const checklist = buildChecklist(data.department, data.subsidiary);
      const emptyChecks = buildEmptyChecklist(checklist);
      return base44.entities.OnboardingRecord.create({
        ...data,
        status: "not_started",
        ...emptyChecks,
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
      setShowCreate(false);
      // Welcome email
      if (form.employee_email) {
        await base44.integrations.Core.SendEmail({
          to: form.employee_email,
          subject: `Welcome to ${form.subsidiary || "Phakathi Holdings"}, ${form.employee_name}! 🎉`,
          body: `Hi ${form.employee_name},\n\nWelcome to ${form.subsidiary || "Phakathi Holdings"}! We're excited to have you joining us on ${form.start_date}.\n\nYour personalised onboarding checklist has been set up covering document collection, IT account provisioning, training, and facilities.\n\nYour HR team will be in touch shortly with next steps.\n\n${form.manager_name ? `Your manager ${form.manager_name} will also be reaching out.` : ""}\n\nWe look forward to seeing you!\n\nPhakathi Holdings HR Team`,
        }).catch(() => {});
      }
      // Notify manager
      if (form.manager_email) {
        const checklist = buildChecklist(form.department, form.subsidiary);
        const totalTasks = checklist.reduce((s, sec) => s + sec.items.length, 0);
        await base44.integrations.Core.SendEmail({
          to: form.manager_email,
          subject: `New Hire Onboarding Started: ${form.employee_name} (${form.department})`,
          body: `Hi ${form.manager_name || "Manager"},\n\nAn onboarding record has been created for ${form.employee_name} (${form.employee_email}) joining ${form.subsidiary || "Phakathi Holdings"} in the ${form.department} department on ${form.start_date}.\n\nA personalised ${totalTasks}-task checklist has been generated covering IT, HR, and Facilities tasks specific to the ${form.department} department.\n\nPlease log in to complete the onboarding checklist. You will receive milestone notifications as each section is completed.\n\nHR Team`,
        }).catch(() => {});
      }
      setForm({ employee_name: "", employee_email: "", department: "", subsidiary: "", start_date: "", manager_name: "", manager_email: "", notes: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OnboardingRecord.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding"] }),
  });

  const sendReminder = async (record) => {
    const checklist = buildChecklist(record.department, record.subsidiary);
    const pct = overallProgress(record, checklist);
    const incomplete = checklist.flatMap(s =>
      s.items.filter(i => !record[s.key]?.[i.key]).map(i => `• ${i.label} (${s.label})`)
    );
    if (record.employee_email) {
      await base44.integrations.Core.SendEmail({
        to: record.employee_email,
        subject: `Onboarding Reminder – ${pct}% Complete`,
        body: `Hi ${record.employee_name},\n\nYour onboarding is currently ${pct}% complete. The following items are still outstanding:\n\n${incomplete.join("\n")}\n\nPlease work with your manager to complete these as soon as possible.\n\nPhakathi Holdings HR`,
      }).catch(() => {});
    }
    if (record.manager_email) {
      await base44.integrations.Core.SendEmail({
        to: record.manager_email,
        subject: `Onboarding Reminder: ${record.employee_name} – ${pct}% Complete`,
        body: `Hi ${record.manager_name || "Manager"},\n\nOnboarding for ${record.employee_name} is ${pct}% complete. Outstanding items:\n\n${incomplete.join("\n")}\n\nLog in to the portal to update the checklist.\n\nHR Team`,
      }).catch(() => {});
    }
  };

  const inProgress = records.filter(r => r.status === "in_progress").length;
  const completed = records.filter(r => r.status === "completed").length;
  const notStarted = records.filter(r => r.status === "not_started").length;

  const filteredRecords = records.filter(r => {
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchDept = filterDept === "all" || r.department === filterDept;
    return matchStatus && matchDept;
  });

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Onboarding</h1>
              <p className="text-gray-600 text-sm">Dynamic checklists tailored by department & subsidiary</p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg gap-2">
              <Plus className="w-4 h-4" /> Add New Hire
            </Button>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Not Started", value: notStarted, color: "text-gray-500" },
            { label: "In Progress", value: inProgress, color: "text-blue-600" },
            { label: "Completed", value: completed, color: "text-green-600" },
          ].map((s, i) => (
            <Card key={i} className="border-none shadow-md">
              <CardContent className="p-5 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 bg-white text-sm h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-36 bg-white text-sm h-9"><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          {(filterStatus !== "all" || filterDept !== "all") && (
            <button onClick={() => { setFilterStatus("all"); setFilterDept("all"); }}
              className="text-xs text-gray-500 hover:text-gray-800 underline">Clear filters</button>
          )}
        </div>

        {/* Records */}
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filteredRecords.length === 0 ? (
          <Card className="border-none shadow-md"><CardContent className="p-12 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p>{records.length === 0 ? "No onboarding records yet." : "No records match your filters."}</p>
            {isAdmin && records.length === 0 && <p className="text-sm mt-1">Add a new hire to get started.</p>}
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map(record => (
              <OnboardingCard
                key={record.id}
                record={record}
                isAdmin={isAdmin}
                onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                onSendReminder={sendReminder}
              />
            ))}
          </div>
        )}
      </div>

      {showScanner && <CameraScanner mode="document" onExtracted={handleDocScan} onClose={() => setShowScanner(false)} />}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Hire</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <button type="button" onClick={() => setShowScanner(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              <Camera className="w-4 h-4" /> Scan Employee Document
              <span className="text-xs text-white/60 ml-1">— AI auto-fills fields</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="flex-1 h-px bg-gray-100"/><span>or fill manually</span><div className="flex-1 h-px bg-gray-100"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input value={form.employee_name} onChange={e => setForm(f => ({...f, employee_name: e.target.value}))} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={form.employee_email} onChange={e => setForm(f => ({...f, employee_email: e.target.value}))} placeholder="employee@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Department *</Label>
                <Select value={form.department} onValueChange={v => setForm(f => ({...f, department: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subsidiary *</Label>
                <Select value={form.subsidiary} onValueChange={v => setForm(f => ({...f, subsidiary: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select subsidiary" /></SelectTrigger>
                  <SelectContent>{SUBSIDIARIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Start Date *</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <Label>Manager Name</Label>
                <Input value={form.manager_name} onChange={e => setForm(f => ({...f, manager_name: e.target.value}))} placeholder="Manager full name" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Manager Email</Label>
                <Input type="email" value={form.manager_email} onChange={e => setForm(f => ({...f, manager_email: e.target.value}))} placeholder="manager@company.com" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Any special notes for this hire" />
              </div>
            </div>

            {form.department && (
              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                <strong>Preview:</strong> A personalised checklist will be auto-generated for <strong>{form.department}</strong>
                {form.subsidiary ? ` at ${form.subsidiary}` : ""} covering Documents, IT Accounts, Training & Orientation, and Facilities.
                {form.subsidiary && ["Kaelo","Synergex Health","Kaelo Education","Micky Mouse School / Baby Geniuses","Kaelo"].includes(form.subsidiary) &&
                  ` Additional ${form.subsidiary}-specific tasks will also be included.`}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.employee_name || !form.employee_email || !form.department || !form.subsidiary || !form.start_date || createMutation.isPending}
                className="flex-1 bg-gray-900 hover:bg-gray-700 text-white">
                {createMutation.isPending ? "Creating..." : "Create & Send Welcome Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}