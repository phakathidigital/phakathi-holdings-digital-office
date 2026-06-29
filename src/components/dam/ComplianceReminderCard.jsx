import { AlertTriangle, Clock, FileX, Tag, CheckCircle, X } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

const ISSUE_CONFIG = {
  pending_review: { icon: Clock, label: 'Pending Review', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  expiring: { icon: AlertTriangle, label: 'Expiring Soon', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  expired: { icon: FileX, label: 'Expired', color: 'text-red-600 bg-red-50 border-red-200' },
  missing_tags: { icon: Tag, label: 'Missing Tags', color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

export default function ComplianceReminderCard({ document, issueType }) {
  const qc = useQueryClient();
  const config = ISSUE_CONFIG[issueType] || ISSUE_CONFIG.pending_review;
  const Icon = config.icon;

  const approve = useMutation({
    mutationFn: () => api.entities.HRDocument.update(document.id, { status: 'approved', approved_date: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr-docs-health'] }),
  });

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${config.color}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{document.title}</p>
        <p className="text-xs mt-0.5 opacity-80">
          {issueType === 'expiring' && document.expiry_date &&
            `Expires in ${differenceInDays(parseISO(document.expiry_date), new Date())} days — ${format(parseISO(document.expiry_date), 'MMM d, yyyy')}`}
          {issueType === 'expired' && document.expiry_date &&
            `Expired ${Math.abs(differenceInDays(parseISO(document.expiry_date), new Date()))} days ago`}
          {issueType === 'pending_review' && 'Awaiting review and approval'}
          {issueType === 'missing_tags' && 'No tags assigned — hard to find'}
        </p>
      </div>
      {issueType === 'pending_review' && (
        <button onClick={() => approve.mutate()} className="text-xs bg-white border border-current px-2 py-0.5 rounded-full hover:bg-opacity-80 flex-shrink-0">
          Approve
        </button>
      )}
    </div>
  );
}