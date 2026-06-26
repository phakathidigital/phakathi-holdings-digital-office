import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Receipt, Plus, CheckCircle, XCircle, Clock, Upload, Camera } from "lucide-react";
import CameraScanner from "../components/shared/CameraScanner";
import { format, parseISO } from "date-fns";

const CATEGORIES = ["Travel", "Meals", "Accommodation", "Office Supplies", "Training", "Client Entertainment", "Other"];
const DEPARTMENTS = ["Management", "Finance", "HR", "IT", "Operations", "Empoweryst"];

const STATUS_CONFIG = {
  pending:  { label: "Pending",  color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-700",   icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700",       icon: XCircle },
};

function ExpenseForm({ onSubmit, isLoading, onCancel }) {
  const [form, setForm] = useState({
    category: "", department: "", description: "", amount: "",
    expense_date: "", notes: "",
  });
  const [receipt, setReceipt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleOCRExtracted = (data) => {
    setShowScanner(false);
    if (data.description) set("description", data.description);
    if (data.amount) set("amount", String(data.amount));
    if (data.expense_date) set("expense_date", data.expense_date);
    if (data.category && ["Travel","Meals","Accommodation","Office Supplies","Training","Client Entertainment","Other"].includes(data.category)) set("category", data.category);
    if (data.notes || data.vendor) set("notes", [data.vendor, data.notes].filter(Boolean).join(" — "));
    // Pre-populate receipt URL if available
    if (data._receipt_url) setForm(f => ({ ...f, _prefilled_receipt: data._receipt_url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let receipt_url = "";
    if (receipt) {
      setUploading(true);
      const res = await base44.integrations.Core.UploadFile({ file: receipt });
      receipt_url = res.file_url;
      setUploading(false);
    } else if (form._prefilled_receipt) {
      receipt_url = form._prefilled_receipt;
    }
    onSubmit({
      ...form,
      amount: parseFloat(form.amount),
      receipt_url,
      status: "pending",
    });
  };

  return (
    <>
    {showScanner && <CameraScanner mode="expense" onExtracted={handleOCRExtracted} onClose={() => setShowScanner(false)} />}
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Scan button */}
      <button type="button" onClick={() => setShowScanner(true)}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
        <Camera className="w-4 h-4" /> Scan Receipt with Camera
        <span className="text-xs text-white/60 ml-1">— AI auto-fills fields</span>
      </button>
      <div className="flex items-center gap-2 text-xs text-gray-400"><div className="flex-1 h-px bg-gray-100"/><span>or fill manually</span><div className="flex-1 h-px bg-gray-100"/></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)} required>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Department *</Label>
          <Select value={form.department} onValueChange={(v) => set("department", v)} required>
            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description *</Label>
        <Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief description of the expense" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Amount (R) *</Label>
          <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00" required />
        </div>
        <div className="space-y-1.5">
          <Label>Expense Date *</Label>
          <Input type="date" value={form.expense_date} onChange={(e) => set("expense_date", e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Receipt (optional)</Label>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => document.getElementById("receipt-input").click()}>
          <input id="receipt-input" type="file" className="hidden" accept="image/*,application/pdf"
            onChange={(e) => setReceipt(e.target.files[0])} />
          {receipt ? (
            <p className="text-sm text-green-700 font-medium">{receipt.name}</p>
          ) : (
            <div className="flex flex-col items-center gap-1 text-gray-400">
              <Upload className="w-5 h-5" />
              <p className="text-sm">Click to upload receipt (image or PDF)</p>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any additional notes" />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={isLoading || uploading} className="flex-1 bg-gray-900 hover:bg-gray-700 text-white">
          {uploading ? "Uploading receipt..." : isLoading ? "Submitting..." : "Submit Expense"}
        </Button>
      </div>
    </form>
    </>
  );
}

function ExpenseCard({ expense, isAdmin, currentUser, onApprove, onReject }) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const config = STATUS_CONFIG[expense.status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-gray-900">{expense.description}</span>
              <Badge className={`${config.color} border-0 text-xs`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-2">
              <span>{expense.category}</span>
              <span>·</span>
              <span>{expense.department}</span>
              {expense.expense_date && (
                <>
                  <span>·</span>
                  <span>{format(parseISO(expense.expense_date), "d MMM yyyy")}</span>
                </>
              )}
            </div>
            {isAdmin && <p className="text-xs text-gray-400">By: {expense.employee_name || expense.employee_email || expense.created_by}</p>}
            {expense.rejection_reason && (
              <p className="text-xs text-red-600 mt-1">Reason: {expense.rejection_reason}</p>
            )}
            {expense.notes && <p className="text-xs text-gray-400 mt-1 italic">{expense.notes}</p>}
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="text-xl font-bold text-gray-900">R{Number(expense.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
            {expense.receipt_url && (
              <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 underline">View Receipt</a>
            )}
            {isAdmin && expense.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onApprove(expense)}
                  className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs">
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowReject(true)}
                  className="border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs">
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
        {showReject && (
          <div className="mt-3 p-3 bg-red-50 rounded-xl space-y-2">
            <Input placeholder="Reason for rejection (optional)" value={reason}
              onChange={(e) => setReason(e.target.value)} className="text-sm" />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setShowReject(false); setReason(""); }}>Cancel</Button>
              <Button size="sm" onClick={() => { onReject(expense, reason); setShowReject(false); setReason(""); }}
                className="bg-red-600 hover:bg-red-700 text-white">
                Confirm Reject
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Expenses() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === "admin";

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", user?.email],
    queryFn: () =>
      isAdmin
        ? base44.entities.Expense.list("-created_date", 100)
        : base44.entities.Expense.filter({ created_by: user?.email }, "-created_date"),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const me = await base44.auth.me();
      return base44.entities.Expense.create({
        ...data,
        employee_email: me.email,
        employee_name: me.full_name || me.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setShowForm(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (expense) => {
      const me = await base44.auth.me();
      await base44.entities.Expense.update(expense.id, { status: "approved", approved_by: me.email });
      await base44.integrations.Core.SendEmail({
        to: expense.employee_email || expense.created_by,
        subject: "Your Expense Has Been Approved",
        body: `Hi ${expense.employee_name || ""},\n\nYour expense claim of R${Number(expense.amount).toFixed(2)} for "${expense.description}" has been approved.\n\nThank you,\nPhakathi Holdings`,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ expense, reason }) => {
      await base44.entities.Expense.update(expense.id, {
        status: "rejected",
        rejection_reason: reason || "No reason provided",
      });
      await base44.integrations.Core.SendEmail({
        to: expense.employee_email || expense.created_by,
        subject: "Your Expense Claim Was Not Approved",
        body: `Hi ${expense.employee_name || ""},\n\nUnfortunately your expense claim of R${Number(expense.amount).toFixed(2)} for "${expense.description}" has been rejected.\n\nReason: ${reason || "No reason provided"}\n\nPlease contact HR if you have questions.\n\nPhakathi Holdings`,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const myExpenses = isAdmin ? expenses : expenses;
  const pendingCount = expenses.filter((e) => e.status === "pending").length;
  const totalApproved = expenses.filter((e) => e.status === "approved").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Receipt className="w-8 h-8 text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expense Claims</h1>
              <p className="text-gray-600 text-sm">
                {isAdmin ? "Review and manage all employee expense submissions" : "Submit and track your business expense claims"}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            New Expense
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending Review",   value: pendingCount,                         color: "text-yellow-600" },
            { label: "Total Approved",   value: `R${totalApproved.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, color: "text-green-600" },
            { label: "Total Submitted",  value: expenses.length,                      color: "text-gray-900" },
          ].map((s, i) => (
            <Card key={i} className="border-none shadow-md">
              <CardContent className="p-5 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList className="bg-white shadow-sm border">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          {["all", "pending", "approved", "rejected"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
              {isLoading ? (
                [1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
              ) : expenses.filter((e) => tab === "all" || e.status === tab).length === 0 ? (
                <Card className="border-none shadow-md">
                  <CardContent className="p-12 text-center">
                    <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">No {tab === "all" ? "" : tab} expenses yet</p>
                  </CardContent>
                </Card>
              ) : (
                expenses
                  .filter((e) => tab === "all" || e.status === tab)
                  .map((expense) => (
                    <motion.div key={expense.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <ExpenseCard
                        expense={expense}
                        isAdmin={isAdmin}
                        currentUser={user}
                        onApprove={(exp) => approveMutation.mutate(exp)}
                        onReject={(exp, reason) => rejectMutation.mutate({ expense: exp, reason })}
                      />
                    </motion.div>
                  ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Submit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Expense Claim</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}