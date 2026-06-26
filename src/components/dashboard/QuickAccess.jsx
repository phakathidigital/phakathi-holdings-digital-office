import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FolderKanban, CalendarOff, FileText, Receipt,
  Star, Wallet, Monitor, UserCheck, ClipboardList,
  Megaphone, CalendarClock, BarChart2, Columns, Sparkles,
  MessageCircle, Mic
} from "lucide-react";

const MODULES = [
  { icon: FolderKanban,  label: "Projects",       path: "/Projects",           color: "bg-slate-100 text-slate-700",   desc: "Manage work" },
  { icon: Star,          label: "Performance",    path: "/PerformanceReviews", color: "bg-amber-50 text-amber-700",    desc: "Reviews & OKRs" },
  { icon: CalendarOff,   label: "Leave",          path: "/Leave",              color: "bg-blue-50 text-blue-700",      desc: "Time off" },
  { icon: FileText,      label: "Payslips",       path: "/Payslips",           color: "bg-green-50 text-green-700",    desc: "Pay documents" },
  { icon: Receipt,       label: "Expenses",       path: "/Expenses",           color: "bg-orange-50 text-orange-700",  desc: "Claims" },
  { icon: Wallet,        label: "Payroll",        path: "/PayrollDashboard",   color: "bg-emerald-50 text-emerald-700",desc: "Payroll admin" },
  { icon: Monitor,       label: "Assets",         path: "/Assets",             color: "bg-purple-50 text-purple-700",  desc: "IT & equipment" },
  { icon: UserCheck,     label: "Onboarding",     path: "/Onboarding",         color: "bg-pink-50 text-pink-700",      desc: "New hires" },
  { icon: Columns,       label: "Kanban",         path: "/Kanban",             color: "bg-cyan-50 text-cyan-700",      desc: "Task board" },
  { icon: CalendarClock, label: "Room Booking",   path: "/ResourceCalendar",   color: "bg-violet-50 text-violet-700",  desc: "Book spaces" },
  { icon: ClipboardList, label: "Meeting Notes",  path: "/MeetingNotes",       color: "bg-yellow-50 text-yellow-700",  desc: "Minutes" },
  { icon: Megaphone,     label: "Noticeboard",    path: "/Noticeboard",        color: "bg-rose-50 text-rose-700",      desc: "Announcements" },
  { icon: BarChart2,     label: "Analytics",      path: "/Analytics",          color: "bg-indigo-50 text-indigo-700",  desc: "Insights" },
  { icon: Sparkles,      label: "AI Assistant",   path: "/AIAssistant",        color: "bg-gray-100 text-gray-700",     desc: "Smart help" },
  { icon: MessageCircle, label: "Messaging",      path: "/Messaging",          color: "bg-sky-50 text-sky-700",        desc: "Team chat" },
  { icon: Mic,           label: "Meeting Studio", path: "/MeetingStudio",      color: "bg-red-50 text-red-700",        desc: "AI notes" },
];

export default function QuickAccess() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Access</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {MODULES.map(({ icon: Icon, label, path, color, desc }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link to={path}>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group text-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{label}</p>
                  <p className="text-xs text-gray-400 leading-tight">{desc}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}