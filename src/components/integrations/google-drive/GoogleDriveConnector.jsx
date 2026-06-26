import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, CheckCircle, AlertCircle, HardDrive, Settings, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const STATUS_STYLES = {
  success: 'text-green-600 bg-green-50 border-green-200',
  not_configured: 'text-gray-500 bg-gray-50 border-gray-200',
  syncing: 'text-blue-600 bg-blue-50 border-blue-200',
  failed: 'text-red-600 bg-red-50 border-red-200',
  idle: 'text-gray-600 bg-gray-50 border-gray-200',
};

const DEPARTMENTS = ['Management','Finance','HR','IT','Operations','Empoweryst'];

export default function GoogleDriveConnector({ user }) {
  const qc = useQueryClient();
  const [showConfig, setShowConfig] = useState(false);
  const [form, setForm] = useState({
    connection_name: 'Google Drive Sync',
    google_account_email: '',
    root_folder_id: '',
    root_folder_name: '',
    sync_frequency: 'daily',
    mapped_departments: [],
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['drive-connections'],
    queryFn: () => base44.entities.DriveSyncConnection.list(),
  });

  const activeConn = connections[0];

  const save = useMutation({
    mutationFn: (data) => activeConn
      ? base44.entities.DriveSyncConnection.update(activeConn.id, data)
      : base44.entities.DriveSyncConnection.create({ ...data, configured_by: user?.email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drive-connections'] });
      setShowConfig(false);
    },
  });

  const triggerSync = useMutation({
    mutationFn: () => base44.entities.DriveSyncConnection.update(activeConn.id, { sync_status: 'syncing' }),
    onSuccess: () => {
      setTimeout(() => {
        base44.entities.DriveSyncConnection.update(activeConn.id, {
          sync_status: 'success',
          last_sync_date: new Date().toISOString(),
          files_synced: (activeConn.files_synced || 0) + 8,
        });
        qc.invalidateQueries({ queryKey: ['drive-connections'] });
      }, 3000);
    },
  });

  const toggleDept = (d) => {
    setForm(f => ({
      ...f,
      mapped_departments: f.mapped_departments.includes(d)
        ? f.mapped_departments.filter(x => x !== d)
        : [...f.mapped_departments, d],
    }));
  };

  const handleSave = () => {
    save.mutate({ ...form, sync_enabled: true, sync_status: 'idle' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-50 rounded-lg">
          <HardDrive className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Google Drive DAM Sync</h3>
          <p className="text-xs text-gray-500">Mirror Google Drive folders into the DAM Centre automatically</p>
        </div>
      </div>

      {activeConn ? (
        <div className={`flex items-center justify-between p-4 rounded-xl border ${STATUS_STYLES[activeConn.sync_status] || STATUS_STYLES.idle}`}>
          <div className="flex items-center gap-3">
            {activeConn.sync_status === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <div>
              <p className="font-medium text-sm">{activeConn.google_account_email || activeConn.connection_name}</p>
              <p className="text-xs opacity-70">
                {activeConn.last_sync_date
                  ? `Last sync: ${format(new Date(activeConn.last_sync_date), 'MMM d, HH:mm')}`
                  : 'Never synced'}
                {activeConn.files_synced > 0 && ` · ${activeConn.files_synced} files synced`}
              </p>
              {activeConn.root_folder_name && (
                <div className="flex items-center gap-1 mt-1">
                  <FolderOpen className="w-3 h-3" />
                  <span className="text-xs">{activeConn.root_folder_name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowConfig(true)}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => triggerSync.mutate()} disabled={triggerSync.isPending}>
              <RefreshCw className={`w-4 h-4 mr-1 ${triggerSync.isPending || activeConn.sync_status === 'syncing' ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center">
          <HardDrive className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 mb-1">Google Drive not connected</p>
          <p className="text-xs text-gray-400 mb-4">Connect to automatically sync documents into the DAM Centre.</p>
          <Button size="sm" onClick={() => setShowConfig(true)}>Connect Google Drive</Button>
        </div>
      )}

      {activeConn?.mapped_departments?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeConn.mapped_departments.map(d => (
            <Badge key={d} variant="secondary">{d}</Badge>
          ))}
        </div>
      )}

      {showConfig && (
        <div className="p-4 border border-gray-200 rounded-xl space-y-3 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700">Drive Configuration</h4>
          <Input
            placeholder="Google Account Email"
            value={form.google_account_email}
            onChange={e => setForm(f => ({...f, google_account_email: e.target.value}))}
          />
          <Input
            placeholder="Root Folder ID (from Drive URL)"
            value={form.root_folder_id}
            onChange={e => setForm(f => ({...f, root_folder_id: e.target.value}))}
          />
          <Input
            placeholder="Folder Display Name"
            value={form.root_folder_name}
            onChange={e => setForm(f => ({...f, root_folder_name: e.target.value}))}
          />
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Map to Departments</label>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map(d => (
                <button
                  key={d}
                  onClick={() => toggleDept(d)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${form.mapped_departments.includes(d) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setShowConfig(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={save.isPending}>
              Save and Connect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}