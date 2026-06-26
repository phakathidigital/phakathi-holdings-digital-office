import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowRight, ArrowLeft,
  LayoutDashboard, Sun, Briefcase, MessageCircle, Users,
  Headphones, Building2, TrendingUp, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TOUR_STEPS = [
  {
    icon: LayoutDashboard,
    title: "Welcome to Phakathi Flow",
    subtitle: "Your Digital Office",
    description: "This is your operational command centre — real-time visibility into projects, tasks, and team productivity across every Phakathi subsidiary. Everything you need is right here, in one place.",
    color: "from-gray-900 to-gray-700",
  },
  {
    icon: Sun,
    title: "Your Personal Day",
    subtitle: "My Day",
    description: "A personalised daily dashboard with your tasks, meetings, pending approvals, AI briefing, and team availability — everything you need to start your day focused and informed.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Briefcase,
    title: "Plan & Execute Work",
    subtitle: "Projects · Kanban · Portfolios · Roadmaps · Gantt · Workload · Time Tracking · OKRs",
    description: "Manage the full project lifecycle — from portfolios and roadmaps down to individual tasks. Track work on a Kanban board, visualise timelines on a Gantt chart, balance team workload, log time, and align on goals and OKRs.",
    color: "from-blue-600 to-indigo-600",
  },
  {
    icon: MessageCircle,
    title: "Collaborate in Real Time",
    subtitle: "Messaging · Company Feed · Meeting Studio",
    description: "Chat in channels and direct messages, share updates on the company feed, and use Meeting Studio to record, transcribe, and auto-summarise meetings with AI-generated action items.",
    color: "from-cyan-600 to-sky-600",
  },
  {
    icon: Users,
    title: "Your People",
    subtitle: "Org Chart · Performance · Onboarding · Team Attendance",
    description: "Explore the interactive org chart, run structured performance reviews with peer feedback and KPIs, onboard new hires with department-specific checklists, and track team attendance.",
    color: "from-emerald-600 to-teal-600",
  },
  {
    icon: Headphones,
    title: "Run Operations",
    subtitle: "Support Tickets · Assets · Document Vault · Expenses · Room Booking",
    description: "Submit and track support tickets, manage IT assets, store and approve HR documents securely, submit expense claims, and book meeting rooms and resources — all from one operations hub.",
    color: "from-violet-600 to-purple-600",
  },
  {
    icon: Building2,
    title: "Company Life",
    subtitle: "Noticeboard · Culture Hub · HR Hub · Meeting Notes",
    description: "Stay connected with company announcements, celebrate colleagues in the Culture Hub with recognition badges, access HR resources, and keep structured meeting notes with action items.",
    color: "from-rose-600 to-pink-600",
  },
  {
    icon: TrendingUp,
    title: "Insights & Payroll",
    subtitle: "Executive Dashboard · Payroll · Auto Payroll · Sage Integration · Integrations",
    description: "Get executive-level analytics across the organisation, manage payroll and payslips, run automated payroll processing, sync with Sage for HR and leave data, and connect external integrations.",
    color: "from-slate-700 to-gray-800",
  },
  {
    icon: Sparkles,
    title: "Your AI-Powered Co-Worker",
    subtitle: "AI Assistant",
    description: "Get smart suggestions, analyse your projects, prioritise your workload, and chat with an AI that understands your business. Innovation is built right into the platform.",
    color: "from-indigo-700 to-purple-700",
  },
];

const STORAGE_KEY = "ph_tour_login_count";

export default function WelcomeTour({ user }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const key = `${STORAGE_KEY}_${user.email || "guest"}`;
    const count = parseInt(localStorage.getItem(key) || "0", 10);
    const newCount = count + 1;
    localStorage.setItem(key, newCount.toString());
    if (newCount <= 3) setShow(true);
  }, [user]);

  const dismiss = () => setShow(false);
  const next = () => { if (step < TOUR_STEPS.length - 1) setStep(s => s + 1); else dismiss(); };
  const prev = () => setStep(s => s - 1);

  const current = TOUR_STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Top gradient banner */}
            <div className={`bg-gradient-to-br ${current.color} p-8 pb-10 relative overflow-hidden`}>
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10 bg-white" />
              <div className="absolute -bottom-12 -left-6 w-56 h-56 rounded-full opacity-5 bg-white" />
              <button onClick={dismiss}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <p className="text-white/60 text-sm font-medium tracking-wider uppercase mb-1">{current.subtitle}</p>
                <h2 className="text-2xl font-bold text-white leading-tight">{current.title}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <p className="text-gray-600 leading-relaxed text-base">{current.description}</p>

              {/* Step counter */}
              <p className="text-xs text-gray-400 mt-4">{step + 1} of {TOUR_STEPS.length}</p>

              {/* Step dots */}
              <div className="flex items-center gap-1.5 mt-3 mb-6 flex-wrap">
                {TOUR_STEPS.map((_, i) => (
                  <button key={i} onClick={() => setStep(i)}
                    className={`rounded-full transition-all duration-300 ${i === step ? "w-6 h-2 bg-gray-900" : "w-2 h-2 bg-gray-200 hover:bg-gray-300"}`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button onClick={dismiss} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  Skip tour
                </button>
                <div className="flex gap-2">
                  {step > 0 && (
                    <Button variant="outline" size="sm" onClick={prev} className="gap-1.5">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </Button>
                  )}
                  <Button size="sm" onClick={next} className="gap-1.5 bg-gray-900 hover:bg-gray-800 text-white">
                    {step === TOUR_STEPS.length - 1 ? "Let's Go!" : "Next"}
                    {step < TOUR_STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}