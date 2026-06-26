
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function TeamActivity({ users, projects, tasks }) {
  const getTeamStats = () => {
    return users.slice(0, 5).map(user => {
      const userTasks = tasks.filter(t => t.assigned_to === user.email);
      const completedTasks = userTasks.filter(t => t.status === 'completed').length;
      return {
        ...user,
        taskCount: userTasks.length,
        completedCount: completedTasks,
        completionRate: userTasks.length > 0 ? Math.round((completedTasks / userTasks.length) * 100) : 0
      };
    });
  };

  const teamStats = getTeamStats();

  return (
    <Card className="shadow-lg border-none h-full">
      <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50 p-6">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-700" />
          Team Performance
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {teamStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No team members yet
            </div>
          ) : (
            teamStats.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {member.full_name?.charAt(0) || member.email?.charAt(0)}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {member.full_name || member.email}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{member.taskCount} tasks</span>
                    {member.completionRate > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-green-600 font-medium">{member.completionRate}%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
