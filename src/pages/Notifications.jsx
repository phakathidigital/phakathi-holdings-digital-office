import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Plus, Filter, CheckCheck, Archive, AlertTriangle, Info, Calendar, Shield, Server, FolderOpen, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import NotificationComposer from '../components/notifications/NotificationComposer';

const TYPE_CONFIG = {
  general: { icon: Info, label: 'General', color: 'bg-gray-100 text-gray-700' },
  hr_reminder: { icon: Calendar, label: 'HR Reminder', color: 'bg-blue-100 text-blue-700' },
  security_alert: { icon: Shield, label: 'Security', color: 'bg-red-100 text-red-700' },
  executive_notice: { icon: Bell, label: 'Executive', color: 'bg-purple-100 text-purple-700' },
  it_downtime: { icon: Server, label: 'IT Alert', color: 'bg-orange-100 text-orange-700' },
  dam_reminder: { icon: FolderOpen, label: 'DAM', color: 'bg-yellow-100 text-yellow-700' },
  meeting_reminder: { icon: Calendar, label: 'Meeting', color: 'bg-teal-100 text-teal-700' },
  birthday_reminder: { icon: Gift, label: 'Birthday', color: 'bg-pink-100 text-pink-700' },
};

const PRIORITY_COLORS = {
  low: 'text-gray-500',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  critical: 'text-red-600 font-semibold',
};

const PRIORITY_BADGE = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function Notifications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showComposer, setShowComposer] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => base44.entities.Notification.list('-created_date', 100),
  });

  const markRead = useMutation({
    mutationFn: (id) => {
      const n = notifications.find(x => x.id === id);
      const already = n?.is_read_by || [];
      if (already.includes(user?.email)) return Promise.resolve();
      return base44.entities.Notification.update(id, { is_read_by: [...already, user?.email] });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => {
      const unread = notifications.filter(n => !n.is_read_by?.includes(user?.email));
      return Promise.all(unread.map(n =>
        base44.entities.Notification.update(n.id, { is_read_by: [...(n.is_read_by || []), user?.email] })
      ));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const archive = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_archived: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const acknowledge = useMutation({
    mutationFn: ({ id, acked }) => base44.entities.Notification.update(id, { acknowledged_by: [...acked, user?.email] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  let filtered = notifications.filter(n => showArchived ? n.is_archived : !n.is_archived);
  if (filter !== 'all') filtered = filtered.filter(n => n.type === filter);
  if (priorityFilter !== 'all') filtered = filtered.filter(n => n.priority === priorityFilter);

  const unreadCount = notifications.filter(n => !n.is_read_by?.includes(user?.email) && !n.is_archived).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-900 rounded-xl">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notification Centre</h1>
            <p className="text-sm text-gray-500">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="w-4 h-4 mr-1" /> Mark all read
            </Button>
          )}
          {(user?.role === 'admin') && (
            <Button size="sm" onClick={() => setShowComposer(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Notification
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilter('all')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          All
        </button>
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilter(key === filter ? 'all' : key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === key ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {['all','low','medium','high','critical'].map(p => (
          <button key={p} onClick={() => setPriorityFilter(p)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${priorityFilter === p ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
          >
            {p === 'all' ? 'All Priority' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <button onClick={() => setShowArchived(!showArchived)}
          className={`text-xs px-3 py-1 rounded-full border ml-auto transition-colors ${showArchived ? 'bg-gray-200 text-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
        >
          <Archive className="w-3 h-3 inline mr-1" />{showArchived ? 'Hide Archived' : 'Show Archived'}
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {isLoading && Array.from({length: 4}).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notifications found</p>
          </div>
        )}
        {filtered.map((n, i) => {
          const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
          const TypeIcon = cfg.icon;
          const isRead = n.is_read_by?.includes(user?.email);
          const isAcked = n.acknowledged_by?.includes(user?.email);

          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => !isRead && markRead.mutate(n.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${!isRead ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'} ${n.priority === 'critical' ? 'border-l-4 border-l-red-500' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.color}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold ${!isRead ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[n.priority]}`}>{n.priority}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">
                      {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ''}
                    </span>
                    {n.requires_acknowledgement && !isAcked && (
                      <button
                        onClick={e => { e.stopPropagation(); acknowledge.mutate({ id: n.id, acked: n.acknowledged_by || [] }); }}
                        className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full hover:bg-gray-700"
                      >
                        Acknowledge
                      </button>
                    )}
                    {isAcked && <span className="text-xs text-green-600">✓ Acknowledged</span>}
                    {!n.is_archived && (
                      <button
                        onClick={e => { e.stopPropagation(); archive.mutate(n.id); }}
                        className="text-xs text-gray-400 hover:text-gray-600 ml-auto"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
                {!isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
              </div>
            </motion.div>
          );
        })}
      </div>

      <NotificationComposer open={showComposer} onClose={() => setShowComposer(false)} user={user} />
    </div>
  );
}