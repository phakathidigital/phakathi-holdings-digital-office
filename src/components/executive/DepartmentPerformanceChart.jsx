import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const DEPARTMENTS = ['Management', 'Finance', 'HR', 'IT', 'Operations', 'Empoweryst'];

export default function DepartmentPerformanceChart() {
  const { data: tasks = [] } = useQuery({ queryKey: ['dept-tasks'], queryFn: () => api.entities.Task.list() });
  const { data: leaves = [] } = useQuery({ queryKey: ['dept-leaves'], queryFn: () => api.entities.LeaveRequest.list() });
  const { data: tickets = [] } = useQuery({ queryKey: ['dept-tickets'], queryFn: () => api.entities.Ticket.list() });

  const data = DEPARTMENTS.map(dept => {
    const deptTasks = tasks.filter(t => t.project_id); // simplified
    const deptLeaves = leaves.filter(l => l.department === dept);
    const approvedLeaves = deptLeaves.filter(l => l.status === 'approved').length;
    const deptTickets = tickets.filter(t => t.queue?.toLowerCase().includes(dept.toLowerCase()));
    const resolvedTickets = deptTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const ticketResolutionRate = deptTickets.length > 0 ? Math.round((resolvedTickets / deptTickets.length) * 100) : 100;
    const leaveApprovalRate = deptLeaves.length > 0 ? Math.round((approvedLeaves / deptLeaves.length) * 100) : 100;
    return {
      dept,
      'Ticket Resolution': ticketResolutionRate,
      'Leave Efficiency': leaveApprovalRate,
      'Activity': Math.min(100, (deptLeaves.length + deptTickets.length) * 5),
    };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Department Activity Radar</h3>
      <p className="text-xs text-gray-400 mb-4">Cross-department operations overview</p>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid />
          <PolarAngleAxis dataKey="dept" tick={{ fontSize: 11 }} />
          <Radar name="Ticket Resolution" dataKey="Ticket Resolution" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
          <Radar name="Leave Efficiency" dataKey="Leave Efficiency" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}