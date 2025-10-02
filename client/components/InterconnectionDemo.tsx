'use client';

import { useState } from 'react';
import { MessageSquare, FileText, Calendar, Euro, ArrowRight, Sparkles } from 'lucide-react';

export default function InterconnectionDemo() {
  const [activeFlow, setActiveFlow] = useState<string | null>(null);

  const flows = [
    {
      id: 'contextual-help',
      title: 'Dashboard → Chat contextuel',
      description: 'Chaque bouton du dashboard lance une question pré-remplie dans le chat',
      steps: [
        { icon: Euro, text: 'Clic sur aide AEEH', color: 'bg-green-100 text-green-600' },
        { icon: MessageSquare, text: 'Ouvre le chat', color: 'bg-rose-100 text-rose-600' },
        { icon: Sparkles, text: 'Question déjà prête', color: 'bg-purple-100 text-purple-600' }
      ]
    },
    {
      id: 'document-upload',
      title: 'Upload document (expérimental)',
      description: 'Analysez un document avec Phoenix IA',
      steps: [
        { icon: FileText, text: 'Upload fichier', color: 'bg-blue-100 text-blue-600' },
        { icon: Sparkles, text: 'Analyse IA', color: 'bg-purple-100 text-purple-600' },
        { icon: MessageSquare, text: 'Résultat affiché', color: 'bg-rose-100 text-rose-600' }
      ]
    },
    {
      id: 'real-alerts',
      title: 'Alertes automatiques',
      description: 'Affiche les échéances à moins de 7 jours depuis Supabase',
      steps: [
        { icon: Calendar, text: 'Deadline Supabase', color: 'bg-orange-100 text-orange-600' },
        { icon: Sparkles, text: 'Calcul J-7', color: 'bg-purple-100 text-purple-600' },
        { icon: MessageSquare, text: 'Bouton "Demander aide"', color: 'bg-rose-100 text-rose-600' }
      ]
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">🔗 Fonctionnalités actuelles</h3>

      <div className="space-y-4">
        {flows.map((flow) => (
          <div key={flow.id} className="border border-slate-200 rounded-lg p-4">
            <button
              onClick={() => setActiveFlow(activeFlow === flow.id ? null : flow.id)}
              className="w-full text-left"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-slate-900">{flow.title}</h4>
                  <p className="text-sm text-slate-600">{flow.description}</p>
                </div>
                <ArrowRight
                  className={`h-5 w-5 text-slate-400 transition-transform ${
                    activeFlow === flow.id ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </button>

            {activeFlow === flow.id && (
              <div className="mt-4 flex items-center space-x-2 overflow-x-auto pb-2">
                {flow.steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="flex items-center space-x-2 flex-shrink-0">
                      <div className={`p-2 rounded-lg ${step.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                        {step.text}
                      </span>
                      {index < flow.steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-slate-300 mx-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-rose-50 to-purple-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-slate-900">Chat IA avec contexte</h4>
            <p className="text-sm text-slate-600 mt-1">
              Le chat reçoit automatiquement vos données (aides, documents, échéances) pour des réponses personnalisées.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
