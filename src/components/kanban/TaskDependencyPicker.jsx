import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Link2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Lets users link/unlink blocking tasks.
 * Props:
 *   allTasks     – all tasks for the project (excludes the current one)
 *   blockedBy    – current array of task IDs
 *   onChange     – (newIds: string[]) => void
 */
export default function TaskDependencyPicker({ allTasks = [], blockedBy = [], onChange, currentTaskId }) {
  const [search, setSearch] = useState("");

  const eligible = allTasks.filter(
    (t) => t.id !== currentTaskId && !blockedBy.includes(t.id)
  );

  const filtered = search
    ? eligible.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : eligible;

  const linked = allTasks.filter((t) => blockedBy.includes(t.id));

  const add = (id) => onChange([...blockedBy, id]);
  const remove = (id) => onChange(blockedBy.filter((x) => x !== id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Link2 className="w-4 h-4" />
        <span>Blocked by (dependencies)</span>
      </div>

      {/* Current dependencies */}
      {linked.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {linked.map((t) => (
            <Badge key={t.id} variant="outline" className="flex items-center gap-1 pr-1 border-orange-300 text-orange-700 bg-orange-50">
              <span className="max-w-[160px] truncate">{t.title}</span>
              <button onClick={() => remove(t.id)} className="ml-1 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search to add more */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
        <Input
          className="h-8 pl-8 text-xs"
          placeholder="Search tasks to add as dependency…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {search && (
        <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-2">No matching tasks</p>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { add(t.id); setSearch(""); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between gap-2"
              >
                <span className="truncate">{t.title}</span>
                <Badge className="text-[10px] capitalize bg-gray-100 text-gray-600 border-0">{t.status?.replace("_", " ")}</Badge>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}