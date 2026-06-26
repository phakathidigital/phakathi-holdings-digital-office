import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const DEPT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function EngagementAnalytics() {
  const { data: leaves = [] } = useQuery({ queryKey: ['exec-leaves'], queryFn: () => base44.entities.LeaveRequest.list() });
  const { data: tickets = [] } = useQuery({ queryKey: ['exec-tickets'], queryFn: () => base44.entities.Ticket.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['exec-tasks'], queryFn: () => base44.entities.Task.list() });
  const { data: reviews = [] } = useQuery({ queryKey: ['exec-reviews'], queryFn: () => base44.entities.PerformanceReview.list() });

  // Leave by type
  const leaveByType = leaves.reduce((acc, l) => {
    acc[l.leave_type] = (acc[l.leave_type] || 0) + 1;
    return acc;
  }, {});
  const leaveChartData = Object.entries(leaveByType).map(([name, value]) => ({ name, value }));

  // Tickets by status
  const ticketsByStatus = [
    { name: 'Open', value: tickets.filter(t => t.status === 'open').length },
    { name: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length },
    { name: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length },
    { name: 'Closed', value: tickets.filter(t => t.status === 'closed').length },
  ].filter(d => d.value > 0);

  // Tasks by status
  const tasksByStatus = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
    { name: 'Review', value: tasks.filter(t => t.status === 'review').length },
    { name: 'Done', value: tasks.filter(t => t.status === 'completed').length },
  ];

  // Review completion
  const reviewCompletion = [
    { name: 'Draft', value: reviews.filter(r => r.status === 'draft').length },
    { name: 'Self Assessment', value: reviews.filter(r => r.status === 'self_assessment_pending').length },
    { name: 'Manager Review', value: reviews.filter(r => r.status === 'manager_review_pending').length },
    { name: 'Completed', value: reviews.filter(r => r.status === 'completed').length },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Leave Requests by Type</h3>
        {leaveChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={leaveChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-gray-400 text-center py-8">No leave data</p>}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Support Tickets</h3>
        {ticketsByStatus.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={ticketsByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {ticketsByStatus.map((_, idx) => <Cell key={idx} fill={DEPT_COLORS[idx % DEPT_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-gray-400 text-center py-8">No ticket data</p>}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Task Pipeline</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tasksByStatus} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#10b981" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Performance Review Status</h3>
        {reviewCompletion.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={reviewCompletion} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={3}>
                {reviewCompletion.map((_, idx) => <Cell key={idx} fill={DEPT_COLORS[idx % DEPT_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-gray-400 text-center py-8">No review data</p>}
      </div>
    </div>
  );
}