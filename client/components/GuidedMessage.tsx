'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronUp, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';

interface GuidedMessageProps {
  answer: string;
  situation?: string;
  priority?: string;
  next_step?: string;
  sources: string[];
  suggestions: string[];
  onActionClick: (action: 'do_now' | 'later' | 'cant_do', step: string) => void;
  onSuggestionClick: (suggestion: string) => void;
}

export default function GuidedMessage({
  answer,
  situation,
  priority,
  next_step,
  sources,
  suggestions,
  onActionClick,
  onSuggestionClick,
}: GuidedMessageProps) {
  const [showDetailedContent, setShowDetailedContent] = useState(false);

  return (
    <div className="flex flex-col space-y-3">
      {priority && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p className="font-medium text-sm">Important maintenant : {priority}</p>
        </div>
      )}

      {next_step && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <ArrowRight className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-800">Prochaine petite étape</h3>
          </div>
          <p className="text-slate-700 mb-4">{next_step}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onActionClick('do_now', next_step)}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Faire maintenant</span>
            </button>
            <button
              onClick={() => onActionClick('later', next_step)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>Plus tard</span>
            </button>
            <button
              onClick={() => onActionClick('cant_do', next_step)}
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <XCircle className="h-4 w-4" />
              <span>Je n&apos;y arrive pas</span>
            </button>
          </div>
        </div>
      )}

      {situation && (
        <div className="bg-slate-50 border border-slate-200 text-slate-700 p-3 rounded-lg text-sm">
          <span className="font-medium">Où on en est :</span> {situation}
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <button
          onClick={() => setShowDetailedContent(!showDetailedContent)}
          className="w-full flex justify-between items-center text-slate-700 hover:text-slate-900 font-medium text-sm"
        >
          <span>{showDetailedContent ? 'Masquer le détail explicatif' : 'Détail explicatif (optionnel)'}</span>
          {showDetailedContent ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showDetailedContent && (
          <div className="prose prose-sm max-w-none leading-relaxed text-slate-800 mt-3 pt-3 border-t border-slate-100">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Sources RAG */}
      {sources && sources.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-2">📚 Sources consultées :</div>
          <div className="flex flex-wrap gap-1">
            {sources.map((source: string, idx: number) => (
              <span
                key={idx}
                className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-200"
              >
                📄 {source.length > 40 ? source.substring(0, 40) + '...' : source}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions intelligentes */}
      {suggestions && suggestions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-2">💡 Questions suggérées :</div>
          <div className="flex flex-col gap-2">
            {suggestions.map((suggestion: string, idx: number) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick(suggestion)}
                className="text-left text-sm bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-lg transition-colors border border-rose-200 hover:border-rose-300"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
