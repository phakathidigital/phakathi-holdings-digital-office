import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Loader2, Palette, Users } from "lucide-react";
import { SUBSIDIARIES, getCompanyBranding, getTeamPlaceholders } from "@/lib/subsidiaries";
import { applyBranding } from "@/lib/branding";

export default function CompleteProfileSetup({ user, onCompleted }) {
  const [form, setForm] = useState({ full_name: user?.full_name || "", job_title: user?.job_title || "", department: user?.department || "", subsidiary: user?.subsidiary || "" });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const companyBranding = useMemo(() => getCompanyBranding(form.subsidiary), [form.subsidiary]);
  const teamPlaceholders = useMemo(() => getTeamPlaceholders(form.subsidiary), [form.subsidiary]);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.subsidiary) { setError("Please select the company you work under."); return; }
    setIsSaving(true); setError("");
    try {
      const userPayload = { full_name: form.full_name, job_title: form.job_title, department: form.department, subsidiary: form.subsidiary };
      await base44.auth.updateMe(userPayload);
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      const profilePayload = { user_email: user.email, job_title: form.job_title, subsidiary: form.subsidiary };
      if (profiles?.[0]?.id) await base44.entities.UserProfile.update(profiles[0].id, profilePayload);
      else await base44.entities.UserProfile.create(profilePayload);
      if (!user?.branding) applyBranding(companyBranding);
      await onCompleted?.();
    } catch (err) {
      setError(err?.message || "We could not save your company profile. Please try again.");
    } finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-gray-100">
        <CardHeader>
          <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center mb-3"><Building2 className="w-6 h-6" /></div>
          <CardTitle className="text-2xl">Complete your company profile</CardTitle>
          <CardDescription>Phakathi Flow supports the whole group in one app. Choose your company so your workspace, team views, meetings, and reports are grouped correctly.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full name</Label><Input value={form.full_name} onChange={(event) => set("full_name", event.target.value)} placeholder="Your name" /></div>
              <div className="space-y-2"><Label>Designation / Role</Label><Input value={form.job_title} onChange={(event) => set("job_title", event.target.value)} placeholder="e.g. Group CEO, Operations Manager, HR, B-BBEE Analyst" /></div>
              <div className="space-y-2"><Label>Department / team</Label><Input value={form.department} onChange={(event) => set("department", event.target.value)} placeholder="e.g. HR, Finance, Operations" /></div>
              <div className="space-y-2">
                <Label>Company / subsidiary *</Label>
                <Select value={form.subsidiary} onValueChange={(value) => set("subsidiary", value)}>
                  <SelectTrigger><SelectValue placeholder="Select your company" /></SelectTrigger>
                  <SelectContent>{SUBSIDIARIES.map((subsidiary) => <SelectItem key={subsidiary} value={subsidiary}>{subsidiary}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {form.subsidiary && (
              <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Palette className="w-4 h-4" /> Company colour defaults</p>
                  <div className="flex gap-2 mt-3">{[companyBranding.primaryHex, companyBranding.accentHex, companyBranding.bgHex].map((colour) => <span key={colour} className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: colour }} />)}</div>
                  <p className="text-xs text-gray-500 mt-2">You can override these later in Settings → Branding.</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Users className="w-4 h-4" /> Initial team placeholders</p>
                  <p className="text-xs text-gray-500 mt-2">{teamPlaceholders.length ? teamPlaceholders.join(", ") : "No named placeholders yet for this company."}</p>
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={isSaving || !form.subsidiary} className="w-full bg-gray-900 hover:bg-gray-800 text-white">{isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save and enter Phakathi Flow"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
