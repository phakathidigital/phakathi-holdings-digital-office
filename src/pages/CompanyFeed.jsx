import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Rss, Heart, MessageCircle, Plus, ChevronDown, ChevronUp, Megaphone, Award, Users, Image, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_CFG = {
  announcement: { icon: Megaphone, cls: 'bg-orange-100 text-orange-700', label: 'Announcement' },
  recognition:  { icon: Award,     cls: 'bg-yellow-100 text-yellow-700', label: 'Recognition' },
  update:       { icon: Rss,       cls: 'bg-blue-100 text-blue-700',     label: 'Update' },
  milestone:    { icon: Users,     cls: 'bg-green-100 text-green-700',   label: 'Milestone' },
};

export default function CompanyFeed() {
  const [user, setUser] = useState(null);
  const [compose, setCompose] = useState(false);
  const [postText, setPostText] = useState('');
  const [postType, setPostType] = useState('update');
  const [filterType, setFilterType] = useState('all');
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['company_feed'],
    queryFn: () => base44.entities.CompanyFeedPost.list('-created_date', 50),
  });
  const { data: recognitions = [] } = useQuery({ queryKey: ['recognitions'], queryFn: () => base44.entities.Recognition.list('-created_date', 10) });

  const create = useMutation({
    mutationFn: d => base44.entities.CompanyFeedPost.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company_feed'] }); setPostText(''); setCompose(false); toast.success('Posted!'); },
  });
  const like = useMutation({
    mutationFn: ({ id, likes }) => base44.entities.CompanyFeedPost.update(id, { likes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company_feed'] }),
  });

  const handleLike = (post) => {
    const already = post.likes?.includes(user?.email);
    const updated = already ? (post.likes || []).filter(e => e !== user?.email) : [...(post.likes || []), user?.email];
    like.mutate({ id: post.id, likes: updated });
  };

  const allItems = [
    ...posts.map(p => ({ ...p, _source: 'post', _date: p.created_date })),
    ...recognitions.map(r => ({ ...r, _source: 'recognition', _date: r.created_date,
      post_type: 'recognition', author_name: r.sender_name,
      content: `${r.sender_name} recognised ${r.recipient_name} — "${r.message}"`,
    })),
  ].sort((a, b) => new Date(b._date) - new Date(a._date));

  const filtered = filterType === 'all' ? allItems : allItems.filter(p => p.post_type === filterType);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-5">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Rss className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Company Feed</h1>
              <p className="text-sm text-gray-500">Updates, recognitions & announcements</p>
            </div>
          </div>
          <Button onClick={() => setCompose(c => !c)} className="gap-2">
            {compose ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            Post
          </Button>
        </div>

        <AnimatePresence>
          {compose && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-700">{user?.full_name?.charAt(0) || '?'}</span>
                    </div>
                    <Select value={postType} onValueChange={setPostType}>
                      <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder={`Share an ${postType} with the company…`}
                    value={postText}
                    onChange={e => setPostText(e.target.value)}
                    className="min-h-20 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCompose(false)}>Cancel</Button>
                    <Button size="sm" disabled={!postText.trim() || create.isPending}
                      onClick={() => create.mutate({ content: postText, post_type: postType, author_name: user?.full_name || user?.email, author_email: user?.email, likes: [], comments: [] })}>
                      {create.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 flex-wrap">
          {['all', ...Object.keys(TYPE_CFG)].map(t => (
            <Button key={t} variant={filterType === t ? 'default' : 'outline'} size="sm"
              className="h-7 text-xs" onClick={() => setFilterType(t)}>
              {t === 'all' ? 'All' : TYPE_CFG[t]?.label || t}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center">
            <Rss className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nothing in the feed yet. Be the first to post!</p>
          </CardContent></Card>
        ) : filtered.map((post, i) => {
          const typeCfg = TYPE_CFG[post.post_type] || TYPE_CFG.update;
          const TypeIcon = typeCfg.icon;
          const liked = post.likes?.includes(user?.email);
          return (
            <motion.div key={`${post._source}-${post.id}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-600">{(post.author_name || post.sender_name || '?').charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{post.author_name || post.sender_name}</span>
                        <Badge className={`text-xs border-0 ${typeCfg.cls}`}>
                          <TypeIcon className="w-3 h-3 mr-1" />{typeCfg.label}
                        </Badge>
                        <span className="text-xs text-gray-400 ml-auto">
                          {post._date ? formatDistanceToNow(new Date(post._date), { addSuffix: true }) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1.5 leading-relaxed whitespace-pre-line">{post.content}</p>
                      {post._source === 'post' && (
                        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-50">
                          <button
                            onClick={() => user && handleLike(post)}
                            className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
                            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500' : ''}`} />
                            {post.likes?.length || 0}
                          </button>
                          <span className="flex items-center gap-1.5 text-xs text-gray-300">
                            <MessageCircle className="w-4 h-4" />{post.comments?.length || 0}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}