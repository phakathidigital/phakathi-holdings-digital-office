import { useRef, useState } from 'react';

const PRIORITY_COLORS = {
  low: { fill: '#d1d5db', stroke: '#9ca3af', text: '#374151' },
  medium: { fill: '#fde68a', stroke: '#f59e0b', text: '#92400e' },
  high: { fill: '#fed7aa', stroke: '#f97316', text: '#7c2d12' },
  critical: { fill: '#fecaca', stroke: '#ef4444', text: '#7f1d1d' },
};

const STATUS_OPACITY = { todo: 0.6, in_progress: 0.9, completed: 0.4, review: 0.75 };

export default function GanttBar({
  task, x, width, y, height, dayWidth,
  onShift, onResize, onSelect, isSelected,
}) {
  const dragRef = useRef(null);
  const colors = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const opacity = STATUS_OPACITY[task.status] || 0.7;
  const minWidth = dayWidth * 0.5;

  const startDrag = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = width;
    const startXPos = x;

    const onMove = (mv) => {
      const dx = mv.clientX - startX;
      const deltaDays = Math.round(dx / dayWidth);
      if (mode === 'move') onShift(task.id, deltaDays);
      else if (mode === 'resize') onResize(task.id, Math.max(1, Math.round((startW + dx) / dayWidth)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const barWidth = Math.max(minWidth, width);
  const completed = task.status === 'completed';

  return (
    <g onClick={() => onSelect(task)} style={{ cursor: 'pointer' }}>
      {/* Background track */}
      <rect x={x} y={y + 6} width={barWidth} height={height - 12}
        rx={5} fill={colors.fill} stroke={colors.stroke}
        strokeWidth={isSelected ? 2 : 1} opacity={opacity}
        onMouseDown={(e) => startDrag(e, 'move')}
        style={{ cursor: 'grab' }}
      />
      {/* Progress fill for in_progress */}
      {task.status === 'in_progress' && barWidth > 20 && (
        <rect x={x + 2} y={y + 8} width={Math.max(4, barWidth * 0.5 - 2)} height={height - 16}
          rx={3} fill={colors.stroke} opacity={0.35} style={{ pointerEvents: 'none' }} />
      )}
      {/* Completion strikethrough */}
      {completed && (
        <line x1={x + 4} y1={y + height / 2} x2={x + barWidth - 4} y2={y + height / 2}
          stroke={colors.stroke} strokeWidth={1.5} opacity={0.5} style={{ pointerEvents: 'none' }} />
      )}
      {/* Label */}
      {barWidth > 30 && (
        <text x={x + 7} y={y + height / 2 + 1} fontSize={11} fill={colors.text}
          dominantBaseline="middle" fontWeight="500"
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
          {task.title.length > Math.floor(barWidth / 7)
            ? task.title.slice(0, Math.floor(barWidth / 7) - 1) + '…'
            : task.title}
        </text>
      )}
      {/* Resize handle */}
      <rect
        x={x + barWidth - 6} y={y + 8} width={6} height={height - 16}
        rx={2} fill={colors.stroke} opacity={0.6}
        onMouseDown={(e) => startDrag(e, 'resize')}
        style={{ cursor: 'ew-resize' }}
      />
      {/* Selected ring */}
      {isSelected && (
        <rect x={x - 1} y={y + 5} width={barWidth + 2} height={height - 10}
          rx={6} fill="none" stroke="#3b82f6" strokeWidth={2}
          style={{ pointerEvents: 'none' }} />
      )}
    </g>
  );
}