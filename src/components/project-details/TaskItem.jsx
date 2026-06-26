import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, MoreVertical, Edit, Trash2, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DependencyPath from "@/components/kanban/DependencyPath";

const statusColors = {
  todo: "bg-gray-100 text-gray-700 border-gray-300",
  in_progress: "bg-blue-100 text-blue-700 border-blue-300",
  review: "bg-purple-100 text-purple-700 border-purple-300",
  completed: "bg-green-100 text-green-700 border-green-300",
};

const priorityColors = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function TaskItem({ task, index, onEdit, onDelete, onStatusChange, allTasks = [] }) {
  const hasBlockers = (task.blocked_by || []).length > 0;
  const hasIncomplete = hasBlockers && (task.blocked_by || []).some((id) => {
    const dep = allTasks.find((t) => t.id === id);
    return dep && dep.status !== "completed";
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-4 p-4 border-2 rounded-xl hover:shadow-md transition-all duration-200 ${
        hasIncomplete ? "border-orange-200 hover:border-orange-300" : "border-gray-100 hover:border-gray-300"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">{task.title}</h4>
            {hasIncomplete && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>Has incomplete blocking dependencies</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="w-4 h-4 mr-2" />Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onStatusChange(task, 'todo')}>Mark as To Do</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(task, 'in_progress')}>Mark as In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(task, 'review')}>Mark as Review</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(task, 'completed')}>Mark as Completed</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-2">
          <Badge className={statusColors[task.status]} variant="outline">
            {task.status?.replace(/_/g, ' ')}
          </Badge>
          <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>

          {task.assigned_to && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <User className="w-4 h-4" /><span>{task.assigned_to}</span>
            </div>
          )}
          {task.due_date && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="w-4 h-4" /><span>Due {format(new Date(task.due_date), 'MMM d')}</span>
            </div>
          )}
          {task.estimated_hours && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" /><span>{task.estimated_hours}h</span>
            </div>
          )}
        </div>

        {hasBlockers && <DependencyPath task={task} allTasks={allTasks} />}
      </div>
    </motion.div>
  );
}