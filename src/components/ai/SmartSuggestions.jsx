import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, RefreshCw, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function SmartSuggestions({ user, tasks, projects }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const overdueTasks = tasks.filter(t => {
        if (!t.due_date) return false;
        return new Date(t.due_date) < new Date() && t.status !== 'completed';
      });

      const upcomingTasks = tasks.filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        const today = new Date();
        const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
        return dueDate > today && dueDate <= threeDaysFromNow && t.status !== 'completed';
      });

      const activeProjects = projects.filter(p => p.status === 'in_progress');

      const prompt = `You are a productivity coach for ${user?.full_name || 'the user'} at Phakathi Holdings.

Current situation:
- Total tasks: ${tasks.length}
- Pending tasks: ${tasks.filter(t => t.status !== 'completed').length}
- Overdue tasks: ${overdueTasks.length}
- Tasks due in next 3 days: ${upcomingTasks.length}
- Active projects: ${activeProjects.length}

Provide personalized, actionable suggestions to help them:
1. Improve productivity
2. Better manage their time
3. Reduce stress
4. Achieve their goals
5. Optimize their workflow

Be encouraging, specific, and practical.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            daily_focus: {
              type: "array",
              items: { type: "string" },
              description: "Top 3 things to focus on today"
            },
            productivity_tips: {
              type: "array",
              items: { type: "string" },
            },
            workflow_improvements: {
              type: "array",
              items: { type: "string" },
            },
            motivational_message: { type: "string" },
            quick_wins: {
              type: "array",
              items: { type: "string" },
              description: "Easy tasks that can be completed quickly for momentum"
            },
          },
        },
      });

      setSuggestions(response);
    } catch (error) {
      console.error("Error generating suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tasks.length > 0 || projects.length > 0) {
      generateSuggestions();
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-600">Generating personalized suggestions...</p>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-12 flex flex-col items-center justify-center">
          <Lightbulb className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No suggestions available yet</p>
          <Button onClick={generateSuggestions}>Generate Suggestions</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">Smart Suggestions</CardTitle>
            <Button
              onClick={generateSuggestions}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Motivational Message */}
      {suggestions.motivational_message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-purple-200 shadow-lg bg-gradient-to-r from-purple-50 to-white">
            <CardContent className="p-6">
              <p className="text-lg text-gray-700 italic leading-relaxed">
                "{suggestions.motivational_message}"
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Daily Focus */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Today's Top Priorities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {suggestions.daily_focus?.map((focus, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 flex-1">{focus}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Wins */}
      {suggestions.quick_wins?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="border-b bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="w-5 h-5" />
                Quick Wins
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Start with these easy tasks to build momentum:
              </p>
              <ul className="space-y-2">
                {suggestions.quick_wins.map((win, index) => (
                  <li key={index} className="flex gap-2 text-gray-700">
                    <span className="text-green-600">✓</span>
                    <span>{win}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Productivity Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Productivity Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-3">
              {suggestions.productivity_tips?.map((tip, index) => (
                <li key={index} className="flex gap-3 text-gray-700">
                  <span className="text-yellow-600">💡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* Workflow Improvements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Workflow Improvements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-3">
              {suggestions.workflow_improvements?.map((improvement, index) => (
                <li key={index} className="flex gap-3 text-gray-700">
                  <span className="text-blue-600">→</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}