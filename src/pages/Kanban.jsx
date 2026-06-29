import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Columns, Circle, Clock, CheckCircle2, Calendar, UserPlus, X, AlertTriangle, Link2, Timer } from "lucide-react";
import TimeLogDialog from "@/components/kanban/TimeLogDialog";
import { format, parseISO } from "date-fns";
import DependencyPath from "@/components/kanban/DependencyPath";

const COLUMNS = [
  { id: "todo",        label: "To Do",       icon: Circle,       color: "text-gray-500",  bg: "bg-gray-50",   border: "border-gray-200",  headerBg: "bg-gray-100" },
  { id: "in_progress", label: "In Progress", icon: Clock,        color: "text-blue-500",  bg: "bg-blue-50",   border: "border-blue-200",  headerBg: "bg-blue-100" },
  { id: "completed",   label: "Done",        icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50",  border: "border-green-200", headerBg: "bg-green-100" },
];

const PRIORITY_COLORS = {
  low:      "bg-gray-100 text-gray-600",
  medium:   "bg-yellow-100 text-yellow-700",
  high:     "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

function hasIncompleteBlockers(task, allTasks) {
  if (!task.blocked_by?.length) return false;
  return task.blocked_by.some((id) => {
    const dep = allTasks.find((t) => t.id === id);
    return dep && dep.status !== "completed";
  });
}

function UserAvatar({ email, name, size = "sm" }) {
  const initials = name ? name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()
    : email ? email[0].toUpperCase() : "?";
  const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];
  const colorIdx = email ? email.charCodeAt(0) % colors.length : 0;
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${sz} ${colors[colorIdx]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function TaskCard({ task, user, users, allTasks, onStatusChange, onAssign, onUnassign, onLogTime, index }) {
  const [showAssign, setShowAssign] = useState(false);
  const assignedUser = users.find(u => u.email === task.assigned_to);
  const isAssignedToMe = task.assigned_to === user?.email;
  const blocked = hasIncompleteBlockers(task, allTasks);
  const depCount = (task.blocked_by || []).length;

  return (
    <Draggable key={task.id} draggableId={task.id} index={index}>
      {(prov, snap) => (
        <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
          <Card className={`border-none shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${snap.isDragging ? "shadow-xl rotate-1 scale-105" : ""} ${blocked ? "ring-1 ring-orange-300" : ""}`}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start gap-2">
                <p className="font-semibold text-gray-900 text-sm leading-snug flex-1">{task.title}</p>
                {blocked && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Has incomplete dependencies — cannot move to Done</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {task.description && <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>}

              <div className="flex flex-wrap gap-1.5 items-center">
                {task.priority && (
                  <Badge className={`text-xs border-0 capitalize ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</Badge>
                )}
                {depCount > 0 && (
                  <Badge className="text-xs border-0 bg-orange-50 text-orange-600 flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    {depCount} dep{depCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              <DependencyPath task={task} allTasks={allTasks} />

              <div className="flex items-center justify-between pt-1 gap-2">
                <div className="flex items-center gap-1.5">
                  {task.assigned_to ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 group cursor-pointer" onClick={() => setShowAssign(!showAssign)}>
                            <UserAvatar email={task.assigned_to} name={assignedUser?.full_name} />
                            <span className="text-xs text-gray-500 hidden group-hover:inline">{assignedUser?.full_name?.split(" ")[0] || task.assigned_to.split("@")[0]}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{assignedUser?.full_name || task.assigned_to}</p>
                          {(user?.role === "admin" || isAssignedToMe) && <p className="text-xs opacity-70">Click to reassign</p>}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setShowAssign(!showAssign)}
                            className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-colors"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent><p>Assign to someone</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {!isAssignedToMe && !showAssign && (
                    <button
                      onClick={() => onAssign(task, user?.email, user?.full_name)}
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors underline-offset-2 hover:underline"
                    >
                      Assign me
                    </button>
                  )}

                  {task.assigned_to && (user?.role === "admin" || isAssignedToMe) && !showAssign && (
                    <button onClick={() => onUnassign(task)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{format(parseISO(task.due_date), "d MMM")}</span>
                    </div>
                  )}
                  <button onClick={() => onLogTime(task)} className="ml-1 text-gray-300 hover:text-blue-500 transition-colors" title="Log time">
                    <Timer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {showAssign && (
                <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                  <Select
                    onValueChange={(email) => {
                      const u = users.find(x => x.email === email);
                      onAssign(task, email, u?.full_name);
                      setShowAssign(false);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select team member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.email}>
                          <div className="flex items-center gap-2">
                            <UserAvatar email={u.email} name={u.full_name} size="sm" />
                            <span>{u.full_name || u.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button onClick={() => setShowAssign(false)} className="text-xs text-gray-400 mt-1 hover:text-gray-600">Cancel</button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}

export default function Kanban() {
  const [selectedProject, setSelectedProject] = useState("all");
  const [timeLogTask, setTimeLogTask] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => api.auth.me() });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => api.entities.User.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => api.entities.Project.list("-created_date", 50) });
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ["tasks"], queryFn: () => api.entities.Task.list("-created_date", 200) });

  const updateTask = useMutation({
    mutationFn: ({ id, ...data }) => api.entities.Task.update(id, data),
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const prev = queryClient.getQueryData(["tasks"]);
      queryClient.setQueryData(["tasks"], (old) => old.map((t) => (t.id === id ? { ...t, ...data } : t)));
      return { prev };
    },
    onError: (_, __, ctx) => queryClient.setQueryData(["tasks"], ctx.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const handleAssign = async (task, email, fullName) => {
    updateTask.mutate({ id: task.id, assigned_to: email });
    if (email && email !== user?.email) {
      api.integrations.Core.SendEmail({
        to: email,
        subject: `You've been assigned a task: ${task.title}`,
        body: `Hi ${fullName || email},\n\nYou have been assigned a task on the Phakathi Holdings Kanban Board.\n\n📌 Task: ${task.title}${task.description ? `\n📝 Description: ${task.description}` : ""}${task.due_date ? `\n📅 Due: ${task.due_date}` : ""}\n\nPlease log in to view and update your task.\n\nPhakathi Holdings – Digital Office`,
      }).catch(() => {});
    }
  };

  const handleUnassign = (task) => {
    updateTask.mutate({ id: task.id, assigned_to: "" });
  };

  const handleDragEnd = (result) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStatus = destination.droppableId;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;
    const currentStatus = task.status === "todo" || !task.status ? "todo" : task.status;
    if (currentStatus === newStatus) return;

    // Block move to completed if dependencies incomplete
    if (newStatus === "completed" && hasIncompleteBlockers(task, tasks)) {
      const blockerNames = (task.blocked_by || [])
        .map((id) => tasks.find((t) => t.id === id))
        .filter((t) => t && t.status !== "completed")
        .map((t) => t.title)
        .join(", ");
      toast.error(`Cannot complete — blocked by: ${blockerNames}`);
      return;
    }

    updateTask.mutate({ id: draggableId, status: newStatus });
  };

  const handleLogTime = (task) => setTimeLogTask(task);

  const filteredTasks = selectedProject === "all" ? tasks : tasks.filter((t) => t.project_id === selectedProject);
  const getColumnTasks = (colId) =>
    filteredTasks.filter((t) => colId === "todo" ? (t.status === "todo" || !t.status) : t.status === colId);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-screen-xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Columns className="w-8 h-8 text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
              <p className="text-gray-600 text-sm">Drag tasks between columns · Assign team members · Track dependencies</p>
            </div>
          </div>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-56 bg-white shadow-sm">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-96 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {COLUMNS.map((col) => {
                const colTasks = getColumnTasks(col.id);
                const Icon = col.icon;
                return (
                  <div key={col.id} className="flex flex-col">
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl ${col.headerBg} border ${col.border} border-b-0`}>
                      <Icon className={`w-5 h-5 ${col.color}`} />
                      <span className="font-semibold text-gray-800">{col.label}</span>
                      <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>{colTasks.length}</span>
                    </div>
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 min-h-[300px] p-3 rounded-b-2xl border ${col.border} space-y-2 transition-colors ${snapshot.isDraggingOver ? col.bg : "bg-white"}`}
                        >
                          {colTasks.map((task, index) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              user={user}
                              users={users}
                              allTasks={tasks}
                              index={index}
                              onAssign={handleAssign}
                              onUnassign={handleUnassign}
                              onLogTime={handleLogTime}
                              onStatusChange={(id, status) => updateTask.mutate({ id, status })}
                            />
                          ))}
                          {provided.placeholder}
                          {colTasks.length === 0 && !snapshot.isDraggingOver && (
                            <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                              <p className="text-xs text-gray-400">Drop tasks here</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>
      {timeLogTask && (
        <TimeLogDialog
          open={!!timeLogTask}
          onClose={() => setTimeLogTask(null)}
          task={timeLogTask}
          user={user}
        />
      )}
    </div>
  );
}