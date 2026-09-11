import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Handshake, Plus } from "lucide-react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const currency = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
const money = (value) => currency.format(Number(value || 0));

export default function Deals() {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({ client_account_id: "", opportunity_id: "", proposal_id: "", value: "" });
  const deals = useQuery({ queryKey: ["business-development", "deals"], queryFn: api.businessDevelopment.deals.list });
  const accounts = useQuery({ queryKey: ["crm", "accounts"], queryFn: api.crm.accounts.list });
  const opportunities = useQuery({ queryKey: ["business-development", "opportunities"], queryFn: api.businessDevelopment.opportunities.list });
  const proposals = useQuery({ queryKey: ["business-development", "proposals"], queryFn: api.businessDevelopment.proposals.list });

  const createDeal = useMutation({
    mutationFn: api.businessDevelopment.deals.create,
    onSuccess: () => {
      setForm({ client_account_id: "", opportunity_id: "", proposal_id: "", value: "" });
      queryClient.invalidateQueries({ queryKey: ["business-development"] });
    },
  });

  const updateDeal = useMutation({
    mutationFn: ({ id, data }) => api.businessDevelopment.deals.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["business-development"] }),
  });

  const dealGroups = [
    { key: "open", label: "Open deals" },
    { key: "won", label: "Won deals" },
    { key: "lost", label: "Lost deals" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <p className="text-sm uppercase tracking-widest text-gray-500">Revenue tracking</p>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Handshake className="w-8 h-8" />
          Deals
        </h1>
        <p className="text-gray-600 mt-1">Track accepted proposals, open commercial work, wins, and losses.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Create deal</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid lg:grid-cols-[1fr_1fr_1fr_0.7fr_auto] gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              createDeal.mutate({
                ...form,
                opportunity_id: form.opportunity_id || null,
                proposal_id: form.proposal_id || null,
                value: Number(form.value || 0),
                status: "open",
              });
            }}
          >
            <select
              value={form.client_account_id}
              onChange={(event) => setForm((item) => ({ ...item, client_account_id: event.target.value }))}
              required
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select client account</option>
              {(accounts.data || []).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
            <select value={form.opportunity_id} onChange={(event) => setForm((item) => ({ ...item, opportunity_id: event.target.value }))} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Link opportunity</option>
              {(opportunities.data || []).map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>)}
            </select>
            <select value={form.proposal_id} onChange={(event) => setForm((item) => ({ ...item, proposal_id: event.target.value }))} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Link proposal</option>
              {(proposals.data || []).map((proposal) => <option key={proposal.id} value={proposal.id}>{proposal.client_account?.name || proposal.id}</option>)}
            </select>
            <Input type="number" value={form.value} onChange={(event) => setForm((item) => ({ ...item, value: event.target.value }))} placeholder="Value" />
            <Button type="submit" disabled={createDeal.isPending}>Save</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid xl:grid-cols-3 gap-4">
        {dealGroups.map((group) => (
          <Card key={group.key}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                {group.label}
                <Badge variant="outline">{(deals.data || []).filter((deal) => group.key === "open" ? deal.status === "open" : deal.status === group.key || deal.status === `closed_${group.key}`).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(deals.data || [])
                .filter((deal) => group.key === "open" ? deal.status === "open" : deal.status === group.key || deal.status === `closed_${group.key}`)
                .map((deal) => (
                  <div key={deal.id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{deal.client_account?.name || "Deal"}</h3>
                        <p className="text-sm text-gray-500">{deal.opportunity?.title || deal.proposal?.id || "No source linked"}</p>
                      </div>
                      <Badge>{deal.status}</Badge>
                    </div>
                    <p className="text-2xl font-bold mt-3">{money(deal.value)}</p>
                    {deal.products_services?.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1">{deal.products_services.length} product/service line item(s)</p>
                    )}
                    {group.key === "open" && (
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" onClick={() => updateDeal.mutate({ id: deal.id, data: { status: "won", closed_at: new Date().toISOString() } })}>Mark won</Button>
                        <Button size="sm" variant="outline" onClick={() => updateDeal.mutate({ id: deal.id, data: { status: "lost", closed_at: new Date().toISOString() } })}>Mark lost</Button>
                      </div>
                    )}
                  </div>
                ))}
              {!(deals.data || []).some((deal) => group.key === "open" ? deal.status === "open" : deal.status === group.key || deal.status === `closed_${group.key}`) && (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-400">No {group.label.toLowerCase()} yet.</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
