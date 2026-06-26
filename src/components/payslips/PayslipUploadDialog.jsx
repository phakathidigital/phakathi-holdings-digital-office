import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2];

export default function PayslipUploadDialog({ open, onOpenChange, onUpload, isLoading }) {
  const [form, setForm] = useState({ employee_email: "", employee_name: "", period_month: "", period_year: currentYear, gross_amount: "", net_amount: "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onUpload({
        ...form,
        period_year: Number(form.period_year),
        gross_amount: form.gross_amount ? Number(form.gross_amount) : undefined,
        net_amount: form.net_amount ? Number(form.net_amount) : undefined,
        file_url,
        status: "draft",
      });
      setForm({ employee_email: "", employee_name: "", period_month: "", period_year: currentYear, gross_amount: "", net_amount: "" });
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const busy = isLoading || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Payslip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Employee Name *</Label>
              <Input className="mt-1" value={form.employee_name} onChange={(e) => setForm({ ...form, employee_name: e.target.value })} required />
            </div>
            <div>
              <Label>Employee Email *</Label>
              <Input className="mt-1" type="email" value={form.employee_email} onChange={(e) => setForm({ ...form, employee_email: e.target.value })} required />
            </div>
            <div>
              <Label>Month *</Label>
              <Select value={form.period_month} onValueChange={(v) => setForm({ ...form, period_month: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Month..." /></SelectTrigger>
                <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year *</Label>
              <Select value={String(form.period_year)} onValueChange={(v) => setForm({ ...form, period_year: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gross Amount (R)</Label>
              <Input className="mt-1" type="number" value={form.gross_amount} onChange={(e) => setForm({ ...form, gross_amount: e.target.value })} />
            </div>
            <div>
              <Label>Net Amount (R)</Label>
              <Input className="mt-1" type="number" value={form.net_amount} onChange={(e) => setForm({ ...form, net_amount: e.target.value })} />
            </div>
          </div>

          {/* File Upload */}
          <div
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to upload PDF payslip</p>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy || !file || !form.period_month || !form.employee_email} className="bg-gray-900 text-white">
              {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : "Upload Payslip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}