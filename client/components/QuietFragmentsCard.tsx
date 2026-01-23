'use client';

import { useState } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import { QUIET_FRAGMENTS } from '@/lib/fragments';

interface QuietFragmentsCardProps {
  layout?: 'card' | 'inline';
}

export default function QuietFragmentsCard({ layout = 'card' }: QuietFragmentsCardProps) {
  const [fragmentIndex, setFragmentIndex] = useState<number | null>(null);

  const revealFragment = () => {
    const nextIndex = Math.floor(Math.random() * QUIET_FRAGMENTS.length);
    setFragmentIndex(nextIndex);
  };

  const fragment = fragmentIndex !== null ? QUIET_FRAGMENTS[fragmentIndex] : null;
  const baseClasses = layout === 'card'
    ? 'bg-white border border-slate-200 rounded-2xl p-6 shadow-sm'
    : 'rounded-2xl border border-slate-200 p-4 bg-white';

  return (
    <div className={baseClasses}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-slate-500" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Tu n&apos;es pas seul</p>
          <h3 className="text-lg font-semibold text-slate-900">Fragments de vécu</h3>
        </div>
      </div>

      {fragment ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-slate-500">{fragment.title}</p>
          <p className="text-slate-800 leading-relaxed">{fragment.content}</p>
        </div>
      ) : (
        <p className="text-sm text-slate-500 mt-4">
          Ces mots sont proposés seulement si tu en as besoin. Rien n&apos;est affiché automatiquement.
        </p>
      )}

      <div className="mt-6 flex gap-2">
        <button
          onClick={revealFragment}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition"
        >
          <BookOpen className="h-4 w-4" />
          Lire quelques mots
        </button>
        {fragment && (
          <button
            onClick={revealFragment}
            className="px-4 py-2 rounded-xl border border-transparent text-slate-500 hover:text-slate-700"
            title="Proposer un autre fragment"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
