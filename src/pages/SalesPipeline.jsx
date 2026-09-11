import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Columns, Plus, Target } from "lucide-react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const currency = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
const money = (value) => currency.format(Number(value || 0));

export default function SalesPipeline() {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({ title: "", value: "", expected_close_date: "" });
  const pipeline = useQuery({
    queryKey: ["business-development", "pipeline"],
    queryFn: api.businessDevelopment.pipeline,
  });

  const createOpportunity = useMutation({
    mutationFn: api.businessDevelopment.opportunities.create,
    onSuccess: () => {
      setForm({ title: "", value: "", expected_close_date: "" });
      queryClient.invalidateQueries({ queryKey: ["business-development"] });
    },
  });

  const moveOpportunity = useMutation({
    mutationFn: ({ id, stageId }) => api.businessDevelopment.opportunities.move(id, stageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["business-development"] }),
  });

  const data = pipeline.data || {};
  const stages = data.stages || [];

  function nextStageId(currentStageId) {
    const index = stages.findIndex((stage) => stage.id === currentStageId);
    if (index < 0 || index >= stages.length - 1) return null;
    return stages[index + 1].id;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-gray-500">Reusable Kanban workflow</p>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Columns className="w-8 h-8" />
            Sales Pipeline
          </h1>
          <p className="text-gray-600 mt-1">
            Move opportunities through lead, discovery, proposal, negotiation, won, or lost stages.
          </p>
        </div>

        <Card className="lg:w-[520px]">
          <CardContent className="p-4">
            <form
              className="grid md:grid-cols-[1.2fr_0.7fr_0.8fr_auto] gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                createOpportunity.mutate({
                  title: form.title,
                  value: Number(form.value || 0),
                  expected_close_date: form.expected_close_date || null,
                });
              }}
            >
              <Input value={form.title} onChange={(event) => setForm((item) => ({ ...item, title: event.target.value }))} placeholder="New opportunity" required />
              <Input type="number" value={form.value} onChange={(event) => setForm((item) => ({ ...item, value: event.target.value }))} placeholder="Value" />
              <Input type="date" value={form.expected_close_date} onChange={(event) => setForm((item) => ({ ...item, expected_close_date: event.target.value }))} />
              <Button type="submit" disabled={createOpportunity.isPending}>
                <Plus className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
        {(data.columns || []).map((column) => (
          <Card key={column.id} className="min-h-[360px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  {column.name}
                </span>
                <Badge variant="outline">{column.opportunities?.length || 0}</Badge>
              </CardTitle>
              <p className="text-xs text-gray-500">{column.probability}% probability</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {(column.opportunities || []).map((opportunity) => {
                const next = nextStageId(column.id);
                return (
                  <div key={opportunity.id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{opportunity.title}</h3>
                        <p className="text-sm text-gray-500">{opportunity.client_account?.name || opportunity.industry || "No account linked"}</p>
                      </div>
                      <Badge>{opportunity.status}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Value</p>
                        <p className="font-semibold">{money(opportunity.value)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Weighted</p>
                        <p className="font-semibold">{money(opportunity.weighted_value)}</p>
                      </div>
                    </div>
                    {opportunity.next_action && <p className="mt-3 text-sm text-gray-600">{opportunity.next_action}</p>}
                    {next && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4 w-full justify-between"
                        disabled={moveOpportunity.isPending}
                        onClick={() => moveOpportunity.mutate({ id: opportunity.id, stageId: next })}
                      >
                        Move forward <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {!column.opportunities?.length && (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-400">
                  No opportunities in this stage.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
