import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const currency = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
const money = (value) => currency.format(Number(value || 0));

export default function Proposals() {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({ client_account_id: "", opportunity_id: "", proposal_value: "", expiry_date: "", notes: "" });
  const proposals = useQuery({ queryKey: ["business-development", "proposals"], queryFn: api.businessDevelopment.proposals.list });
  const accounts = useQuery({ queryKey: ["crm", "accounts"], queryFn: api.crm.accounts.list });
  const opportunities = useQuery({ queryKey: ["business-development", "opportunities"], queryFn: api.businessDevelopment.opportunities.list });

  const createProposal = useMutation({
    mutationFn: api.businessDevelopment.proposals.create,
    onSuccess: () => {
      setForm({ client_account_id: "", opportunity_id: "", proposal_value: "", expiry_date: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["business-development"] });
    },
  });

  const updateProposal = useMutation({
    mutationFn: ({ id, data }) => api.businessDevelopment.proposals.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["business-development"] }),
  });

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <p className="text-sm uppercase tracking-widest text-gray-500">Sales documents</p>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="w-8 h-8" />
          Proposals
        </h1>
        <p className="text-gray-600 mt-1">Prepare, send, review, accept, and track client proposals.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Create proposal</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid lg:grid-cols-[1fr_1fr_0.7fr_0.7fr] gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              createProposal.mutate({
                ...form,
                opportunity_id: form.opportunity_id || null,
                proposal_value: Number(form.proposal_value || 0),
                status: "draft",
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
            <select
              value={form.opportunity_id}
              onChange={(event) => setForm((item) => ({ ...item, opportunity_id: event.target.value }))}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Link opportunity (optional)</option>
              {(opportunities.data || []).map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>)}
            </select>
            <Input type="number" value={form.proposal_value} onChange={(event) => setForm((item) => ({ ...item, proposal_value: event.target.value }))} placeholder="Value" />
            <Input type="date" value={form.expiry_date} onChange={(event) => setForm((item) => ({ ...item, expiry_date: event.target.value }))} />
            <textarea
              value={form.notes}
              onChange={(event) => setForm((item) => ({ ...item, notes: event.target.value }))}
              placeholder="Proposal notes and next action"
              className="lg:col-span-3 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button type="submit" disabled={createProposal.isPending}>Save proposal</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-4">
        {(proposals.data || []).map((proposal) => (
          <Card key={proposal.id}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{proposal.client_account?.name || "Proposal"}</h3>
                  <p className="text-sm text-gray-500">{proposal.opportunity?.title || "No opportunity linked"}</p>
                </div>
                <Badge>{proposal.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Value</p>
                  <p className="font-semibold">{money(proposal.proposal_value)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Expires</p>
                  <p className="font-semibold">{proposal.expiry_date ? new Date(proposal.expiry_date).toLocaleDateString() : "Not set"}</p>
                </div>
              </div>
              {proposal.notes && <p className="text-sm text-gray-600">{proposal.notes}</p>}
              <div className="flex flex-wrap gap-2">
                {["sent", "under_review", "accepted", "declined"].map((status) => (
                  <Button key={status} size="sm" variant="outline" disabled={updateProposal.isPending || proposal.status === status} onClick={() => updateProposal.mutate({ id: proposal.id, data: { status } })}>
                    {status.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
