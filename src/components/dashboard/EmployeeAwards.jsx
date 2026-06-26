import React from "react";
import { motion } from "framer-motion";
import { Crown, Award, Star } from "lucide-react";
import { computeTaskStats } from "@/lib/taskUtils";

function getTopPerformer(users, tasks, daysBack) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  const stats = users.map(user => {
    const userTasks = tasks.filter(t => t.assigned_to === user.email && new Date(t.created_date) >= cutoff);
    return computeTaskStats(user, userTasks);
  })
    .filter(s => s.totalTasks >= 2)
    .sort((a, b) => b.completionRate - a.completionRate || b.completedTasks - a.completedTasks);

  return stats[0] || null;
}

const AWARDS = [
  { period: 'Employee of the Week', days: 7, icon: Star, gradient: 'from-amber-400 to-orange-500', ring: 'ring-amber-200' },
  { period: 'Employee of the Month', days: 30, icon: Award, gradient: 'from-violet-500 to-purple-600', ring: 'ring-violet-200' },
  { period: 'Employee of the Year', days: 365, icon: Crown, gradient: 'from-blue-500 to-indigo-600', ring: 'ring-blue-200' },
];

export default function EmployeeAwards({ users, tasks }) {
  const winners = AWARDS.map(award => ({
    ...award,
    winner: getTopPerformer(users, tasks, award.days),
  }));

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Recognition Awards</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {winners.map((award, i) => (
          <motion.div
            key={award.period}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${award.gradient} text-white p-5 shadow-lg ring-4 ${award.ring}`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <award.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">{award.period}</span>
              </div>
              {award.winner ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {award.winner.full_name?.charAt(0) || award.winner.email?.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-lg truncate">{award.winner.full_name || award.winner.email}</p>
                      <p className="text-xs text-white/70">{award.winner.completedTasks} tasks completed</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white/15 rounded-lg px-3 py-2">
                    <span className="text-xs text-white/80">Completion Rate</span>
                    <span className="text-2xl font-bold">{award.winner.completionRate}%</span>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-white/60 text-sm">No eligible candidates yet</p>
                  <p className="text-white/40 text-xs mt-1">Complete tasks to qualify</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}