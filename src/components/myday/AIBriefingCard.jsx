import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { format } from "date-fns";
import { Zap, Loader2, ArrowRight, AlertTriangle, CheckCircle2, Clock, Sparkles } from "lucide-react";

export default function AIBriefingCard({ user, tasks, leaveRequests }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const urgentTasks = tasks
    .filter(t => t.status !== 'completed' && (t.priority === 'critical' || t.priority === 'high'))
    .filter(t => !t.due_date || t.due_date <= todayStr)
    .sort((a, b) => {
      const order = { critical: 0, high: 1 };
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    })
    .slice(0, 5);

  const criticalApprovals = (leaveRequests || [])
    .filter(l => l.status === 'pending')
    .slice(0, 3);

  useEffect(() => {
    if (!user || briefing) return;
    setLoading(true);

    const taskSummary = urgentTasks.map(t =>
      `- ${t.title} (Priority: ${t.priority}, Due: ${t.due_date || 'no date'})`
    ).join('\n');

    const approvalSummary = criticalApprovals.map(a =>
      `- ${a.employee_name}: ${a.leave_type} from ${a.start_date} to ${a.end_date}`
    ).join('\n');

    api.integrations.Core.InvokeLLM({
      prompt: `You are a smart workplace AI assistant. Today is ${format(new Date(), 'EEEE, MMMM d yyyy')}.
Employee: ${user.full_name || user.email}.

URGENT TASKS (critical/high priority, due today or overdue):
${taskSummary || 'None'}

CRITICAL PENDING APPROVALS:
${approvalSummary || 'None'}

Generate a concise daily action plan. First, identify the single TOP PRIORITY that needs immediate attention. Then give a 2-sentence action plan for the day. Be specific and actionable.`,
      response_json_schema: {
        type: 'object',
        properties: {
          top_priority: { type: 'string' },
          action_plan: { type: 'string' },
        },
      },
    }).then(r => {
      setBriefing(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, tasks, leaveRequests]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white overflow-hidden shadow-xl"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Daily Briefing</h3>
            <p className="text-[10px] text-white/40">Urgent tasks & critical approvals</p>
          </div>
        </div>

        {/* Top Priority from AI */}
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs text-white/50">Analysing your priorities…</p>
          </div>
        ) : briefing ? (
          <div className="mb-4 p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-indigo-300">TOP PRIORITY TODAY</span>
            </div>
            <p className="text-sm text-white font-medium">{briefing.top_priority}</p>
            <p className="text-xs text-white/50 mt-2 leading-relaxed">{briefing.action_plan}</p>
          </div>
        ) : (
          <div className="py-6 text-center">
            <Sparkles className="w-8 h-8 text-indigo-400/40 mx-auto mb-2" />
            <p className="text-xs text-white/40">Generating your briefing…</p>
          </div>
        )}

        {/* Urgent Tasks List */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-xs font-semibold text-white/70">URGENT TASKS</span>
          </div>
          {urgentTasks.length === 0 ? (
            <div className="flex items-center gap-2 py-3 px-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-xs text-white/50">No urgent tasks — you're on top of things!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {urgentTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.priority === 'critical' ? 'bg-red-400' : 'bg-orange-400'}`} />
                  <p className="text-xs text-white/80 flex-1 truncate">{task.title}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${task.priority === 'critical' ? 'bg-red-500/30 text-red-300' : 'bg-orange-500/30 text-orange-300'}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Critical Approvals */}
        {criticalApprovals.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-white/70">CRITICAL APPROVALS PENDING</span>
            </div>
            <div className="space-y-1.5">
              {criticalApprovals.map(req => (
                <Link key={req.id} to="/Leave">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer">
                    <div className="w-6 h-6 rounded-full bg-amber-400/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-amber-300 font-bold">{req.employee_name?.charAt(0) || '?'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 truncate">{req.employee_name}</p>
                      <p className="text-[10px] text-white/40">{req.leave_type} · {req.start_date}</p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-amber-400/60" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-5 py-3">
        <Link to="/AIAssistant">
          <button className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
            Open AI Assistant <ArrowRight className="w-3 h-3" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}