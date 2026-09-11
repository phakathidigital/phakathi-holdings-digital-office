import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/apiClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonitorSmartphone, ShieldCheck, Smartphone, Server, Brain, BarChart3 } from "lucide-react";

const STATUS_TONE = {
  ready_for_office_pilot: "bg-green-100 text-green-700 border-0",
  production_foundation_configured: "bg-green-100 text-green-700 border-0",
  baseline_hardened: "bg-blue-100 text-blue-700 border-0",
  foundation_ready_not_packaged: "bg-amber-100 text-amber-700 border-0",
  configuration_required: "bg-red-100 text-red-700 border-0",
  configured: "bg-green-100 text-green-700 border-0",
  not_configured: "bg-amber-100 text-amber-700 border-0",
};

function ReadinessCard({ title, icon: Icon, item }) {
  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-3">
          <span className="flex items-center gap-2"><Icon className="w-4 h-4" /> {title}</span>
          <Badge className={STATUS_TONE[item?.status] || "bg-gray-100 text-gray-700 border-0"}>
            {String(item?.status || "unknown").replaceAll("_", " ")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {item?.target && <p className="text-sm text-gray-600">{item.target}</p>}
        {item?.checks?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.checks.map((check) => <Badge key={check} variant="outline">{check.replaceAll("_", " ")}</Badge>)}
          </div>
        )}
        {item?.blockers?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Before public release</p>
            <ul className="space-y-1 text-sm text-gray-600">
              {item.blockers.map((blocker) => <li key={blocker}>• {blocker.replaceAll("_", " ")}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlatformReadiness() {
  const readiness = useQuery({
    queryKey: ["platform-readiness"],
    queryFn: api.integrations.platformReadiness,
  });
  const analytics = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: api.analytics.overview,
  });
  const ai = useQuery({
    queryKey: ["ai-status"],
    queryFn: api.integrations.aiStatus,
  });

  const platform = readiness.data || {};

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <p className="text-sm uppercase tracking-widest text-gray-500">Deployment path</p>
          <h1 className="text-3xl font-bold text-gray-900">Platform Readiness</h1>
          <p className="text-gray-600 mt-1">
            Tracks the path from web office pilot into production web, mobile wrappers, desktop packaging, security, and deployment.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-gray-700" />
                <div>
                  <p className="text-2xl font-bold">{analytics.data?.summary?.tracked_events || 0}</p>
                  <p className="text-sm text-gray-500">tracked analytics events</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-gray-700" />
                <div>
                  <p className="text-sm font-semibold">{ai.data?.provider || "loading"}</p>
                  <p className="text-sm text-gray-500">AI provider</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Server className="w-8 h-8 text-gray-700" />
                <div>
                  <p className="text-sm font-semibold">{platform.deployment?.status?.replaceAll("_", " ") || "loading"}</p>
                  <p className="text-sm text-gray-500">deployment foundation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <ReadinessCard title="Web" icon={MonitorSmartphone} item={platform.web} />
          <ReadinessCard title="Mobile" icon={Smartphone} item={platform.mobile} />
          <ReadinessCard title="Desktop" icon={MonitorSmartphone} item={platform.desktop} />
          <ReadinessCard title="Security" icon={ShieldCheck} item={platform.security} />
          <ReadinessCard title="Deployment" icon={Server} item={platform.deployment} />
        </div>
      </div>
    </div>
  );
}
