import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const statusIcons = {
  todo: Circle,
  in_progress: Clock,
  review: Clock,
  completed: CheckCircle2,
};

const statusColors = {
  todo: "text-gray-400",
  in_progress: "text-blue-500",
  review: "text-purple-500",
  completed: "text-green-500",
};

const priorityColors = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function RecentTasks({ tasks, projects, isLoading }) {
  const recentTasks = tasks.slice(0, 5);

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50 p-6">
        <CardTitle className="text-xl font-bold">Recent Tasks</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tasks yet
          </div>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task, index) => {
              const StatusIcon = statusIcons[task.status];
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:border-amber-200 hover:shadow-md transition-all duration-200"
                >
                  <StatusIcon className={`w-5 h-5 mt-0.5 ${statusColors[task.status]}`} />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {getProjectName(task.project_id)}
                      </span>
                      {task.due_date && (
                        <span>Due {format(new Date(task.due_date), 'MMM d')}</span>
                      )}
                    </div>
                  </div>
                  
                  <Badge className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}