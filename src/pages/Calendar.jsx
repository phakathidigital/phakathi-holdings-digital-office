import React, { useState, useMemo } from "react";
import { api } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Calendar as CalIcon, Filter,
  FolderKanban, CalendarOff, Users, ClipboardList, Clock, X, Layers, Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SUBSIDIARY_OPTIONS_WITH_ALL as SUBSIDIARIES } from "@/lib/subsidiaries";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, parseISO, isValid, startOfDay
} from "date-fns";
import { getHolidaysInRange } from "@/lib/saHolidays";


const EVENT_TYPES = {
  deadline:  { label: "Project Deadline", color: "bg-red-500",    text: "text-red-700",    bg: "bg-red-50",    icon: FolderKanban },
  milestone: { label: "Milestone",        color: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50", icon: Layers },
  leave:     { label: "Leave",            color: "bg-amber-500",  text: "text-amber-700",  bg: "bg-amber-50",  icon: CalendarOff },
  meeting:   { label: "Meeting",          color: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50",   icon: ClipboardList },
  onboarding:{ label: "New Hire",         color: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50",  icon: Users },
  holiday:   { label: "SA Holidays",      color: "bg-yellow-500", text: "text-yellow-800", bg: "bg-yellow-50", icon: Flag },
};

function safeParse(str) {
  if (!str) return null;
  try { const d = parseISO(str); return isValid(d) ? d : null; } catch { return null; }
}

function EventPill({ event, onClick }) {
  const cfg = EVENT_TYPES[event.type] || EVENT_TYPES.meeting;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(event); }}
      className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate font-medium ${cfg.color} text-white hover:opacity-80 transition-opacity`}
      title={event.title}
    >
      {event.title}
    </button>
  );
}

function DayCell({ date, events, isCurrentMonth, isToday, onClick, onEventClick }) {
  const MAX_VISIBLE = 3;
  const visible = events.slice(0, MAX_VISIBLE);
  const overflow = events.length - MAX_VISIBLE;
  return (
    <div
      onClick={() => onClick(date, events)}
      className={`min-h-[90px] p-1.5 border-b border-r border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${!isCurrentMonth ? "bg-gray-50/50" : "bg-white"}`}
    >
      <span className={`text-xs font-semibold inline-flex w-6 h-6 items-center justify-center rounded-full mb-1 ${
        isToday ? "bg-gray-900 text-white" : isCurrentMonth ? "text-gray-800" : "text-gray-300"
      }`}>
        {format(date, "d")}
      </span>
      <div className="space-y-0.5">
        {visible.map((ev, i) => <EventPill key={i} event={ev} onClick={onEventClick} />)}
        {overflow > 0 && (
          <p className="text-xs text-gray-400 pl-1">+{overflow} more</p>
        )}
      </div>
    </div>
  );
}

function EventDetailPanel({ event, onClose }) {
  const cfg = EVENT_TYPES[event.type] || EVENT_TYPES.meeting;
  const Icon = cfg.icon;
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-100 z-40 flex flex-col">
      <div className={`p-5 ${cfg.bg}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${cfg.text}`} />
            <Badge className={`${cfg.bg} ${cfg.text} border-0 text-xs`}>{cfg.label}</Badge>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
        </div>
        <h3 className="font-bold text-gray-900 mt-3 text-lg leading-tight">{event.title}</h3>
        {event.date && <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{format(parseISO(event.date), "EEEE, d MMMM yyyy")}</p>}
      </div>
      <div className="p-5 space-y-3 flex-1 overflow-y-auto">
        {event.subsidiary && <div><p className="text-xs font-semibold text-gray-400 uppercase">Subsidiary</p><p className="text-sm text-gray-700">{event.subsidiary}</p></div>}
        {event.description && <div><p className="text-xs font-semibold text-gray-400 uppercase">Details</p><p className="text-sm text-gray-700">{event.description}</p></div>}
        {event.person && <div><p className="text-xs font-semibold text-gray-400 uppercase">Person</p><p className="text-sm text-gray-700">{event.person}</p></div>}
        {event.status && <div><p className="text-xs font-semibold text-gray-400 uppercase">Status</p><Badge variant="outline" className="text-xs">{event.status}</Badge></div>}
      </div>
    </motion.div>
  );
}

function DayModal({ date, events, onClose, onEventClick }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">{format(date, "EEEE, d MMMM yyyy")}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        {events.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No events on this day</p>
        ) : (
          <div className="space-y-2">
            {events.map((ev, i) => {
              const cfg = EVENT_TYPES[ev.type] || EVENT_TYPES.meeting;
              const Icon = cfg.icon;
              return (
                <button key={i} onClick={() => { onEventClick(ev); onClose(); }}
                  className={`w-full text-left p-3 rounded-xl ${cfg.bg} hover:opacity-80 transition-opacity`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${cfg.text}`} />
                    <span className={`text-sm font-semibold ${cfg.text}`}>{ev.title}</span>
                  </div>
                  {ev.description && <p className="text-xs text-gray-500 mt-1 truncate">{ev.description}</p>}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const [subsidiaryFilter, setSubsidiaryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: projects = [] } = useQuery({ queryKey: ["cal-projects"], queryFn: () => api.entities.Project.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ["cal-tasks"], queryFn: () => api.entities.Task.list() });
  const { data: leaves = [] } = useQuery({ queryKey: ["cal-leaves"], queryFn: () => api.entities.LeaveRequest.list() });
  const { data: meetings = [] } = useQuery({ queryKey: ["cal-meetings"], queryFn: () => api.entities.MeetingNote.list() });
  const { data: onboardings = [] } = useQuery({ queryKey: ["cal-onboarding"], queryFn: () => api.entities.OnboardingRecord.list() });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Build unified event list
  const allEvents = useMemo(() => {
    const evs = [];

    // Project deadlines & milestones
    projects.forEach(p => {
      if (p.end_date) evs.push({ type: "deadline", title: `📁 ${p.name} deadline`, date: p.end_date, subsidiary: p.subsidiary, description: p.description, status: p.status });
      if (p.start_date) evs.push({ type: "milestone", title: `🚀 ${p.name} kickoff`, date: p.start_date, subsidiary: p.subsidiary, description: `Project starts` });
    });

    // Task due dates
    tasks.forEach(t => {
      if (t.due_date) evs.push({ type: "deadline", title: `✓ ${t.title}`, date: t.due_date, description: t.description, person: t.assigned_to, status: t.status });
    });

    // Leave
    leaves.forEach(l => {
      if (l.start_date) evs.push({
        type: "leave",
        title: `🌴 ${l.employee_name || l.employee_email} – ${l.leave_type}`,
        date: l.start_date,
        subsidiary: l.subsidiary,
        description: `${l.start_date} → ${l.end_date} (${l.days_requested || "?"} days)`,
        person: l.employee_email,
        status: l.status,
      });
    });

    // Meetings
    meetings.forEach(m => {
      if (m.meeting_date) evs.push({ type: "meeting", title: `🗓 ${m.title}`, date: m.meeting_date, description: m.venue, subsidiary: m.department });
    });

    // Onboarding start dates
    onboardings.forEach(o => {
      if (o.start_date) evs.push({ type: "onboarding", title: `👋 ${o.employee_name} joins`, date: o.start_date, subsidiary: o.subsidiary, person: o.employee_email, status: o.status });
    });

    // SA public, recognised, and special holidays for the visible calendar range
    getHolidaysInRange(gridStart, gridEnd).forEach(h => {
      evs.push({
        type: "holiday",
        title: `${h.emoji} ${h.name}`,
        date: h.dateKey,
        description: `${h.type === "public" ? "South African public holiday" : "Recognised/special day"}${h.observed ? ` · observed from ${h.originalDate}` : ""}. ${h.message}`,
        status: h.type === "public" ? "Public Holiday" : "Special Day",
      });
    });

    return evs.filter(e => e.date);
  }, [projects, tasks, leaves, meetings, onboardings, gridStart, gridEnd]);

  const filteredEvents = useMemo(() => allEvents.filter(e => {
    const subOk = subsidiaryFilter === "All" || !e.subsidiary || e.subsidiary === subsidiaryFilter;
    const typeOk = typeFilter === "all" || e.type === typeFilter;
    return subOk && typeOk;
  }), [allEvents, subsidiaryFilter, typeFilter]);

  const days = [];
  let d = gridStart;
  while (d <= gridEnd) { days.push(d); d = addDays(d, 1); }

  const eventsByDate = useMemo(() => {
    const map = {};
    filteredEvents.forEach(ev => {
      const key = ev.date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [filteredEvents]);

  const today = new Date();
  const todayStart = startOfDay(today);
  const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Upcoming events for sidebar
  const upcoming = filteredEvents
    .filter(e => safeParse(e.date) >= todayStart)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  const handleDayClick = (date, events) => {
    setSelectedDay(date);
    setDayEvents(events);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex items-center gap-3">
            <CalIcon className="w-6 h-6 text-gray-700" />
            <h1 className="text-xl font-bold text-gray-900">Team Calendar</h1>
            <div className="flex items-center gap-1 ml-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-base font-semibold text-gray-800 min-w-32 text-center">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="ml-2 h-8 text-xs" onClick={() => setCurrentDate(new Date())}>Today</Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={subsidiaryFilter} onValueChange={setSubsidiaryFilter}>
              <SelectTrigger className="h-8 text-xs w-44 bg-white">
                <SelectValue placeholder="All Subsidiaries" />
              </SelectTrigger>
              <SelectContent>
                {SUBSIDIARIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs w-36 bg-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(EVENT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Legend */}
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 mt-3">
          {Object.entries(EVENT_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setTypeFilter(typeFilter === k ? "all" : k)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${typeFilter === k ? `${v.bg} ${v.text} border-transparent font-semibold` : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
              <span className={`w-2 h-2 rounded-full ${v.color}`} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-4 gap-4">
        {/* Calendar Grid */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const key = format(day, "yyyy-MM-dd");
                const dayEvs = eventsByDate[key] || [];
                return (
                  <DayCell
                    key={i}
                    date={day}
                    events={dayEvs}
                    isCurrentMonth={isSameMonth(day, currentDate)}
                    isToday={isSameDay(day, today)}
                    onClick={handleDayClick}
                    onEventClick={setSelectedEvent}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming sidebar */}
        <div className="hidden lg:flex flex-col w-64 shrink-0 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex-1">
            <h3 className="font-semibold text-gray-700 text-sm mb-3">Upcoming Events</h3>
            {upcoming.length === 0 ? (
              <p className="text-gray-400 text-xs">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((ev, i) => {
                  const cfg = EVENT_TYPES[ev.type] || EVENT_TYPES.meeting;
                  const Icon = cfg.icon;
                  const d = safeParse(ev.date);
                  return (
                    <button key={i} onClick={() => setSelectedEvent(ev)}
                      className={`w-full text-left p-2.5 rounded-xl ${cfg.bg} hover:opacity-80 transition-opacity`}>
                      <div className="flex items-start gap-2">
                        <Icon className={`w-3.5 h-3.5 ${cfg.text} mt-0.5 shrink-0`} />
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold ${cfg.text} truncate`}>{ev.title}</p>
                          {d && <p className="text-xs text-gray-400 mt-0.5">{format(d, "d MMM")}</p>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-700 text-sm mb-3">This Month</h3>
            <div className="space-y-2">
              {Object.entries(EVENT_TYPES).map(([k, v]) => {
                const count = filteredEvents.filter(e => e.type === k && e.date?.startsWith(format(currentDate, "yyyy-MM"))).length;
                return (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{v.label}</span>
                    <Badge className={`${v.bg} ${v.text} border-0 text-xs h-5`}>{count}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Day modal */}
      <AnimatePresence>
        {selectedDay && (
          <DayModal date={selectedDay} events={dayEvents} onClose={() => setSelectedDay(null)} onEventClick={setSelectedEvent} />
        )}
      </AnimatePresence>

      {/* Event detail panel */}
      <AnimatePresence>
        {selectedEvent && <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      </AnimatePresence>
    </div>
  );
}
