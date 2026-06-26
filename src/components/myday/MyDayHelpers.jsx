import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-500 border-gray-200',
};

export const STATUS_DOT = { online: 'bg-emerald-400', busy: 'bg-red-400', away: 'bg-amber-400', offline: 'bg-gray-300' };

export const BADGE_EMOJI = {
  star_performer: '⭐', team_player: '🤝', innovator: '💡', above_and_beyond: '🚀',
  leadership: '👑', mentor: '🎓', problem_solver: '🛠️', customer_first: '🌟'
};

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35, ease: 'easeOut' }
});

export function StatPill({ value, label, color = 'bg-white/15 text-white' }) {
  return (
    <div className={`${color} rounded-2xl px-4 py-3 text-center min-w-[72px]`}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs mt-1 opacity-70">{label}</p>
    </div>
  );
}

export function SectionHeader({ icon: Icon, iconColor, title, badge, linkTo, linkLabel }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        {badge != null && <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">{badge}</Badge>}
      </div>
      {linkTo && (
        <Link to={linkTo}>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-400 hover:text-gray-700 gap-1">
            {linkLabel || 'View all'} <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      )}
    </div>
  );
}