export default function GanttDependencyLines({ tasks, rowHeight, dayWidth, startDate, headerHeight }) {
  const getX = (dateStr) => {
    if (!dateStr) return null;
    const diff = (new Date(dateStr) - startDate) / (1000 * 60 * 60 * 24);
    return diff * dayWidth;
  };

  const lines = [];
  tasks.forEach((task, toIdx) => {
    (task.blocked_by || []).forEach((fromId) => {
      const fromIdx = tasks.findIndex((t) => t.id === fromId);
      if (fromIdx === -1) return;
      const fromTask = tasks[fromIdx];
      const x1 = getX(fromTask._endDate);
      const y1 = headerHeight + fromIdx * rowHeight + rowHeight / 2;
      const x2 = getX(task._startDate);
      const y2 = headerHeight + toIdx * rowHeight + rowHeight / 2;
      if (x1 == null || x2 == null) return;
      const mx = x1 + (x2 - x1) / 2;
      lines.push(
        <g key={`${fromId}-${task.id}`}>
          <path
            d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
            fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7}
          />
          <polygon
            points={`${x2},${y2} ${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4}`}
            fill="#f59e0b" opacity={0.8}
          />
        </g>
      );
    });
  });

  return <g>{lines}</g>;
}