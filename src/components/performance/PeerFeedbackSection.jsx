import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Star, Lock } from "lucide-react";

const RELATIONSHIPS = ["peer", "direct_report", "cross_functional", "external"];
const RATING_LABELS = { 1: "Poor", 2: "Below Average", 3: "Average", 4: "Good", 5: "Excellent" };

function MiniStars({ value, onChange, readonly }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" disabled={readonly}
          onClick={() => onChange?.(s)}
          className={`text-lg transition-colors leading-none ${s <= value ? "text-yellow-400" : "text-gray-200"} ${!readonly ? "hover:text-yellow-300" : ""}`}>
          ★
        </button>
      ))}
    </div>
  );
}

const EMPTY_FORM = {
  relationship: "peer",
  collaboration_rating: 0, communication_rating: 0, delivery_rating: 0, leadership_rating: 0,
  strengths: "", improvements: "", overall_comments: "", is_anonymous: true,
};

export default function PeerFeedbackSection({ reviewId, employeeEmail, employeeName, currentUserEmail, isManager }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["peer-feedback", reviewId],
    queryFn: () => base44.entities.PeerFeedback.filter({ review_id: reviewId }),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const me = await base44.auth.me();
      return base44.entities.PeerFeedback.create({
        ...data,
        review_id: reviewId,
        employee_email: employeeEmail,
        employee_name: employeeName,
        reviewer_email: me.email,
        reviewer_name: data.is_anonymous ? "Anonymous" : (me.full_name || me.email),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["peer-feedback", reviewId] });
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
  });

  const alreadySubmitted = feedbacks.some(f => f.reviewer_email === currentUserEmail);
  const avgRating = feedbacks.length > 0
    ? feedbacks.reduce((s, f) => s + ((f.collaboration_rating + f.communication_rating + f.delivery_rating + f.leadership_rating) / 4), 0) / feedbacks.length
    : 0;

  // Employees see anonymous aggregated; managers see all details
  const canViewDetails = isManager;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-500" />
          360° Peer Feedback ({feedbacks.length})
          {feedbacks.length > 0 && (
            <span className="text-xs text-gray-500">Avg: <strong className="text-gray-800">{avgRating.toFixed(1)}/5</strong></span>
          )}
        </h4>
        {!alreadySubmitted && currentUserEmail !== employeeEmail && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="w-3 h-3 mr-1" /> Give Feedback
          </Button>
        )}
        {alreadySubmitted && <Badge className="bg-green-50 text-green-700 border-0 text-xs">Feedback submitted</Badge>}
      </div>

      {/* Aggregated averages */}
      {feedbacks.length > 0 && (
        <div className="p-3 bg-purple-50 rounded-xl">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Collaboration", key: "collaboration_rating" },
              { label: "Communication", key: "communication_rating" },
              { label: "Delivery", key: "delivery_rating" },
              { label: "Leadership", key: "leadership_rating" },
            ].map(({ label, key }) => {
              const avg = feedbacks.reduce((s, f) => s + (f[key] || 0), 0) / feedbacks.length;
              return (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">{label}</span>
                  <div className="flex items-center gap-1">
                    <MiniStars value={Math.round(avg)} readonly />
                    <span className="text-xs text-gray-500">{avg.toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual feedback — visible to managers */}
      {canViewDetails && feedbacks.map((fb) => (
        <div key={fb.id} className="p-3 bg-white border border-gray-100 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
              {fb.is_anonymous ? <Lock className="w-3.5 h-3.5 text-purple-500" /> : <span className="text-purple-700 font-bold text-xs">{fb.reviewer_name?.charAt(0)}</span>}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">{fb.reviewer_name}</p>
              <Badge variant="outline" className="text-xs capitalize">{fb.relationship?.replace("_", " ")}</Badge>
            </div>
          </div>
          {fb.strengths && <p className="text-xs text-gray-700"><strong>Strengths:</strong> {fb.strengths}</p>}
          {fb.improvements && <p className="text-xs text-gray-700"><strong>Improvements:</strong> {fb.improvements}</p>}
          {fb.overall_comments && <p className="text-xs text-gray-600 italic">"{fb.overall_comments}"</p>}
        </div>
      ))}

      {feedbacks.length === 0 && <p className="text-sm text-gray-400 italic">No peer feedback collected yet.</p>}

      {/* Submission form */}
      {showForm && (
        <div className="p-4 bg-purple-50 rounded-xl space-y-3 border border-purple-100">
          <h5 className="font-semibold text-gray-800 text-sm">Submit Peer Feedback for {employeeName}</h5>

          <div className="space-y-1">
            <Label className="text-xs">Your relationship</Label>
            <Select value={form.relationship} onValueChange={(v) => setForm(f => ({ ...f, relationship: v }))}>
              <SelectTrigger className="text-sm h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "collaboration_rating", label: "Collaboration" },
              { key: "communication_rating", label: "Communication" },
              { key: "delivery_rating", label: "Delivery" },
              { key: "leadership_rating", label: "Leadership" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <MiniStars value={form[key]} onChange={(v) => setForm(f => ({ ...f, [key]: v }))} />
              </div>
            ))}
          </div>

          {[
            { key: "strengths", label: "Key Strengths", placeholder: "What does this person do really well?" },
            { key: "improvements", label: "Areas for Growth", placeholder: "Where could they improve?" },
            { key: "overall_comments", label: "Overall Comments (optional)", placeholder: "Any additional thoughts..." },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <textarea className="w-full border rounded-lg p-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-purple-300" rows={2}
                value={form[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} />
            </div>
          ))}

          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={form.is_anonymous} onChange={(e) => setForm(f => ({ ...f, is_anonymous: e.target.checked }))} className="rounded" />
            Submit anonymously
          </label>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancel</Button>
            <Button size="sm" onClick={() => createMutation.mutate(form)}
              disabled={!form.collaboration_rating || createMutation.isPending}
              className="bg-purple-700 hover:bg-purple-800 text-white">Submit Feedback</Button>
          </div>
        </div>
      )}
    </div>
  );
}