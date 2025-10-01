'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ExternalLink,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Sparkles,
  BookOpen,
  Scale,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Types pour les réponses IA
interface LegalSource {
  id: string;
  title: string;
  type: 'code' | 'arrete' | 'circulaire' | 'jurisprudence' | 'guide';
  article?: string;
  date: string;
  url?: string;
  excerpt: string;
  confidence: number;
  department?: string;
}

interface ActionableItem {
  id: string;
  type: 'document' | 'appointment' | 'form' | 'contact';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  url?: string;
  icon: React.ReactNode;
}

interface AIResponse {
  id: string;
  content: string;
  sources: LegalSource[];
  actionables: ActionableItem[];
  confidence: number;
  processingTime: number;
  followUpQuestions: string[];
  relatedTopics: string[];
}

// Composant principal pour les réponses IA
export function AIResponseCard({ response }: { response: AIResponse }) {
  const [activeTab, setActiveTab] = useState<'response' | 'sources' | 'actions'>('response');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(response.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Header avec métriques */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-slate-900">PhoenixIA</span>
            <ConfidenceBadge confidence={response.confidence} />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>{response.processingTime.toFixed(1)}s</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-6 px-2"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copié !' : 'Copier'}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'response', label: 'Réponse', count: null },
          { id: 'sources', label: 'Sources', count: response.sources.length },
          { id: 'actions', label: 'Actions', count: response.actionables.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            )}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={cn(
                'px-2 py-1 rounded-full text-xs',
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu des tabs */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'response' && (
            <ResponseContent key="response" response={response} />
          )}
          {activeTab === 'sources' && (
            <SourcesContent key="sources" sources={response.sources} />
          )}
          {activeTab === 'actions' && (
            <ActionsContent key="actions" actionables={response.actionables} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Contenu de la réponse principale
function ResponseContent({ response }: { response: AIResponse }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {/* Contenu principal */}
      <div className="prose prose-sm max-w-none">
        <ResponseRenderer content={response.content} />
      </div>

      {/* Questions de suivi */}
      {response.followUpQuestions.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">
            Questions fréquentes liées :
          </h4>
          <div className="space-y-2">
            {response.followUpQuestions.map((question, index) => (
              <button
                key={index}
                className="block w-full text-left p-3 text-sm border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sujets connexes */}
      {response.relatedTopics.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">
            Sujets connexes :
          </h4>
          <div className="flex flex-wrap gap-2">
            {response.relatedTopics.map((topic, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs hover:bg-slate-200 cursor-pointer transition-colors"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Rendu du contenu avec formatage intelligent
function ResponseRenderer({ content }: { content: string }) {
  const formatContent = (text: string) => {
    // Conversion markdown simple + highlighting juridique
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/#{1,6}\s+(.*?)$/gm, '<h3 class="font-semibold text-slate-900 mt-4 mb-2">$1</h3>')
      .replace(/^\d+\.\s+(.*?)$/gm, '<li class="ml-4">$1</li>')
      .replace(/^-\s+(.*?)$/gm, '<li class="ml-4">$1</li>');

    // Highlight termes juridiques
    const legalTerms = ['MDPH', 'AEEH', 'PCH', 'AESH', 'CDAPH', 'CNSA', 'PPS', 'PAI'];
    legalTerms.forEach(term => {
      formatted = formatted.replace(
        new RegExp(`\\b${term}\\b`, 'gi'),
        `<span class="font-medium text-blue-700 cursor-help" title="Terme juridique">${term}</span>`
      );
    });

    return formatted;
  };

  return (
    <div
      className="leading-relaxed text-slate-700"
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  );
}

// Sources légales avec validation
function SourcesContent({ sources }: { sources: LegalSource[] }) {
  const [selectedSource, setSelectedSource] = useState<LegalSource | null>(null);

  const getSourceIcon = (type: LegalSource['type']) => {
    switch (type) {
      case 'code': return <Scale className="w-4 h-4" />;
      case 'arrete': return <FileText className="w-4 h-4" />;
      case 'circulaire': return <BookOpen className="w-4 h-4" />;
      case 'jurisprudence': return <Scale className="w-4 h-4" />;
      case 'guide': return <BookOpen className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getSourceColor = (type: LegalSource['type']) => {
    switch (type) {
      case 'code': return 'text-purple-600 bg-purple-100';
      case 'arrete': return 'text-blue-600 bg-blue-100';
      case 'circulaire': return 'text-green-600 bg-green-100';
      case 'jurisprudence': return 'text-orange-600 bg-orange-100';
      case 'guide': return 'text-teal-600 bg-teal-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-3"
    >
      {sources.map((source) => (
        <div
          key={source.id}
          className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded', getSourceColor(source.type))}>
                {getSourceIcon(source.type)}
              </div>
              <div>
                <h4 className="font-medium text-slate-900 text-sm">
                  {source.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="capitalize">{source.type}</span>
                  {source.article && <span>• Art. {source.article}</span>}
                  <span>• {source.date}</span>
                  {source.department && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {source.department}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <ConfidenceBadge confidence={source.confidence} size="sm" />
          </div>

          <p className="text-sm text-slate-700 mb-3 leading-relaxed">
            {source.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedSource(source)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir le détail complet
            </button>
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
              >
                <ExternalLink className="w-3 h-3" />
                Source officielle
              </a>
            )}
          </div>
        </div>
      ))}

      {sources.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Aucune source spécifique pour cette réponse</p>
        </div>
      )}
    </motion.div>
  );
}

// Actions recommandées
function ActionsContent({ actionables }: { actionables: ActionableItem[] }) {
  const getPriorityColor = (priority: ActionableItem['priority']) => {
    switch (priority) {
      case 'urgent': return 'border-red-300 bg-red-50 text-red-700';
      case 'high': return 'border-orange-300 bg-orange-50 text-orange-700';
      case 'medium': return 'border-blue-300 bg-blue-50 text-blue-700';
      case 'low': return 'border-slate-300 bg-slate-50 text-slate-700';
    }
  };

  const getPriorityIcon = (priority: ActionableItem['priority']) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-4 h-4" />;
      case 'high': return <Clock className="w-4 h-4" />;
      case 'medium': return <CheckCircle className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-3"
    >
      {actionables.map((action) => (
        <div
          key={action.id}
          className={cn(
            'border rounded-lg p-4 transition-all hover:shadow-md',
            getPriorityColor(action.priority)
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/50">
                {action.icon}
              </div>
              <div>
                <h4 className="font-medium text-slate-900">
                  {action.title}
                </h4>
                <p className="text-sm opacity-80 mt-1">
                  {action.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getPriorityIcon(action.priority)}
              <span className="text-xs font-medium capitalize">
                {action.priority}
              </span>
            </div>
          </div>

          {action.deadline && (
            <div className="flex items-center gap-2 text-xs mb-3">
              <Calendar className="w-3 h-3" />
              <span>Échéance : {action.deadline}</span>
            </div>
          )}

          <Button
            variant={action.priority === 'urgent' ? 'danger' : 'primary'}
            size="sm"
            className="w-full"
            onClick={() => {
              if (action.url) {
                window.open(action.url, '_blank');
              }
            }}
          >
            {action.type === 'document' && 'Télécharger'}
            {action.type === 'form' && 'Remplir le formulaire'}
            {action.type === 'appointment' && 'Prendre RDV'}
            {action.type === 'contact' && 'Contacter'}
          </Button>
        </div>
      ))}

      {actionables.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Aucune action spécifique recommandée</p>
        </div>
      )}
    </motion.div>
  );
}

// Badge de confiance
function ConfidenceBadge({
  confidence,
  size = 'md'
}: {
  confidence: number;
  size?: 'sm' | 'md'
}) {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'bg-green-100 text-green-700 border-green-200';
    if (conf >= 0.7) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (conf >= 0.5) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.9) return 'Très fiable';
    if (conf >= 0.7) return 'Fiable';
    if (conf >= 0.5) return 'Modérée';
    return 'Faible';
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-1 border rounded-full font-medium',
      size === 'sm' ? 'text-xs' : 'text-xs',
      getConfidenceColor(confidence)
    )}>
      <div className="w-1.5 h-1.5 rounded-full bg-current" />
      {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
    </span>
  );
}