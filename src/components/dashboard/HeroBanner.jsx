import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BarChart3, ArrowRight, Activity, FolderKanban, CheckCircle2, Users } from "lucide-react";

export default function HeroBanner({ user, stats }) {
  const metrics = [
    { icon: FolderKanban, label: "Active Projects", value: stats?.activeProjects ?? 0, color: "text-amber-300" },
    { icon: CheckCircle2, label: "Completed", value: stats?.completedProjects ?? 0, color: "text-emerald-300" },
    { icon: Users, label: "Team Members", value: stats?.teamMembers ?? 0, color: "text-sky-300" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-slate-800 to-gray-950 p-6 md:p-8 text-white"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 bg-white" />
        <div className="absolute bottom-0 left-1/3 w-96 h-32 opacity-5 bg-gradient-to-t from-white" />
        <div className="absolute top-1/2 right-8 w-24 h-24 rounded-full opacity-5 bg-white" />
      </div>

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Operational title */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-white/60" />
            <span className="text-white/50 text-sm font-medium tracking-wide uppercase">Operations Overview</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Team Dashboard
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-md">
            Real-time visibility into projects, tasks, and team productivity across the organisation.
          </p>

          {/* Live metrics */}
          <div className="flex flex-wrap gap-4 mt-5">
            {metrics.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-2.5 bg-white/10 rounded-lg px-4 py-2.5">
                <Icon className={`w-4 h-4 ${color}`} />
                <div>
                  <p className="text-white text-lg font-bold leading-tight">{value}</p>
                  <p className="text-white/50 text-xs leading-tight">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex flex-col gap-3 shrink-0">
          <Link to="/ExecutiveDashboard">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-gray-900 font-semibold text-sm shadow-lg hover:shadow-xl transition-all w-full justify-center"
            >
              <BarChart3 className="w-4 h-4" />
              Executive View
            </motion.button>
          </Link>
          <Link to="/Projects">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all w-full justify-center border border-white/20"
            >
              View Projects
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}