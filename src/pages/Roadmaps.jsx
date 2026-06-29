import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Map, Plus, CheckCircle2, AlertTriangle, Calendar, Flag, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isBefore } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const STATUS_CFG = {
  pending:     { cls: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-300' },
  in_progress: { cls: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  completed:   { cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  delayed:     { cls: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
};

const EMPTY = { title: '', description: '', due_date: '', status: 'pending', project_id: '', owner_email: '', progress: 0 };

export default function Roadmaps() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [filterProject, setFilterProject] = useState('all');
  const qc = useQueryClient();
  const today = new Date();

  const { data: milestones = [], isLoading } = useQuery({ queryKey: ['milestones'], queryFn: () => api.entities.Milestone.list('due_date') });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => api.entities.Project.list() });

  const create = useMutation({
    mutationFn: d => api.entities.Milestone.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['milestones'] }); setShowCreate(false); setForm(EMPTY); toast.success('Milestone added'); },
  });
  const updateM = useMutation({
    mutationFn: ({ id, ...d }) => api.entities.Milestone.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones'] }),
  });

  const filtered = filterProject === 'all' ? milestones : milestones.filter(m => m.project_id === filterProject);
  const byProject = {};
  filtered.forEach(m => {
    const key = m.project_id || '__general__';
    if (!byProject[key]) byProject[key] = [];
    byProject[key].push(m);
  });

  const upcoming = filtered.filter(m => m.due_date && !isBefore(parseISO(m.due_date), today) && m.status !== 'completed').length;
  const overdue  = filtered.filter(m => m.due_date &&  isBefore(parseISO(m.due_date), today) && m.status !== 'completed').length;
  const done     = filtered.filter(m => m.status === 'completed').length;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-screen-xl mx-auto space-y-6">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Map className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Roadmaps</h1>
              <p className="text-sm text-gray-500">Strategic milestones & project timelines</p>
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
            <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" />Add Milestone</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: filtered.length, color: 'text-indigo-600' },
            { label: 'Upcoming', value: upcoming, color: 'text-blue-600' },
            { label: 'Overdue', value: overdue, color: 'text-red-600' },
            { label: 'Completed', value: done, color: 'text-green-600' },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent></Card>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="py-20 text-center">
            <Map className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No Milestones Yet</h3>
            <p className="text-sm text-gray-400 mb-4">Define strategic milestones to build your roadmap</p>
            <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Add Milestone</Button>
          </CardContent></Card>
        ) : (
          Object.entries(byProject).map(([projId, items], gi) => {
            const proj = projects.find(p => p.id === projId);
            return (
              <motion.div key={projId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.05 }}>
                <Card className="border-0 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 bg-gray-50/80 border-b border-gray-100">
                    <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Flag className="w-4 h-4 text-indigo-500" />
                      {proj?.name || 'General Milestones'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-100" />
                      {items.map((m, mi) => {
                        const isLate = m.due_date && isBefore(parseISO(m.due_date), today) && m.status !== 'completed';
                        const cfg = isLate ? { cls: 'bg-red-100 text-red-700', dot: 'bg-red-500' } : (STATUS_CFG[m.status] || STATUS_CFG.pending);
                        return (
                          <div key={m.id} className="flex items-start gap-4 px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                            <div className="relative z-10 flex-shrink-0 mt-1">
                              <div className={`w-4 h-4 rounded-full border-2 border-white shadow ${cfg.dot}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-sm font-semibold ${m.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{m.title}</p>
                                <Badge className={`text-xs border-0 ${cfg.cls}`}>{m.status?.replace('_', ' ')}</Badge>
                                {isLate && <Badge className="text-xs border-0 bg-red-50 text-red-600">Overdue</Badge>}
                              </div>
                              {m.description && <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>}
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                {m.due_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(parseISO(m.due_date), 'dd MMM yyyy')}</span>}
                                {m.owner_email && <span>{m.owner_email}</span>}
                              </div>
                              {m.progress > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                  <Progress value={m.progress} className="h-1.5 flex-1" />
                                  <span className="text-xs text-gray-400 flex-shrink-0">{m.progress}%</span>
                                </div>
                              )}
                            </div>
                            {m.status !== 'completed' && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600 hover:bg-green-50 flex-shrink-0"
                                onClick={() => updateM.mutate({ id: m.id, status: 'completed', progress: 100 })}>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Done
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>New Milestone</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="h-20" />
              <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Link to Project (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No Project</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                <Input placeholder="Owner email" value={form.owner_email} onChange={e => setForm({ ...form, owner_email: e.target.value })} />
              </div>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(STATUS_CFG).map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button disabled={!form.title || create.isPending} onClick={() => create.mutate(form)}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}