import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Award } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot
} from "recharts";

const PERIOD_ORDER = [
  "Q1 2024","Q2 2024","Q3 2024","Q4 2024",
  "Q1 2025","Q2 2025","Q3 2025","Q4 2025",
  "Q1 2026","Q2 2026","Q3 2026","Q4 2026",
];

function scoreLabel(score) {
  if (score >= 4.5) return { label: "Outstanding", color: "bg-green-100 text-green-700" };
  if (score >= 3.5) return { label: "Exceeds Expectations", color: "bg-blue-100 text-blue-700" };
  if (score >= 2.5) return { label: "Meets Expectations", color: "bg-yellow-100 text-yellow-700" };
  if (score >= 1.5) return { label: "Needs Improvement", color: "bg-orange-100 text-orange-700" };
  return { label: "Unsatisfactory", color: "bg-red-100 text-red-700" };
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload?.score) return null;
  return <circle cx={cx} cy={cy} r={5} fill="#1f2937" stroke="white" strokeWidth={2} />;
};

export default function GrowthHistory({ employeeEmail, employeeName }) {
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews-history", employeeEmail],
    queryFn: () => base44.entities.PerformanceReview.filter({ employee_email: employeeEmail }),
    enabled: !!employeeEmail,
  });

  const { data: allKpis = [] } = useQuery({
    queryKey: ["kpis-history", employeeEmail],
    queryFn: () => base44.entities.KPI.filter({ employee_email: employeeEmail }),
    enabled: !!employeeEmail,
  });

  const { data: allFeedbacks = [] } = useQuery({
    queryKey: ["peer-history", employeeEmail],
    queryFn: () => base44.entities.PeerFeedback.filter({ employee_email: employeeEmail }),
    enabled: !!employeeEmail,
  });

  const chartData = useMemo(() => {
    const completedReviews = reviews.filter(r => r.status === "completed");
    return completedReviews
      .map(review => {
        const kpis = allKpis.filter(k => k.review_id === review.id);
        const feedbacks = allFeedbacks.filter(f => f.review_id === review.id);

        const totalWeight = kpis.reduce((s, k) => s + (k.weight || 0), 0);
        const kpiScore = kpis.length > 0 && totalWeight > 0
          ? kpis.reduce((s, k) => s + ((k.score || 0) * (k.weight || 0)), 0) / totalWeight
          : null;

        const peerScore = feedbacks.length > 0
          ? feedbacks.reduce((s, f) => s + ((f.collaboration_rating + f.communication_rating + f.delivery_rating + f.leadership_rating) / 4), 0) / feedbacks.length
          : null;

        const scores = [
          review.self_rating || null,
          review.manager_rating || null,
          kpiScore,
          peerScore,
        ].filter(s => s !== null && s > 0);

        const finalScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        return {
          period: review.review_period,
          score: parseFloat(finalScore.toFixed(2)),
          self: review.self_rating || null,
          manager: review.manager_rating || null,
          kpi: kpiScore ? parseFloat(kpiScore.toFixed(2)) : null,
          peer: peerScore ? parseFloat(peerScore.toFixed(2)) : null,
          periodOrder: PERIOD_ORDER.indexOf(review.review_period),
        };
      })
      .filter(d => d.score > 0)
      .sort((a, b) => a.periodOrder - b.periodOrder);
  }, [reviews, allKpis, allFeedbacks]);

  if (chartData.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No completed reviews to show growth history.</p>
        </CardContent>
      </Card>
    );
  }

  const latest = chartData[chartData.length - 1];
  const previous = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  const trend = previous ? latest.score - previous.score : 0;
  const { label, color } = scoreLabel(latest.score);

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 justify-between flex-wrap">
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" />
            Growth History — {employeeName || employeeEmail}
          </span>
          <div className="flex items-center gap-2">
            <Badge className={`border-0 text-xs ${color}`}>{label}</Badge>
            {trend !== 0 && (
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend > 0 ? "text-green-600" : "text-red-500"}`}>
                {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {trend > 0 ? "+" : ""}{trend.toFixed(2)}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Final Score", value: latest.score.toFixed(2), sub: "/ 5.00", color: "text-gray-900" },
            { label: "Self Rating", value: latest.self ? latest.self.toFixed(1) : "—", sub: "", color: "text-blue-600" },
            { label: "Manager Rating", value: latest.manager ? latest.manager.toFixed(1) : "—", sub: "", color: "text-purple-600" },
            { label: "KPI Score", value: latest.kpi ? latest.kpi.toFixed(1) : "—", sub: "", color: "text-orange-600" },
          ].map(s => (
            <div key={s.label} className="text-center p-2 bg-gray-50 rounded-xl">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}<span className="text-xs text-gray-400">{s.sub}</span></p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs space-y-1">
                    <p className="font-bold text-gray-800">{d.period}</p>
                    <p>Final: <strong>{d.score}</strong></p>
                    {d.self && <p>Self: {d.self}</p>}
                    {d.manager && <p>Manager: {d.manager}</p>}
                    {d.kpi && <p>KPI: {d.kpi}</p>}
                    {d.peer && <p>Peer: {d.peer}</p>}
                  </div>
                );
              }}
            />
            <ReferenceLine y={3} stroke="#d1d5db" strokeDasharray="4 4" label={{ value: "Target", fontSize: 10, fill: "#9ca3af" }} />
            <Line
              type="monotone" dataKey="score" stroke="#1f2937" strokeWidth={2.5}
              dot={<CustomDot />} activeDot={{ r: 7, fill: "#1f2937" }}
            />
          </LineChart>
        </ResponsiveContainer>

        {chartData.length > 1 && (
          <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
            {chartData.map(d => (
              <div key={d.period} className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400">{d.period}:</span>
                <span className={`font-semibold ${d.score >= 4 ? "text-green-600" : d.score >= 3 ? "text-blue-600" : "text-orange-500"}`}>
                  {d.score.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}