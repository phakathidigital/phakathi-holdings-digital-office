import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, Filter, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

import ProjectCard from "../components/projects/ProjectCard";
import ProjectDialog from "../components/projects/ProjectDialog";
import FilterTabs from "../components/projects/FilterTabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBSIDIARIES } from "@/lib/subsidiaries";

export default function Projects() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subsidiaryFilter, setSubsidiaryFilter] = useState("all");
  
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.entities.Project.list("-updated_date"),
    initialData: [],
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.entities.Task.list(),
    initialData: [],
  });

  const createProjectMutation = useMutation({
    mutationFn: (projectData) => api.entities.Project.create(projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowDialog(false);
      setEditingProject(null);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowDialog(false);
      setEditingProject(null);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => api.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingProject) {
      const projectTaskCount = tasks.filter(t => t.project_id === editingProject.id).length;
      const progress = getProjectProgress(editingProject.id);
      if (data.status === "completed" && (projectTaskCount === 0 || progress < 100)) {
        window.alert("This project cannot be marked completed until all linked tasks are completed. Progress is verified from task completion.");
        return;
      }
      updateProjectMutation.mutate({ id: editingProject.id, data });
    } else {
      createProjectMutation.mutate(data);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowDialog(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteProjectMutation.mutate(id);
    }
  };

  const getProjectProgress = (projectId) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesSubsidiary = subsidiaryFilter === "all" || project.subsidiary === subsidiaryFilter;
    return matchesSearch && matchesStatus && matchesSubsidiary;
  });

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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">Manage all your company projects</p>
          </div>
          <Button
            onClick={() => {
              setEditingProject(null);
              setShowDialog(true);
            }}
            className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </motion.div>

        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-green-700 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Project progress is verified from tasks</p>
            <p className="text-sm text-green-800 mt-1">
              Employees cannot type a project progress percentage. Progress is calculated from linked tasks marked Done.
              A project cannot be completed while linked tasks are still open.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <FilterTabs activeFilter={statusFilter} setActiveFilter={setStatusFilter} />
          <Select value={subsidiaryFilter} onValueChange={setSubsidiaryFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All Subsidiaries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subsidiaries</SelectItem>
              {SUBSIDIARIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-gray-500 mb-4">No projects found</p>
              <Button
                onClick={() => {
                  setEditingProject(null);
                  setShowDialog(true);
                }}
                variant="outline"
              >
                Create Your First Project
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  progress={getProjectProgress(project.id)}
                  taskCount={tasks.filter(t => t.project_id === project.id).length}
                  completedTaskCount={tasks.filter(t => t.project_id === project.id && t.status === 'completed').length}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  index={index}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project Dialog */}
        <ProjectDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          project={editingProject}
          onSubmit={handleSubmit}
          isLoading={createProjectMutation.isPending || updateProjectMutation.isPending}
        />
      </div>
    </div>
  );
}
