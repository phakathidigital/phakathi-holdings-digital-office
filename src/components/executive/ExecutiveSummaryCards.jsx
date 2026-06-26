import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function ExecutiveSummaryCards({ metrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className={`p-2 rounded-lg ${m.iconBg || 'bg-gray-50'}`}>
              <m.icon className={`w-5 h-5 ${m.iconColor || 'text-gray-600'}`} />
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${m.trend > 0 ? 'text-green-600' : m.trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {m.trend > 0 ? <TrendingUp className="w-3 h-3" /> : m.trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {m.trendLabel}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">{m.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
          </div>
          {m.subtext && <p className="text-xs text-gray-400 mt-1">{m.subtext}</p>}
        </motion.div>
      ))}
    </div>
  );
}