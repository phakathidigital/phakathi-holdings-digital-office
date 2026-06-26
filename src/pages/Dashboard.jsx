import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { isOverdue } from "@/lib/taskUtils";

import StatsGrid from "@/components/dashboard/StatsGrid";
import ProjectsOverview from "@/components/dashboard/ProjectsOverview";
import RecentTasks from "@/components/dashboard/RecentTasks";
import TeamPerformance from "@/components/dashboard/TeamPerformance";
import EmployeeAwards from "@/components/dashboard/EmployeeAwards";
import HeroBanner from "@/components/dashboard/HeroBanner";
import WelcomeTour from "@/components/dashboard/WelcomeTour";
import BirthdayConfetti from "@/components/dashboard/BirthdayConfetti";
import TeamBirthdays from "@/components/dashboard/TeamBirthdays";

export default function Dashboard() {
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

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const [user, setUser] = useState(null);
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'in_progress').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    overdueTasks: tasks.filter(t => isOverdue(t)).length,
    teamMembers: users.length,
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* First-time user tour — shows for first 5 logins */}
      <WelcomeTour user={user} />
      {/* Birthday confetti */}
      <BirthdayConfetti user={user} />

      <div className="max-w-7xl mx-auto space-y-7">
        {/* Hero banner */}
        <HeroBanner user={user} stats={stats} />

        {/* Stats */}
        <StatsGrid stats={stats} isLoading={projectsLoading || tasksLoading} />

        {/* Employee Awards */}
        <EmployeeAwards tasks={tasks} users={users} />

        {/* Team Birthdays */}
        <TeamBirthdays />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ProjectsOverview
            projects={projects}
            isLoading={projectsLoading}
          />
          <TeamPerformance users={users} tasks={tasks} projects={projects} />
        </div>

        {/* Recent Tasks */}
        <RecentTasks
          tasks={tasks}
          projects={projects}
          isLoading={tasksLoading}
        />
      </div>
    </div>
  );
}