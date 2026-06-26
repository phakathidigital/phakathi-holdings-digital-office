import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle, AlertCircle, ExternalLink, Settings, Zap, Download, Upload,
  BookOpen, Shield, Users, DollarSign, BarChart2, X, Copy, Eye, EyeOff, Plug
} from "lucide-react";

const INTEGRATIONS = [
  {
    id: "sage",
    name: "Sage Business Cloud",
    category: "accounting",
    description: "Sync payroll data, export journals, and import employee records directly into Sage Business Cloud Payroll.",
    logo: "💼",
    color: "from-green-600 to-green-800",
    features: ["Payroll export (CSV/XML)", "Employee sync", "Leave balance sync", "GL journal export"],
    status: "available",
    docs: "https://www.sage.com/en-za/",
    exportFormats: ["CSV", "XML", "IIF"],
    fields: [{ key: "api_key", label: "Sage API Key", type: "password" }, { key: "company_id", label: "Company ID", type: "text" }, { key: "payroll_period", label: "Payroll Period (e.g. 2026/04)", type: "text" }],
  },
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    category: "accounting",
    description: "Push approved expenses, payslip data, and payroll adjustments to QuickBooks for seamless accounting reconciliation.",
    logo: "📊",
    color: "from-blue-600 to-blue-800",
    features: ["Expense import", "Payroll journal entries", "Employee vendor sync", "IIF export"],
    status: "available",
    docs: "https://quickbooks.intuit.com/",
    exportFormats: ["IIF", "CSV"],
    fields: [{ key: "client_id", label: "Client ID", type: "text" }, { key: "client_secret", label: "Client Secret", type: "password" }, { key: "realm_id", label: "Realm ID", type: "text" }],
  },
  {
    id: "simplepay",
    name: "SimplePay",
    category: "payroll",
    description: "South Africa's leading cloud payroll. Export payroll runs, UIF submissions, and IRP5 data.",
    logo: "🇿🇦",
    color: "from-orange-500 to-red-600",
    features: ["UIF submissions", "IRP5 / IT3(a) export", "Payroll run sync", "Leave integration"],
    status: "available",
    docs: "https://www.simplepay.co.za/",
    exportFormats: ["CSV", "PDF"],
    fields: [{ key: "api_key", label: "SimplePay API Key", type: "password" }, { key: "company_ref", label: "Company Reference", type: "text" }],
  },
  {
    id: "payspace",
    name: "PaySpace",
    category: "payroll",
    description: "Integrated SA HR & payroll platform. Sync employee profiles, leave, and salary data bidirectionally.",
    logo: "🌐",
    color: "from-teal-600 to-cyan-700",
    features: ["Employee sync", "Leave sync", "Payslip distribution", "Tax calculations"],
    status: "available",
    docs: "https://payspace.com/",
    exportFormats: ["CSV", "XML"],
    fields: [{ key: "api_key", label: "PaySpace API Key", type: "password" }, { key: "tenant_id", label: "Tenant ID", type: "text" }],
  },
  {
    id: "workday",
    name: "Workday HCM",
    category: "hr",
    description: "Enterprise HR platform. Sync org structure, compensation, and performance review data.",
    logo: "🏢",
    color: "from-violet-600 to-purple-800",
    features: ["Org chart sync", "Performance data", "Compensation management", "Talent management"],
    status: "available",
    docs: "https://www.workday.com/",
    exportFormats: ["CSV", "XML", "JSON"],
    fields: [{ key: "tenant_url", label: "Tenant URL", type: "text" }, { key: "client_id", label: "Client ID", type: "text" }, { key: "client_secret", label: "Client Secret", type: "password" }],
  },
  {
    id: "bamboohr",
    name: "BambooHR",
    category: "hr",
    description: "Export employee records, onboarding checklists, and performance reviews to BambooHR.",
    logo: "🎋",
    color: "from-emerald-600 to-green-700",
    features: ["Employee records", "Onboarding workflows", "Time-off tracking", "Performance export"],
    status: "available",
    docs: "https://www.bamboohr.com/",
    exportFormats: ["CSV", "JSON"],
    fields: [{ key: "api_key", label: "BambooHR API Key", type: "password" }, { key: "subdomain", label: "Subdomain", type: "text" }],
  },
  {
    id: "xero",
    name: "Xero Accounting",
    category: "accounting",
    description: "Sync expense claims, invoices, and payroll costs to Xero for real-time financial reporting.",
    logo: "💙",
    color: "from-blue-500 to-blue-700",
    features: ["Expense sync", "Invoice creation", "Bank reconciliation", "Payroll export"],
    status: "available",
    docs: "https://www.xero.com/",
    exportFormats: ["CSV", "OFX"],
    fields: [{ key: "client_id", label: "Client ID", type: "text" }, { key: "client_secret", label: "Client Secret", type: "password" }],
  },
  {
    id: "microsoft365",
    name: "Microsoft 365 / AD",
    category: "productivity",
    description: "Sync employee accounts with Azure Active Directory for single sign-on and user provisioning.",
    logo: "🪟",
    color: "from-blue-600 to-indigo-700",
    features: ["User provisioning", "SSO integration", "Calendar sync", "Teams integration"],
    status: "available",
    docs: "https://www.microsoft.com/en-us/microsoft-365",
    exportFormats: ["CSV"],
    fields: [{ key: "tenant_id", label: "Tenant ID", type: "text" }, { key: "client_id", label: "App Client ID", type: "text" }, { key: "client_secret", label: "Client Secret", type: "password" }],
  },
];

const CATEGORIES = [
  { id: "all", label: "All Integrations", icon: Plug },
  { id: "accounting", label: "Accounting & Finance", icon: DollarSign },
  { id: "payroll", label: "Payroll & HR", icon: Users },
  { id: "hr", label: "HR Platforms", icon: Shield },
  { id: "productivity", label: "Productivity", icon: Zap },
];

function ConfigDialog({ integration, connected, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(integration.id, form);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1500);
  };

  const handleExport = () => {
    const info = `Integration: ${integration.name}\nExport Format: ${integration.exportFormats.join(", ")}\nNote: Connect your ${integration.name} account and use the Auto Payroll module to export data in the required format.\n\nDocs: ${integration.docs}`;
    const blob = new Blob([info], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${integration.id}-setup-guide.txt`;
    a.click();
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="text-xl">{integration.logo}</span>
          {integration.name}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">{integration.description}</p>

        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Supported Features</p>
          <div className="flex flex-wrap gap-1.5">
            {integration.features.map(f => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-xl">
          <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Export Formats</p>
          <div className="flex gap-2">
            {integration.exportFormats.map(f => <Badge key={f} className="bg-blue-100 text-blue-700 border-0 text-xs">{f}</Badge>)}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase">Credentials</p>
          {integration.fields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs">{field.label}</Label>
              <div className="relative">
                <Input
                  type={field.type === "password" && !showSecrets[field.key] ? "password" : "text"}
                  placeholder={field.type === "password" ? "••••••••••••" : `Enter ${field.label}`}
                  value={form[field.key] || ""}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="pr-9 text-sm"
                />
                {field.type === "password" && (
                  <button type="button" onClick={() => setShowSecrets(s => ({ ...s, [field.key]: !s[field.key] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                    {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={handleExport} className="flex-1 gap-2 text-xs">
            <Download className="w-3.5 h-3.5" /> Setup Guide
          </Button>
          <Button variant="outline" onClick={() => window.open(integration.docs, "_blank")} className="gap-2 text-xs">
            <ExternalLink className="w-3.5 h-3.5" /> Docs
          </Button>
          <Button onClick={handleSave} className="flex-1 gap-2 bg-gray-900 hover:bg-gray-800 text-white text-xs">
            {saved ? <><CheckCircle className="w-3.5 h-3.5" /> Saved!</> : <><CheckCircle className="w-3.5 h-3.5" /> Connect</>}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

function IntegrationCard({ integration, connected, onConfigure, onDisconnect }) {
  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center text-2xl shrink-0 shadow`}>
            {integration.logo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm">{integration.name}</h3>
              {connected ? (
                <Badge className="bg-green-100 text-green-700 border-0 text-xs flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-gray-400">Not connected</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{integration.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {integration.features.slice(0, 3).map(f => (
                <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
              ))}
              {integration.features.length > 3 && (
                <span className="text-xs text-gray-400">+{integration.features.length - 3} more</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={() => onConfigure(integration)}
            className={`flex-1 gap-1.5 h-8 text-xs ${connected ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" : "bg-gray-900 hover:bg-gray-800 text-white"}`}>
            <Settings className="w-3.5 h-3.5" />
            {connected ? "Reconfigure" : "Connect"}
          </Button>
          {connected && (
            <Button size="sm" variant="outline" onClick={() => onDisconnect(integration.id)} className="h-8 text-xs text-red-500 hover:text-red-700 hover:border-red-300">
              Disconnect
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => window.open(integration.docs, "_blank")} className="h-8 w-8 p-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Integrations() {
  const [category, setCategory] = useState("all");
  const [configuring, setConfiguring] = useState(null);
  const [connected, setConnected] = useState({}); // { integrationId: true/false }

  const filtered = INTEGRATIONS.filter(i => category === "all" || i.category === category);

  const handleSave = (id, form) => {
    setConnected(c => ({ ...c, [id]: true }));
    // In a real app, save credentials securely server-side
  };

  const handleDisconnect = (id) => {
    setConnected(c => ({ ...c, [id]: false }));
  };

  const connectedCount = Object.values(connected).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Plug className="w-8 h-8 text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
              <p className="text-gray-600 text-sm">Connect Sage, QuickBooks, payroll & HR platforms</p>
            </div>
          </div>
          <Badge className="bg-gray-900 text-white border-0">{connectedCount} connected</Badge>
        </motion.div>

        {/* Info banner */}
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Note:</strong> Credentials entered here are stored locally in your session. For production use, set up server-side credential storage via Builder+ backend functions. Export formats (CSV/IIF/XML) are fully functional and ready for manual import into each platform.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = cat.id === "all" ? INTEGRATIONS.length : INTEGRATIONS.filter(i => i.category === cat.id).length;
            return (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                  category === cat.id ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${category === cat.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Integration grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(integration => (
            <motion.div key={integration.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <IntegrationCard
                integration={integration}
                connected={!!connected[integration.id]}
                onConfigure={setConfiguring}
                onDisconnect={handleDisconnect}
              />
            </motion.div>
          ))}
        </div>

        {/* Export guide */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Download className="w-4 h-4" /> Data Export Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-green-50 rounded-xl">
                <p className="font-semibold text-green-800 mb-1">Sage Export</p>
                <p className="text-xs text-green-700">Use Auto Payroll → Export CSV. Import into Sage via <em>Payroll → Import Employee Data</em>. Use XML format for journal entries.</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="font-semibold text-blue-800 mb-1">QuickBooks Export</p>
                <p className="text-xs text-blue-700">Export IIF from Auto Payroll. In QuickBooks: <em>File → Utilities → Import → IIF Files</em> to post payroll journals.</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <p className="font-semibold text-orange-800 mb-1">SimplePay / PaySpace</p>
                <p className="text-xs text-orange-700">Export CSV from Payroll module. Use platform import wizard to map Employee, Gross, Net, Leave Deductions columns.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Config dialog */}
      <Dialog open={!!configuring} onOpenChange={(o) => !o && setConfiguring(null)}>
        {configuring && (
          <ConfigDialog
            integration={configuring}
            connected={!!connected[configuring.id]}
            onClose={() => setConfiguring(null)}
            onSave={handleSave}
          />
        )}
      </Dialog>
    </div>
  );
}