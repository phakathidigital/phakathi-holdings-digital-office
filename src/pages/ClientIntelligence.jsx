import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Building2, HeartPulse, TrendingUp, Users } from "lucide-react";

function money(value) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function healthTone(score = 0) {
  if (score >= 75) return "text-green-700 bg-green-50 border-green-100";
  if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-100";
  return "text-red-700 bg-red-50 border-red-100";
}

export default function ClientIntelligence() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["crm-client-intelligence"],
    queryFn: () => api.crm.clientIntelligence(),
  });

  const summary = data?.summary || {};
  const accounts = data?.accounts || [];
  const atRisk = accounts.filter((account) => Number(account.health_score || 0) < 50);

  if (isLoading) {
    return <div className="p-8 text-sm text-gray-500">Loading client intelligence…</div>;
  }

  if (error) {
    return <div className="p-8 text-sm text-red-600">{error.message}</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-gray-400">CRM Intelligence</p>
          <h1 className="text-3xl font-bold text-gray-950">Client Intelligence</h1>
          <p className="text-gray-500 mt-1">Relationship health, pipeline value, and account visibility across the group.</p>
        </div>
        <Button asChild>
          <Link to="/Account360">Open Account 360</Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><CardContent className="p-5"><Building2 className="w-5 h-5 text-gray-500 mb-3" /><p className="text-sm text-gray-500">Accounts</p><p className="text-3xl font-bold">{summary.accounts || 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><Users className="w-5 h-5 text-gray-500 mb-3" /><p className="text-sm text-gray-500">Contacts</p><p className="text-3xl font-bold">{summary.contacts || 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><TrendingUp className="w-5 h-5 text-gray-500 mb-3" /><p className="text-sm text-gray-500">Pipeline</p><p className="text-3xl font-bold">{money(summary.pipeline_value)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><Activity className="w-5 h-5 text-gray-500 mb-3" /><p className="text-sm text-gray-500">Interactions</p><p className="text-3xl font-bold">{summary.interactions || 0}</p></CardContent></Card>
      </div>

      <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.length === 0 ? (
              <p className="text-sm text-gray-500">No client accounts yet. Create the first account in Account 360.</p>
            ) : accounts.map((account) => (
              <Link key={account.id} to={`/Account360?id=${encodeURIComponent(account.id)}`} className="block rounded-xl border border-gray-100 p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-950">{account.name}</h3>
                    <p className="text-sm text-gray-500">{account.industry || "No industry captured"} · {account.contact_count || 0} contacts · {account.opportunity_count || 0} opportunities</p>
                    <p className="text-xs text-gray-400 mt-1">{account.health_reasons?.[0] || "Health score calculated from account activity."}</p>
                  </div>
                  <Badge className={`border ${healthTone(account.health_score)}`}>{account.health_score || 0}%</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HeartPulse className="w-5 h-5" /> Accounts needing attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {atRisk.length === 0 ? (
              <p className="text-sm text-gray-500">No at-risk accounts based on current CRM activity.</p>
            ) : atRisk.map((account) => (
              <div key={account.id} className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="font-semibold text-red-900">{account.name}</p>
                <p className="text-sm text-red-700">{account.health_reasons?.join(" ")}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
