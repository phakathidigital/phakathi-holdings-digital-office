import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, AlertTriangle, FileX, Clock } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function DAMHealthWidget() {
  const { data: documents = [] } = useQuery({
    queryKey: ['hr-docs-health'],
    queryFn: () => base44.entities.HRDocument.list(),
  });

  const today = new Date();
  const pending = documents.filter(d => d.status === 'pending_review');
  const expiring = documents.filter(d => {
    if (!d.expiry_date) return false;
    const days = differenceInDays(parseISO(d.expiry_date), today);
    return days >= 0 && days <= 30;
  });
  const expired = documents.filter(d => {
    if (!d.expiry_date) return false;
    return differenceInDays(parseISO(d.expiry_date), today) < 0;
  });
  const noTags = documents.filter(d => !d.tags || d.tags.length === 0);
  const total = documents.length;
  const healthy = total - pending.length - expired.length - noTags.length;
  const score = total > 0 ? Math.max(0, Math.round((healthy / total) * 100)) : 100;

  const stats = [
    { label: 'Pending Review', value: pending.length, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Expiring (30 days)', value: expiring.length, icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Expired', value: expired.length, icon: FileX, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Missing Tags', value: noTags.length, icon: ShieldCheck, color: 'text-gray-500', bg: 'bg-gray-50' },
  ];

  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg = score >= 80 ? 'from-green-400 to-teal-500' : score >= 60 ? 'from-yellow-400 to-orange-400' : 'from-red-400 to-rose-500';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">DAM Compliance Score</p>
          <p className={`text-3xl font-bold mt-1 ${scoreColor}`}>{score}%</p>
          <p className="text-xs text-gray-400 mt-0.5">{total} documents tracked</p>
        </div>
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle cx="32" cy="32" r="26" fill="none" stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
              strokeWidth="8" strokeDasharray={`${(score / 100) * 163} 163`} strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map(s => (
          <div key={s.label} className={`${s.bg} rounded-lg p-3 flex items-center gap-2`}>
            <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
            <div>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}