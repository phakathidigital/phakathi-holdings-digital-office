import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const priorityColors = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function TaskPrioritizer({ tasks, projects, isLoading }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeTasks = async () => {
    setAnalyzing(true);
    try {
      const tasksData = tasks.map(task => ({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        estimated_hours: task.estimated_hours,
      }));

      const prompt = `You are an expert project manager analyzing tasks for prioritization.

Tasks to analyze:
${JSON.stringify(tasksData, null, 2)}

Please analyze these tasks and provide:
1. A priority ranking of tasks (reorder by importance)
2. Specific reasoning for each task's priority
3. Recommendations for task management
4. Any urgent items that need immediate attention
5. Suggestions for better time management

Provide actionable insights to help the user be more productive.`;

      const response = await api.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            prioritized_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  task_title: { type: "string" },
                  recommended_priority: { type: "string" },
                  reasoning: { type: "string" },
                  urgency_score: { type: "number" },
                },
              },
            },
            urgent_items: {
              type: "array",
              items: { type: "string" },
            },
            overall_recommendations: {
              type: "array",
              items: { type: "string" },
            },
            time_management_tips: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      });

      setAnalysis(response);
    } catch (error) {
      console.error("Error analyzing tasks:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">Task Prioritizer</CardTitle>
              <CardDescription>
                Let AI analyze your tasks and suggest the optimal priority order
              </CardDescription>
            </div>
            <Button
              onClick={analyzeTasks}
              disabled={analyzing || tasks.length === 0}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analyze Tasks
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Current Tasks Overview */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
          <CardTitle>Your Current Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks assigned to you yet
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(task.due_date), 'MMM d')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={priorityColors[task.priority]} variant="outline">
                      {task.priority}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Urgent Items */}
          {analysis.urgent_items?.length > 0 && (
            <Card className="border-red-200 shadow-lg">
              <CardHeader className="border-b bg-red-50">
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertCircle className="w-5 h-5" />
                  Urgent Items Requiring Immediate Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {analysis.urgent_items.map((item, index) => (
                    <li key={index} className="flex gap-2 text-gray-700">
                      <span className="text-red-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Prioritized Tasks */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
              <CardTitle>AI-Recommended Priority Order</CardTitle>
              <CardDescription>
                Tasks reordered by importance and urgency
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analysis.prioritized_tasks?.map((task, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border-l-4 border-purple-600 bg-gradient-to-r from-purple-50 to-white rounded-r-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{task.task_title}</h4>
                          <Badge className={priorityColors[task.recommended_priority?.toLowerCase()]} variant="outline">
                            {task.recommended_priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{task.reasoning}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-purple-600 font-medium">
                            Urgency Score: {task.urgency_score}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
              <CardTitle>Overall Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-3">
                {analysis.overall_recommendations?.map((rec, index) => (
                  <li key={index} className="flex gap-3 text-gray-700">
                    <span className="text-purple-600 font-bold">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Time Management Tips */}
          {analysis.time_management_tips?.length > 0 && (
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
                <CardTitle>Time Management Tips</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {analysis.time_management_tips.map((tip, index) => (
                    <li key={index} className="flex gap-3 text-gray-700">
                      <span className="text-blue-600 font-bold">💡</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}