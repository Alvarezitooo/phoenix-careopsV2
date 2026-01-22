'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, RotateCcw, FileText, Heart, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { formatTimestamp, isRecentMessage } from '@/lib/chatApi';
import GuidedMessage from '@/components/GuidedMessage'; // Import the new component

interface ChatInterfaceProps {
  userId?: string;
  className?: string;
  initialMessage?: string;
  userContext?: any;
}

export default function ChatInterface({ userId, className = '', initialMessage, userContext }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    error,
    connectionStatus,
    sendMessage,
    resetConversation,
    saveMemory,
    retry,
    isEmpty
  } = useChat({ userId, autoLoadHistory: true, userContext });

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Message initial pré-rempli
  useEffect(() => {
    if (initialMessage && !inputValue) {
      setInputValue(initialMessage);
      // Focus automatique pour permettre à l'utilisateur d'envoyer directement
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [initialMessage, inputValue]);

  // Focus automatique sur l'input
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  if (!userId) {
    return (
      <div className={`flex items-center justify-center h-full bg-slate-50 ${className}`}>
        <div className="text-center max-w-md space-y-4">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
            <Heart className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Session expirée</h2>
          <p className="text-slate-600">
            Merci de vous reconnecter pour continuer à discuter avec Phoenix. Votre sécurité passe avant tout.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    setShowQuickActions(false);

    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  }, []);

  const handleActionClick = useCallback(async (action: 'do_now' | 'later' | 'cant_do', step: string) => {
    let messageToSend = '';
    switch (action) {
      case 'do_now':
        messageToSend = `J'ai fait l'étape : "${step}"`;
        break;
      case 'later':
        messageToSend = `Je ferai l'étape : "${step}" plus tard.`;
        break;
      case 'cant_do':
        messageToSend = `Je n'arrive pas à faire l'étape : "${step}". Peux-tu m'aider autrement ?`;
        break;
    }
    if (messageToSend) {
      setInputValue('');
      await sendMessage(messageToSend);
    }
  }, [sendMessage]);

  const handleQuickAction = async (action: string) => {
    const expertQuickMessages = {
      hello: "Bonjour Phoenix, j'aurais besoin d'aide pour accompagner mon enfant.",
      aeeh_calc: "Mon enfant a un handicap. Puis-je avoir l'AEEH et à combien ai-je droit ?",
      parent_solo: "Je suis parent isolé avec un enfant handicapé. Quelles majorations puis-je avoir ?",
      aesh_demande: "Mon enfant entre à l'école. Comment demander un AESH ?",
      dossier_mdph: "Je dois constituer un dossier MDPH. Quels documents dois-je préparer ?",
      cumul_aides: "Puis-je cumuler AEEH, allocations familiales et ARS ?",
      recours_mdph: "Ma demande MDPH a été refusée. Comment faire un recours ?",
      caf_handicap: "Quelles aides de la CAF existent pour les familles avec enfant handicapé ?",
      transport: "Comment obtenir un transport scolaire adapté pour mon enfant ?"
    };

    const message = expertQuickMessages[action as keyof typeof expertQuickMessages];
    if (message) {
      setInputValue('');
      setShowQuickActions(false);
      await sendMessage(message);
    }
  };

  const ConnectionStatus = () => {
    const statusConfig = {
      connected: { icon: CheckCircle, color: 'text-green-500', text: 'Connecté' },
      connecting: { icon: Loader2, color: 'text-yellow-500', text: 'Connexion...' },
      disconnected: { icon: AlertCircle, color: 'text-red-500', text: 'Déconnecté' }
    };

    const config = statusConfig[connectionStatus];
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 text-sm ${config.color}`}>
        <Icon className={`h-4 w-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
        {config.text}
      </div>
    );
  };

  const MessageBubble = ({ message, index }: { message: any; index: number }) => {
    const isUser = message.role === 'user';
    const isRecent = isRecentMessage(message.timestamp);

    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`
          max-w-[95%] sm:max-w-[85%] rounded-2xl px-4 py-3 relative
          ${isUser
            ? 'bg-rose-500 text-white'
            : 'bg-white shadow-sm border border-slate-200'
          }
          ${isRecent ? 'animate-in slide-in-from-bottom-2 duration-300' : ''}
        `}>
          {!isUser && (
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-medium text-slate-700">Phoenix</span>
              <span className="text-xs text-slate-500">• Conseiller expert</span>
            </div>
          )}

          {/* Render GuidedMessage for AI responses */}
          {!isUser ? (
            <GuidedMessage
              answer={message.response} // Use message.response for the main answer
              situation={message.situation}
              priority={message.priority}
              next_step={message.next_step}
              sources={message.sources || []}
              suggestions={message.suggestions || []}
              onActionClick={handleActionClick}
              onSuggestionClick={handleSuggestionClick}
            />
          ) : (
            <div className={`prose prose-sm max-w-none leading-relaxed ${
              isUser ? 'text-white' : 'text-slate-800'
            }`}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}

          <div className={`text-xs mt-2 ${
            isUser ? 'text-rose-100' : 'text-slate-400'
          }`}>
            {formatTimestamp(message.timestamp)}
            {!isUser && message.processing_time && (
              <span className="ml-2">• Réponse en {message.processing_time.toFixed(1)}s</span>
            )}
          </div>

          {!isUser && index === messages.length - 1 && (
            <button
              onClick={() => saveMemory(message.response, 'helpful_response')} // Use message.response
              className="absolute -bottom-2 -right-2 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-full p-1 transition-colors"
              title="Sauvegarder cette réponse"
            >
              <Heart className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const QuickActions = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-slate-50 rounded-lg mb-4">
      <button
        onClick={() => handleQuickAction('aeeh_calc')}
        className="p-3 text-left rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-white transition-all"
      >
        <div className="font-medium text-slate-800">💰 Calculer AEEH</div>
        <div className="text-sm text-slate-600">Montants & éligibilité</div>
      </button>

      <button
        onClick={() => handleQuickAction('parent_solo')}
        className="p-3 text-left rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-white transition-all"
      >
        <div className="font-medium text-slate-800">👩‍👧 Parent isolé</div>
        <div className="text-sm text-slate-600">Majorations spéciales</div>
      </button>

      <button
        onClick={() => handleQuickAction('aesh_demande')}
        className="p-3 text-left rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-white transition-all"
      >
        <div className="font-medium text-slate-800">🏫 Demander AESH</div>
        <div className="text-sm text-slate-600">École & accompagnement</div>
      </button>

      <button
        onClick={() => handleQuickAction('dossier_mdph')}
        className="p-3 text-left rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-white transition-all"
      >
        <div className="font-medium text-slate-800">📋 Dossier MDPH</div>
        <div className="text-sm text-slate-600">Documents & démarches</div>
      </button>

      <button
        onClick={() => handleQuickAction('cumul_aides')}
        className="p-3 text-left rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-white transition-all"
      >
        <div className="font-medium text-slate-800">🔄 Cumul d&apos;aides</div>
        <div className="text-sm text-slate-600">AEEH + CAF + autres</div>
      </button>

      <button
        onClick={() => handleQuickAction('recours_mdph')}
        className="p-3 text-left rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-white transition-all"
      >
        <div className="font-medium text-slate-800">⚖️ Recours MDPH</div>
        <div className="text-sm text-slate-600">Refus & contestation</div>
      </button>

      <button
        onClick={() => handleQuickAction('caf_handicap')}
        className="p-3 text-left rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-white transition-all"
      >
        <div className="font-medium text-slate-800">🏛️ Aides CAF</div>
        <div className="text-sm text-slate-600">Allocations familiales</div>
      </button>

      <button
        onClick={() => handleQuickAction('transport')}
        className="p-3 text-left rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-white transition-all"
      >
        <div className="font-medium text-slate-800">🚌 Transport adapté</div>
        <div className="text-sm text-slate-600">École & déplacements</div>
      </button>
    </div>
  );

  return (
    <div className={`flex flex-col h-full bg-slate-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <Heart className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Phoenix</h2>
              <p className="text-sm text-slate-600">Votre assistant empathique</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ConnectionStatus />
            <button
              onClick={resetConversation}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Nouvelle conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isEmpty && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Bonjour ! Je suis Phoenix 🕊️
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              <strong>Conseiller social expert</strong> combinant l&apos;expertise MDPH + CAF + droits parentaux.
              Je vous accompagne pour toutes vos démarches : AEEH, allocations, AESH, recours, et bien plus !
            </p>
            <QuickActions />
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble key={message.id} message={message} index={index} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white shadow-sm border border-slate-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-medium text-slate-700">Phoenix</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                <span className="text-slate-600">Phoenix réfléchit...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Oups, une difficulté technique</span>
            </div>
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <button
              onClick={retry}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md text-sm transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-6 py-4">
        {showQuickActions && !isEmpty && (
          <div className="mb-4">
            <QuickActions />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message à Phoenix..."
              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 focus:outline-none transition-all"
              rows={1}
              style={{ minHeight: '50px', maxHeight: '120px' }}
              disabled={isLoading}
            />

            {!isEmpty && (
              <button
                type="button"
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                title="Actions rapides"
              >
                <FileText className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors focus:ring-2 focus:ring-rose-300 focus:outline-none"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>

        <div className="text-xs text-slate-500 mt-2 text-center">
          Phoenix garde en mémoire vos conversations pour mieux vous accompagner
        </div>
      </div>
    </div>
  );
}

