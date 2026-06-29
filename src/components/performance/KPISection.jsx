import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target, Trash2 } from "lucide-react";

const KPI_STATUS = {
  not_started:  { label: "Not Started",   color: "bg-gray-100 text-gray-600" },
  in_progress:  { label: "In Progress",   color: "bg-blue-100 text-blue-700" },
  achieved:     { label: "Achieved",      color: "bg-green-100 text-green-700" },
  not_achieved: { label: "Not Achieved",  color: "bg-red-100 text-red-700" },
};

const EMPTY_KPI = { title: "", description: "", target: "", actual: "", weight: 10, score: 0, status: "not_started", notes: "" };

export default function KPISection({ reviewId, employeeEmail, period, canEdit }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_KPI);
  const queryClient = useQueryClient();

  const { data: kpis = [] } = useQuery({
    queryKey: ["kpis", reviewId],
    queryFn: () => api.entities.KPI.filter({ review_id: reviewId }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.KPI.create({ ...data, review_id: reviewId, employee_email: employeeEmail, period }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kpis", reviewId] }); setShowForm(false); setForm(EMPTY_KPI); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.entities.KPI.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kpis", reviewId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.KPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kpis", reviewId] }),
  });

  const totalWeight = kpis.reduce((s, k) => s + (k.weight || 0), 0);
  const weightedScore = kpis.length > 0
    ? kpis.reduce((s, k) => s + ((k.score || 0) * (k.weight || 0)), 0) / Math.max(totalWeight, 1)
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-500" />
          KPIs ({kpis.length})
          {kpis.length > 0 && (
            <span className="text-xs font-normal text-gray-500 ml-1">
              Weighted Score: <strong className="text-gray-800">{weightedScore.toFixed(1)}/5</strong>
            </span>
          )}
        </h4>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="w-3 h-3 mr-1" /> Add KPI
          </Button>
        )}
      </div>

      {kpis.map((kpi) => (
        <div key={kpi.id} className="p-3 bg-white border border-gray-200 rounded-xl space-y-2">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900 text-sm">{kpi.title}</p>
                <Badge className={`text-xs border-0 ${KPI_STATUS[kpi.status]?.color}`}>
                  {KPI_STATUS[kpi.status]?.label}
                </Badge>
                <span className="text-xs text-gray-400">Weight: {kpi.weight}%</span>
              </div>
              {kpi.description && <p className="text-xs text-gray-500 mt-0.5">{kpi.description}</p>}
            </div>
            {canEdit && (
              <button onClick={() => deleteMutation.mutate(kpi.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Target</p>
              <p className="text-xs text-gray-700 font-medium">{kpi.target || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Actual</p>
              {canEdit ? (
                <Input
                  defaultValue={kpi.actual || ""}
                  className="h-6 text-xs p-1"
                  placeholder="Enter actual result"
                  onBlur={(e) => updateMutation.mutate({ id: kpi.id, actual: e.target.value })}
                />
              ) : (
                <p className="text-xs text-gray-700 font-medium">{kpi.actual || "—"}</p>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-3">
              <Select value={kpi.status} onValueChange={(v) => updateMutation.mutate({ id: kpi.id, status: v })}>
                <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(KPI_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Score:</span>
                <Input
                  type="number" min="0" max="5" step="0.5"
                  defaultValue={kpi.score || 0}
                  className="h-7 w-14 text-xs p-1 text-center"
                  onBlur={(e) => updateMutation.mutate({ id: kpi.id, score: parseFloat(e.target.value) || 0 })}
                />
                <span className="text-xs text-gray-400">/5</span>
              </div>
            </div>
          )}
        </div>
      ))}

      {kpis.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 italic">No KPIs set yet.</p>
      )}

      {showForm && (
        <div className="p-4 bg-orange-50 rounded-xl space-y-3 border border-orange-100">
          <h5 className="font-semibold text-gray-800 text-sm">New KPI</h5>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">KPI Title *</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Customer Satisfaction Score" className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Target</Label>
              <Input value={form.target} onChange={(e) => setForm(f => ({ ...f, target: e.target.value }))} placeholder="e.g. ≥ 90%" className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Weight (%)</Label>
              <Input type="number" min="1" max="100" value={form.weight} onChange={(e) => setForm(f => ({ ...f, weight: parseInt(e.target.value) || 0 }))} className="text-sm" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Description</Label>
              <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of this KPI" className="text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setForm(EMPTY_KPI); }}>Cancel</Button>
            <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.target || createMutation.isPending}
              className="bg-gray-900 hover:bg-gray-700 text-white">Add KPI</Button>
          </div>
        </div>
      )}
    </div>
  );
}