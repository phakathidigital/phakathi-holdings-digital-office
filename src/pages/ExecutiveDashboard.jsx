import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Users, ShieldCheck, Ticket, Star, CalendarOff, FolderOpen, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import ExecutiveSummaryCards from '../components/executive/ExecutiveSummaryCards';
import EngagementAnalytics from '../components/executive/EngagementAnalytics';
import DepartmentPerformanceChart from '../components/executive/DepartmentPerformanceChart';
import DAMHealthWidget from '../components/dam/DAMHealthWidget';

export default function ExecutiveDashboard() {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: tasks = [] } = useQuery({ queryKey: ['exec-tasks-count'], queryFn: () => base44.entities.Task.list() });
  const { data: tickets = [] } = useQuery({ queryKey: ['exec-tickets-count'], queryFn: () => base44.entities.Ticket.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['exec-projects-count'], queryFn: () => base44.entities.Project.list() });
  const { data: leaves = [] } = useQuery({ queryKey: ['exec-leaves-count'], queryFn: () => base44.entities.LeaveRequest.list() });
  const { data: reviews = [] } = useQuery({ queryKey: ['exec-reviews-count'], queryFn: () => base44.entities.PerformanceReview.list() });
  const { data: documents = [] } = useQuery({ queryKey: ['exec-docs-count'], queryFn: () => base44.entities.HRDocument.list() });

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Access Restricted</h2>
          <p className="text-sm text-gray-400">Executive Dashboard is available to administrators only.</p>
        </div>
      </div>
    );
  }

  const activeTasks = tasks.filter(t => t.status !== 'completed').length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  const completedReviews = reviews.filter(r => r.status === 'completed').length;
  const pendingDocs = documents.filter(d => d.status === 'pending_review').length;

  const metrics = [
    { label: 'Active Projects', value: activeProjects, icon: Layers, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', trend: 0, trendLabel: 'stable' },
    { label: 'Open Tickets', value: openTickets, icon: Ticket, iconBg: 'bg-orange-50', iconColor: 'text-orange-600', trend: openTickets > 10 ? -1 : 1, trendLabel: openTickets > 10 ? 'high volume' : 'healthy' },
    { label: 'Pending Leaves', value: pendingLeaves, icon: CalendarOff, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', trend: 0, trendLabel: 'awaiting approval' },
    { label: 'Tasks In Progress', value: activeTasks, icon: TrendingUp, iconBg: 'bg-green-50', iconColor: 'text-green-600', trend: 1, trendLabel: 'active' },
    { label: 'Reviews Completed', value: completedReviews, icon: Star, iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600', trend: completedReviews > 0 ? 1 : -1, trendLabel: `of ${reviews.length}` },
    { label: 'Docs Pending Review', value: pendingDocs, icon: FolderOpen, iconBg: 'bg-red-50', iconColor: 'text-red-500', trend: pendingDocs > 5 ? -1 : 0, trendLabel: pendingDocs > 5 ? 'needs attention' : 'on track' },
    { label: 'Total Staff (Tasks)', value: [...new Set(tasks.filter(t => t.assigned_to).map(t => t.assigned_to))].length, icon: Users, iconBg: 'bg-purple-50', iconColor: 'text-purple-600', trend: 1, trendLabel: 'team members' },
    { label: 'DAM Documents', value: documents.length, icon: ShieldCheck, iconBg: 'bg-teal-50', iconColor: 'text-teal-600', trend: 0, trendLabel: 'total assets' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-gray-900 rounded-xl">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-sm text-gray-500">Enterprise-wide operations overview — Phakathi Holdings Group</p>
        </div>
      </motion.div>

      <ExecutiveSummaryCards metrics={metrics} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <EngagementAnalytics />
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" /> DAM Compliance
            </h3>
            <DAMHealthWidget />
          </div>
        </div>
      </div>

      <DepartmentPerformanceChart />
    </div>
  );
}