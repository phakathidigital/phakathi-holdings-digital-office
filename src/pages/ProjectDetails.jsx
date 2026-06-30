import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, Edit, CheckCircle2, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { format } from "date-fns";

import TaskList from "../components/project-details/TaskList";
import TaskDialog from "../components/project-details/TaskDialog";
import ProjectStats from "../components/project-details/ProjectStats";
import ProjectDialog from "../components/projects/ProjectDialog";
import WorkSystemFlow from "@/components/work/WorkSystemFlow";

export default function ProjectDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await api.entities.Project.list();
      return projects.find(p => p.id === projectId);
    },
    enabled: !!projectId,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => api.entities.Task.filter({ project_id: projectId }, "-updated_date"),
    initialData: [],
    enabled: !!projectId,
  });

  const { data: portfolios = [] } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => api.entities.Portfolio.list(),
    initialData: [],
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => api.entities.Task.create({ ...taskData, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTaskDialog(false);
      setEditingTask(null);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTaskDialog(false);
      setEditingTask(null);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowProjectDialog(false);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => api.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleTaskSubmit = (data) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data });
    } else {
      createTaskMutation.mutate(data);
    }
  };

  const handleProjectSubmit = (data) => {
    if (data.status === "completed" && (tasks.length === 0 || progress < 100)) {
      window.alert("This project cannot be marked completed until all linked tasks are completed. Progress is verified from task completion.");
      return;
    }
    updateProjectMutation.mutate({ id: projectId, data });
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskDialog(true);
  };

  const handleDeleteTask = (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(id);
    }
  };

  const handleStatusChange = (task, newStatus) => {
    const hasIncompleteBlockers = newStatus === "completed" && task.blocked_by?.some((blockedTaskId) => {
      const blocker = tasks.find((item) => item.id === blockedTaskId);
      return blocker && blocker.status !== "completed";
    });
    if (hasIncompleteBlockers) {
      window.alert("This task cannot be marked Done until its blocking task(s) are completed.");
      return;
    }
    updateTaskMutation.mutate({ id: task.id, data: { ...task, status: newStatus } });
  };

  if (!projectId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No project selected</p>
        <Link to={createPageUrl("Projects")}>
          <Button className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  if (projectLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">Project not found</p>
        <Link to={createPageUrl("Projects")}>
          <Button>Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const progress = tasks.length > 0
    ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
    : 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to={createPageUrl("Projects")}>
            <Button variant="ghost" className="mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color || '#D97706' }}
                />
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {project.name}
                </h1>
              </div>
              <p className="text-gray-600">{project.description}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowProjectDialog(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Project
              </Button>
              <Button
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskDialog(true);
                }}
                className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </motion.div>

        <WorkSystemFlow active="projects" compact />

        {/* Project Stats */}
        <ProjectStats project={project} tasks={tasks} progress={progress} />

        {/* Tasks Section */}
        <TaskList
          tasks={tasks}
          isLoading={tasksLoading}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onStatusChange={handleStatusChange}
          allTasks={tasks}
        />

        {/* Task Dialog */}
        <TaskDialog
          open={showTaskDialog}
          onOpenChange={setShowTaskDialog}
          task={editingTask}
          onSubmit={handleTaskSubmit}
          isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
          allProjectTasks={tasks}
        />

        {/* Project Dialog */}
        <ProjectDialog
          open={showProjectDialog}
          onOpenChange={setShowProjectDialog}
          project={project}
          onSubmit={handleProjectSubmit}
          isLoading={updateProjectMutation.isPending}
          portfolios={portfolios}
        />
      </div>
    </div>
  );
}
