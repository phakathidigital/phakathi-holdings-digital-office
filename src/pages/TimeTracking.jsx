import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Timer, TrendingDown, Users, BarChart2, Calendar, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format, subDays, eachDayOfInterval, parseISO, isValid } from 'date-fns';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, AreaChart, Area,
} from 'recharts';

const PERIOD_DAYS = { '7': 7, '14': 14, '30': 30 };

export default function TimeTracking() {
  const [selectedProject, setSelectedProject] = useState('all');
  const [period, setPeriod] = useState('30');

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });
  const { data: logs = [], isLoading } = useQuery({ queryKey: ['timelogs'], queryFn: () => base44.entities.TimeLog.list('-log_date', 500) });

  const days = PERIOD_DAYS[period] || 30;
  const cutoff = subDays(new Date(), days);

  const filteredLogs = logs.filter(l => {
    const d = l.log_date ? parseISO(l.log_date) : null;
    if (!d || !isValid(d)) return false;
    if (d < cutoff) return false;
    if (selectedProject !== 'all' && l.project_id !== selectedProject) return false;
    return true;
  });

  const totalHours = filteredLogs.reduce((s, l) => s + (l.hours || 0), 0);
  const billableHours = filteredLogs.filter(l => l.billable).reduce((s, l) => s + (l.hours || 0), 0);
  const uniqueContributors = [...new Set(filteredLogs.map(l => l.employee_email))].length;
  const activeTasks = [...new Set(filteredLogs.map(l => l.task_id))].length;

  // Burndown data: cumulative hours logged per day vs ideal burn
  const projectTasks = selectedProject === 'all' ? tasks : tasks.filter(t => t.project_id === selectedProject);
  const totalEstimated = projectTasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
  const dateRange = eachDayOfInterval({ start: cutoff, end: new Date() });
  let cumulativeHours = 0;
  const burndownData = dateRange.map((day, i) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayHours = filteredLogs.filter(l => l.log_date === dayStr).reduce((s, l) => s + (l.hours || 0), 0);
    cumulativeHours += dayHours;
    const ideal = totalEstimated > 0 ? Math.max(0, totalEstimated - (totalEstimated / days) * (i + 1)) : null;
    return { date: format(day, 'MMM d'), logged: parseFloat(cumulativeHours.toFixed(1)), ideal: ideal ? parseFloat(ideal.toFixed(1)) : null };
  });

  // Daily hours bar chart
  const dailyData = dateRange.slice(-14).map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayHours = filteredLogs.filter(l => l.log_date === dayStr).reduce((s, l) => s + (l.hours || 0), 0);
    return { date: format(day, 'MMM d'), hours: parseFloat(dayHours.toFixed(1)) };
  });

  // Capacity by person
  const capacityMap = {};
  filteredLogs.forEach(l => {
    const key = l.employee_name || l.employee_email;
    capacityMap[key] = (capacityMap[key] || 0) + (l.hours || 0);
  });
  const capacityData = Object.entries(capacityMap)
    .map(([name, hours]) => ({ name: name.split(' ')[0] || name.split('@')[0], hours: parseFloat(hours.toFixed(1)) }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10);

  // Per-task hours
  const taskHoursMap = {};
  filteredLogs.forEach(l => {
    taskHoursMap[l.task_id] = (taskHoursMap[l.task_id] || { title: l.task_title || l.task_id, hours: 0 });
    taskHoursMap[l.task_id].hours += l.hours || 0;
  });
  const taskRows = Object.values(taskHoursMap).sort((a, b) => b.hours - a.hours).slice(0, 8);

  const statCards = [
    { label: 'Total Hours Logged', value: totalHours.toFixed(1) + 'h', icon: Timer, color: 'text-blue-600 bg-blue-50' },
    { label: 'Billable Hours', value: billableHours.toFixed(1) + 'h', icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: 'Team Members', value: uniqueContributors, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Tasks Worked', value: activeTasks, icon: BarChart2, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl"><Timer className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Time Tracking</h1>
            <p className="text-sm text-gray-500">Burndown, capacity, and resource reports</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48 bg-white"><SelectValue placeholder="All Projects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="w-4 h-4" /></div>
            <div><p className="text-xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Budget Burndown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-800 text-sm">Budget Burn-Down</h3>
            {totalEstimated > 0 && (
              <Badge className="ml-auto text-xs bg-blue-50 text-blue-700 border-0">
                Est. {totalEstimated}h total
              </Badge>
            )}
          </div>
          {isLoading ? <div className="h-52 bg-gray-50 rounded-lg animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="logged" stroke="#3b82f6" fill="#eff6ff" name="Hours Logged" strokeWidth={2} />
                {totalEstimated > 0 && <Line type="monotone" dataKey="ideal" stroke="#ef4444" strokeDasharray="5 5" name="Ideal Burn" dot={false} strokeWidth={1.5} />}
              </AreaChart>
            </ResponsiveContainer>
          )}
          {totalEstimated === 0 && (
            <p className="text-xs text-center text-gray-400 mt-1">Set estimated_hours on tasks to see ideal burn line</p>
          )}
        </div>

        {/* Daily Hours */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-800 text-sm">Daily Hours (last 14 days)</h3>
          </div>
          {isLoading ? <div className="h-52 bg-gray-50 rounded-lg animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={1} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Resource Capacity */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-gray-800 text-sm">Resource Capacity</h3>
          </div>
          {capacityData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No time logged in this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={capacityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="hours" fill="#10b981" radius={[0, 4, 4, 0]} name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Tasks by Hours */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-orange-600" />
            <h3 className="font-semibold text-gray-800 text-sm">Most Time-Intensive Tasks</h3>
          </div>
          {taskRows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No task logs yet</p>
          ) : (
            <div className="space-y-2">
              {taskRows.map((t, i) => {
                const pct = taskRows[0]?.hours > 0 ? (t.hours / taskRows[0].hours) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 flex-1 truncate">{t.title}</span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-12 text-right">{t.hours.toFixed(1)}h</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Logs Table */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 text-sm mb-4 flex items-center gap-2">
          <Timer className="w-4 h-4 text-gray-500" /> Recent Time Entries
        </h3>
        {filteredLogs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No time entries for this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Date', 'Task', 'Employee', 'Hours', 'Billable', 'Notes'].map(h => (
                    <th key={h} className="text-left text-gray-500 font-medium pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.slice(0, 20).map(l => (
                  <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{l.log_date}</td>
                    <td className="py-2 pr-4 text-gray-800 max-w-[180px] truncate">{l.task_title}</td>
                    <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{(l.employee_name || l.employee_email || '').split(' ')[0]}</td>
                    <td className="py-2 pr-4 font-semibold text-gray-900">{l.hours}h</td>
                    <td className="py-2 pr-4">
                      <Badge className={`text-xs border-0 ${l.billable ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {l.billable ? 'Billable' : 'Non-bill'}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 text-gray-500 max-w-[200px] truncate">{l.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}