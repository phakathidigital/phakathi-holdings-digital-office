import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, Star, Target, MessageSquare, TrendingUp } from "lucide-react";
import { format } from "date-fns";

function Section({ title, icon: Icon, color, children }) {
  return (
    <div className="mb-6">
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${color}`}>
        <Icon className="w-4 h-4" />
        <h3 className="font-bold text-sm uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function EvaluationReport({ review, open, onClose }) {
  const [exporting, setExporting] = useState(false);

  const { data: kpis = [] } = useQuery({
    queryKey: ["kpis", review?.id],
    queryFn: () => base44.entities.KPI.filter({ review_id: review?.id }),
    enabled: !!review?.id,
  });

  const { data: okrs = [] } = useQuery({
    queryKey: ["okrs"],
    queryFn: () => base44.entities.OKR.list("-created_date", 500),
    enabled: !!review?.id,
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["peer-feedback", review?.id],
    queryFn: () => base44.entities.PeerFeedback.filter({ review_id: review?.id }),
    enabled: !!review?.id,
  });

  if (!review) return null;

  const reviewOKRs = okrs.filter(o => o.review_id === review.id);
  const totalWeight = kpis.reduce((s, k) => s + (k.weight || 0), 0);
  const weightedKPIScore = kpis.length > 0
    ? kpis.reduce((s, k) => s + ((k.score || 0) * (k.weight || 0)), 0) / Math.max(totalWeight, 1)
    : 0;
  const avgPeerRating = feedbacks.length > 0
    ? feedbacks.reduce((s, f) => s + ((f.collaboration_rating + f.communication_rating + f.delivery_rating + f.leadership_rating) / 4), 0) / feedbacks.length
    : 0;

  const overallScore = [
    review.self_rating || 0,
    review.manager_rating || 0,
    weightedKPIScore,
    avgPeerRating,
  ].filter(s => s > 0);
  const finalScore = overallScore.length > 0 ? overallScore.reduce((a, b) => a + b, 0) / overallScore.length : 0;

  const handleExport = async () => {
    setExporting(true);
    const lines = [
      `PERFORMANCE EVALUATION REPORT`,
      `================================`,
      `Employee: ${review.employee_name}`,
      `Department: ${review.department}`,
      `Review Period: ${review.review_period}`,
      `Manager: ${review.manager_name}`,
      `Generated: ${format(new Date(), "dd MMM yyyy")}`,
      `Status: ${review.status?.replace(/_/g, " ").toUpperCase()}`,
      ``,
      `FINAL SCORE: ${finalScore.toFixed(2)} / 5.00`,
      `  Self Rating: ${review.self_rating || "N/A"}`,
      `  Manager Rating: ${review.manager_rating || "N/A"}`,
      `  KPI Score (weighted): ${weightedKPIScore.toFixed(2)}`,
      `  Peer Feedback Avg: ${avgPeerRating.toFixed(2)} (${feedbacks.length} responses)`,
      ``,
      `SELF ASSESSMENT`,
      `----------------`,
      review.self_assessment || "Not submitted.",
      ``,
      `MANAGER ASSESSMENT`,
      `------------------`,
      review.manager_assessment || "Not completed.",
      ``,
      review.strengths ? `STRENGTHS\n${review.strengths}\n` : "",
      review.areas_for_improvement ? `AREAS FOR IMPROVEMENT\n${review.areas_for_improvement}\n` : "",
      review.development_goals ? `DEVELOPMENT GOALS\n${review.development_goals}\n` : "",
      `KPIs (${kpis.length})`,
      `---------`,
      ...kpis.map(k => `[${k.status?.toUpperCase()}] ${k.title} | Target: ${k.target} | Actual: ${k.actual || "N/A"} | Score: ${k.score || 0}/5 | Weight: ${k.weight}%`),
      ``,
      `OKRs (${reviewOKRs.length})`,
      `--------`,
      ...reviewOKRs.map(o => `[${o.status?.toUpperCase()}] ${o.objective} — ${o.progress || 0}%`),
      ``,
      `360° PEER FEEDBACK (${feedbacks.length} responses)`,
      `----------------------------`,
      ...feedbacks.map(f => `[${f.relationship}] ${f.reviewer_name}: C:${f.collaboration_rating} Co:${f.communication_rating} D:${f.delivery_rating} L:${f.leadership_rating} — ${f.strengths || ""} ${f.improvements || ""}`),
    ].filter(l => l !== undefined).join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation-${review.employee_name?.replace(/\s+/g, "-")}-${review.review_period}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Evaluation Report — {review.employee_name}
          </DialogTitle>
        </DialogHeader>

        {/* Score banner */}
        <div className="p-4 bg-gray-900 text-white rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Final Score</p>
            <p className="text-4xl font-bold">{finalScore.toFixed(2)}<span className="text-lg text-gray-400">/5</span></p>
            <p className="text-xs text-gray-400 mt-1">{review.review_period} · {review.department}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-gray-400">Self: <strong className="text-white">{review.self_rating || "—"}</strong></p>
            <p className="text-xs text-gray-400">Manager: <strong className="text-white">{review.manager_rating || "—"}</strong></p>
            <p className="text-xs text-gray-400">KPI Score: <strong className="text-white">{weightedKPIScore.toFixed(1)}</strong></p>
            <p className="text-xs text-gray-400">Peer Avg: <strong className="text-white">{avgPeerRating.toFixed(1)} ({feedbacks.length})</strong></p>
          </div>
        </div>

        <div className="space-y-4 mt-2">
          {/* Manager Assessment */}
          <Section title="Manager Assessment" icon={TrendingUp} color="border-blue-200 text-blue-700">
            {review.manager_assessment ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.manager_assessment}</p>
                {review.strengths && <div><p className="text-xs font-semibold text-gray-500">STRENGTHS</p><p className="text-sm text-gray-700">{review.strengths}</p></div>}
                {review.areas_for_improvement && <div><p className="text-xs font-semibold text-gray-500 mt-2">AREAS FOR IMPROVEMENT</p><p className="text-sm text-gray-700">{review.areas_for_improvement}</p></div>}
                {review.development_goals && <div><p className="text-xs font-semibold text-gray-500 mt-2">DEVELOPMENT GOALS</p><p className="text-sm text-gray-700">{review.development_goals}</p></div>}
              </div>
            ) : <p className="text-sm text-gray-400 italic">Not yet completed.</p>}
          </Section>

          {/* KPIs */}
          {kpis.length > 0 && (
            <Section title={`KPIs (${kpis.length})`} icon={Target} color="border-orange-200 text-orange-600">
              <div className="space-y-2">
                {kpis.map(k => (
                  <div key={k.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{k.title}</p>
                      <p className="text-xs text-gray-500">Target: {k.target} · Actual: {k.actual || "N/A"} · Weight: {k.weight}%</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-bold text-gray-900">{k.score || 0}/5</p>
                      <Badge className={`text-xs border-0 ${k.status === "achieved" ? "bg-green-100 text-green-700" : k.status === "not_achieved" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                        {k.status?.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                  <span>Weighted KPI Score</span>
                  <span>{weightedKPIScore.toFixed(2)} / 5</span>
                </div>
              </div>
            </Section>
          )}

          {/* Peer Feedback */}
          {feedbacks.length > 0 && (
            <Section title={`360° Peer Feedback (${feedbacks.length})`} icon={MessageSquare} color="border-purple-200 text-purple-600">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {["collaboration_rating", "communication_rating", "delivery_rating", "leadership_rating"].map(key => {
                  const avg = feedbacks.reduce((s, f) => s + (f[key] || 0), 0) / feedbacks.length;
                  return (
                    <div key={key} className="p-2 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-500 capitalize">{key.replace("_rating", "").replace("_", " ")}</p>
                      <p className="font-bold text-gray-800">{avg.toFixed(1)}/5</p>
                    </div>
                  );
                })}
              </div>
              {feedbacks.some(f => f.strengths) && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500">PEER-NOTED STRENGTHS</p>
                  {feedbacks.filter(f => f.strengths).map((f, i) => (
                    <p key={i} className="text-xs text-gray-600">· {f.strengths}</p>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* OKRs */}
          {reviewOKRs.length > 0 && (
            <Section title={`OKRs (${reviewOKRs.length})`} icon={Star} color="border-gray-200 text-gray-600">
              {reviewOKRs.map(o => (
                <div key={o.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm mb-1.5">
                  <p className="text-gray-800">{o.objective}</p>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                      <div className="h-full bg-gray-900 rounded-full" style={{ width: `${o.progress || 0}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8">{o.progress}%</span>
                  </div>
                </div>
              ))}
            </Section>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleExport} disabled={exporting} className="bg-gray-900 hover:bg-gray-700 text-white gap-2">
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}