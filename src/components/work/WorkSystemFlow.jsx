import { Link } from "react-router-dom";
import { ArrowRight, Network } from "lucide-react";
import { WORK_SYSTEM_STEPS } from "@/lib/workSystem";

export default function WorkSystemFlow({ active = "projects", compact = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-slate-900 text-white shrink-0">
          <Network className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
            <div>
              <p className="font-semibold text-slate-900">One connected work management system</p>
              <p className="text-sm text-slate-500">
                Strategy flows into portfolios, projects, tasks, timelines, workload and time tracking.
              </p>
            </div>
          </div>
          {!compact && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {WORK_SYSTEM_STEPS.map((step, index) => (
                <div key={step.key} className="flex items-center gap-2">
                  <Link
                    to={step.path}
                    title={step.description}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active === step.key
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {step.label}
                  </Link>
                  {index < WORK_SYSTEM_STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-300" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
