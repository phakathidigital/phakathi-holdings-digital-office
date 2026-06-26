
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Calendar, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const statusColors = {
  planning: "bg-gray-100 text-gray-700 border-gray-300",
  in_progress: "bg-blue-100 text-blue-700 border-blue-300",
  on_hold: "bg-yellow-100 text-yellow-700 border-yellow-300",
  completed: "bg-green-100 text-green-700 border-green-300",
};

const priorityColors = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function ProjectsOverview({ projects, isLoading }) {
  const activeProjects = projects.filter(p => p.status !== 'completed').slice(0, 3);

  return (
    <Card className="shadow-lg border-none overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50 p-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            Active Projects
            <Badge variant="secondary" className="ml-2">
              {activeProjects.length}
            </Badge>
          </CardTitle>
          <Link to={createPageUrl("Projects")}>
            <motion.button
              whileHover={{ x: 5 }}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 border rounded-xl">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : activeProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No active projects yet</p>
            <Link to={createPageUrl("Projects")}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-6 py-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-lg font-semibold"
              >
                Create Your First Project
              </motion.button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProjects.map((project, index) => (
              <Link key={project.id} to={createPageUrl(`ProjectDetails?id=${project.id}`)}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01, x: 5 }}
                  className="p-4 border-2 border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  style={{ borderLeft: `4px solid ${project.color || '#808080'}` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-1">{project.description}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Badge className={statusColors[project.status]} variant="outline">
                        {project.status.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={priorityColors[project.priority]}>
                        {project.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    {project.end_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due {format(new Date(project.end_date), 'MMM d')}</span>
                      </div>
                    )}
                    {project.team_members?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{project.team_members.length} members</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
