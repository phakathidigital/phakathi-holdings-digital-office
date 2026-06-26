import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Mail, CheckCircle2, Clock, AlertCircle, TrendingUp, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { computeTaskStats } from "@/lib/taskUtils";

export default function EmployeeDetailDialog({ employee, tasks, projects, open, onClose }) {
  if (!employee) return null;

  const stats = computeTaskStats(employee, tasks);
  const userTasks = tasks.filter(t => t.assigned_to === employee.email);
  const inProgress = userTasks.filter(t => t.status === 'in_progress');
  const projectIds = [...new Set(userTasks.map(t => t.project_id).filter(Boolean))];
  const activeProjects = projectIds.map(pid => projects.find(p => p.id === pid)).filter(Boolean);

  const metrics = [
    { label: 'Total Tasks', value: stats.totalTasks, icon: FolderKanban, color: 'text-gray-600' },
    { label: 'Completed', value: stats.completedTasks, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'In Progress', value: inProgress.length, icon: Clock, color: 'text-blue-600' },
    { label: 'Overdue', value: stats.overdueTasks, icon: AlertCircle, color: 'text-red-600' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-2xl">
              {employee.full_name?.charAt(0) || employee.email?.charAt(0)}
            </div>
            <div>
              <DialogTitle className="text-xl">{employee.full_name || employee.email}</DialogTitle>
              {employee.email && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Mail className="w-3 h-3" /> {employee.email}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Performance Score */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-gray-900">Performance Score</span>
            </div>
            <span className="text-3xl font-bold text-indigo-600">{stats.performanceScore}%</span>
          </div>
          <Progress value={stats.performanceScore} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Completion: {stats.completionRate}%</span>
            <span>On-time: {stats.onTimeRate}%</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <m.icon className={`w-5 h-5 mx-auto mb-1 ${m.color}`} />
              <p className="text-2xl font-bold text-gray-900">{m.value}</p>
              <p className="text-xs text-gray-500">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Active Projects */}
        {activeProjects.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Active Projects ({activeProjects.length})</h4>
            <div className="flex flex-wrap gap-2">
              {activeProjects.map(p => (
                <Badge key={p.id} variant="secondary" className="bg-gray-100">
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recent Tasks */}
        {userTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Tasks</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {userTasks.slice(0, 6).map(task => (
                <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.status === 'completed' ? 'bg-green-500' :
                    task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm text-gray-700 flex-1 truncate">{task.title}</span>
                  {task.due_date && (
                    <span className="text-xs text-gray-400">{format(new Date(task.due_date), 'MMM d')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}