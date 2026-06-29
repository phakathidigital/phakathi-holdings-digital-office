import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Type, RotateCcw, CheckCircle2, Eye } from "lucide-react";
import { applyBranding, DEFAULT_BRANDING } from "@/lib/branding";
import { getCompanyBranding } from "@/lib/subsidiaries";

const FONT_OPTIONS = [
  { value: "Inter, system-ui, sans-serif", label: "Inter (Default)" },
  { value: "Poppins, sans-serif", label: "Poppins" },
  { value: "Roboto, sans-serif", label: "Roboto" },
  { value: "'DM Sans', sans-serif", label: "DM Sans" },
  { value: "'Nunito', sans-serif", label: "Nunito" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "Georgia, serif", label: "Georgia" },
];

const RADIUS_OPTIONS = [
  { value: "0rem", label: "Square" },
  { value: "0.25rem", label: "Slight" },
  { value: "0.5rem", label: "Default" },
  { value: "0.75rem", label: "Rounded" },
  { value: "1rem", label: "Very Rounded" },
  { value: "1.5rem", label: "Pill" },
];

const PRESET_THEMES = [
  { name: "Default (Monochrome)", primary: "0 0% 9%", accent: "0 0% 96.1%", background: "0 0% 100%", primaryHex: "#171717", accentHex: "#f5f5f5", bgHex: "#ffffff" },
  { name: "Corporate Blue", primary: "221 83% 53%", accent: "214 95% 93%", background: "0 0% 100%", primaryHex: "#2563eb", accentHex: "#dbeafe", bgHex: "#ffffff" },
  { name: "Emerald Green", primary: "160 84% 39%", accent: "152 76% 90%", background: "0 0% 100%", primaryHex: "#10b981", accentHex: "#d1fae5", bgHex: "#ffffff" },
  { name: "Deep Purple", primary: "262 83% 58%", accent: "270 95% 95%", background: "0 0% 100%", primaryHex: "#7c3aed", accentHex: "#ede9fe", bgHex: "#ffffff" },
  { name: "Burnt Orange", primary: "24 95% 53%", accent: "34 100% 92%", background: "0 0% 100%", primaryHex: "#f97316", accentHex: "#ffedd5", bgHex: "#ffffff" },
  { name: "Rose Red", primary: "347 77% 50%", accent: "351 100% 95%", background: "0 0% 100%", primaryHex: "#e11d48", accentHex: "#ffe4e6", bgHex: "#ffffff" },
  { name: "Dark Mode", primary: "0 0% 98%", accent: "0 0% 14.9%", background: "0 0% 3.9%", primaryHex: "#fafafa", accentHex: "#262626", bgHex: "#0a0a0a" },
];

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function BrandingSettings({ user }) {
  const queryClient = useQueryClient();
  const companyDefault = getCompanyBranding(user?.subsidiary);
  const saved = { ...companyDefault, ...(user?.branding || {}) };
  const [form, setForm] = useState({
    primaryHex: saved.primaryHex || "#171717",
    accentHex: saved.accentHex || "#f5f5f5",
    bgHex: saved.bgHex || "#ffffff",
    font: saved.font || "Inter, system-ui, sans-serif",
    radius: saved.radius || "0.5rem",
    orgName: saved.orgName || "Phakathi Holdings",
    orgTagline: saved.orgTagline || "Digital Office",
  });
  const [saved2, setSaved2] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => api.auth.updateMe({ branding: data }),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      applyBranding(data);
      setSaved2(true);
      setTimeout(() => setSaved2(false), 2500);
    },
  });

  // Live preview
  useEffect(() => {
    applyBranding(form);
  }, [form]);

  const applyPreset = (preset) => {
    setForm(f => ({
      ...f,
      primaryHex: preset.primaryHex,
      accentHex: preset.accentHex,
      bgHex: preset.bgHex,
    }));
  };

  const resetDefaults = () => {
    setForm({
      primaryHex: "#171717", accentHex: "#f5f5f5", bgHex: "#ffffff",
      font: "Inter, system-ui, sans-serif", radius: "0.5rem",
      ...companyDefault,
    });
  };

  return (
    <div className="space-y-6">
      {/* Preset Themes */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" />Preset Themes</CardTitle>
          <CardDescription>Pick a theme to get started quickly. Company defaults apply first; your personal branding overrides them</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {PRESET_THEMES.map(preset => (
              <button key={preset.name} onClick={() => applyPreset(preset)}
                className="p-3 rounded-xl border-2 border-gray-100 hover:border-gray-300 transition-all text-left group">
                <div className="flex gap-1.5 mb-2">
                  <div className="w-5 h-5 rounded-full shadow-inner" style={{ background: preset.primaryHex }} />
                  <div className="w-5 h-5 rounded-full shadow-inner" style={{ background: preset.accentHex, border: "1px solid #e5e7eb" }} />
                  <div className="w-5 h-5 rounded-full shadow-inner" style={{ background: preset.bgHex, border: "1px solid #e5e7eb" }} />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">{preset.name}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Colour Pickers */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" />Custom Colours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: "primaryHex", label: "Primary / Brand Colour", desc: "Buttons, active states, headings" },
              { key: "accentHex", label: "Accent / Background Tint", desc: "Hover states, subtle highlights" },
              { key: "bgHex", label: "Page Background", desc: "Main background of the app" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="space-y-2">
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-gray-400">{desc}</p>
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 cursor-pointer shrink-0">
                    <input type="color" value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
                    <div className="w-full h-full rounded-lg" style={{ background: form[key] }} />
                  </div>
                  <Input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="font-mono text-sm uppercase" maxLength={7} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography & Shape */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Type className="w-4 h-4" />Typography & Shape</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Font Family</Label>
              <Select value={form.font} onValueChange={v => setForm(f => ({ ...f, font: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      <span style={{ fontFamily: o.value }}>{o.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Border Radius</Label>
              <Select value={form.radius} onValueChange={v => setForm(f => ({ ...f, radius: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RADIUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organisation Identity */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Organisation Identity</CardTitle>
          <CardDescription>Shown in the sidebar header</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Organisation Name</Label>
              <Input value={form.orgName} onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))} placeholder="Phakathi Holdings" />
            </div>
            <div className="space-y-1.5">
              <Label>Tagline</Label>
              <Input value={form.orgTagline} onChange={e => setForm(f => ({ ...f, orgTagline: e.target.value }))} placeholder="Digital Office" />
            </div>
          </div>

          {/* Live preview */}
          <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1"><Eye className="w-3 h-3" />Sidebar preview</p>
            <div className="flex items-center gap-3 w-fit">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${form.primaryHex}, ${form.primaryHex}cc)` }}>
                <span className="font-bold text-lg" style={{ color: form.bgHex }}>
                  {form.orgName?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "PH"}
                </span>
              </div>
              <div>
                <p className="font-bold text-gray-900" style={{ fontFamily: form.font }}>{form.orgName || "Phakathi Holdings"}</p>
                <p className="text-xs text-gray-500">{form.orgTagline || "Digital Office"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={resetDefaults} className="gap-2">
          <RotateCcw className="w-4 h-4" /> Reset Defaults
        </Button>
        <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
          className="bg-gray-900 hover:bg-gray-700 text-white gap-2 min-w-36">
          {saved2 ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : mutation.isPending ? "Saving..." : "Save Branding"}
        </Button>
      </div>
    </div>
  );
}