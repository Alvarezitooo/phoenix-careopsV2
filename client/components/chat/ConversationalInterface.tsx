'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, FileText, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'quick_action' | 'document_suggestion' | 'community_link';
  metadata?: {
    sources?: Source[];
    quickActions?: QuickAction[];
    confidence?: number;
    processingTime?: number;
  };
}

interface Source {
  title: string;
  type: 'loi' | 'arrete' | 'circulaire' | 'guide';
  date: string;
  url?: string;
  excerpt: string;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

interface SuggestedQuestion {
  id: string;
  text: string;
  category: 'droits' | 'demarches' | 'scolarite' | 'soins';
  icon: React.ReactNode;
}

const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    id: '1',
    text: "Quelles aides pour mon enfant autiste de 7 ans ?",
    category: 'droits',
    icon: <Sparkles className="w-4 h-4" />
  },
  {
    id: '2',
    text: "Comment remplir le formulaire MDPH ?",
    category: 'demarches',
    icon: <FileText className="w-4 h-4" />
  },
  {
    id: '3',
    text: "Accompagnement scolaire : AESH ou AVS ?",
    category: 'scolarite',
    icon: <Users className="w-4 h-4" />
  },
  {
    id: '4',
    text: "Mon dossier MDPH est rejeté, que faire ?",
    category: 'demarches',
    icon: <AlertCircle className="w-4 h-4" />
  }
];

export default function ConversationalInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Auto-focus input on mount
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      // Simulate API call to RAG system
      await new Promise(resolve => setTimeout(resolve, 1500));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateMockResponse(content),
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          sources: [
            {
              title: "Code de l'action sociale et des familles - Art. L245-1",
              type: 'loi',
              date: '2024',
              excerpt: "Les prestations de compensation du handicap..."
            }
          ],
          quickActions: [
            {
              id: '1',
              label: "Télécharger formulaire CERFA",
              description: "Formulaire 15692*01 pré-rempli",
              icon: <FileText className="w-4 h-4" />,
              action: () => console.log('Download CERFA')
            },
            {
              id: '2',
              label: "Voir témoignages parents",
              description: "Expériences similaires communauté",
              icon: <Users className="w-4 h-4" />,
              action: () => console.log('View testimonials')
            }
          ],
          confidence: 0.92,
          processingTime: 1.2
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (question: string): string => {
    return `Pour votre question concernant "${question}", voici les informations importantes :

🎯 **Réponse personnalisée** basée sur la réglementation en vigueur

📋 **Étapes recommandées** :
1. Vérification des critères d'éligibilité
2. Préparation du dossier administratif
3. Dépôt auprès de votre MDPH

💡 **Conseil** : Les délais de traitement varient selon les départements (2-4 mois en moyenne).

Sources vérifiées et mises à jour automatiquement.`;
  };

  const handleSuggestedQuestion = (question: SuggestedQuestion) => {
    sendMessage(question.text);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900">PhoenixIA</h1>
            <p className="text-sm text-slate-600">Votre assistant expert handicap</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.length === 0 && showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Comment puis-je vous aider ?
                </h2>
                <p className="text-slate-600 max-w-md mx-auto">
                  Posez votre question sur les droits, démarches et aides liées au handicap.
                  Je m'appuie sur toute la réglementation française à jour.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <motion.button
                    key={question.id}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="group p-4 text-left border border-slate-200 rounded-xl hover:border-rose-300 hover:shadow-md transition-all duration-200 bg-white"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-rose-100 transition-colors">
                        {question.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm mb-1">
                          {question.text}
                        </p>
                        <span className="text-xs text-slate-500 capitalize">
                          {question.category}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white p-4">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputValue);
                }
              }}
              placeholder="Tapez votre question sur le handicap..."
              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-300 focus:border-rose-400 focus:outline-none transition-all"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-3">
              <kbd className="px-2 py-1 text-xs text-slate-500 border border-slate-200 rounded">
                ⏎
              </kbd>
            </div>
          </div>
          <Button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            size="lg"
            className="px-6"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-slate-500 text-center mt-2">
          PhoenixIA peut faire des erreurs. Vérifiez les informations importantes.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-3 max-w-4xl mx-auto',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3',
        isUser
          ? 'bg-rose-500 text-white ml-auto'
          : 'bg-white border border-slate-200'
      )}>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>

        {!isUser && message.metadata && (
          <div className="mt-4 space-y-3">
            {/* Quick Actions */}
            {message.metadata.quickActions && (
              <div className="space-y-2">
                {message.metadata.quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="flex items-center gap-2 w-full p-2 text-left text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {action.icon}
                    <div>
                      <div className="font-medium text-slate-900">{action.label}</div>
                      <div className="text-slate-600">{action.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Sources */}
            {message.metadata.sources && (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-medium text-slate-700 mb-2">Sources :</p>
                {message.metadata.sources.map((source, index) => (
                  <div key={index} className="text-xs text-slate-600 mb-1">
                    📖 {source.title} ({source.date})
                  </div>
                ))}
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
              <span>
                {message.metadata.confidence && (
                  <>Fiabilité: {Math.round(message.metadata.confidence * 100)}%</>
                )}
              </span>
              <span>
                {message.metadata.processingTime && (
                  <>{message.metadata.processingTime}s</>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0">
          👤
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 max-w-4xl mx-auto justify-start"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-slate-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
          <span className="text-sm text-slate-600 ml-2">
            PhoenixIA recherche dans la base juridique...
          </span>
        </div>
      </div>
    </motion.div>
  );
}