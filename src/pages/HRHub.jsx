import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Megaphone, FileText, Calendar, BookOpen, Plus, Pin, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const CATEGORIES = ['All', 'Policy', 'Event', 'Training', 'Compliance', 'Benefit', 'General'];

const CATEGORY_COLORS = {
  Policy: 'bg-blue-100 text-blue-700',
  Event: 'bg-purple-100 text-purple-700',
  Training: 'bg-green-100 text-green-700',
  Compliance: 'bg-red-100 text-red-700',
  Benefit: 'bg-yellow-100 text-yellow-700',
  General: 'bg-gray-100 text-gray-700',
};

export default function HRHub() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements-hrhub'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 50),
  });
  const { data: documents = [] } = useQuery({
    queryKey: ['hr-policies'],
    queryFn: () => base44.entities.HRDocument.filter({ category: 'Policy Handbook', status: 'approved' }),
  });
  const { data: events = [] } = useQuery({
    queryKey: ['hr-events'],
    queryFn: () => base44.entities.MeetingNote.list('-meeting_date', 10),
  });

  let filtered = announcements.filter(a =>
    (category === 'All' || a.category === category) &&
    (a.title?.toLowerCase().includes(search.toLowerCase()) || a.content?.toLowerCase().includes(search.toLowerCase()))
  );

  const pinned = filtered.filter(a => a.is_pinned);
  const regular = filtered.filter(a => !a.is_pinned);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">HR Communications Hub</h1>
            <p className="text-sm text-gray-500">Policies, announcements, events and HR notices</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Notices', value: announcements.filter(a => a.is_pinned).length, icon: Megaphone, color: 'text-blue-600 bg-blue-50' },
          { label: 'Policy Documents', value: documents.length, icon: FileText, color: 'text-green-600 bg-green-50' },
          { label: 'Upcoming Events', value: events.length, icon: Calendar, color: 'text-purple-600 bg-purple-50' },
          { label: 'Total Notices', value: announcements.length, icon: BookOpen, color: 'text-gray-600 bg-gray-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="w-4 h-4" /></div>
            <div><p className="text-xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcements Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input className="pl-9" placeholder="Search HR notices..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${category === c ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {c}
              </button>
            ))}
          </div>

          {pinned.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Pin className="w-3 h-3" /> Pinned
              </p>
              {pinned.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="p-4 bg-blue-50 border border-blue-100 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Pin className="w-3 h-3 text-blue-500" />
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[a.category] || CATEGORY_COLORS.General}`}>{a.category}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-3">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-2">{a.created_date ? format(new Date(a.created_date), 'MMM d, yyyy') : ''}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {isLoading && Array.from({length: 4}).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            {!isLoading && regular.length === 0 && pinned.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No HR notices found</p>
              </div>
            )}
            {regular.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <Megaphone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[a.category] || CATEGORY_COLORS.General}`}>{a.category}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{a.created_date ? format(new Date(a.created_date), 'MMM d, yyyy') : ''}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Policy Documents */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" /> Policy Documents
            </h3>
            {documents.length === 0 ? (
              <p className="text-xs text-gray-400">No approved policies found</p>
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 6).map(d => (
                  <div key={d.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg">
                    <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 flex-1 truncate">{d.title}</span>
                    {d.file_url && (
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Events */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" /> Recent Meetings
            </h3>
            {events.length === 0 ? (
              <p className="text-xs text-gray-400">No recent meetings</p>
            ) : (
              <div className="space-y-2">
                {events.slice(0, 5).map(e => (
                  <div key={e.id} className="p-2 hover:bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-800 truncate">{e.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{e.meeting_date ? format(new Date(e.meeting_date), 'MMM d, yyyy') : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}