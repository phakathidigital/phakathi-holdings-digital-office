import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TimeLogDialog({ open, onClose, task, user }) {
  const queryClient = useQueryClient();
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);

  const createLog = useMutation({
    mutationFn: (data) => api.entities.TimeLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timelogs'] });
      toast.success(`${hours}h logged for "${task?.title}"`);
      setHours(''); setDescription('');
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hours || isNaN(parseFloat(hours)) || parseFloat(hours) <= 0) {
      toast.error('Enter a valid number of hours');
      return;
    }
    createLog.mutate({
      task_id: task.id,
      task_title: task.title,
      project_id: task.project_id || '',
      employee_email: user?.email || '',
      employee_name: user?.full_name || '',
      hours: parseFloat(hours),
      log_date: date,
      description,
      billable,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-blue-600" /> Log Time
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-500 -mt-2 mb-2 line-clamp-1">
          Task: <span className="font-medium text-gray-700">{task?.title}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Hours *</Label>
              <Input type="number" step="0.25" min="0.25" max="24" placeholder="e.g. 2.5"
                value={hours} onChange={e => setHours(e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Date *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Notes</Label>
            <Textarea placeholder="What did you work on?" rows={2}
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Billable</Label>
            <Switch checked={billable} onCheckedChange={setBillable} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" className="flex-1" disabled={createLog.isPending}>
              {createLog.isPending ? 'Saving…' : 'Log Time'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}