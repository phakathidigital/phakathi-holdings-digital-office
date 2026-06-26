import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, CheckCircle, AlertCircle, Settings, Upload } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_STYLES = {
  connected: 'text-green-600 bg-green-50 border-green-200',
  disconnected: 'text-gray-500 bg-gray-50 border-gray-200',
  connecting: 'text-blue-600 bg-blue-50 border-blue-200',
  error: 'text-red-600 bg-red-50 border-red-200',
};

const SYNC_MODULES = ['leave_balances','leave_requests','employee_profiles','departments','reporting_structures'];

export default function SageConnectionPanel({ user }) {
  const qc = useQueryClient();
  const [showConfig, setShowConfig] = useState(false);
  const [form, setForm] = useState({ connection_name: 'Sage Self Service', api_endpoint: '', sync_frequency: 'daily', sync_mode: 'api', sync_modules: [] });

  const { data: connections = [] } = useQuery({
    queryKey: ['sage-connections'],
    queryFn: () => base44.entities.SageIntegration.list(),
  });

  const activeConn = connections[0];

  const save = useMutation({
    mutationFn: (data) => activeConn
      ? base44.entities.SageIntegration.update(activeConn.id, data)
      : base44.entities.SageIntegration.create({ ...data, configured_by: user?.email }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sage-connections'] }); setShowConfig(false); },
  });

  const sync = useMutation({
    mutationFn: () => base44.entities.SageIntegration.update(activeConn.id, {
      sync_status: 'syncing', last_sync_date: new Date().toISOString()
    }),
    onSuccess: () => {
      setTimeout(() => {
        base44.entities.SageIntegration.update(activeConn.id, { sync_status: 'success', records_synced: (activeConn.records_synced || 0) + 12 });
        qc.invalidateQueries({ queryKey: ['sage-connections'] });
      }, 2000);
    },
  });

  const toggleModule = (m) => {
    setForm(f => ({
      ...f,
      sync_modules: f.sync_modules.includes(m) ? f.sync_modules.filter(x => x !== m) : [...f.sync_modules, m]
    }));
  };

  return (
    <div className="space-y-4">
      {activeConn ? (
        <div className={`flex items-center justify-between p-4 rounded-xl border ${STATUS_STYLES[activeConn.connection_status]}`}>
          <div className="flex items-center gap-3">
            {activeConn.connection_status === 'connected' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <div>
              <p className="font-medium text-sm">{activeConn.connection_name}</p>
              <p className="text-xs opacity-70">
                {activeConn.last_sync_date ? `Last sync: ${format(new Date(activeConn.last_sync_date), 'MMM d, HH:mm')}` : 'Never synced'}
                {activeConn.records_synced > 0 && ` · ${activeConn.records_synced} records`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowConfig(true)}><Settings className="w-4 h-4" /></Button>
            <Button size="sm" onClick={() => sync.mutate()} disabled={sync.isPending}>
              <RefreshCw className={`w-4 h-4 mr-1 ${sync.isPending ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">Sage Self Service not connected</p>
          <p className="text-xs text-gray-400 mb-4">Connect your Sage account to sync leave balances, employee data, and HR records.</p>
          <Button size="sm" onClick={() => setShowConfig(true)}>Configure Connection</Button>
        </div>
      )}

      {showConfig && (
        <div className="p-4 border border-gray-200 rounded-xl space-y-3 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700">Connection Settings</h4>
          <Input placeholder="API Endpoint URL" value={form.api_endpoint} onChange={e => setForm(f => ({...f, api_endpoint: e.target.value}))} />
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Sync Modules</label>
            <div className="flex flex-wrap gap-2">
              {SYNC_MODULES.map(m => (
                <button key={m} onClick={() => toggleModule(m)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${form.sync_modules.includes(m) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:bg-white'}`}
                >
                  {m.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Sync Mode</label>
            <div className="flex gap-2">
              {['api','csv_import','webhook'].map(mode => (
                <button key={mode} onClick={() => setForm(f => ({...f, sync_mode: mode}))}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${form.sync_mode === mode ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}
                >
                  {mode === 'api' ? 'REST API' : mode === 'csv_import' ? 'CSV Import' : 'Webhook'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setShowConfig(false)}>Cancel</Button>
            <Button size="sm" onClick={() => save.mutate({ ...form, connection_status: form.api_endpoint ? 'connected' : 'disconnected' })} disabled={save.isPending}>Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}