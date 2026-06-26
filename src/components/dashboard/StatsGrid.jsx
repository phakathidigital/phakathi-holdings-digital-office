import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { FolderKanban, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statCards = [
  {
    title: "Total Projects",
    key: "totalProjects",
    icon: FolderKanban,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Active Projects",
    key: "activeProjects",
    icon: TrendingUp,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "Completed",
    key: "completedProjects",
    icon: CheckCircle2,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Overdue Tasks",
    key: "overdueTasks",
    icon: AlertCircle,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50",
  },
];

export default function StatsGrid({ stats, isLoading }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`p-6 border-none shadow-lg hover:shadow-xl transition-all duration-300 ${stat.bgColor} relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full transform translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-500`} />
            
            <div className="relative">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="text-3xl font-bold text-gray-900"
                >
                  {stats[stat.key]}
                </motion.p>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}