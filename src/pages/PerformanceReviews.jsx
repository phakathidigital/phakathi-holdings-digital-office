import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Target, Plus, Star, ChevronDown, ChevronUp, TrendingUp, User, CheckCircle, FileText, History } from "lucide-react";
import { format } from "date-fns";
import KPISection from "../components/performance/KPISection";
import PeerFeedbackSection from "../components/performance/PeerFeedbackSection";
import EvaluationReport from "../components/performance/EvaluationReport";
import GrowthHistory from "../components/performance/GrowthHistory";

const DEPARTMENTS = ["Management", "Finance", "HR", "IT", "Operations", "Empoweryst"];
const PERIODS = ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"];

const STATUS_CONFIG = {
  draft:                    { label: "Draft",                  color: "bg-gray-100 text-gray-600" },
  self_assessment_pending:  { label: "Self-Assessment Due",    color: "bg-yellow-100 text-yellow-700" },
  manager_review_pending:   { label: "Manager Review Due",     color: "bg-blue-100 text-blue-700" },
  completed:                { label: "Completed",              color: "bg-green-100 text-green-700" },
};

const OKR_STATUS = {
  not_started: { label: "Not Started", color: "bg-gray-100 text-gray-600" },
  on_track:    { label: "On Track",    color: "bg-green-100 text-green-700" },
  at_risk:     { label: "At Risk",     color: "bg-red-100 text-red-700" },
  completed:   { label: "Completed",   color: "bg-blue-100 text-blue-700" },
};

function StarRating({ value, onChange, readonly }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" disabled={readonly}
          onClick={() => onChange?.(s)}
          className={`text-2xl transition-colors ${s <= value ? "text-yellow-400" : "text-gray-200"} ${!readonly ? "hover:text-yellow-300 cursor-pointer" : "cursor-default"}`}>
          ★
        </button>
      ))}
      {value > 0 && <span className="ml-2 text-sm text-gray-600 self-center">{value}/5</span>}
    </div>
  );
}

function ReviewCard({ review, user, onUpdate, okrs }) {
  const [showReport, setShowReport] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(null); // 'self' | 'manager'
  const [form, setForm] = useState({});
  const [showOKRForm, setShowOKRForm] = useState(false);
  const [newOKR, setNewOKR] = useState({ objective: "", key_results: [""], progress: 0, status: "not_started", notes: "" });
  const queryClient = useQueryClient();

  const isEmployee = review.employee_email === user?.email;
  const isManager = user?.role === "admin" || review.manager_email === user?.email;
  const statusCfg = STATUS_CONFIG[review.status] || STATUS_CONFIG.draft;
  const reviewOKRs = okrs.filter((o) => o.review_id === review.id);

  const updateReview = useMutation({
    mutationFn: (data) => base44.entities.PerformanceReview.update(review.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["reviews"] }); setEditing(null); },
  });

  const createOKR = useMutation({
    mutationFn: (data) => base44.entities.OKR.create({ ...data, review_id: review.id, employee_email: review.employee_email, period: review.review_period }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["okrs"] }); setShowOKRForm(false); setNewOKR({ objective: "", key_results: [""], progress: 0, status: "not_started", notes: "" }); },
  });

  const updateOKR = useMutation({
    mutationFn: ({ id, ...data }) => base44.entities.OKR.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["okrs"] }),
  });

  const handleSelfSubmit = () => {
    updateReview.mutate({ ...form, status: "manager_review_pending" });
  };

  const handleManagerSubmit = () => {
    updateReview.mutate({ ...form, status: "completed" });
  };

  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold">
              {review.employee_name?.charAt(0) || "?"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{review.employee_name}</p>
              <p className="text-sm text-gray-500">{review.department} · {review.review_period}</p>
              {review.manager_name && <p className="text-xs text-gray-400">Manager: {review.manager_name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${statusCfg.color} border-0 text-xs`}>{statusCfg.label}</Badge>
            {review.status === "completed" && (
              <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => setShowReport(true)}>
                <FileText className="w-3 h-3" /> Report
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-5 space-y-5">

              {/* Self Assessment */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2"><User className="w-4 h-4" />Self Assessment</h4>
                  {isEmployee && review.status === "self_assessment_pending" && editing !== "self" && (
                    <Button size="sm" variant="outline" onClick={() => { setEditing("self"); setForm({ self_assessment: review.self_assessment || "", self_rating: review.self_rating || 0 }); }}>
                      Complete Assessment
                    </Button>
                  )}
                </div>
                {editing === "self" ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Your self-assessment *</Label>
                      <textarea className="w-full border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-400" rows={4}
                        value={form.self_assessment} onChange={(e) => setForm((f) => ({ ...f, self_assessment: e.target.value }))}
                        placeholder="Describe your achievements, contributions, and areas you feel you've grown..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Self Rating</Label>
                      <StarRating value={form.self_rating} onChange={(v) => setForm((f) => ({ ...f, self_rating: v }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                      <Button size="sm" onClick={handleSelfSubmit} disabled={!form.self_assessment || updateReview.isPending}
                        className="bg-gray-900 hover:bg-gray-700 text-white">Submit Assessment</Button>
                    </div>
                  </div>
                ) : review.self_assessment ? (
                  <div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.self_assessment}</p>
                    {review.self_rating > 0 && <div className="mt-2"><StarRating value={review.self_rating} readonly /></div>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No self-assessment submitted yet.</p>
                )}
              </div>

              {/* Manager Review */}
              <div className="p-4 bg-blue-50 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Manager Review</h4>
                  {isManager && review.status === "manager_review_pending" && editing !== "manager" && (
                    <Button size="sm" variant="outline" onClick={() => { setEditing("manager"); setForm({ manager_assessment: review.manager_assessment || "", manager_rating: review.manager_rating || 0, strengths: review.strengths || "", areas_for_improvement: review.areas_for_improvement || "", development_goals: review.development_goals || "", overall_comments: review.overall_comments || "" }); }}>
                      Complete Review
                    </Button>
                  )}
                </div>
                {editing === "manager" ? (
                  <div className="space-y-3">
                    {[
                      { key: "manager_assessment", label: "Overall Assessment *", rows: 3, placeholder: "Summarize employee's performance this quarter..." },
                      { key: "strengths", label: "Key Strengths", rows: 2, placeholder: "What did they do well?" },
                      { key: "areas_for_improvement", label: "Areas for Improvement", rows: 2, placeholder: "Where can they grow?" },
                      { key: "development_goals", label: "Development Goals", rows: 2, placeholder: "Agreed goals for next period..." },
                      { key: "overall_comments", label: "Additional Comments", rows: 2, placeholder: "Any other notes..." },
                    ].map(({ key, label, rows, placeholder }) => (
                      <div key={key} className="space-y-1.5">
                        <Label>{label}</Label>
                        <textarea className="w-full border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-400" rows={rows}
                          value={form[key] || ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder} />
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <Label>Manager Rating</Label>
                      <StarRating value={form.manager_rating} onChange={(v) => setForm((f) => ({ ...f, manager_rating: v }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                      <Button size="sm" onClick={handleManagerSubmit} disabled={!form.manager_assessment || updateReview.isPending}
                        className="bg-gray-900 hover:bg-gray-700 text-white">Submit Review</Button>
                    </div>
                  </div>
                ) : review.manager_assessment ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.manager_assessment}</p>
                    {review.manager_rating > 0 && <StarRating value={review.manager_rating} readonly />}
                    {review.strengths && <div><p className="text-xs font-semibold text-gray-500 mt-2">STRENGTHS</p><p className="text-sm text-gray-700">{review.strengths}</p></div>}
                    {review.areas_for_improvement && <div><p className="text-xs font-semibold text-gray-500 mt-2">AREAS FOR IMPROVEMENT</p><p className="text-sm text-gray-700">{review.areas_for_improvement}</p></div>}
                    {review.development_goals && <div><p className="text-xs font-semibold text-gray-500 mt-2">DEVELOPMENT GOALS</p><p className="text-sm text-gray-700">{review.development_goals}</p></div>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Awaiting manager review.</p>
                )}
              </div>

              {/* KPIs */}
              <div className="p-4 bg-orange-50 rounded-xl">
                <KPISection
                  reviewId={review.id}
                  employeeEmail={review.employee_email}
                  period={review.review_period}
                  canEdit={isManager}
                />
              </div>

              {/* 360° Peer Feedback */}
              <div className="p-4 bg-purple-50 rounded-xl">
                <PeerFeedbackSection
                  reviewId={review.id}
                  employeeEmail={review.employee_email}
                  employeeName={review.employee_name}
                  currentUserEmail={user?.email}
                  isManager={isManager}
                />
              </div>

              {/* OKRs */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2"><Target className="w-4 h-4" />OKRs & Goals ({reviewOKRs.length})</h4>
                  {(isEmployee || isManager) && (
                    <Button size="sm" variant="outline" onClick={() => setShowOKRForm(true)}><Plus className="w-3 h-3 mr-1" />Add OKR</Button>
                  )}
                </div>
                {reviewOKRs.map((okr) => (
                  <div key={okr.id} className="p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <p className="font-medium text-gray-900 text-sm">{okr.objective}</p>
                      <Select value={okr.status} onValueChange={(v) => updateOKR.mutate({ id: okr.id, status: v })}>
                        <SelectTrigger className="h-7 w-32 text-xs border-0 shadow-none bg-transparent p-0 justify-end">
                          <Badge className={`${OKR_STATUS[okr.status]?.color} border-0 text-xs cursor-pointer`}>{OKR_STATUS[okr.status]?.label}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(OKR_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {okr.key_results?.length > 0 && (
                      <ul className="space-y-1 mb-2">
                        {okr.key_results.filter(Boolean).map((kr, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="text-gray-400 mt-0.5">•</span>{kr}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-gray-900 h-1.5 rounded-full transition-all" style={{ width: `${okr.progress || 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{okr.progress || 0}%</span>
                      <Input type="number" min="0" max="100" defaultValue={okr.progress || 0}
                        className="w-16 h-6 text-xs p-1 text-center"
                        onBlur={(e) => updateOKR.mutate({ id: okr.id, progress: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                ))}
                {reviewOKRs.length === 0 && <p className="text-sm text-gray-400 italic">No OKRs set yet.</p>}
              </div>

              {/* OKR Form */}
              {showOKRForm && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-200">
                  <h5 className="font-semibold text-gray-800">Add OKR</h5>
                  <div className="space-y-1.5">
                    <Label>Objective *</Label>
                    <Input value={newOKR.objective} onChange={(e) => setNewOKR((o) => ({ ...o, objective: e.target.value }))} placeholder="What do you want to achieve?" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Key Results</Label>
                    {newOKR.key_results.map((kr, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={kr} onChange={(e) => setNewOKR((o) => { const krs = [...o.key_results]; krs[i] = e.target.value; return { ...o, key_results: krs }; })} placeholder={`Key result ${i + 1}`} />
                        {i === newOKR.key_results.length - 1 && (
                          <Button type="button" variant="outline" size="sm" onClick={() => setNewOKR((o) => ({ ...o, key_results: [...o.key_results, ""] }))}>+</Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowOKRForm(false)}>Cancel</Button>
                    <Button size="sm" onClick={() => createOKR.mutate(newOKR)} disabled={!newOKR.objective || createOKR.isPending}
                      className="bg-gray-900 hover:bg-gray-700 text-white">Add OKR</Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <EvaluationReport review={review} open={showReport} onClose={() => setShowReport(false)} />
    </Card>
  );
}

export default function PerformanceReviews() {
  const [showCreate, setShowCreate] = useState(false);
  const [newReview, setNewReview] = useState({ employee_email: "", employee_name: "", manager_name: "", department: "", review_period: "" });
  const [activeTab, setActiveTab] = useState("reviews");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isAdmin = user?.role === "admin";

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => base44.entities.PerformanceReview.list("-created_date", 100),
  });

  const { data: okrs = [] } = useQuery({
    queryKey: ["okrs"],
    queryFn: () => base44.entities.OKR.list("-created_date", 500),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const me = await base44.auth.me();
      return base44.entities.PerformanceReview.create({
        ...data,
        manager_email: me.email,
        manager_name: me.full_name || me.email,
        status: "self_assessment_pending",
      });
    },
    onSuccess: async (review) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setShowCreate(false);
      await base44.integrations.Core.SendEmail({
        to: newReview.employee_email,
        subject: `Performance Review: ${newReview.review_period} – Action Required`,
        body: `Hi ${newReview.employee_name},\n\nYour ${newReview.review_period} performance review has been initiated. Please log in to complete your self-assessment.\n\nThis is an important part of your development journey at Phakathi Holdings.\n\nKind regards,\n${newReview.manager_name || "Management"}`,
      });
      setNewReview({ employee_email: "", employee_name: "", manager_name: "", department: "", review_period: "" });
    },
  });

  const visibleReviews = isAdmin
    ? reviews
    : reviews.filter((r) => r.employee_email === user?.email || r.manager_email === user?.email);

  const myPending = visibleReviews.filter((r) =>
    (r.employee_email === user?.email && r.status === "self_assessment_pending") ||
    (r.manager_email === user?.email && r.status === "manager_review_pending")
  ).length;

  // People whose growth history the current user can view
  const reviewableEmails = [...new Set(visibleReviews.map(r => r.employee_email))];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Performance Reviews</h1>
              <p className="text-gray-600 text-sm">Quarterly reviews, self-assessments, OKR tracking, and growth history</p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />Initiate Review
            </Button>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Action Required", value: myPending, color: "text-orange-600" },
            { label: "Completed Reviews", value: reviews.filter((r) => r.status === "completed").length, color: "text-green-600" },
            { label: "Total OKRs Tracked", value: okrs.length, color: "text-gray-900" },
          ].map((s, i) => (
            <Card key={i} className="border-none shadow-md">
              <CardContent className="p-5 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          <button onClick={() => setActiveTab("reviews")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "reviews" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            Reviews
          </button>
          <button onClick={() => setActiveTab("growth")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === "growth" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            <History className="w-3.5 h-3.5" /> Growth History
          </button>
        </div>

        {/* Reviews list */}
        {activeTab === "reviews" && (
          <div className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
            ) : visibleReviews.length === 0 ? (
              <Card className="border-none shadow-md">
                <CardContent className="p-12 text-center">
                  <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">No performance reviews yet.</p>
                  {isAdmin && <p className="text-gray-400 text-sm mt-1">Initiate a review to get started.</p>}
                </CardContent>
              </Card>
            ) : (
              visibleReviews.map((review) => (
                <motion.div key={review.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <ReviewCard review={review} user={user} okrs={okrs} />
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Growth History */}
        {activeTab === "growth" && (
          <div className="space-y-6">
            {reviewableEmails.length === 0 ? (
              <Card className="border-none shadow-md">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">No completed reviews to display history.</p>
                </CardContent>
              </Card>
            ) : reviewableEmails.map(email => {
              const rev = visibleReviews.find(r => r.employee_email === email);
              return (
                <GrowthHistory
                  key={email}
                  employeeEmail={email}
                  employeeName={rev?.employee_name || email}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Create Review Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Initiate Performance Review</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Employee Name *</Label>
                <Input value={newReview.employee_name} onChange={(e) => setNewReview((r) => ({ ...r, employee_name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label>Employee Email *</Label>
                <Input type="email" value={newReview.employee_email} onChange={(e) => setNewReview((r) => ({ ...r, employee_email: e.target.value }))} placeholder="email@company.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Department *</Label>
                <Select value={newReview.department} onValueChange={(v) => setNewReview((r) => ({ ...r, department: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Review Period *</Label>
                <Select value={newReview.review_period} onValueChange={(v) => setNewReview((r) => ({ ...r, review_period: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => createMutation.mutate(newReview)}
                disabled={!newReview.employee_email || !newReview.employee_name || !newReview.department || !newReview.review_period || createMutation.isPending}
                className="flex-1 bg-gray-900 hover:bg-gray-700 text-white">
                {createMutation.isPending ? "Creating..." : "Initiate & Notify"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}