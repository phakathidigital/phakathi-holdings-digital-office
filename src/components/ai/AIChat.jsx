import React, { useState, useRef, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AIChat({ user, tasks, projects }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant for Phakathi Holdings. I can help you manage your tasks, prioritize your work, analyze projects, and provide insights. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const context = {
        user_name: user?.full_name || user?.email,
        user_role: user?.role,
        total_tasks: tasks.length,
        pending_tasks: tasks.filter(t => t.status !== 'completed').length,
        overdue_tasks: tasks.filter(t => {
          if (!t.due_date) return false;
          return new Date(t.due_date) < new Date() && t.status !== 'completed';
        }).length,
        total_projects: projects.length,
        active_projects: projects.filter(p => p.status === 'in_progress').length,
      };

      const prompt = `You are an AI assistant for Phakathi Holdings project management system. 

Current user context:
- Name: ${context.user_name}
- Role: ${context.user_role}
- Total Tasks: ${context.total_tasks}
- Pending Tasks: ${context.pending_tasks}
- Overdue Tasks: ${context.overdue_tasks}
- Total Projects: ${context.total_projects}
- Active Projects: ${context.active_projects}

User's question: ${userMessage}

Provide helpful, concise, and actionable advice. If the user asks about their tasks or projects, refer to the context above. Be friendly and professional.`;

      const response = await api.integrations.Core.InvokeLLM({
        prompt: prompt,
      });

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "I apologize, but I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "What should I prioritize today?",
    "Analyze my project workload",
    "Show me overdue tasks",
    "Suggest improvements",
  ];

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            AI Chat Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages */}
          <ScrollArea className="h-[500px] p-6" ref={scrollRef}>
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-br from-gray-400 to-gray-600' 
                        : 'bg-gradient-to-br from-purple-500 to-purple-700'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                      <div className={`inline-block max-w-[80%] p-4 rounded-xl ${
                        message.role === 'user'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 p-4 rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div className="p-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">Quick prompts:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(prompt)}
                    className="text-xs"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your tasks and projects..."
                className="min-h-[60px] max-h-[120px]"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}