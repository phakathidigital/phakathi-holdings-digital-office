import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

const BADGES = [
  { key: 'star_performer', emoji: '⭐', label: 'Star Performer' },
  { key: 'team_player', emoji: '🤝', label: 'Team Player' },
  { key: 'innovator', emoji: '💡', label: 'Innovator' },
  { key: 'above_and_beyond', emoji: '🚀', label: 'Above & Beyond' },
  { key: 'leadership', emoji: '👑', label: 'Leadership' },
  { key: 'customer_first', emoji: '💎', label: 'Customer First' },
  { key: 'problem_solver', emoji: '🔧', label: 'Problem Solver' },
  { key: 'mentor', emoji: '🎓', label: 'Mentor' },
];

export default function KudosDialog({ open, onClose, user }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ recipient_email: '', message: '', badge_type: 'star_performer' });

  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.entities.User.list(),
  });

  const send = useMutation({
    mutationFn: () => api.entities.Recognition.create({
      ...form,
      sender_email: user?.email,
      sender_name: user?.full_name || user?.email,
      recipient_name: users.find(u => u.email === form.recipient_email)?.full_name || form.recipient_email,
      is_public: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recognitions'] });
      setForm({ recipient_email: '', message: '', badge_type: 'star_performer' });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Kudos 🎉</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Recognise a colleague</label>
            <select
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={form.recipient_email}
              onChange={e => setForm(f => ({...f, recipient_email: e.target.value}))}
            >
              <option value="">Select colleague...</option>
              {users.filter(u => u.email !== user?.email).map(u => (
                <option key={u.id} value={u.email}>{u.full_name || u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Choose a badge</label>
            <div className="grid grid-cols-4 gap-2">
              {BADGES.map(b => (
                <button
                  key={b.key} onClick={() => setForm(f => ({...f, badge_type: b.key}))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs ${form.badge_type === b.key ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                >
                  <span className="text-xl">{b.emoji}</span>
                  <span className="leading-tight text-center">{b.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Personal message</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
              rows={3} placeholder="Why are you recognising them?"
              value={form.message}
              onChange={e => setForm(f => ({...f, message: e.target.value}))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => send.mutate()} disabled={!form.recipient_email || !form.message || send.isPending}>
              <Send className="w-4 h-4 mr-2" /> Send Kudos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}