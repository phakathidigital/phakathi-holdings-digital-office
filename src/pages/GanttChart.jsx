import { useState, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GitBranch, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { addDays, format, differenceInDays, parseISO, startOfDay, isValid } from 'date-fns';
import GanttBar from '../components/gantt/GanttBar';
import GanttDependencyLines from '../components/gantt/GanttDependencyLines';

const ROW_HEIGHT = 44;
const LABEL_WIDTH = 200;
const MIN_DAY_WIDTH = 18;
const HEADER_HEIGHT = 48;

function resolveTaskDates(task, today) {
  let endDate = task.due_date && isValid(parseISO(task.due_date)) ? parseISO(task.due_date) : addDays(today, 3);
  const durationDays = task.estimated_hours ? Math.max(1, Math.ceil(task.estimated_hours / 8)) : 1;
  let startDate = addDays(endDate, -durationDays);
  return {
    ...task,
    _startDate: format(startDate, 'yyyy-MM-dd'),
    _endDate: format(endDate, 'yyyy-MM-dd'),
    _durationDays: durationDays,
  };
}

const STATUS_BADGE = {
  todo: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
};

export default function GanttChart() {
  const [selectedProject, setSelectedProject] = useState('all');
  const [dayWidth, setDayWidth] = useState(32);
  const [viewStart, setViewStart] = useState(() => addDays(new Date(), -7));
  const [selectedTask, setSelectedTask] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const svgRef = useRef(null);
  const queryClient = useQueryClient();
  const today = startOfDay(new Date());

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: rawTasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list('-created_date', 200) });

  const updateTask = useMutation({
    mutationFn: ({ id, ...data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('Failed to save changes'),
  });

  // Merge pending local changes for live preview
  const tasks = useMemo(() => {
    const filtered = selectedProject === 'all' ? rawTasks : rawTasks.filter(t => t.project_id === selectedProject);
    return filtered.map(t => {
      const merged = { ...t, ...(pendingChanges[t.id] || {}) };
      return resolveTaskDates(merged, today);
    });
  }, [rawTasks, selectedProject, pendingChanges, today]);

  const viewDays = Math.max(30, Math.ceil((window.innerWidth - LABEL_WIDTH) / dayWidth) + 10);
  const viewEnd = addDays(viewStart, viewDays);

  const getX = useCallback((dateStr) => {
    const d = dateStr ? parseISO(dateStr) : today;
    return differenceInDays(d, viewStart) * dayWidth;
  }, [viewStart, dayWidth]);

  const totalSvgWidth = viewDays * dayWidth;
  const totalSvgHeight = HEADER_HEIGHT + tasks.length * ROW_HEIGHT + 20;

  // Build day/week columns
  const dayHeaders = [];
  const weekLines = [];
  let cur = new Date(viewStart);
  while (cur <= viewEnd) {
    const x = differenceInDays(cur, viewStart) * dayWidth;
    const isToday = format(cur, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    const isMonday = cur.getDay() === 1;
    if (isMonday) {
      weekLines.push({ x, label: format(cur, 'MMM d') });
    }
    if (dayWidth >= 24) {
      dayHeaders.push({ x, label: format(cur, 'd'), isToday, isMonday });
    }
    cur = addDays(cur, 1);
  }

  const handleShift = useCallback((taskId, deltaDays) => {
    if (deltaDays === 0) return;
    setPendingChanges(prev => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return prev;
      const newEnd = addDays(parseISO(task._endDate), deltaDays);
      return { ...prev, [taskId]: { due_date: format(newEnd, 'yyyy-MM-dd') } };
    });
  }, [tasks]);

  const handleResize = useCallback((taskId, newDurationDays) => {
    setPendingChanges(prev => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return prev;
      const newHours = newDurationDays * 8;
      return { ...prev, [taskId]: { estimated_hours: newHours } };
    });
  }, [tasks]);

  const handleSaveAll = () => {
    const entries = Object.entries(pendingChanges);
    if (entries.length === 0) { toast('No changes to save'); return; }
    entries.forEach(([id, data]) => updateTask.mutate({ id, ...data }));
    setPendingChanges({});
    toast.success(`Saved ${entries.length} task update${entries.length > 1 ? 's' : ''} to Kanban`);
  };

  const handleDiscard = () => { setPendingChanges({}); toast('Changes discarded'); };

  const pendingCount = Object.keys(pendingChanges).length;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg"><GitBranch className="w-4 h-4 text-white" /></div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-none">Gantt Timeline</h1>
            <p className="text-xs text-gray-500">Drag bars to reschedule · Drag right edge to resize</p>
          </div>
        </div>

        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="All Projects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setViewStart(s => addDays(s, -7))}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" className="h-8 text-xs px-3" onClick={() => setViewStart(addDays(today, -7))}>Today</Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setViewStart(s => addDays(s, 7))}><ChevronRight className="w-4 h-4" /></Button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDayWidth(w => Math.min(60, w + 6))}><ZoomIn className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDayWidth(w => Math.max(MIN_DAY_WIDTH, w - 6))}><ZoomOut className="w-4 h-4" /></Button>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">{pendingCount} unsaved</Badge>
            <Button size="sm" className="h-7 text-xs" onClick={handleSaveAll}>
              <RefreshCw className="w-3 h-3 mr-1" /> Sync to Kanban
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500" onClick={handleDiscard}>Discard</Button>
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Task labels column */}
        <div className="flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto" style={{ width: LABEL_WIDTH }}>
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide h-12 flex items-center">
            Task
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            tasks.map((task, i) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                className={`flex items-center px-3 gap-2 cursor-pointer transition-colors ${selectedTask?.id === task.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                style={{ height: ROW_HEIGHT, borderBottom: '1px solid #f3f4f6' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{task.title}</p>
                  <Badge className={`text-xs border-0 mt-0.5 ${STATUS_BADGE[task.status] || 'bg-gray-100 text-gray-500'}`}>{task.status?.replace('_', ' ')}</Badge>
                </div>
              </div>
            ))
          )}
        </div>

        {/* SVG Gantt */}
        <div className="flex-1 overflow-auto">
          {!isLoading && tasks.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <GitBranch className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tasks found. Create tasks on the Kanban board first.</p>
              </div>
            </div>
          ) : (
            <svg ref={svgRef} width={totalSvgWidth} height={totalSvgHeight} style={{ display: 'block' }}>
              {/* Week column backgrounds */}
              {weekLines.map((wl, i) => (
                <rect key={i} x={wl.x} y={0} width={dayWidth * 7} height={totalSvgHeight}
                  fill={i % 2 === 0 ? '#fafafa' : '#ffffff'} />
              ))}

              {/* Today highlight */}
              <rect x={getX(format(today, 'yyyy-MM-dd'))} y={0} width={dayWidth} height={totalSvgHeight}
                fill="#eff6ff" />

              {/* Row stripes */}
              {tasks.map((_, i) => (
                <rect key={i} x={0} y={HEADER_HEIGHT + i * ROW_HEIGHT} width={totalSvgWidth} height={ROW_HEIGHT}
                  fill={i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'}
                  stroke="#f3f4f6" strokeWidth={1} />
              ))}

              {/* Header background */}
              <rect x={0} y={0} width={totalSvgWidth} height={HEADER_HEIGHT} fill="#f9fafb" />

              {/* Week labels */}
              {weekLines.map((wl, i) => (
                <g key={i}>
                  <line x1={wl.x} y1={0} x2={wl.x} y2={totalSvgHeight} stroke="#e5e7eb" strokeWidth={1} />
                  <text x={wl.x + 4} y={16} fontSize={11} fill="#6b7280" fontWeight="600">{wl.label}</text>
                </g>
              ))}

              {/* Day labels */}
              {dayHeaders.map((dh, i) => (
                <g key={i}>
                  <text x={dh.x + dayWidth / 2} y={HEADER_HEIGHT - 6} fontSize={10}
                    fill={dh.isToday ? '#3b82f6' : '#9ca3af'}
                    textAnchor="middle" fontWeight={dh.isToday ? '700' : '400'}>
                    {dh.label}
                  </text>
                  {dh.isToday && (
                    <rect x={dh.x} y={HEADER_HEIGHT - 18} width={dayWidth} height={14} rx={3} fill="#dbeafe" />
                  )}
                </g>
              ))}

              {/* Today line */}
              <line x1={getX(format(today, 'yyyy-MM-dd')) + dayWidth / 2} y1={HEADER_HEIGHT}
                x2={getX(format(today, 'yyyy-MM-dd')) + dayWidth / 2} y2={totalSvgHeight}
                stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 3" />

              {/* Dependency lines */}
              <GanttDependencyLines
                tasks={tasks} rowHeight={ROW_HEIGHT}
                dayWidth={dayWidth} startDate={viewStart} headerHeight={HEADER_HEIGHT}
              />

              {/* Task bars */}
              {tasks.map((task, i) => {
                const x = getX(task._startDate);
                const w = Math.max(dayWidth * 0.5, task._durationDays * dayWidth);
                const y = HEADER_HEIGHT + i * ROW_HEIGHT;
                return (
                  <GanttBar
                    key={task.id} task={task}
                    x={x} width={w} y={y} height={ROW_HEIGHT}
                    dayWidth={dayWidth}
                    onShift={handleShift}
                    onResize={handleResize}
                    onSelect={setSelectedTask}
                    isSelected={selectedTask?.id === task.id}
                  />
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Selected task detail panel */}
      {selectedTask && (
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-4 text-xs text-gray-600">
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-800">{selectedTask.title}</span>
          <span>Start: {tasks.find(t => t.id === selectedTask.id)?._startDate}</span>
          <span>End: {tasks.find(t => t.id === selectedTask.id)?._endDate}</span>
          <span>Duration: {tasks.find(t => t.id === selectedTask.id)?._durationDays}d</span>
          {selectedTask.assigned_to && <span>Assigned: {selectedTask.assigned_to}</span>}
          {pendingChanges[selectedTask.id] && (
            <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">Modified — unsaved</Badge>
          )}
          <button onClick={() => setSelectedTask(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}
    </div>
  );
}