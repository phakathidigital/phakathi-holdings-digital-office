import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, ChevronRight } from "lucide-react";
import EmployeeDetailDialog from "./EmployeeDetailDialog";
import { computeTaskStats } from "@/lib/taskUtils";

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const SCORE_COLORS = [
  'from-amber-400 to-yellow-500',
  'from-gray-300 to-gray-400',
  'from-orange-300 to-amber-600',
];

export default function TeamPerformance({ users, tasks, projects }) {
  const [selected, setSelected] = useState(null);

  const teamStats = users.map(u => computeTaskStats(u, tasks))
    .filter(s => s.totalTasks > 0)
    .sort((a, b) => b.performanceScore - a.performanceScore || b.completedTasks - a.completedTasks);

  return (
    <Card className="shadow-lg border-none h-full">
      <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50 p-6">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Team Performance
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        {teamStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No task data yet</div>
        ) : (
          <div className="space-y-2">
            {teamStats.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelected(member)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group border border-transparent hover:border-gray-200"
              >
                <div className="w-7 text-center flex-shrink-0">
                  {index < 3 ? (
                    <span className="text-lg">{RANK_MEDALS[index]}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-400">{index + 1}</span>
                  )}
                </div>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {member.full_name?.charAt(0) || member.email?.charAt(0)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {member.full_name || member.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={member.performanceScore} className="h-1.5 flex-1" />
                    <span className="text-xs font-bold text-gray-600 w-8 text-right">{member.performanceScore}%</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-xs flex-shrink-0">
                  <span className="text-green-600 font-medium">{member.completedTasks} done</span>
                  {member.overdueTasks > 0 && (
                    <span className="text-red-500 font-medium">{member.overdueTasks} overdue</span>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>

      <EmployeeDetailDialog
        employee={selected}
        tasks={tasks}
        projects={projects}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </Card>
  );
}