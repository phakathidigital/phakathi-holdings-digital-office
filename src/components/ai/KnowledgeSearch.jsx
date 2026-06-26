import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, BookOpen, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const SUGGESTED_PROMPTS = [
  'How do I submit a leave request?',
  'Where do I upload invoices for DAM?',
  'What is the IT support escalation process?',
  'Show me the onboarding checklist.',
  'How do I raise an expense claim?',
  'What are the performance review criteria?',
];

export default function KnowledgeSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const search = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the internal knowledge assistant for Phakathi Holdings, a multi-subsidiary South African holding company.

A staff member is asking: "${q}"

Please provide a clear, helpful, and concise answer based on typical HR, IT, and operational procedures. 
If the question relates to leave, expenses, documents, onboarding, performance, payroll, support tickets, or DAM (Document Asset Management), give a step-by-step guide.
Where relevant, mention which module in the Phakathi Flow system to use.
Keep your answer friendly and professional. Format with markdown for readability.
At the end, suggest 2-3 related questions the staff member might also want to ask.`,
    });
    setResult(response);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Ask anything about HR policies, procedures, or the platform..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search(query)}
          className="w-full pl-10 pr-24 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
        />
        <button
          onClick={() => search(query)}
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Ask
        </button>
      </div>

      {!result && !loading && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Suggested questions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => { setQuery(p); search(p); }}
                className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 transition-colors text-left"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
          <p className="text-sm text-blue-700">Searching the knowledge base...</p>
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-gray-600" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Knowledge Base Answer</p>
            </div>
            <ReactMarkdown
              className="prose prose-sm prose-gray max-w-none text-gray-700 [&>*:first-child]:mt-0"
              components={{
                p: ({children}) => <p className="my-1.5 text-sm leading-relaxed">{children}</p>,
                li: ({children}) => <li className="text-sm my-0.5">{children}</li>,
                h3: ({children}) => <h3 className="text-sm font-semibold text-gray-900 mt-3 mb-1">{children}</h3>,
              }}
            >
              {result}
            </ReactMarkdown>
            <button onClick={() => { setResult(null); setQuery(''); }} className="mt-3 text-xs text-gray-400 hover:text-gray-600">
              Clear answer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}