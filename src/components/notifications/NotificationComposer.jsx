import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send } from 'lucide-react';

const DEPARTMENTS = ['Management','Finance','HR','IT','Operations','Empoweryst'];
const TYPES = ['general','hr_reminder','security_alert','executive_notice','it_downtime','dam_reminder','meeting_reminder'];

export default function NotificationComposer({ open, onClose, user }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '', message: '', type: 'general', priority: 'medium',
    target_departments: [], requires_acknowledgement: false,
  });

  const create = useMutation({
    mutationFn: (data) => api.entities.Notification.create({ ...data, created_by: user?.email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-bell'] });
      setForm({ title: '', message: '', type: 'general', priority: 'medium', target_departments: [], requires_acknowledgement: false });
      onClose();
    },
  });

  const toggleDept = (dept) => {
    setForm(f => ({
      ...f,
      target_departments: f.target_departments.includes(dept)
        ? f.target_departments.filter(d => d !== dept)
        : [...f.target_departments, dept],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Compose Notification</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Input placeholder="Notification title" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
            rows={3} placeholder="Message..." value={form.message}
            onChange={e => setForm(f => ({...f, message: e.target.value}))}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Type</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g,' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Priority</label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({...f, priority: v}))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['low','medium','high','critical'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Target Departments (leave empty for all)</label>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map(d => (
                <button
                  key={d} onClick={() => toggleDept(d)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${form.target_departments.includes(d) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ack" checked={form.requires_acknowledgement} onChange={e => setForm(f => ({...f, requires_acknowledgement: e.target.checked}))} />
            <label htmlFor="ack" className="text-sm text-gray-700">Require acknowledgement</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => create.mutate(form)} disabled={!form.title || !form.message || create.isPending}>
              <Send className="w-4 h-4 mr-2" /> Send Notification
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}