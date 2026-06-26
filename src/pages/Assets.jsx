import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBSIDIARIES } from "@/lib/subsidiaries";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Monitor, Key, Plus, Search, Bell, UserPlus, X, AlertTriangle, CheckCircle, Package } from "lucide-react";
import { format, parseISO, differenceInDays, addDays } from "date-fns";

const TYPE_ICONS = { "Hardware": Monitor, "Software License": Key, "Peripheral": Package, "Mobile Device": Monitor, "Vehicle": Package, "Other": Package };
const STATUS_COLORS = { available: "bg-green-100 text-green-700", assigned: "bg-blue-100 text-blue-700", maintenance: "bg-yellow-100 text-yellow-700", retired: "bg-gray-100 text-gray-500" };
const CONDITION_COLORS = { new: "bg-emerald-100 text-emerald-700", good: "bg-green-100 text-green-700", fair: "bg-yellow-100 text-yellow-700", poor: "bg-red-100 text-red-700" };

const EMPTY_FORM = { name: "", subsidiary: "", type: "Hardware", category: "", serial_number: "", license_key: "", vendor: "", purchase_date: "", purchase_cost: "", warranty_expiry: "", renewal_date: "", status: "available", condition: "good", notes: "" };

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  return differenceInDays(parseISO(dateStr), new Date());
}

function RenewalBadge({ days }) {
  if (days === null) return null;
  if (days < 0) return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Expired</Badge>;
  if (days <= 30) return <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">Due in {days}d</Badge>;
  if (days <= 90) return <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">Due in {days}d</Badge>;
  return null;
}

export default function Assets() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSubsidiary, setFilterSubsidiary] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showAssign, setShowAssign] = useState(null);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignName, setAssignName] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [sendingReminders, setSendingReminders] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const isAdmin = user?.role === "admin";

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list("-created_date", 300),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingAsset
      ? base44.entities.Asset.update(editingAsset.id, data)
      : base44.entities.Asset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setShowForm(false);
      setEditingAsset(null);
      setForm(EMPTY_FORM);
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, email, name }) => base44.entities.Asset.update(id, {
      assigned_to_email: email, assigned_to_name: name,
      assigned_date: format(new Date(), "yyyy-MM-dd"), status: "assigned",
    }),
    onSuccess: async (_, { email, name, assetName }) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setShowAssign(null);
      if (email) {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `Asset Assigned to You – ${assetName}`,
          body: `Hi ${name || email},\n\nThe following asset has been assigned to you:\n\n📦 ${assetName}\n📅 Date: ${format(new Date(), "d MMMM yyyy")}\n\nPlease log in to the Phakathi Holdings Digital Office to confirm receipt.\n\nIT Team`,
        }).catch(() => {});
      }
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (id) => base44.entities.Asset.update(id, { assigned_to_email: "", assigned_to_name: "", assigned_date: "", status: "available" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Asset.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
  });

  const handleSendReminders = async () => {
    setSendingReminders(true);
    const toRemind = assets.filter(a => {
      const days = getDaysUntil(a.renewal_date) ?? getDaysUntil(a.warranty_expiry);
      return days !== null && days >= 0 && days <= 30 && a.assigned_to_email;
    });
    for (const asset of toRemind) {
      const days = getDaysUntil(asset.renewal_date) ?? getDaysUntil(asset.warranty_expiry);
      const type = asset.renewal_date ? "renewal" : "warranty expiry";
      await base44.integrations.Core.SendEmail({
        to: asset.assigned_to_email,
        subject: `Reminder: Asset ${type} in ${days} day(s) – ${asset.name}`,
        body: `Hi ${asset.assigned_to_name || asset.assigned_to_email},\n\nThis is a reminder that your asset "${asset.name}" has a ${type} coming up in ${days} day(s).\n\nPlease contact IT to arrange renewal or replacement.\n\nIT Team – Phakathi Holdings`,
      }).catch(() => {});
    }
    // Also notify admin
    if (toRemind.length > 0 && user?.email) {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Asset Reminder Summary – ${toRemind.length} item(s) expiring soon`,
        body: `Hi,\n\nThe following assets are expiring within 30 days:\n\n${toRemind.map(a => `• ${a.name} (assigned to ${a.assigned_to_name || a.assigned_to_email})`).join("\n")}\n\nLog in to the Asset Management page to take action.\n\nPhakathi Holdings`,
      }).catch(() => {});
    }
    setSendingReminders(false);
  };

  const openEdit = (asset) => {
    setEditingAsset(asset);
    setForm({ ...EMPTY_FORM, ...asset, purchase_cost: asset.purchase_cost ?? "" });
    setShowForm(true);
  };

  const filtered = useMemo(() => assets.filter(a => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.vendor?.toLowerCase().includes(search.toLowerCase()) || a.assigned_to_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || a.type === filterType;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchSubsidiary = filterSubsidiary === "all" || a.subsidiary === filterSubsidiary;
    return matchSearch && matchType && matchStatus && matchSubsidiary;
  }), [assets, search, filterType, filterStatus, filterSubsidiary]);

  const expiringSoon = assets.filter(a => {
    const d = getDaysUntil(a.renewal_date) ?? getDaysUntil(a.warranty_expiry);
    return d !== null && d >= 0 && d <= 30;
  });

  const stats = [
    { label: "Total Assets", value: assets.length, color: "text-gray-900" },
    { label: "Assigned", value: assets.filter(a => a.status === "assigned").length, color: "text-blue-600" },
    { label: "Available", value: assets.filter(a => a.status === "available").length, color: "text-green-600" },
    { label: "Expiring Soon", value: expiringSoon.length, color: "text-orange-600" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Monitor className="w-8 h-8 text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
              <p className="text-gray-600 text-sm">Hardware, software licenses, and assignments</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {isAdmin && expiringSoon.length > 0 && (
              <Button variant="outline" onClick={handleSendReminders} disabled={sendingReminders} className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50">
                <Bell className="w-4 h-4" />
                {sendingReminders ? "Sending..." : `Send ${expiringSoon.length} Reminder(s)`}
              </Button>
            )}
            {isAdmin && (
              <Button onClick={() => { setEditingAsset(null); setForm(EMPTY_FORM); setShowForm(true); }}
                className="bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg gap-2">
                <Plus className="w-4 h-4" /> Add Asset
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <Card key={i} className="border-none shadow-md">
              <CardContent className="p-5 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Expiring banner */}
        {expiringSoon.length > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3 text-orange-700 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span><strong>{expiringSoon.length} asset(s)</strong> have renewal or warranty expiry within 30 days.</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets..." className="pl-9 bg-white" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {["Hardware","Software License","Peripheral","Mobile Device","Vehicle","Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {["available","assigned","maintenance","retired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSubsidiary} onValueChange={setFilterSubsidiary}>
            <SelectTrigger className="w-48 bg-white"><SelectValue placeholder="All Subsidiaries" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subsidiaries</SelectItem>
              {SUBSIDIARIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Asset list */}
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="border-none shadow-md"><CardContent className="p-12 text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p>No assets found.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((asset, i) => {
              const Icon = TYPE_ICONS[asset.type] || Package;
              const renewalDays = getDaysUntil(asset.renewal_date);
              const warrantyDays = getDaysUntil(asset.warranty_expiry);
              return (
                <motion.div key={asset.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-gray-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{asset.name}</p>
                            <Badge className={`${STATUS_COLORS[asset.status]} border-0 text-xs capitalize`}>{asset.status}</Badge>
                            <Badge className={`${CONDITION_COLORS[asset.condition]} border-0 text-xs capitalize`}>{asset.condition}</Badge>
                            <RenewalBadge days={renewalDays} />
                            {renewalDays === null && <RenewalBadge days={warrantyDays} />}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span>{asset.type}{asset.vendor ? ` · ${asset.vendor}` : ""}</span>
                            {asset.serial_number && <span>S/N: {asset.serial_number}</span>}
                            {asset.purchase_date && <span>Purchased: {format(parseISO(asset.purchase_date), "d MMM yyyy")}</span>}
                            {asset.renewal_date && <span>Renews: {format(parseISO(asset.renewal_date), "d MMM yyyy")}</span>}
                            {asset.warranty_expiry && <span>Warranty: {format(parseISO(asset.warranty_expiry), "d MMM yyyy")}</span>}
                          </div>
                          {asset.subsidiary && <p className="text-xs text-purple-600 mt-0.5">{asset.subsidiary}</p>}
                          {asset.assigned_to_name && (
                            <p className="text-xs text-blue-600 mt-1">Assigned to: {asset.assigned_to_name}{asset.assigned_date ? ` (${format(parseISO(asset.assigned_date), "d MMM yyyy")})` : ""}</p>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {asset.status !== "assigned" ? (
                              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => { setShowAssign(asset); setAssignEmail(""); setAssignName(""); }}>
                                <UserPlus className="w-3.5 h-3.5" /> Assign
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="gap-1 text-xs text-red-500 border-red-200 hover:bg-red-50" onClick={() => unassignMutation.mutate(asset.id)}>
                                <X className="w-3.5 h-3.5" /> Unassign
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-xs" onClick={() => openEdit(asset)}>Edit</Button>
                            <Button size="sm" variant="ghost" className="text-xs text-red-400" onClick={() => deleteMutation.mutate(asset.id)}>Delete</Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) { setEditingAsset(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Asset Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. MacBook Pro 14, Adobe CC License" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Subsidiary</Label>
                <Select value={form.subsidiary} onValueChange={v => setForm(f => ({...f, subsidiary: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select subsidiary..." /></SelectTrigger>
                  <SelectContent>{SUBSIDIARIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Hardware","Software License","Peripheral","Mobile Device","Vehicle","Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Vendor</Label>
                <Input value={form.vendor} onChange={e => setForm(f => ({...f, vendor: e.target.value}))} placeholder="e.g. Apple, Microsoft" />
              </div>
              <div className="space-y-1.5">
                <Label>Serial / Asset Number</Label>
                <Input value={form.serial_number} onChange={e => setForm(f => ({...f, serial_number: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <Label>License Key</Label>
                <Input value={form.license_key} onChange={e => setForm(f => ({...f, license_key: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <Label>Purchase Date</Label>
                <Input type="date" value={form.purchase_date} onChange={e => setForm(f => ({...f, purchase_date: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <Label>Purchase Cost (R)</Label>
                <Input type="number" value={form.purchase_cost} onChange={e => setForm(f => ({...f, purchase_cost: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <Label>Warranty Expiry</Label>
                <Input type="date" value={form.warranty_expiry} onChange={e => setForm(f => ({...f, warranty_expiry: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <Label>Renewal Date</Label>
                <Input type="date" value={form.renewal_date} onChange={e => setForm(f => ({...f, renewal_date: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["available","assigned","maintenance","retired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Condition</Label>
                <Select value={form.condition} onValueChange={v => setForm(f => ({...f, condition: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["new","good","fair","poor"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Any additional notes" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={() => saveMutation.mutate({ ...form, purchase_cost: form.purchase_cost ? parseFloat(form.purchase_cost) : undefined })}
                disabled={!form.name || saveMutation.isPending}
                className="flex-1 bg-gray-900 hover:bg-gray-700 text-white">
                {saveMutation.isPending ? "Saving..." : editingAsset ? "Save Changes" : "Add Asset"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign: {showAssign?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Assign to (select user)</Label>
              <Select onValueChange={email => { const u = users.find(u => u.email === email); setAssignEmail(email); setAssignName(u?.full_name || ""); }}>
                <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Or enter email manually</Label>
              <Input value={assignEmail} onChange={e => setAssignEmail(e.target.value)} placeholder="email@company.com" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAssign(null)} className="flex-1">Cancel</Button>
              <Button disabled={!assignEmail || assignMutation.isPending}
                onClick={() => assignMutation.mutate({ id: showAssign.id, email: assignEmail, name: assignName, assetName: showAssign.name })}
                className="flex-1 bg-gray-900 hover:bg-gray-700 text-white">
                {assignMutation.isPending ? "Assigning..." : "Assign & Notify"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}