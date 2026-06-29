import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Heart, Cake, Award, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import BirthdayWall from '../components/culture/BirthdayWall';
import RecognitionFeed from '../components/culture/RecognitionFeed';
import KudosDialog from '../components/culture/KudosDialog';

const TABS = [
  { key: 'recognition', label: 'Recognition Feed', icon: Award },
  { key: 'birthdays', label: 'Birthday Wall', icon: Cake },
];

export default function CultureHub() {
  const [tab, setTab] = useState('recognition');
  const [showKudos, setShowKudos] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me() });
  const { data: recognitions = [] } = useQuery({
    queryKey: ['recognitions-count'],
    queryFn: () => api.entities.Recognition.list(),
  });

  const kudosSentThisWeek = recognitions.filter(r => {
    if (!r.created_date) return false;
    const daysDiff = (Date.now() - new Date(r.created_date).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Culture Hub</h1>
            <p className="text-sm text-gray-500">Recognition, birthdays and team appreciation</p>
          </div>
        </div>
        <Button onClick={() => setShowKudos(true)} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-none">
          <Plus className="w-4 h-4 mr-1" /> Send Kudos
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-pink-700">{recognitions.length}</p>
          <p className="text-xs text-pink-600 mt-0.5">Total Kudos</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{kudosSentThisWeek}</p>
          <p className="text-xs text-purple-600 mt-0.5">Kudos This Week</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">
            {[...new Set(recognitions.map(r => r.recipient_email))].length}
          </p>
          <p className="text-xs text-blue-600 mt-0.5">Staff Recognised</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'recognition' && <RecognitionFeed userEmail={user?.email} />}
      {tab === 'birthdays' && <BirthdayWall />}

      <KudosDialog open={showKudos} onClose={() => setShowKudos(false)} user={user} />
    </div>
  );
}