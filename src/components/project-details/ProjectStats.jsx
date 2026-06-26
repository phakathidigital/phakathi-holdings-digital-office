
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, DollarSign, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const statusColors = {
  // Updated to Silver, Black, and White color scheme
  planning: "bg-gray-100 text-gray-700 border-gray-200",
  in_progress: "bg-gray-200 text-gray-800 border-gray-300",
  on_hold: "bg-gray-300 text-gray-800 border-gray-400",
  completed: "bg-gray-700 text-white border-gray-800",
};

const priorityColors = {
  // Updated to Silver, Black, and White color scheme
  low: "bg-gray-100 text-gray-700",
  medium: "bg-gray-200 text-gray-800",
  high: "bg-gray-300 text-gray-800",
  critical: "bg-gray-700 text-white",
};

export default function ProjectStats({ project, tasks, progress }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-2 border-gray-100 shadow-lg">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Status & Priority */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Status & Priority</p>
              <div className="flex flex-wrap gap-2">
                <Badge className={statusColors[project.status]} variant="outline">
                  {project.status.replace(/_/g, ' ')}
                </Badge>
                <Badge className={priorityColors[project.priority]}>
                  {project.priority}
                </Badge>
              </div>
            </div>

            {/* Timeline */}
            {(project.start_date || project.end_date) && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Timeline</p>
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {project.start_date && format(new Date(project.start_date), 'MMM d')}
                    {project.start_date && project.end_date && ' - '}
                    {project.end_date && format(new Date(project.end_date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            )}

            {/* Team */}
            {project.team_members?.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Team</p>
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <Users className="w-4 h-4" />
                  <span>{project.team_members.length} members</span>
                </div>
              </div>
            )}

            {/* Budget */}
            {project.budget && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Budget</p>
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <DollarSign className="w-4 h-4" />
                  <span>${project.budget.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-700" /> {/* Updated color */}
                <span className="text-sm font-medium text-gray-600">Overall Progress</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-gray-500">
              {tasks.filter(t => t.status === 'completed').length} of {tasks.length} tasks completed
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
