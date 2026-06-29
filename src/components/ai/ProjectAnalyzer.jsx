import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function ProjectAnalyzer({ projects, tasks, isLoading }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeProjects = async () => {
    setAnalyzing(true);
    try {
      const projectsData = projects.map(project => {
        const projectTasks = tasks.filter(t => t.project_id === project.id);
        const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
        
        return {
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
          start_date: project.start_date,
          end_date: project.end_date,
          total_tasks: projectTasks.length,
          completed_tasks: completedTasks,
          progress: projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0,
          team_size: project.team_members?.length || 0,
        };
      });

      const prompt = `You are an expert project management consultant analyzing projects for Phakathi Holdings.

Projects data:
${JSON.stringify(projectsData, null, 2)}

Please provide a comprehensive analysis including:
1. Overall health assessment of each project
2. Identify projects at risk and why
3. Projects performing well and best practices
4. Workload balance analysis
5. Strategic recommendations for improving project outcomes
6. Resource allocation suggestions

Be specific, actionable, and data-driven.`;

      const response = await api.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            project_health: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  project_name: { type: "string" },
                  health_status: { type: "string" },
                  health_score: { type: "number" },
                  key_findings: { type: "array", items: { type: "string" } },
                },
              },
            },
            at_risk_projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  project_name: { type: "string" },
                  risk_level: { type: "string" },
                  reasons: { type: "array", items: { type: "string" } },
                  mitigation_steps: { type: "array", items: { type: "string" } },
                },
              },
            },
            best_performers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  project_name: { type: "string" },
                  success_factors: { type: "array", items: { type: "string" } },
                },
              },
            },
            strategic_recommendations: {
              type: "array",
              items: { type: "string" },
            },
            workload_insights: { type: "string" },
          },
        },
      });

      setAnalysis(response);
    } catch (error) {
      console.error("Error analyzing projects:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const healthColors = {
    excellent: "bg-green-100 text-green-700 border-green-200",
    good: "bg-blue-100 text-blue-700 border-blue-200",
    fair: "bg-yellow-100 text-yellow-700 border-yellow-200",
    poor: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">Project Analyzer</CardTitle>
              <CardDescription>
                Get AI-powered insights into your projects' health and performance
              </CardDescription>
            </div>
            <Button
              onClick={analyzeProjects}
              disabled={analyzing || projects.length === 0}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze Projects
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Projects Overview */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
          <CardTitle>Your Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No projects to analyze yet
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {projects.map((project, index) => {
                const projectTasks = tasks.filter(t => t.project_id === project.id);
                const progress = projectTasks.length > 0
                  ? Math.round((projectTasks.filter(t => t.status === 'completed').length / projectTasks.length) * 100)
                  : 0;

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900 mb-2">{project.name}</h4>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline">{project.status}</Badge>
                      <Badge variant="outline">{project.priority}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{projectTasks.length} tasks • {progress}% complete</p>
                    </div>
                  </motion.div>
                );
              })}
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
          {/* At Risk Projects */}
          {analysis.at_risk_projects?.length > 0 && (
            <Card className="border-red-200 shadow-lg">
              <CardHeader className="border-b bg-red-50">
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="w-5 h-5" />
                  Projects Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {analysis.at_risk_projects.map((project, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg border border-red-200">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900">{project.project_name}</h4>
                        <Badge className="bg-red-100 text-red-700 border-red-200">
                          {project.risk_level} Risk
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Reasons:</p>
                          <ul className="space-y-1">
                            {project.reasons.map((reason, i) => (
                              <li key={i} className="text-sm text-gray-600 flex gap-2">
                                <span>•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Mitigation Steps:</p>
                          <ul className="space-y-1">
                            {project.mitigation_steps.map((step, i) => (
                              <li key={i} className="text-sm text-gray-600 flex gap-2">
                                <span className="text-green-600">✓</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Health */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
              <CardTitle>Project Health Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analysis.project_health?.map((project, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900">{project.project_name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={healthColors[project.health_status?.toLowerCase()]}>
                          {project.health_status}
                        </Badge>
                        <span className="text-sm font-medium text-gray-700">
                          {project.health_score}/10
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {project.key_findings?.map((finding, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-2">
                          <span className="text-purple-600">•</span>
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Best Performers */}
          {analysis.best_performers?.length > 0 && (
            <Card className="border-green-200 shadow-lg">
              <CardHeader className="border-b bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <TrendingUp className="w-5 h-5" />
                  Top Performing Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analysis.best_performers.map((project, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-2">{project.project_name}</h4>
                      <p className="text-sm font-medium text-gray-700 mb-1">Success Factors:</p>
                      <ul className="space-y-1">
                        {project.success_factors.map((factor, i) => (
                          <li key={i} className="text-sm text-gray-600 flex gap-2">
                            <span className="text-green-600">✓</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strategic Recommendations */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
              <CardTitle>Strategic Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-3">
                {analysis.strategic_recommendations?.map((rec, index) => (
                  <li key={index} className="flex gap-3 text-gray-700">
                    <span className="text-purple-600 font-bold">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Workload Insights */}
          {analysis.workload_insights && (
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-white to-gray-50">
                <CardTitle>Workload & Resource Insights</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">{analysis.workload_insights}</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}