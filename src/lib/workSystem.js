export const WORK_SYSTEM_STEPS = [
  {
    key: "goals",
    label: "Goals & OKRs",
    path: "/PerformanceReviews",
    description: "Define what the group or employee must achieve.",
  },
  {
    key: "portfolios",
    label: "Portfolios",
    path: "/Portfolios",
    description: "Group related projects under a strategic initiative.",
  },
  {
    key: "projects",
    label: "Projects",
    path: "/Projects",
    description: "Own deliverables, subsidiary, budget, dates and team.",
  },
  {
    key: "tasks",
    label: "Kanban",
    path: "/Kanban",
    description: "Create, assign and move the actual work.",
  },
  {
    key: "schedule",
    label: "Roadmap / Gantt",
    path: "/GanttChart",
    description: "See milestones, deadlines and task dependencies.",
  },
  {
    key: "capacity",
    label: "Workload / Time",
    path: "/WorkloadPlanner",
    description: "Check capacity, logged time and delivery effort.",
  },
];

export function getProjectTasks(tasks = [], projectId) {
  return tasks.filter((task) => task.project_id === projectId);
}

export function getTaskProgress(tasks = []) {
  if (!tasks.length) return 0;
  const completed = tasks.filter((task) => task.status === "completed").length;
  return Math.round((completed / tasks.length) * 100);
}

export function getProjectProgress(project, tasks = []) {
  return getTaskProgress(getProjectTasks(tasks, project?.id));
}

export function getPortfolioProjects(portfolio, projects = []) {
  const explicitIds = new Set(portfolio?.project_ids || []);
  return projects.filter((project) => project.portfolio_id === portfolio?.id || explicitIds.has(project.id));
}

export function getPortfolioProgress(portfolio, projects = [], tasks = []) {
  const linkedProjects = getPortfolioProjects(portfolio, projects);
  if (!linkedProjects.length) return 0;
  const total = linkedProjects.reduce((sum, project) => sum + getProjectProgress(project, tasks), 0);
  return Math.round(total / linkedProjects.length);
}

