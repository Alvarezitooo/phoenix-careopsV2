import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200 ${className}`}
    >
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={`px-6 py-3 rounded-xl font-medium transition-colors focus:ring-2 focus:outline-none ${
            action.variant === 'secondary'
              ? 'text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-300'
              : 'bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-300'
          }`}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
