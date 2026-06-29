import React, { useState, useEffect, useRef } from "react";
import { api } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Plus, Send, Users, MessageCircle, Search, X, ChevronRight, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "🎉", "🔥", "👏"];

function Avatar({ name, email, size = "sm" }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : (email?.[0] || "?").toUpperCase();
  const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];
  const color = colors[(name || email || "").charCodeAt(0) % colors.length];
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "md" ? "w-9 h-9 text-sm" : "w-11 h-11 text-base";
  return <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>{initials}</div>;
}

function MessageBubble({ msg, currentUser, onReact }) {
  const isMine = msg.sender_email === currentUser?.email;
  const [showEmoji, setShowEmoji] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 group mb-1 ${isMine ? "flex-row-reverse" : ""}`}
    >
      {!isMine && <Avatar name={msg.sender_name} email={msg.sender_email} size="sm" />}
      <div className={`max-w-[70%] relative`}>
        {!isMine && <p className="text-xs text-gray-400 mb-0.5 ml-1">{msg.sender_name}</p>}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isMine
              ? "bg-gray-900 text-white rounded-br-sm"
              : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
          }`}
        >
          {msg.content}
        </div>
        {/* Reactions */}
        {msg.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {[...new Set(msg.reactions)].map(r => (
              <span key={r} onClick={() => onReact(msg.id, r)}
                className="text-xs bg-gray-100 rounded-full px-1.5 py-0.5 cursor-pointer hover:bg-gray-200 border border-gray-200">
                {r} {msg.reactions.filter(x => x === r).length}
              </span>
            ))}
          </div>
        )}
        {/* React button */}
        <div className={`absolute -top-2 ${isMine ? "left-0" : "right-0"} hidden group-hover:flex bg-white border border-gray-100 rounded-full shadow-md px-1 gap-0.5`}>
          {EMOJI_REACTIONS.map(e => (
            <button key={e} onClick={() => onReact(msg.id, e)} className="text-sm hover:scale-125 transition-transform p-0.5">{e}</button>
          ))}
        </div>
        <p className="text-xs text-gray-300 mt-0.5 px-1">
          {new Date(msg.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
}

export default function Messaging() {
  const [user, setUser] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);
  const qc = useQueryClient();

  useEffect(() => { api.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: channels = [] } = useQuery({
    queryKey: ["channels"],
    queryFn: () => api.entities.Channel.list("-created_date"),
    refetchInterval: 5000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeChannel?.id],
    queryFn: () => activeChannel
      ? api.entities.Message.filter({ channel_id: activeChannel.id }, "created_date", 200)
      : [],
    enabled: !!activeChannel,
    refetchInterval: 3000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (content) => api.entities.Message.create({
      channel_id: activeChannel.id,
      channel_name: activeChannel.name,
      channel_type: activeChannel.type,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      content,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["messages", activeChannel?.id] }); },
  });

  const reactMutation = useMutation({
    mutationFn: ({ msgId, emoji, existing }) =>
      api.entities.Message.update(msgId, { reactions: [...(existing || []), emoji] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages", activeChannel?.id] }),
  });

  const createChannelMutation = useMutation({
    mutationFn: () => api.entities.Channel.create({
      name: newChannelName.toLowerCase().replace(/\s+/g, "-"),
      description: newChannelDesc,
      type: "channel",
      members: [],
      created_by: user?.email,
    }),
    onSuccess: (ch) => {
      qc.invalidateQueries({ queryKey: ["channels"] });
      setActiveChannel(ch);
      setShowNewChannel(false);
      setNewChannelName(""); setNewChannelDesc("");
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;
    sendMutation.mutate(newMessage.trim());
    setNewMessage("");
  };

  const handleReact = (msgId, emoji) => {
    const msg = messages.find(m => m.id === msgId);
    reactMutation.mutate({ msgId, emoji, existing: msg?.reactions || [] });
  };

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const channelMessages = messages.filter(m => !m.is_deleted);

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  channelMessages.forEach(msg => {
    const d = new Date(msg.created_date).toLocaleDateString();
    if (d !== lastDate) { grouped.push({ type: "date", label: d }); lastDate = d; }
    grouped.push({ type: "msg", msg });
  });

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden" style={{ height: "calc(100vh - 0px)" }}>
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-white font-bold text-lg">Messages</h2>
          <p className="text-gray-400 text-xs">Phakathi Holdings</p>
        </div>

        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search channels..."
              className="pl-8 bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500 text-xs h-8" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Channels</span>
            <button onClick={() => setShowNewChannel(true)} className="text-gray-500 hover:text-white transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {filteredChannels.filter(c => c.type === "channel").map(ch => (
            <button key={ch.id} onClick={() => setActiveChannel(ch)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors mb-0.5 ${
                activeChannel?.id === ch.id ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}>
              <Hash className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{ch.name}</span>
            </button>
          ))}
          {filteredChannels.filter(c => c.type === "channel").length === 0 && (
            <p className="text-gray-600 text-xs px-2 py-2">No channels yet. Create one!</p>
          )}
        </div>

        {user && (
          <div className="p-3 border-t border-gray-700 flex items-center gap-2">
            <Avatar name={user.full_name} email={user.email} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.full_name || user.email}</p>
              <div className="flex items-center gap-1"><Circle className="w-2 h-2 fill-green-400 text-green-400" /><span className="text-green-400 text-xs">Active</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChannel ? (
          <>
            {/* Channel header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
              <Hash className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900">{activeChannel.name}</h3>
                {activeChannel.description && <p className="text-xs text-gray-500">{activeChannel.description}</p>}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-0.5">
              {grouped.map((item, i) =>
                item.type === "date" ? (
                  <div key={`date-${i}`} className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400 bg-gray-50 px-2">{item.label}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                ) : (
                  <MessageBubble key={item.msg.id} msg={item.msg} currentUser={user} onReact={handleReact} />
                )
              )}
              {channelMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-200 mb-3" />
                  <p className="text-gray-400 font-medium">No messages yet</p>
                  <p className="text-gray-300 text-sm">Be the first to say something in #{activeChannel.name}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="bg-white border-t border-gray-200 px-4 py-3">
              <div className="flex gap-2 items-center">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={`Message #${activeChannel.name}...`}
                  className="flex-1 bg-gray-50 border-gray-200 focus:bg-white"
                  autoComplete="off"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMutation.isPending}
                  className="bg-gray-900 hover:bg-gray-700 shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a channel</h3>
              <p className="text-gray-400 text-sm max-w-xs">Choose a channel from the sidebar or create a new one to start collaborating</p>
              <Button onClick={() => setShowNewChannel(true)} className="mt-4 gap-2 bg-gray-900 hover:bg-gray-800">
                <Plus className="w-4 h-4" /> Create Channel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Channel Dialog */}
      <AnimatePresence>
        {showNewChannel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Create Channel</h3>
                <button onClick={() => setShowNewChannel(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Channel name</label>
                  <div className="flex items-center gap-2">
                    <Hash className="text-gray-400 w-4 h-4" />
                    <Input value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
                      placeholder="e.g. general, design-team" className="flex-1" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Description (optional)</label>
                  <Input value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)} placeholder="What's this channel about?" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <Button variant="outline" onClick={() => setShowNewChannel(false)}>Cancel</Button>
                <Button onClick={() => createChannelMutation.mutate()} disabled={!newChannelName.trim() || createChannelMutation.isPending}
                  className="bg-gray-900 hover:bg-gray-800">
                  Create Channel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}