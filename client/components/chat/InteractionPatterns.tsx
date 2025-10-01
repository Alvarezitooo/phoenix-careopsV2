'use client';

import { useState } from 'react';
import { ChevronRight, HelpCircle, FileText, Users, GraduationCap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Pattern 1: Progressive Disclosure
interface ProgressiveQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    label: string;
    nextQuestion?: string;
    action?: 'collect_info' | 'provide_answer' | 'redirect';
    data?: any;
  }[];
}

const PROGRESSIVE_FLOW: Record<string, ProgressiveQuestion> = {
  age_detection: {
    id: 'age_detection',
    question: "Quel âge a votre enfant ?",
    options: [
      { id: '0-3', label: '0-3 ans (Petite enfance)', nextQuestion: 'early_intervention' },
      { id: '3-6', label: '3-6 ans (Maternelle)', nextQuestion: 'school_prep' },
      { id: '6-11', label: '6-11 ans (Primaire)', nextQuestion: 'school_support' },
      { id: '11-16', label: '11-16 ans (Collège)', nextQuestion: 'adolescent_support' },
      { id: '16+', label: '16+ ans (Lycée/Post-bac)', nextQuestion: 'transition_adult' }
    ]
  },
  school_support: {
    id: 'school_support',
    question: "Votre enfant est-il déjà scolarisé en milieu ordinaire ?",
    options: [
      { id: 'yes_ordinary', label: 'Oui, en école ordinaire', nextQuestion: 'support_type' },
      { id: 'specialized', label: 'Non, en établissement spécialisé', nextQuestion: 'inclusion_desire' },
      { id: 'not_school', label: 'Pas encore scolarisé', nextQuestion: 'school_prep' },
      { id: 'unknown', label: 'Je ne sais pas quoi choisir', action: 'provide_answer', data: { topic: 'school_guidance' } }
    ]
  }
};

// Pattern 2: Contextual Help
interface ContextualHelp {
  trigger: string;
  explanation: string;
  links?: { label: string; url: string }[];
}

const CONTEXTUAL_HELPS: ContextualHelp[] = [
  {
    trigger: 'MDPH',
    explanation: 'La MDPH (Maison Départementale des Personnes Handicapées) évalue les besoins et accorde les aides. Il y en a une par département.',
    links: [
      { label: 'Trouver ma MDPH', url: '/tools/find-mdph' },
      { label: 'Guide MDPH complet', url: '/guides/mdph' }
    ]
  },
  {
    trigger: 'AEEH',
    explanation: 'L\'AEEH (Allocation d\'Éducation de l\'Enfant Handicapé) est une aide financière pour compenser les frais liés au handicap de votre enfant.',
    links: [
      { label: 'Calculer mon AEEH', url: '/tools/aeeh-calculator' },
      { label: 'Conditions AEEH', url: '/guides/aeeh' }
    ]
  }
];

// Pattern 3: Smart Suggestions
interface SmartSuggestion {
  type: 'document' | 'community' | 'action' | 'guide';
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  relevanceScore: number;
}

export function ProgressiveDisclosure() {
  const [currentQuestion, setCurrentQuestion] = useState<string>('age_detection');
  const [userPath, setUserPath] = useState<string[]>([]);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});

  const handleOptionSelect = (option: any) => {
    const newPath = [...userPath, option.id];
    setUserPath(newPath);

    if (option.nextQuestion) {
      setCurrentQuestion(option.nextQuestion);
    } else if (option.action === 'collect_info') {
      setCollectedData({ ...collectedData, [currentQuestion]: option.id });
    }
  };

  const question = PROGRESSIVE_FLOW[currentQuestion];
  if (!question) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 p-6"
    >
      <div className="mb-4">
        <h3 className="font-semibold text-slate-900 mb-2">{question.question}</h3>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Étape {userPath.length + 1}</span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full',
                  i <= userPath.length ? 'bg-rose-500' : 'bg-slate-200'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionSelect(option)}
            className="w-full p-3 text-left border border-slate-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-900">{option.label}</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function ContextualHelpTooltip({ text }: { text: string }) {
  const [showHelp, setShowHelp] = useState(false);

  const helpContent = CONTEXTUAL_HELPS.find(help =>
    text.toLowerCase().includes(help.trigger.toLowerCase())
  );

  if (!helpContent) return <span>{text}</span>;

  return (
    <span className="relative">
      <button
        onMouseEnter={() => setShowHelp(true)}
        onMouseLeave={() => setShowHelp(false)}
        className="underline decoration-dotted decoration-rose-400 hover:decoration-solid cursor-help"
      >
        {text}
      </button>

      {showHelp && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute z-50 w-80 p-4 bg-white border border-slate-200 rounded-lg shadow-lg -top-2 left-full ml-2"
        >
          <div className="flex items-start gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-slate-900 font-medium mb-1">
                {helpContent.trigger}
              </p>
              <p className="text-xs text-slate-600">
                {helpContent.explanation}
              </p>
            </div>
          </div>

          {helpContent.links && (
            <div className="space-y-1 mt-3 pt-2 border-t border-slate-100">
              {helpContent.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="block text-xs text-rose-600 hover:text-rose-700 underline"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </span>
  );
}

export function SmartSuggestions({ context }: { context: string }) {
  const [suggestions] = useState<SmartSuggestion[]>([
    {
      type: 'document',
      title: 'Télécharger le formulaire CERFA adapté',
      description: 'Formulaire 15692*01 pré-rempli selon votre situation',
      icon: <FileText className="w-4 h-4" />,
      action: () => console.log('Download CERFA'),
      relevanceScore: 0.95
    },
    {
      type: 'community',
      title: 'Échanger avec d\'autres parents',
      description: 'Forum spécialisé pour votre situation',
      icon: <Users className="w-4 h-4" />,
      action: () => console.log('Open forum'),
      relevanceScore: 0.87
    },
    {
      type: 'guide',
      title: 'Guide : Première demande MDPH',
      description: 'Pas à pas illustré pour débutants',
      icon: <GraduationCap className="w-4 h-4" />,
      action: () => console.log('Open guide'),
      relevanceScore: 0.82
    }
  ]);

  const topSuggestions = suggestions
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-slate-700 mb-3">Actions recommandées :</h4>
      {topSuggestions.map((suggestion, index) => (
        <motion.button
          key={index}
          onClick={suggestion.action}
          className="w-full p-3 text-left border border-slate-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 transition-all duration-200 group"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2 rounded-lg flex-shrink-0 transition-colors',
              suggestion.type === 'document' && 'bg-blue-100 group-hover:bg-blue-200',
              suggestion.type === 'community' && 'bg-green-100 group-hover:bg-green-200',
              suggestion.type === 'guide' && 'bg-purple-100 group-hover:bg-purple-200'
            )}>
              {suggestion.icon}
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 text-sm mb-1">
                {suggestion.title}
              </p>
              <p className="text-xs text-slate-600">
                {suggestion.description}
              </p>
              <div className="flex items-center mt-2">
                <div className="flex-1 bg-slate-200 rounded-full h-1">
                  <div
                    className="bg-rose-500 h-1 rounded-full transition-all"
                    style={{ width: `${suggestion.relevanceScore * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 ml-2">
                  {Math.round(suggestion.relevanceScore * 100)}% pertinent
                </span>
              </div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// Pattern 4: Multi-Turn Conversation Manager
export function ConversationManager() {
  const [conversationState, setConversationState] = useState({
    phase: 'discovery', // discovery, qualification, solution, action
    collectedInfo: {},
    confidence: 0,
    nextSteps: []
  });

  const phaseIndicators = [
    { phase: 'discovery', label: 'Découverte', icon: <HelpCircle className="w-4 h-4" /> },
    { phase: 'qualification', label: 'Qualification', icon: <FileText className="w-4 h-4" /> },
    { phase: 'solution', label: 'Solutions', icon: <GraduationCap className="w-4 h-4" /> },
    { phase: 'action', label: 'Actions', icon: <Heart className="w-4 h-4" /> }
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700">Progression de la conversation</span>
        <span className="text-xs text-slate-500">
          {conversationState.confidence}% de confiance
        </span>
      </div>

      <div className="flex gap-2">
        {phaseIndicators.map((indicator, index) => (
          <div
            key={indicator.phase}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
              conversationState.phase === indicator.phase
                ? 'bg-rose-500 text-white'
                : index < phaseIndicators.findIndex(p => p.phase === conversationState.phase)
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-200 text-slate-600'
            )}
          >
            {indicator.icon}
            {indicator.label}
          </div>
        ))}
      </div>
    </div>
  );
}