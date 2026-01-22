'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, PlayCircle } from 'lucide-react';

interface ResumeCardProps {
  guidedState: {
    situation: string;
    priority: string;
    next_step: string;
  };
}

export default function ResumeCard({ guidedState }: ResumeCardProps) {
  const router = useRouter();

  const handleResumeClick = () => {
    router.push(`/chat?initialMessage=${encodeURIComponent(guidedState.next_step)}`);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 hover:shadow-lg transition-all duration-200 text-left max-w-md mx-auto">
      <div className="flex items-center space-x-3 mb-4">
        <PlayCircle className="h-8 w-8 text-rose-500" />
        <h2 className="text-xl font-semibold text-slate-900">Reprendre votre parcours</h2>
      </div>
      <p className="text-slate-700 mb-2">
        <span className="font-medium">Où en étiez-vous :</span> {guidedState.situation}
      </p>
      <p className="text-slate-700 mb-4">
        <span className="font-medium">Prochaine action :</span> {guidedState.next_step}
      </p>
      <button
        onClick={handleResumeClick}
        className="w-full bg-rose-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors flex items-center justify-center space-x-2"
      >
        <span>Reprendre maintenant</span>
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
