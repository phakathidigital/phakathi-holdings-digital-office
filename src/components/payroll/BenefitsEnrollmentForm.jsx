import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Heart } from "lucide-react";

const MEDICAL_AID_OPTIONS = [
  { value: "none", label: "None", cost: "R0/month" },
  { value: "basic", label: "Basic Plan", cost: "~R1,200/month" },
  { value: "standard", label: "Standard Plan", cost: "~R2,400/month" },
  { value: "comprehensive", label: "Comprehensive Plan", cost: "~R4,100/month" },
];

const TOGGLE_BENEFITS = [
  { key: "retirement_fund", label: "Retirement Fund (Pension)", desc: "Employer contributes 8% of basic salary" },
  { key: "group_life_cover", label: "Group Life Cover", desc: "3× annual salary death benefit" },
  { key: "disability_cover", label: "Disability Cover", desc: "75% income protection" },
  { key: "funeral_cover", label: "Funeral Cover", desc: "R30,000 family funeral benefit" },
  { key: "travel_allowance", label: "Travel Allowance", desc: "R2,500/month towards commuting" },
  { key: "cell_phone_allowance", label: "Cell Phone Allowance", desc: "R750/month data & calls" },
];

export default function BenefitsEnrollmentForm({ existing, user, open, onClose }) {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const [form, setForm] = useState({
    medical_aid: existing?.medical_aid || "none",
    medical_aid_dependants: existing?.medical_aid_dependants || 0,
    retirement_fund: existing?.retirement_fund || false,
    retirement_contribution_pct: existing?.retirement_contribution_pct || 5,
    group_life_cover: existing?.group_life_cover || false,
    disability_cover: existing?.disability_cover || false,
    funeral_cover: existing?.funeral_cover || false,
    travel_allowance: existing?.travel_allowance || false,
    cell_phone_allowance: existing?.cell_phone_allowance || false,
    annual_bonus_pct: existing?.annual_bonus_pct || 0,
    notes: existing?.notes || "",
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data, period_year: currentYear,
        employee_email: user.email,
        employee_name: user.full_name || user.email,
        status: "submitted",
      };
      if (existing?.id) return api.entities.BenefitsEnrollment.update(existing.id, payload);
      return api.entities.BenefitsEnrollment.create(payload);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["benefits-enrollment"] });
      await api.integrations.Core.SendEmail({
        to: user.email,
        subject: `Benefits Enrollment Submitted — ${currentYear}`,
        body: `Hi ${user.full_name || "there"},\n\nYour benefits enrollment for ${currentYear} has been submitted for HR review.\n\nSelected benefits:\n- Medical Aid: ${form.medical_aid}\n- Retirement Fund: ${form.retirement_fund ? "Yes" : "No"}\n- Group Life Cover: ${form.group_life_cover ? "Yes" : "No"}\n\nYou will be notified once HR approves your enrollment.\n\nPhakathi Holdings HR`,
      }).catch(() => {});
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            Benefits Enrollment — {currentYear}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Medical Aid */}
          <div className="space-y-2">
            <Label className="font-semibold">Medical Aid</Label>
            <div className="grid grid-cols-2 gap-2">
              {MEDICAL_AID_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setForm(f => ({ ...f, medical_aid: opt.value }))}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${form.medical_aid === opt.value ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.cost}</p>
                </button>
              ))}
            </div>
            {form.medical_aid !== "none" && (
              <div className="flex items-center gap-2 mt-2">
                <Label className="text-xs text-gray-600">Dependants:</Label>
                <Input type="number" min="0" max="10" value={form.medical_aid_dependants}
                  onChange={e => setForm(f => ({ ...f, medical_aid_dependants: parseInt(e.target.value) || 0 }))}
                  className="w-20 h-7 text-sm" />
              </div>
            )}
          </div>

          {/* Toggle benefits */}
          <div className="space-y-2">
            <Label className="font-semibold">Additional Benefits</Label>
            {TOGGLE_BENEFITS.map(b => (
              <label key={b.key} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 cursor-pointer transition-colors">
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, [b.key]: !f[b.key] }))}
                  className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${form[b.key] ? "bg-gray-900 text-white" : "border-2 border-gray-300"}`}>
                  {form[b.key] && <CheckCircle className="w-3.5 h-3.5" />}
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-800">{b.label}</p>
                  <p className="text-xs text-gray-500">{b.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Retirement contribution % */}
          {form.retirement_fund && (
            <div className="space-y-1.5 p-3 bg-blue-50 rounded-xl">
              <Label className="text-xs">Your Retirement Contribution (%)</Label>
              <div className="flex items-center gap-2">
                <Input type="number" min="1" max="27.5" value={form.retirement_contribution_pct}
                  onChange={e => setForm(f => ({ ...f, retirement_contribution_pct: parseFloat(e.target.value) || 5 }))}
                  className="w-20 h-8 text-sm" />
                <span className="text-sm text-gray-600">% of gross salary (max 27.5% tax deductible)</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Additional Notes</Label>
            <textarea className="w-full border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-300" rows={2}
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any special requests or queries for HR..." />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
              className="flex-1 bg-gray-900 hover:bg-gray-700 text-white">
              {saveMutation.isPending ? "Submitting..." : "Submit Enrollment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}