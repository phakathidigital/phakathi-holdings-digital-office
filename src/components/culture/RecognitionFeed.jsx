import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const BADGE_CONFIG = {
  star_performer: { emoji: '⭐', label: 'Star Performer', color: 'from-yellow-400 to-orange-400' },
  team_player: { emoji: '🤝', label: 'Team Player', color: 'from-blue-400 to-cyan-400' },
  innovator: { emoji: '💡', label: 'Innovator', color: 'from-purple-400 to-pink-400' },
  above_and_beyond: { emoji: '🚀', label: 'Above & Beyond', color: 'from-green-400 to-teal-400' },
  leadership: { emoji: '👑', label: 'Leadership', color: 'from-amber-400 to-yellow-400' },
  customer_first: { emoji: '💎', label: 'Customer First', color: 'from-sky-400 to-blue-400' },
  problem_solver: { emoji: '🔧', label: 'Problem Solver', color: 'from-rose-400 to-red-400' },
  mentor: { emoji: '🎓', label: 'Mentor', color: 'from-indigo-400 to-violet-400' },
};

export default function RecognitionFeed({ userEmail, compact = false }) {
  const qc = useQueryClient();

  const { data: recognitions = [] } = useQuery({
    queryKey: ['recognitions'],
    queryFn: () => api.entities.Recognition.list('-created_date', compact ? 5 : 20),
  });

  const toggleLike = useMutation({
    mutationFn: ({ id, likes }) => api.entities.Recognition.update(id, { likes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recognitions'] }),
  });

  const handleLike = (r) => {
    const likes = r.likes || [];
    const updated = likes.includes(userEmail)
      ? likes.filter(e => e !== userEmail)
      : [...likes, userEmail];
    toggleLike.mutate({ id: r.id, likes: updated });
  };

  return (
    <div className="space-y-3">
      {recognitions.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-sm">No recognitions yet. Be the first to appreciate a colleague!</div>
      )}
      {recognitions.map((r, i) => {
        const badge = BADGE_CONFIG[r.badge_type] || BADGE_CONFIG.star_performer;
        const liked = r.likes?.includes(userEmail);
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-xl flex-shrink-0`}>
                {badge.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{r.sender_name || r.sender_email?.split('@')[0]}</span>
                  <span className="text-xs text-gray-500">recognised</span>
                  <span className="text-sm font-semibold text-gray-900">{r.recipient_name || r.recipient_email?.split('@')[0]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${badge.color} text-white font-medium`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 italic">"{r.message}"</p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => handleLike(r)}
                    className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                    {r.likes?.length || 0}
                  </button>
                  <span className="text-xs text-gray-400">
                    {r.created_date ? formatDistanceToNow(new Date(r.created_date), { addSuffix: true }) : ''}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}