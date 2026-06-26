import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Link2 } from "lucide-react";

const STATUS_ORDER = { todo: 0, in_progress: 1, review: 2, completed: 3 };

/**
 * Renders the full dependency chain for a task.
 * Shows each blocking task, its status, and whether it's cleared.
 */
export default function DependencyPath({ task, allTasks }) {
  const blockers = (task.blocked_by || [])
    .map((id) => allTasks.find((t) => t.id === id))
    .filter(Boolean);

  if (blockers.length === 0) return null;

  const incomplete = blockers.filter((t) => t.status !== "completed");

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
        <Link2 className="w-3 h-3" />
        <span>Depends on:</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {blockers.map((b) => {
          const done = b.status === "completed";
          return (
            <span
              key={b.id}
              className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border ${
                done
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-orange-200 bg-orange-50 text-orange-700"
              }`}
            >
              {done ? (
                <CheckCircle2 className="w-2.5 h-2.5" />
              ) : (
                <AlertTriangle className="w-2.5 h-2.5" />
              )}
              <span className="max-w-[100px] truncate">{b.title}</span>
            </span>
          );
        })}
      </div>
      {incomplete.length > 0 && (
        <p className="text-[11px] text-orange-600 font-medium">
          ⚠ {incomplete.length} blocking task{incomplete.length > 1 ? "s" : ""} not yet completed
        </p>
      )}
    </div>
  );
}