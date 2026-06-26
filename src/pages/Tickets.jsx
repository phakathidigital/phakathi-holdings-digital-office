import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Ticket, Plus, Search, Clock, CheckCircle, AlertTriangle, MessageCircle,
  User, ChevronDown, ChevronUp, Send, Filter, X, Zap
} from "lucide-react";
import { format } from "date-fns";
import { hasGroupOverviewAccess, accessScopeLabel } from "@/lib/accessControl";

const CATEGORIES = ["IT Support", "HR Request", "Payroll Query", "Access & Permissions", "Facilities", "Onboarding", "Other"];
const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["open", "in_progress", "pending_info", "resolved", "closed"];

const QUEUE_MAP = {
  "IT Support": "IT Queue",
  "Access & Permissions": "IT Queue",
  "HR Request": "HR Queue",
  "Onboarding": "HR Queue",
  "Payroll Query": "Finance Queue",
  "Facilities": "General Queue",
  "Other": "General Queue",
};

// Department routing descriptions shown to users
const QUEUE_DESCRIPTIONS = {
  "IT Queue": { emoji: "💻", desc: "IT Support Team", sla: "4 business hours" },
  "HR Queue": { emoji: "👥", desc: "Human Resources Team", sla: "1 business day" },
  "Finance Queue": { emoji: "💰", desc: "Finance & Payroll Team", sla: "2 business days" },
  "General Queue": { emoji: "🏢", desc: "General Support Team", sla: "2 business days" },
};

const STATUS_CONFIG = {
  open:         { label: "Open",         color: "bg-blue-100 text-blue-700",   icon: Clock },
  in_progress:  { label: "In Progress",  color: "bg-yellow-100 text-yellow-700", icon: Zap },
  pending_info: { label: "Pending Info", color: "bg-orange-100 text-orange-700", icon: AlertTriangle },
  resolved:     { label: "Resolved",     color: "bg-green-100 text-green-700",  icon: CheckCircle },
  closed:       { label: "Closed",       color: "bg-gray-100 text-gray-500",    icon: X },
};

const PRIORITY_CONFIG = {
  low:      { color: "bg-gray-100 text-gray-500",   dot: "bg-gray-400" },
  medium:   { color: "bg-blue-50 text-blue-600",    dot: "bg-blue-500" },
  high:     { color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  critical: { color: "bg-red-100 text-red-700",     dot: "bg-red-600" },
};

function genTicketNumber() {
  return `TKT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

function TicketCard({ ticket, user, onOpen, isAdmin }) {
  const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
  const StatusIcon = status.icon;

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onOpen(ticket)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-gray-400">{ticket.ticket_number}</span>
              <Badge className={`text-xs border-0 ${priority.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot} mr-1 inline-block`} />
                {ticket.priority}
              </Badge>
              <Badge className={`text-xs border-0 ${status.color}`}>
                <StatusIcon className="w-3 h-3 mr-1" />{status.label}
              </Badge>
              <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
            </div>
            <p className="font-semibold text-gray-900 text-sm truncate">{ticket.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ticket.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{ticket.submitter_name || ticket.submitter_email}</span>
              <span>{ticket.queue}</span>
              {ticket.assigned_to_name && <span>→ {ticket.assigned_to_name}</span>}
              <span>{ticket.created_date ? format(new Date(ticket.created_date), "dd MMM") : ""}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketDetail({ ticket, user, isAdmin, onClose }) {
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ["ticket-comments", ticket?.id],
    queryFn: () => base44.entities.TicketComment.filter({ ticket_id: ticket?.id }),
    enabled: !!ticket?.id,
  });

  const addComment = useMutation({
    mutationFn: async (data) => {
      const me = await base44.auth.me();
      return base44.entities.TicketComment.create({
        ...data,
        ticket_id: ticket.id,
        author_email: me.email,
        author_name: me.full_name || me.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-comments", ticket.id] });
      setComment("");
    },
  });

  const updateTicket = useMutation({
    mutationFn: (data) => base44.entities.Ticket.update(ticket.id, data),
    onSuccess: async (updated) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      // Notify submitter on resolution
      if (updated.status === "resolved" && ticket.submitter_email) {
        await base44.integrations.Core.SendEmail({
          to: ticket.submitter_email,
          subject: `Your ticket ${ticket.ticket_number} has been resolved`,
          body: `Hi ${ticket.submitter_name || "there"},\n\nYour support ticket "${ticket.title}" (${ticket.ticket_number}) has been marked as Resolved.\n\n${updated.resolution_notes ? `Resolution: ${updated.resolution_notes}` : ""}\n\nIf you need further assistance, please submit a new ticket.\n\nPhakathi Holdings Support Team`,
        }).catch(() => {});
      }
    },
  });

  if (!ticket) return null;
  const status = STATUS_CONFIG[ticket.status];
  const visibleComments = isAdmin ? comments : comments.filter(c => !c.is_internal);

  return (
    <Dialog open={!!ticket} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <span className="font-mono text-gray-400">{ticket.ticket_number}</span>
            <span className="text-gray-900">{ticket.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`border-0 ${PRIORITY_CONFIG[ticket.priority]?.color}`}>{ticket.priority}</Badge>
            <Badge className={`border-0 ${status?.color}`}>{status?.label}</Badge>
            <Badge variant="outline">{ticket.category}</Badge>
            <Badge variant="outline">{ticket.queue}</Badge>
          </div>

          <p className="text-sm text-gray-700">{ticket.description}</p>

          <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
            <div><span className="font-medium">Submitted by:</span> {ticket.submitter_name}</div>
            <div><span className="font-medium">Date:</span> {ticket.created_date ? format(new Date(ticket.created_date), "dd MMM yyyy") : "—"}</div>
            <div><span className="font-medium">Assigned to:</span> {ticket.assigned_to_name || "Unassigned"}</div>
            <div><span className="font-medium">Subsidiary:</span> {ticket.subsidiary || "—"}</div>
          </div>

          {/* Admin controls */}
          {isAdmin && (
            <div className="p-3 bg-gray-50 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase">Admin Controls</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={ticket.status} onValueChange={(v) => updateTicket.mutate({ status: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Priority</Label>
                  <Select value={ticket.priority} onValueChange={(v) => updateTicket.mutate({ priority: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Resolution Notes</Label>
                <textarea className="w-full border rounded-lg p-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-gray-300" rows={2}
                  defaultValue={ticket.resolution_notes || ""}
                  onBlur={(e) => updateTicket.mutate({ resolution_notes: e.target.value })}
                  placeholder="Describe how this was resolved..." />
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase">Comments ({visibleComments.length})</p>
            {visibleComments.map(c => (
              <div key={c.id} className={`p-3 rounded-xl text-sm ${c.is_internal ? "bg-yellow-50 border border-yellow-100" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {(c.author_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{c.author_name}</span>
                  {c.is_internal && <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">Internal</Badge>}
                  <span className="text-xs text-gray-400 ml-auto">{c.created_date ? format(new Date(c.created_date), "dd MMM HH:mm") : ""}</span>
                </div>
                <p className="text-gray-700 text-sm">{c.content}</p>
              </div>
            ))}

            {/* Add comment */}
            <div className="space-y-2">
              <textarea className="w-full border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-300" rows={2}
                value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment or update..." />
              <div className="flex items-center justify-between">
                {isAdmin && (
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded" />
                    Internal note (not visible to submitter)
                  </label>
                )}
                <Button size="sm" className="ml-auto gap-2 bg-gray-900 hover:bg-gray-700 text-white"
                  disabled={!comment.trim() || addComment.isPending}
                  onClick={() => addComment.mutate({ content: comment, is_internal: isInternal })}>
                  <Send className="w-3.5 h-3.5" /> Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewTicketDialog({ open, onClose, user }) {
  const [form, setForm] = useState({ title: "", description: "", category: "IT Support", priority: "medium", subsidiary: "" });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const me = await base44.auth.me();
      const queue = QUEUE_MAP[data.category] || "General Queue";
      const queueInfo = QUEUE_DESCRIPTIONS[queue];
      const ticket = await base44.entities.Ticket.create({
        ...data,
        ticket_number: genTicketNumber(),
        queue,
        submitter_email: me.email,
        submitter_name: me.full_name || me.email,
        status: "open",
      });
      // Confirmation to submitter
      await base44.integrations.Core.SendEmail({
        to: me.email,
        subject: `${queueInfo?.emoji || "📋"} Ticket ${ticket.ticket_number} submitted — ${data.category}`,
        body: `Hi ${me.full_name || "there"},\n\nYour support ticket has been submitted and automatically routed to the ${queueInfo?.desc || queue}.\n\n━━━━━━━━━━━━━━━━━━━━━━\nTicket Number: ${ticket.ticket_number}\nTitle: ${data.title}\nCategory: ${data.category}\nPriority: ${data.priority.toUpperCase()}\nRouted to: ${queueInfo?.desc || queue}\nExpected Response: ${queueInfo?.sla || "2 business days"}\n━━━━━━━━━━━━━━━━━━━━━━\n\nYou will receive an email notification when your ticket status changes.\n\nPhakathi Holdings Support`,
      }).catch(() => {});
      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      onClose();
      setForm({ title: "", description: "", category: "IT Support", priority: "medium", subsidiary: "" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Ticket className="w-4 h-4" />Submit a Ticket</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief summary of your issue" />
          </div>
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <textarea className="w-full border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-300" rows={3}
              value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Please describe your issue in detail..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl space-y-1">
            <p className="text-xs text-blue-700 font-semibold">
              {QUEUE_DESCRIPTIONS[QUEUE_MAP[form.category]]?.emoji} Auto-routing to: {QUEUE_DESCRIPTIONS[QUEUE_MAP[form.category]]?.desc}
            </p>
            <p className="text-xs text-blue-600">
              Expected response: <strong>{QUEUE_DESCRIPTIONS[QUEUE_MAP[form.category]]?.sla}</strong> · You'll receive email confirmation and updates.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)}
              disabled={!form.title || !form.description || createMutation.isPending}
              className="flex-1 bg-gray-900 hover:bg-gray-700 text-white">
              {createMutation.isPending ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Tickets() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterQueue, setFilterQueue] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isAdmin = hasGroupOverviewAccess(user);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.Ticket.list("-created_date", 300),
  });

  const myTickets = tickets.filter(t => t.submitter_email === user?.email);
  const allQueues = [...new Set(tickets.map(t => t.queue).filter(Boolean))];

  const filtered = useMemo(() => {
    const base = isAdmin ? tickets : myTickets;
    return base.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.title?.toLowerCase().includes(q) || t.ticket_number?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      const matchPriority = filterPriority === "all" || t.priority === filterPriority;
      const matchQueue = filterQueue === "all" || t.queue === filterQueue;
      return matchSearch && matchStatus && matchPriority && matchQueue;
    });
  }, [tickets, myTickets, isAdmin, search, filterStatus, filterPriority, filterQueue]);

  const stats = {
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    critical: tickets.filter(t => t.priority === "critical" && !["resolved","closed"].includes(t.status)).length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Ticket className="w-8 h-8 text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
              <p className="text-gray-600 text-sm">IT, HR & general support requests · {accessScopeLabel(user)}</p>
            </div>
          </div>
          <Button onClick={() => setShowNew(true)} className="bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg gap-2">
            <Plus className="w-4 h-4" /> New Ticket
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Open", value: stats.open, color: "text-blue-600" },
            { label: "In Progress", value: stats.inProgress, color: "text-yellow-600" },
            { label: "Critical", value: stats.critical, color: "text-red-600" },
            { label: "Resolved", value: stats.resolved, color: "text-green-600" },
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
          <div className="relative flex-1 min-w-40">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." className="pl-8 bg-white" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 bg-white text-sm h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32 bg-white text-sm h-9"><SelectValue placeholder="All Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select value={filterQueue} onValueChange={setFilterQueue}>
              <SelectTrigger className="w-36 bg-white text-sm h-9"><SelectValue placeholder="All Queues" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Queues</SelectItem>
                {allQueues.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Tickets */}
        <div>
          {isAdmin && (
            <Tabs defaultValue="all">
              <TabsList className="bg-gray-100 mb-4">
                <TabsTrigger value="all">All Tickets ({tickets.length})</TabsTrigger>
                <TabsTrigger value="it">IT Queue ({tickets.filter(t => t.queue === "IT Queue").length})</TabsTrigger>
                <TabsTrigger value="hr">HR Queue ({tickets.filter(t => t.queue === "HR Queue").length})</TabsTrigger>
                <TabsTrigger value="finance">Finance ({tickets.filter(t => t.queue === "Finance Queue").length})</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)
            ) : filtered.length === 0 ? (
              <Card className="border-none shadow-md">
                <CardContent className="p-12 text-center">
                  <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">No tickets found.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNew(true)}>Submit a ticket</Button>
                </CardContent>
              </Card>
            ) : (
              filtered.map(ticket => (
                <motion.div key={ticket.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <TicketCard ticket={ticket} user={user} isAdmin={isAdmin} onOpen={setSelectedTicket} />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <NewTicketDialog open={showNew} onClose={() => setShowNew(false)} user={user} />
      {selectedTicket && (
        <TicketDetail ticket={selectedTicket} user={user} isAdmin={isAdmin} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
}
