import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, format, isSameDay, addWeeks, subWeeks,
  addMonths, subMonths, isWithinInterval, parseISO, addDays, subDays,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarDays, ChevronLeft, ChevronRight, Users, Coffee, Mic } from "lucide-react";

const VIEW_MODES = ["day", "week", "month"];

const LEAVE_COLORS = {
  "Annual Leave":           "bg-blue-100 text-blue-700 border-blue-200",
  "Sick Leave":             "bg-red-100 text-red-700 border-red-200",
  "Family Responsibility":  "bg-purple-100 text-purple-700 border-purple-200",
  "Study Leave":            "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Unpaid Leave":           "bg-gray-100 text-gray-600 border-gray-200",
  "Maternity Leave":        "bg-pink-100 text-pink-700 border-pink-200",
  "Paternity Leave":        "bg-indigo-100 text-indigo-700 border-indigo-200",
};

function initials(name = "") {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function Avatar({ name, email }) {
  const colors = ["bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500","bg-pink-500","bg-teal-500"];
  const ci = email ? email.charCodeAt(0) % colors.length : 0;
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${colors[ci]}`}>
      {initials(name || email)}
    </div>
  );
}

function getEventsOnDay(day, leaveRequests, meetings, users) {
  const events = [];

  leaveRequests.forEach((lr) => {
    if (lr.status !== "approved") return;
    const start = parseISO(lr.start_date);
    const end = parseISO(lr.end_date);
    if (isWithinInterval(day, { start, end })) {
      const user = users.find((u) => u.email === lr.employee_email);
      events.push({
        type: "leave",
        label: lr.leave_type,
        email: lr.employee_email,
        name: lr.employee_name || user?.full_name || lr.employee_email,
        colorClass: LEAVE_COLORS[lr.leave_type] || "bg-gray-100 text-gray-600",
      });
    }
  });

  meetings.forEach((m) => {
    if (!m.meeting_date) return;
    if (isSameDay(parseISO(m.meeting_date), day)) {
      (m.attendees || []).forEach((email) => {
        const user = users.find((u) => u.email === email);
        events.push({
          type: "meeting",
          label: m.title,
          email,
          name: user?.full_name || email,
          colorClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
        });
      });
    }
  });

  return events;
}

function DayCell({ day, leaveRequests, meetings, users, isToday, compact = false }) {
  const events = getEventsOnDay(day, leaveRequests, meetings, users);
  const leaveEvents = events.filter(e => e.type === "leave");
  const meetingEvents = events.filter(e => e.type === "meeting");

  return (
    <div className={`min-h-[80px] p-2 border-b border-r border-gray-100 ${isToday ? "bg-blue-50/60" : "bg-white"} ${compact ? "min-h-[60px]" : ""}`}>
      <div className={`text-xs font-semibold mb-1 ${isToday ? "text-blue-600" : "text-gray-500"}`}>
        {compact ? format(day, "d") : format(day, "d MMM")}
      </div>
      <div className="space-y-1">
        {leaveEvents.slice(0, compact ? 2 : 99).map((ev, i) => (
          <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-default ${ev.colorClass}`}>
                  <Coffee className="inline w-2.5 h-2.5 mr-0.5" />
                  {compact ? ev.name.split(" ")[0] : `${ev.name} – ${ev.label}`}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{ev.name}</p>
                <p>{ev.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {meetingEvents.slice(0, compact ? 1 : 99).map((ev, i) => (
          <TooltipProvider key={`m-${i}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-default ${ev.colorClass}`}>
                  <Mic className="inline w-2.5 h-2.5 mr-0.5" />
                  {compact ? ev.name.split(" ")[0] : `${ev.name} – ${ev.label}`}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{ev.name}</p>
                <p className="text-xs text-gray-500">Meeting: {ev.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {compact && events.length > 3 && (
          <div className="text-[10px] text-gray-400">+{events.length - 3} more</div>
        )}
      </div>
    </div>
  );
}

function DayView({ day, leaveRequests, meetings, users }) {
  const events = getEventsOnDay(day, leaveRequests, meetings, users);
  const leaveToday = events.filter(e => e.type === "leave");
  const meetingsToday = events.filter(e => e.type === "meeting");

  const available = users.filter(
    (u) => !leaveToday.some((e) => e.email === u.email)
  );

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-red-600 flex items-center gap-2">
            <Coffee className="w-4 h-4" /> On Leave ({leaveToday.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {leaveToday.length === 0 && <p className="text-sm text-gray-400">No one on leave today</p>}
          {leaveToday.map((ev, i) => (
            <div key={i} className="flex items-center gap-2">
              <Avatar name={ev.name} email={ev.email} />
              <div>
                <p className="text-sm font-medium text-gray-900">{ev.name}</p>
                <p className="text-xs text-gray-500">{ev.label}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-emerald-600 flex items-center gap-2">
            <Mic className="w-4 h-4" /> In Meetings ({meetingsToday.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {meetingsToday.length === 0 && <p className="text-sm text-gray-400">No meetings recorded</p>}
          {meetingsToday.map((ev, i) => (
            <div key={i} className="flex items-center gap-2">
              <Avatar name={ev.name} email={ev.email} />
              <div>
                <p className="text-sm font-medium text-gray-900">{ev.name}</p>
                <p className="text-xs text-gray-500 truncate">{ev.label}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-green-600 flex items-center gap-2">
            <Users className="w-4 h-4" /> Available ({available.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {available.length === 0 && <p className="text-sm text-gray-400">No one available</p>}
          {available.map((u, i) => (
            <div key={i} className="flex items-center gap-2">
              <Avatar name={u.full_name} email={u.email} />
              <p className="text-sm font-medium text-gray-900">{u.full_name || u.email}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TeamAttendance() {
  const [viewMode, setViewMode] = useState("week");
  const [anchor, setAnchor] = useState(new Date());

  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => base44.entities.User.list() });
  const { data: leaveRequests = [] } = useQuery({ queryKey: ["leaveRequests"], queryFn: () => base44.entities.LeaveRequest.list("-start_date", 200) });
  const { data: meetings = [] } = useQuery({ queryKey: ["meetingStudio"], queryFn: () => base44.entities.MeetingStudio.list("-meeting_date", 200) });

  const approvedLeave = leaveRequests.filter((l) => l.status === "approved");

  const navigate = (dir) => {
    if (viewMode === "day")   setAnchor((d) => dir > 0 ? addDays(d, 1) : subDays(d, 1));
    if (viewMode === "week")  setAnchor((d) => dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1));
    if (viewMode === "month") setAnchor((d) => dir > 0 ? addMonths(d, 1) : subMonths(d, 1));
  };

  const days = useMemo(() => {
    if (viewMode === "day")   return [anchor];
    if (viewMode === "week")  return eachDayOfInterval({ start: startOfWeek(anchor, { weekStartsOn: 1 }), end: endOfWeek(anchor, { weekStartsOn: 1 }) });
    if (viewMode === "month") return eachDayOfInterval({ start: startOfMonth(anchor), end: endOfMonth(anchor) });
    return [];
  }, [viewMode, anchor]);

  const title = viewMode === "day"
    ? format(anchor, "EEEE, d MMMM yyyy")
    : viewMode === "week"
    ? `${format(days[0], "d MMM")} – ${format(days[days.length - 1], "d MMM yyyy")}`
    : format(anchor, "MMMM yyyy");

  const today = new Date();

  // Summary stats for the visible period
  const periodLeave = useMemo(() => {
    const seen = new Set();
    days.forEach((day) => {
      getEventsOnDay(day, approvedLeave, meetings, users)
        .filter(e => e.type === "leave")
        .forEach(e => seen.add(e.email));
    });
    return seen.size;
  }, [days, approvedLeave, meetings, users]);

  const periodMeetings = useMemo(() => {
    const seen = new Set();
    days.forEach((day) => {
      getEventsOnDay(day, approvedLeave, meetings, users)
        .filter(e => e.type === "meeting")
        .forEach(e => seen.add(`${e.email}-${e.label}`));
    });
    return seen.size;
  }, [days, approvedLeave, meetings, users]);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Attendance</h1>
              <p className="text-gray-500 text-sm">Approved leave + meeting bookings — plan meetings smarter</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-28 bg-white shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIEW_MODES.map((v) => (
                  <SelectItem key={v} value={v} className="capitalize">{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>Today</Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-xs text-gray-500">Team members</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <Coffee className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{periodLeave}</p>
                <p className="text-xs text-gray-500">On leave this period</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Mic className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{periodMeetings}</p>
                <p className="text-xs text-gray-500">Meeting slots this period</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar nav */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold text-gray-900 text-lg">{title}</h2>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Day view */}
        {viewMode === "day" && (
          <DayView day={anchor} leaveRequests={approvedLeave} meetings={meetings} users={users} />
        )}

        {/* Week view */}
        {viewMode === "week" && (
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-100">
              {days.map((day) => (
                <div key={day.toISOString()} className={`text-center text-xs font-semibold py-2 ${isSameDay(day, today) ? "text-blue-600 bg-blue-50" : "text-gray-500 bg-gray-50"}`}>
                  <div>{format(day, "EEE")}</div>
                  <div className="text-base">{format(day, "d")}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => (
                <DayCell
                  key={day.toISOString()}
                  day={day}
                  leaveRequests={approvedLeave}
                  meetings={meetings}
                  users={users}
                  isToday={isSameDay(day, today)}
                  compact
                />
              ))}
            </div>
          </Card>
        )}

        {/* Month view */}
        {viewMode === "month" && (
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-100">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                <div key={d} className="text-center text-xs font-semibold py-2 text-gray-500 bg-gray-50">{d}</div>
              ))}
            </div>
            {/* Fill leading empty cells */}
            <div className="grid grid-cols-7">
              {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[60px] bg-gray-50/50 border-b border-r border-gray-100" />
              ))}
              {days.map((day) => (
                <DayCell
                  key={day.toISOString()}
                  day={day}
                  leaveRequests={approvedLeave}
                  meetings={meetings}
                  users={users}
                  isToday={isSameDay(day, today)}
                  compact
                />
              ))}
            </div>
          </Card>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="font-medium text-gray-700">Legend:</span>
          <span className="flex items-center gap-1"><Coffee className="w-3 h-3 text-red-500" /> Approved leave</span>
          <span className="flex items-center gap-1"><Mic className="w-3 h-3 text-emerald-600" /> Meeting Studio booking</span>
          {Object.entries(LEAVE_COLORS).map(([label, cls]) => (
            <span key={label} className={`px-2 py-0.5 rounded border ${cls}`}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}