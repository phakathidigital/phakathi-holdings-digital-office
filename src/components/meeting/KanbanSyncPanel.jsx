import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Kanban, Loader2, CheckCircle2, Pencil, Trash2, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const PRIORITY_OPTS = ["low", "medium", "high", "critical"];
const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

function TaskRow({ task, index, onChange, onRemove }) {
  const [editing, setEditing] = useState(false);
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => api.entities.Project.list("-created_date", 50) });

  if (editing) {
    return (
      <div className="border border-blue-200 rounded-xl p-3 bg-blue-50/50 space-y-2">
        <Input
          value={task.title}
          onChange={e => onChange(index, { ...task, title: e.target.value })}
          placeholder="Task title"
          className="h-8 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={task.assigned_to || ""}
            onChange={e => onChange(index, { ...task, assigned_to: e.target.value })}
            placeholder="Assignee email"
            className="h-8 text-xs"
          />
          <Input
            value={task.due_date || ""}
            type="date"
            onChange={e => onChange(index, { ...task, due_date: e.target.value })}
            className="h-8 text-xs"
          />
          <Select value={task.priority || "medium"} onValueChange={v => onChange(index, { ...task, priority: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTS.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={task.project_id || ""} onValueChange={v => onChange(index, { ...task, project_id: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Link to project…" /></SelectTrigger>
            <SelectContent>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Input
          value={task.description || ""}
          onChange={e => onChange(index, { ...task, description: e.target.value })}
          placeholder="Description (optional)"
          className="h-8 text-xs"
        />
        <Button size="sm" onClick={() => setEditing(false)} className="h-7 text-xs bg-gray-900 hover:bg-gray-800 text-white">Done</Button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl bg-white hover:border-gray-200 transition-colors group">
      <CheckSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {task.assigned_to && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">→ {task.assigned_to}</span>
          )}
          {task.priority && (
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
          )}
          {task.due_date && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Due {task.due_date}</span>
          )}
          {task.project_id && (
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Kanban className="w-2.5 h-2.5" /> Linked to project
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => setEditing(true)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onRemove(index)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function KanbanSyncPanel({ meeting, onSynced }) {
  const qc = useQueryClient();
  const actionItemTasks = (meeting.action_items || []).map((item) => ({
    title: item.replace(/^[^:]{1,60}:\s*/, "").replace(/\s+—.*$/, "").trim() || item,
    description: `Action item from meeting: ${meeting.title}\n\n${item}`,
    assigned_to: extractAssigneeFromActionItem(item),
    priority: "medium",
    due_date: "",
  }));
  const [tasks, setTasks] = useState(
    ((meeting.extracted_tasks?.length ? meeting.extracted_tasks : actionItemTasks) || []).map(t => ({ ...t }))
  );
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(!!meeting.tasks_synced);

  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => api.entities.Project.list("-created_date", 50) });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => api.entities.User.list() });

  const handleChange = (index, updated) => {
    setTasks(prev => prev.map((t, i) => i === index ? updated : t));
  };

  const handleRemove = (index) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    setTasks(prev => [...prev, { title: "New task", priority: "medium", assigned_to: "", due_date: "", description: "" }]);
  };

  const handleSync = async () => {
    if (!tasks.length) return;
    setSyncing(true);
    try {
      // Link to first project when available; otherwise create a general Kanban task.
      const defaultProjectId = projects[0]?.id;

      for (const t of tasks) {
        const projectId = t.project_id || defaultProjectId || "";
        const assignedTo = resolveUserEmail(t.assigned_to, users);
        await api.entities.Task.create({
          title: t.title,
          description: t.description || `Action item from meeting: ${meeting.title}`,
          assigned_to: assignedTo,
          priority: t.priority || "medium",
          due_date: t.due_date || "",
          status: "todo",
          project_id: projectId,
          tags: ["meeting-action-item"],
        });
      }

      await api.entities.MeetingStudio.update(meeting.id, { tasks_synced: true });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["meeting-studios"] });
      setSynced(true);
      toast.success(`${tasks.length} task${tasks.length > 1 ? "s" : ""} pushed to Kanban`);
      onSynced?.();
    } catch (err) {
      toast.error("Failed to sync tasks. Please check the task titles and assignees.");
    } finally {
      setSyncing(false);
    }
  };

  if (!tasks.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 italic">
        <AlertCircle className="w-4 h-4" />
        No tasks were extracted from this meeting.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Kanban className="w-3.5 h-3.5" />
          {tasks.length} Kanban Task{tasks.length > 1 ? "s" : ""} Extracted
        </p>
        {!synced && (
          <button onClick={handleAdd} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add task
          </button>
        )}
      </div>

      <div className="space-y-2">
        {tasks.map((task, i) => (
          <TaskRow
            key={i}
            task={task}
            index={i}
            onChange={handleChange}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {projects.length === 0 && (
        <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          No project exists yet. These will be created as general Kanban tasks.
        </p>
      )}

      <div className="flex items-center justify-between pt-1 border-t">
        {synced ? (
          <span className="text-sm text-green-600 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Tasks synced to Kanban
          </span>
        ) : (
          <p className="text-xs text-gray-400">Review tasks above, then push to the Kanban board</p>
        )}
        <Button
          onClick={handleSync}
          disabled={synced || syncing || !tasks.length}
          className="gap-2 bg-gray-900 hover:bg-gray-800 text-white h-8 text-xs"
        >
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Kanban className="w-3.5 h-3.5" />}
          {synced ? "Already Synced" : "Push to Kanban"}
        </Button>
      </div>
    </div>
  );
}

function extractAssigneeFromActionItem(item = "") {
  const match = item.match(/^([^:—-]{2,60})[:—-]/);
  return match?.[1]?.trim() || "";
}

function normalize(value = "") {
  return String(value).trim().toLowerCase();
}

function resolveUserEmail(value = "", users = []) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.includes("@")) return raw;
  const wanted = normalize(raw);
  const match = users.find((user) => {
    const fullName = normalize(user.full_name);
    const firstName = fullName.split(" ")[0];
    return fullName === wanted || firstName === wanted || fullName.includes(wanted);
  });
  return match?.email || raw;
}
