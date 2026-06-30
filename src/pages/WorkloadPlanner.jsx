import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Users, AlertTriangle, CheckCircle, TrendingUp, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import WorkSystemFlow from '@/components/work/WorkSystemFlow';

const WEEKLY_CAP = 40; // hours

function utilInfo(hours) {
  const pct = (hours / WEEKLY_CAP) * 100;
  if (pct > 120) return { label: 'Overloaded', bg: 'bg-red-500', badge: 'bg-red-100 text-red-700', Icon: AlertTriangle };
  if (pct > 90)  return { label: 'High Load',  bg: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700', Icon: TrendingUp };
  if (pct > 40)  return { label: 'Optimal',    bg: 'bg-green-500', badge: 'bg-green-100 text-green-700', Icon: CheckCircle };
  return          { label: 'Available',   bg: 'bg-blue-400', badge: 'bg-blue-100 text-blue-700', Icon: Users };
}

export default function WorkloadPlanner() {
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => api.entities.Task.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => api.entities.Project.list() });

  const filtered = tasks.filter(t => {
    if (!t.assigned_to) return false;
    if (filterProject !== 'all' && t.project_id !== filterProject) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return t.status !== 'completed';
  });

  const workloadMap = {};
  filtered.forEach(t => {
    if (!workloadMap[t.assigned_to]) workloadMap[t.assigned_to] = { email: t.assigned_to, tasks: [], hours: 0 };
    workloadMap[t.assigned_to].tasks.push(t);
    workloadMap[t.assigned_to].hours += t.estimated_hours || 4;
  });
  const workload = Object.values(workloadMap).sort((a, b) => b.hours - a.hours);

  const unassigned = tasks.filter(t => !t.assigned_to && t.status !== 'completed');
  const overloaded = workload.filter(w => w.hours > WEEKLY_CAP * 1.2).length;
  const underused = workload.filter(w => w.hours < WEEKLY_CAP * 0.4).length;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-screen-xl mx-auto space-y-6">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Workload Planner</h1>
              <p className="text-sm text-gray-500">Team capacity & utilisation — based on estimated task hours</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="All Projects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <WorkSystemFlow active="capacity" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Team Members', value: workload.length, color: 'text-indigo-600' },
            { label: 'Overloaded',   value: overloaded,      color: 'text-red-600' },
            { label: 'Underutilised', value: underused,      color: 'text-blue-600' },
            { label: 'Unassigned Tasks', value: unassigned.length, color: 'text-amber-600' },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent></Card>
          ))}
        </div>

        {workload.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No assigned tasks found.<br />Assign tasks to team members on the <Link to="/Kanban" className="text-indigo-500 hover:underline">Kanban board</Link>.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {workload.map((person, idx) => {
              const pct = Math.min(150, Math.round((person.hours / WEEKLY_CAP) * 100));
              const util = utilInfo(person.hours);
              const UIcon = util.Icon;
              return (
                <motion.div key={person.email} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex items-center gap-3 md:w-56 flex-shrink-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">{person.email.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{person.email}</p>
                            <p className="text-xs text-gray-400">{person.tasks.length} task{person.tasks.length !== 1 ? 's' : ''} · {person.hours}h est.</p>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{person.hours}h / {WEEKLY_CAP}h capacity</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${util.bg} ${pct > 100 ? 'animate-pulse' : ''}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                        <div className="md:w-28 flex-shrink-0">
                          <Badge className={`text-xs border-0 ${util.badge}`}>
                            <UIcon className="w-3 h-3 mr-1" />{util.label}
                          </Badge>
                        </div>
                      </div>
                      {person.tasks.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 pl-12">
                          {person.tasks.slice(0, 5).map(t => (
                            <span key={t.id} className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-gray-600 truncate max-w-[180px]">{t.title}</span>
                          ))}
                          {person.tasks.length > 5 && <span className="text-xs text-gray-400">+{person.tasks.length - 5} more</span>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {unassigned.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />Unassigned Tasks ({unassigned.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {unassigned.slice(0, 12).map(t => (
                  <span key={t.id} className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded px-2 py-1">{t.title}</span>
                ))}
                {unassigned.length > 12 && <span className="text-xs text-gray-400 self-center">+{unassigned.length - 12} more</span>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
