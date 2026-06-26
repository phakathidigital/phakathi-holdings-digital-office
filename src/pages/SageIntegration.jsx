import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link2, RefreshCw, CheckCircle, AlertTriangle, Users, Calendar, Building2, Loader2, Database, Clock, Settings, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const SYNC_MODULES = ['leave_balances', 'leave_requests', 'employee_profiles', 'departments', 'reporting_structures'];
const MODULE_LABELS = { leave_balances: 'Leave Balances', leave_requests: 'Leave Requests', employee_profiles: 'Employee Profiles', departments: 'Departments', reporting_structures: 'Reporting Structures' };
const MODULE_ICONS = { leave_balances: Calendar, leave_requests: Calendar, employee_profiles: Users, departments: Building2, reporting_structures: Building2 };

export default function SageIntegration() {
  const [configForm, setConfigForm] = useState({ connection_name: 'Primary Sage Connection', api_endpoint: '', sync_frequency: 'daily', sync_mode: 'api', notes: '' });
  const [syncing, setSyncing] = useState(null);
  const qc = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({ queryKey: ['sage'], queryFn: () => base44.entities.SageIntegration.list() });
  const { data: leaveRequests = [] } = useQuery({ queryKey: ['leave'], queryFn: () => base44.entities.LeaveRequest.list('-created_date', 20) });

  const create = useMutation({
    mutationFn: d => base44.entities.SageIntegration.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sage'] }); toast.success('Sage connection saved'); },
  });
  const update = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.SageIntegration.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sage'] }),
  });

  const primary = connections[0];

  const simulateSync = async (moduleKey) => {
    if (!primary) { toast.error('No Sage connection configured'); return; }
    setSyncing(moduleKey);
    await update.mutateAsync({ id: primary.id, sync_status: 'syncing' });
    await new Promise(r => setTimeout(r, 2200));
    await update.mutateAsync({ id: primary.id, sync_status: 'success', last_sync_date: new Date().toISOString(), records_synced: (primary.records_synced || 0) + Math.floor(Math.random() * 15 + 3) });
    setSyncing(null);
    toast.success(`${MODULE_LABELS[moduleKey]} synced from Sage`);
  };

  const stats = [
    { label: 'Sage Status', value: primary?.connection_status === 'connected' ? 'Connected' : 'Not Connected', color: primary?.connection_status === 'connected' ? 'text-green-600' : 'text-red-600' },
    { label: 'Records Synced', value: primary?.records_synced || 0, color: 'text-indigo-600' },
    { label: 'Pending Leaves', value: leaveRequests.filter(l => l.status === 'pending').length, color: 'text-amber-600' },
    { label: 'Last Sync', value: primary?.last_sync_date ? new Date(primary.last_sync_date).toLocaleDateString() : 'Never', color: 'text-gray-600' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-screen-xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl"><Link2 className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sage Integration Centre</h1>
            <p className="text-sm text-gray-500">Phakathi Flow ↔ Sage Self Service — never duplicate data entry</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Integration Architecture</p>
            <p className="text-xs text-amber-700 mt-0.5">Sage Self Service remains the authoritative source for Payslips, Leave Applications, Leave Balances, Travel Requests, Claims, Employee Personal Details, and Approval Structures. Phakathi Flow reads from Sage and provides a unified employee workspace above it.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400">{s.label}</p><p className={`text-xl font-bold ${s.color}`}>{s.value}</p></CardContent></Card>)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Config */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Settings className="w-4 h-4 text-indigo-500" />Connection Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {primary ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{primary.connection_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{primary.sync_mode} · {primary.sync_frequency}</p>
                      </div>
                    </div>
                    <Badge className={`text-xs border-0 ${primary.connection_status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {primary.connection_status}
                    </Badge>
                  </div>
                  {primary.api_endpoint && <p className="text-xs text-gray-400 px-1">Endpoint: {primary.api_endpoint}</p>}
                  <Button className="w-full gap-2" onClick={() => update.mutate({ id: primary.id, connection_status: primary.connection_status === 'connected' ? 'disconnected' : 'connected' })}>
                    {primary.connection_status === 'connected' ? 'Disconnect' : 'Reconnect to Sage'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input placeholder="Connection name" value={configForm.connection_name} onChange={e => setConfigForm({ ...configForm, connection_name: e.target.value })} />
                  <Input placeholder="Sage API Endpoint (optional)" value={configForm.api_endpoint} onChange={e => setConfigForm({ ...configForm, api_endpoint: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={configForm.sync_mode} onValueChange={v => setConfigForm({ ...configForm, sync_mode: v })}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Sync Mode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="csv_import">CSV Import</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={configForm.sync_frequency} onValueChange={v => setConfigForm({ ...configForm, sync_frequency: v })}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full gap-2" onClick={() => create.mutate({ ...configForm, connection_status: 'connected', sync_status: 'idle' })}>
                    <Link2 className="w-4 h-4" />Save & Connect
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Modules */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Database className="w-4 h-4 text-indigo-500" />Sync Modules</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {SYNC_MODULES.map(mod => {
                const Icon = MODULE_ICONS[mod] || Database;
                const isSyncing = syncing === mod;
                return (
                  <div key={mod} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                    <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">{MODULE_LABELS[mod]}</p>
                      <p className="text-xs text-gray-400">Reads from Sage · displayed in Phakathi Flow</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 flex-shrink-0"
                      disabled={isSyncing || !primary}
                      onClick={() => simulateSync(mod)}>
                      {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Sync
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent Leave (Sage data displayed) */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />Leave Status (from Sage)
              <Badge className="text-xs border-0 bg-blue-100 text-blue-700 ml-auto">Sage Source</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaveRequests.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No leave requests. Sage leave data will appear here.</p>
            ) : (
              <div className="space-y-2">
                {leaveRequests.slice(0, 8).map(lr => (
                  <div key={lr.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-indigo-700">{(lr.employee_name || 'E').charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{lr.employee_name || lr.employee_email}</p>
                      <p className="text-xs text-gray-400">{lr.leave_type} · {lr.start_date} → {lr.end_date}</p>
                    </div>
                    <Badge className={`text-xs border-0 ${lr.status === 'approved' ? 'bg-green-100 text-green-700' : lr.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {lr.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}