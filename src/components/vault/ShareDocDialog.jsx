import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, X, Plus, Users, Lock, Globe, Shield } from "lucide-react";

const DEPARTMENTS = ["Management","Finance","HR","IT","Operations","Empoweryst"];
const ACCESS_OPTIONS = [
  { value: "public", label: "Public", icon: Globe, desc: "Visible to everyone" },
  { value: "employee_only", label: "All Employees", icon: Users, desc: "All logged-in employees" },
  { value: "hr_only", label: "HR Only", icon: Shield, desc: "Only HR/Admin users" },
  { value: "management_only", label: "Management", icon: Lock, desc: "Management & admin only" },
];

export default function ShareDocDialog({ open, onClose, doc, onSave }) {
  const [accessLevel, setAccessLevel] = useState(doc?.access_level || "employee_only");
  const [allowedDepts, setAllowedDepts] = useState(doc?.allowed_departments || []);
  const [sharedWith, setSharedWith] = useState(doc?.shared_with || []);
  const [emailInput, setEmailInput] = useState("");

  const toggleDept = (dept) => {
    setAllowedDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (email && !sharedWith.includes(email)) {
      setSharedWith(prev => [...prev, email]);
    }
    setEmailInput("");
  };

  const removeEmail = (email) => setSharedWith(prev => prev.filter(e => e !== email));

  const handleSave = () => {
    onSave({ access_level: accessLevel, allowed_departments: allowedDepts, shared_with: sharedWith });
  };

  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share "{doc.title}"
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">

          {/* Access level */}
          <div className="space-y-2">
            <Label>Who can access this document?</Label>
            <div className="grid grid-cols-2 gap-2">
              {ACCESS_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
                <button key={value} onClick={() => setAccessLevel(value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${accessLevel === value ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <Icon className="w-4 h-4 mb-1 text-gray-600" />
                  <p className="text-xs font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Department restrictions */}
          <div className="space-y-2">
            <Label>Department Restrictions <span className="text-xs text-gray-400 font-normal">(optional — leave empty for all)</span></Label>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTMENTS.map(dept => (
                <button key={dept} onClick={() => toggleDept(dept)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${allowedDepts.includes(dept) ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                  {dept}
                </button>
              ))}
            </div>
            {allowedDepts.length > 0 && (
              <p className="text-xs text-amber-600">⚠ Only <strong>{allowedDepts.join(", ")}</strong> can access.</p>
            )}
          </div>

          {/* Share with specific people */}
          <div className="space-y-2">
            <Label>Share directly with people</Label>
            <div className="flex gap-2">
              <Input value={emailInput} onChange={e => setEmailInput(e.target.value)}
                placeholder="colleague@company.com"
                onKeyDown={e => e.key === "Enter" && addEmail()} />
              <Button type="button" variant="outline" size="sm" onClick={addEmail}><Plus className="w-4 h-4" /></Button>
            </div>
            {sharedWith.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {sharedWith.map(email => (
                  <Badge key={email} variant="secondary" className="gap-1 pr-1 text-xs">
                    {email}
                    <button onClick={() => removeEmail(email)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
            {sharedWith.length > 0 && (
              <p className="text-xs text-gray-400">These people will receive an email notification.</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1 bg-gray-900 hover:bg-gray-700 text-white gap-2">
              <Share2 className="w-4 h-4" /> Save & Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}