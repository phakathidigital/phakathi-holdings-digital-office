import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Users, Target, FileText, Handshake, Plus } from "lucide-react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const currency = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });

function money(value) {
  return currency.format(Number(value || 0));
}

function MetricCard({ title, value, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BusinessDevelopment() {
  const queryClient = useQueryClient();
  const [leadForm, setLeadForm] = React.useState({ title: "", estimated_value: "", description: "" });
  const overview = useQuery({
    queryKey: ["business-development", "overview"],
    queryFn: api.businessDevelopment.overview,
  });

  const createLead = useMutation({
    mutationFn: api.businessDevelopment.leads.create,
    onSuccess: () => {
      setLeadForm({ title: "", estimated_value: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["business-development"] });
    },
  });

  const data = overview.data || {};
  const summary = data.summary || {};

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <p className="text-sm uppercase tracking-widest text-gray-500">Growth system</p>
        <h1 className="text-3xl font-bold text-gray-900">Business Development</h1>
        <p className="text-gray-600 mt-1">
          Capture leads, qualify opportunities, send proposals, and turn accepted work into deals.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <MetricCard title="Leads" value={summary.leads || 0} icon={Users} tone="blue" />
        <MetricCard title="Open opportunities" value={summary.open_opportunities || 0} icon={Target} tone="green" />
        <MetricCard title="Proposal value" value={money(summary.proposal_value)} icon={FileText} tone="amber" />
        <MetricCard title="Weighted pipeline" value={money(summary.weighted_pipeline)} icon={TrendingUp} tone="purple" />
      </div>

      <div className="grid xl:grid-cols-[0.85fr_1.15fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add a lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                createLead.mutate({
                  ...leadForm,
                  estimated_value: Number(leadForm.estimated_value || 0),
                  status: "new",
                });
              }}
            >
              <Input
                value={leadForm.title}
                onChange={(event) => setLeadForm((form) => ({ ...form, title: event.target.value }))}
                placeholder="Lead title, e.g. Health-sector training opportunity"
                required
              />
              <Input
                type="number"
                value={leadForm.estimated_value}
                onChange={(event) => setLeadForm((form) => ({ ...form, estimated_value: event.target.value }))}
                placeholder="Estimated value"
              />
              <textarea
                value={leadForm.description}
                onChange={(event) => setLeadForm((form) => ({ ...form, description: event.target.value }))}
                placeholder="What is the opportunity and who should follow up?"
                className="w-full min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-gray-900/10"
              />
              <Button type="submit" disabled={createLead.isPending}>
                {createLead.isPending ? "Saving..." : "Save lead"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active growth work</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <section>
              <h3 className="font-semibold text-gray-900 mb-3">Recent leads</h3>
              <div className="space-y-3">
                {(data.leads || []).map((lead) => (
                  <div key={lead.id} className="rounded-xl border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{lead.title}</p>
                        <p className="text-sm text-gray-500">{money(lead.estimated_value)}</p>
                      </div>
                      <Badge variant="outline">{lead.status}</Badge>
                    </div>
                  </div>
                ))}
                {!data.leads?.length && <p className="text-sm text-gray-500">No leads captured yet.</p>}
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">Proposals and deals</h3>
              <div className="space-y-3">
                {(data.proposals || []).slice(0, 4).map((proposal) => (
                  <div key={proposal.id} className="rounded-xl border bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{proposal.client_account?.name || "Proposal"}</p>
                      <Badge>{proposal.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{money(proposal.proposal_value)}</p>
                  </div>
                ))}
                {(data.deals || []).slice(0, 3).map((deal) => (
                  <div key={deal.id} className="rounded-xl border bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold flex items-center gap-2"><Handshake className="w-4 h-4" /> {deal.client_account?.name || "Deal"}</p>
                      <Badge variant="outline">{deal.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{money(deal.value)}</p>
                  </div>
                ))}
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
