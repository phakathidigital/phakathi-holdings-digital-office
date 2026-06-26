import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import TaskPrioritizer from "../components/ai/TaskPrioritizer";
import ProjectAnalyzer from "../components/ai/ProjectAnalyzer";
import AIChat from "../components/ai/AIChat";
import SmartSuggestions from "../components/ai/SmartSuggestions";

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState("chat");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list("-updated_date"),
    initialData: [],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list("-updated_date"),
    initialData: [],
  });

  const myTasks = tasks.filter(t => t.assigned_to === user?.email);
  const myProjects = projects.filter(p => 
    p.created_by === user?.email || 
    p.team_members?.includes(user?.email)
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">AI Assistant</h1>
                <p className="text-gray-600">Smart insights for better project management</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Assistant Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tabs Navigation */}
            <Card className="border-none shadow-lg">
              <div className="p-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gray-100 h-auto p-1">
                  <TabsTrigger
                    value="chat"
                    className="flex flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-xs md:text-sm font-medium">AI Chat</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="prioritizer"
                    className="flex flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <span className="text-lg">🎯</span>
                    <span className="text-xs md:text-sm font-medium">Task Priority</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="analyzer"
                    className="flex flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <span className="text-lg">📊</span>
                    <span className="text-xs md:text-sm font-medium">Project Insights</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="suggestions"
                    className="flex flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <span className="text-lg">💡</span>
                    <span className="text-xs md:text-sm font-medium">Suggestions</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </Card>

            {/* Tab Content */}
            <TabsContent value="chat">
              <AIChat 
                user={user}
                tasks={myTasks}
                projects={myProjects}
              />
            </TabsContent>

            <TabsContent value="prioritizer">
              <TaskPrioritizer 
                tasks={myTasks}
                projects={myProjects}
                isLoading={tasksLoading}
              />
            </TabsContent>

            <TabsContent value="analyzer">
              <ProjectAnalyzer 
                projects={myProjects}
                tasks={tasks}
                isLoading={projectsLoading}
              />
            </TabsContent>

            <TabsContent value="suggestions">
              <SmartSuggestions 
                user={user}
                tasks={myTasks}
                projects={myProjects}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}