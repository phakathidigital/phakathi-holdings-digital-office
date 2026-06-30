import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Layers, Plus, CheckCircle, AlertTriangle, Clock, TrendingUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import WorkSystemFlow from '@/components/work/WorkSystemFlow';
import { getPortfolioProgress, getPortfolioProjects } from '@/lib/workSystem';

const STATUS_STYLES = {
  active:     { cls: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: TrendingUp },
  on_track:   { cls: 'bg-green-100 text-green-700 border-green-200',    icon: CheckCircle },
  at_risk:    { cls: 'bg-amber-100 text-amber-700 border-amber-200',    icon: AlertTriangle },
  delayed:    { cls: 'bg-red-100 text-red-700 border-red-200',          icon: AlertTriangle },
  completed:  { cls: 'bg-blue-100 text-blue-700 border-blue-200',       icon: CheckCircle },
  archived:   { cls: 'bg-gray-100 text-gray-500 border-gray-200',       icon: Clock },
};

const EMPTY_FORM = { name: '', description: '', status: 'active', budget: '', owner: '', strategic_objective: '', start_date: '', end_date: '' };

export default function Portfolios() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const qc = useQueryClient();

  const { data: portfolios = [], isLoading } = useQuery({ queryKey: ['portfolios'], queryFn: () => api.entities.Portfolio.list('-created_date') });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => api.entities.Project.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => api.entities.Task.list() });

  const create = useMutation({
    mutationFn: d => api.entities.Portfolio.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolios'] }); setShowCreate(false); setForm(EMPTY_FORM); toast.success('Portfolio created'); },
  });
  const remove = useMutation({
    mutationFn: id => api.entities.Portfolio.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolios'] }); toast.success('Portfolio deleted'); },
  });
  const update = useMutation({
    mutationFn: ({ id, ...d }) => api.entities.Portfolio.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolios'] }),
  });

  const stats = [
    { label: 'Portfolios', value: portfolios.length, color: 'text-indigo-600' },
    { label: 'Active', value: portfolios.filter(p => ['active','on_track'].includes(p.status)).length, color: 'text-green-600' },
    { label: 'At Risk', value: portfolios.filter(p => p.status === 'at_risk').length, color: 'text-amber-600' },
    { label: 'Projects', value: projects.length, color: 'text-blue-600' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-screen-xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Portfolios</h1>
              <p className="text-sm text-gray-500">Group projects into strategic initiatives</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" />New Portfolio</Button>
        </div>

        <WorkSystemFlow active="portfolios" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent></Card>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-20">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No Portfolios Yet</h3>
            <p className="text-sm text-gray-400 mb-4">Group your projects into strategic portfolios</p>
            <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Create Portfolio</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {portfolios.map((p, idx) => {
              const stl = STATUS_STYLES[p.status] || STATUS_STYLES.active;
              const SIcon = stl.icon;
              const linked = getPortfolioProjects(p, projects);
              const progress = getPortfolioProgress(p, projects, tasks);
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all bg-white h-full flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-bold text-gray-900">{p.name}</CardTitle>
                          {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                        </div>
                        <Badge className={`text-xs border flex-shrink-0 ${stl.cls}`}>
                          <SIcon className="w-3 h-3 mr-1" />{p.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                      {linked.length > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Verified roll-up progress</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <p className="text-[11px] text-gray-400 mt-1">Average progress of linked projects, which is calculated from tasks.</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {p.budget && <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">Budget</p><p className="font-semibold">R{Number(p.budget).toLocaleString()}</p></div>}
                        {p.owner && <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">Owner</p><p className="font-semibold truncate">{p.owner}</p></div>}
                        {p.start_date && <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">Start</p><p className="font-semibold">{p.start_date}</p></div>}
                        {p.end_date && <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">End</p><p className="font-semibold">{p.end_date}</p></div>}
                      </div>
                      {p.strategic_objective && (
                        <div className="bg-indigo-50 rounded-lg p-2">
                          <p className="text-xs text-gray-400">Strategic Objective</p>
                          <p className="text-xs text-indigo-800 mt-0.5">{p.strategic_objective}</p>
                        </div>
                      )}
                      {linked.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Linked Projects</p>
                          {linked.slice(0, 3).map(pr => <p key={pr.id} className="text-xs text-gray-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 inline-block" />{pr.name}</p>)}
                          {linked.length > 3 && <p className="text-xs text-gray-400">+{linked.length - 3} more</p>}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Select value={p.status} onValueChange={v => update.mutate({ id: p.id, status: v })}>
                          <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(STATUS_STYLES).map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600" onClick={() => remove.mutate(p.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>New Portfolio</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Portfolio name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="h-20" />
              <Input placeholder="Strategic Objective" value={form.strategic_objective} onChange={e => setForm({ ...form, strategic_objective: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Budget (ZAR)" type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
                <Input placeholder="Owner email" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
                <Input type="date" placeholder="Start date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                <Input type="date" placeholder="End date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(STATUS_STYLES).map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button disabled={!form.name || create.isPending} onClick={() => create.mutate(form)}>Create Portfolio</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
