import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/apiClient";
import { Target, Plus, CheckCircle2, AlertTriangle, Clock, Link2, Briefcase, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import WorkSystemFlow from "@/components/work/WorkSystemFlow";
import { getGoalPortfolios, getGoalProgress, getGoalProjects } from "@/lib/workSystem";

const STATUS = {
  not_started: { label: "Not Started", className: "bg-gray-100 text-gray-600", icon: Clock },
  on_track: { label: "On Track", className: "bg-green-100 text-green-700", icon: CheckCircle2 },
  at_risk: { label: "At Risk", className: "bg-amber-100 text-amber-700", icon: AlertTriangle },
  completed: { label: "Completed", className: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
};

const EMPTY_GOAL = {
  objective: "",
  key_results: "",
  period: "2026",
  status: "not_started",
  owner_email: "",
  level: "group",
  portfolio_id: "",
  project_id: "",
  notes: "",
};

export default function GoalsOKRs() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_GOAL);
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["okrs"],
    queryFn: () => api.entities.OKR.list("-created_date", 500),
  });
  const { data: portfolios = [] } = useQuery({ queryKey: ["portfolios"], queryFn: () => api.entities.Portfolio.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => api.entities.Project.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => api.entities.Task.list() });

  const createGoal = useMutation({
    mutationFn: async (data) => {
      const goal = await api.entities.OKR.create({
        objective: data.objective,
        key_results: data.key_results.split("\n").map((line) => line.trim()).filter(Boolean),
        period: data.period || "2026",
        status: data.status,
        owner_email: data.owner_email,
        employee_email: data.owner_email || "group",
        level: data.level,
        portfolio_id: data.portfolio_id || "",
        project_id: data.project_id || "",
        notes: data.notes,
        progress: 0,
      });
      if (data.portfolio_id) await api.entities.Portfolio.update(data.portfolio_id, { okr_id: goal.id });
      if (data.project_id) await api.entities.Project.update(data.project_id, { okr_id: goal.id });
      return goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["okrs"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setForm(EMPTY_GOAL);
      setShowCreate(false);
      toast.success("Goal created and linked");
    },
    onError: (error) => toast.error(error?.message || "Could not create goal"),
  });

  const updateGoal = useMutation({
    mutationFn: ({ id, ...data }) => api.entities.OKR.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["okrs"] }),
    onError: (error) => toast.error(error?.message || "Could not update goal"),
  });

  const goalRows = useMemo(() => goals.map((goal) => {
    const linkedPortfolios = getGoalPortfolios(goal, portfolios);
    const linkedProjects = getGoalProjects(goal, projects, portfolios);
    const progress = getGoalProgress(goal, portfolios, projects, tasks);
    return { goal, linkedPortfolios, linkedProjects, progress };
  }), [goals, portfolios, projects, tasks]);

  const stats = [
    { label: "Goals", value: goals.length, color: "text-slate-900" },
    { label: "On Track", value: goals.filter((goal) => goal.status === "on_track").length, color: "text-green-600" },
    { label: "At Risk", value: goals.filter((goal) => goal.status === "at_risk").length, color: "text-amber-600" },
    { label: "Completed", value: goals.filter((goal) => goal.status === "completed").length, color: "text-blue-600" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-screen-xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Goals & OKRs</h1>
              <p className="text-sm text-gray-500">Set group outcomes and connect them to portfolios, projects and tasks.</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
            <Plus className="w-4 h-4" /> New Goal
          </Button>
        </div>

        <WorkSystemFlow active="goals" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : goalRows.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Target className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-600">No goals yet</p>
              <p className="text-sm text-gray-400 mt-1">Create the group outcome first, then link portfolios and projects to it.</p>
              <Button onClick={() => setShowCreate(true)} className="mt-4">Create First Goal</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {goalRows.map(({ goal, linkedPortfolios, linkedProjects, progress }) => {
              const status = STATUS[goal.status] || STATUS.not_started;
              const StatusIcon = status.icon;
              return (
                <Card key={goal.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-base font-bold text-gray-900">{goal.objective}</CardTitle>
                        <p className="text-xs text-gray-400 mt-1">{goal.period} · {goal.level || "group"}{goal.owner_email ? ` · ${goal.owner_email}` : ""}</p>
                      </div>
                      <Select value={goal.status || "not_started"} onValueChange={(value) => updateGoal.mutate({ id: goal.id, status: value })}>
                        <SelectTrigger className="w-36 h-8 border-0 shadow-none bg-transparent p-0">
                          <Badge className={`${status.className} border-0 text-xs`}>
                            <StatusIcon className="w-3 h-3 mr-1" />{status.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS).map(([key, config]) => <SelectItem key={key} value={key}>{config.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Verified roll-up progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-[11px] text-gray-400 mt-1">Rolls up from linked portfolio/project task completion.</p>
                    </div>

                    {goal.key_results?.length > 0 && (
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Key Results</p>
                        <ul className="space-y-1">
                          {goal.key_results.map((result, index) => (
                            <li key={index} className="text-xs text-gray-600 flex gap-2">
                              <span className="text-gray-300">•</span>
                              <span>{result}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-gray-100 p-3">
                        <p className="text-xs text-gray-400 flex items-center gap-1"><Layers className="w-3 h-3" /> Portfolios</p>
                        <p className="text-lg font-bold text-gray-900">{linkedPortfolios.length}</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 p-3">
                        <p className="text-xs text-gray-400 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Projects</p>
                        <p className="text-lg font-bold text-gray-900">{linkedProjects.length}</p>
                      </div>
                    </div>

                    {(linkedPortfolios.length > 0 || linkedProjects.length > 0) && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Link2 className="w-3 h-3" /> Connected execution</p>
                        {linkedPortfolios.slice(0, 2).map((portfolio) => <p key={portfolio.id} className="text-xs text-gray-500">Portfolio: {portfolio.name}</p>)}
                        {linkedProjects.slice(0, 2).map((project) => <p key={project.id} className="text-xs text-gray-500">Project: {project.name}</p>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader><DialogTitle>New Goal / OKR</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Objective *</Label>
                <Input value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} placeholder="Improve Empoweryst BBBEE client delivery by 30%" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Input value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })} placeholder="Q3 2026" />
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select value={form.level} onValueChange={(value) => setForm({ ...form, level: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="subsidiary">Subsidiary</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS).map(([key, config]) => <SelectItem key={key} value={key}>{config.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Owner email</Label>
                <Input value={form.owner_email} onChange={(event) => setForm({ ...form, owner_email: event.target.value })} placeholder="owner@phakathi.local" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Link Portfolio</Label>
                  <Select value={form.portfolio_id || "none"} onValueChange={(value) => setForm({ ...form, portfolio_id: value === "none" ? "" : value })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Portfolio</SelectItem>
                      {portfolios.map((portfolio) => <SelectItem key={portfolio.id} value={portfolio.id}>{portfolio.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Link Project</Label>
                  <Select value={form.project_id || "none"} onValueChange={(value) => setForm({ ...form, project_id: value === "none" ? "" : value })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Project</SelectItem>
                      {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Key Results</Label>
                <Textarea value={form.key_results} onChange={(event) => setForm({ ...form, key_results: event.target.value })} placeholder={"One key result per line\nExample: Reduce overdue client deliverables to under 5%"} className="h-24" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Context, meeting notes, strategic reason..." className="h-20" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button disabled={!form.objective || createGoal.isPending} onClick={() => createGoal.mutate(form)}>Create Goal</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
