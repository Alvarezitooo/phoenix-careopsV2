'use client';

import { useState } from 'react';
import { MessageSquare, FileText, Calendar, Euro, ArrowRight, Sparkles } from 'lucide-react';

export default function InterconnectionDemo() {
  const [activeFlow, setActiveFlow] = useState<string | null>(null);

  const flows = [
    {
      id: 'document-analysis',
      title: 'Upload → Analyse → Dashboard',
      description: 'Document analysé automatiquement et ajouté au dossier',
      steps: [
        { icon: FileText, text: 'Upload document', color: 'bg-blue-100 text-blue-600' },
        { icon: Sparkles, text: 'Analyse Phoenix', color: 'bg-purple-100 text-purple-600' },
        { icon: Calendar, text: 'Échéances détectées', color: 'bg-orange-100 text-orange-600' },
        { icon: Euro, text: 'Droits identifiés', color: 'bg-green-100 text-green-600' }
      ]
    },
    {
      id: 'contextual-help',
      title: 'Dashboard → Questions contextuelles',
      description: 'Chaque élément du dashboard connecté à Phoenix',
      steps: [
        { icon: Euro, text: 'Aide AEEH', color: 'bg-green-100 text-green-600' },
        { icon: MessageSquare, text: 'Comment renouveler ?', color: 'bg-rose-100 text-rose-600' },
        { icon: Sparkles, text: 'Réponse personnalisée', color: 'bg-purple-100 text-purple-600' }
      ]
    },
    {
      id: 'proactive-suggestions',
      title: 'Système proactif intelligent',
      description: 'Phoenix anticipe vos besoins selon votre profil',
      steps: [
        { icon: Calendar, text: 'Échéance détectée', color: 'bg-orange-100 text-orange-600' },
        { icon: Sparkles, text: 'Alerte Phoenix', color: 'bg-purple-100 text-purple-600' },
        { icon: MessageSquare, text: 'Guidance automatique', color: 'bg-rose-100 text-rose-600' }
      ]
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">🔗 Écosystème Interconnecté</h3>

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
            <h4 className="font-medium text-slate-900">Intelligence contextuelle</h4>
            <p className="text-sm text-slate-600 mt-1">
              Phoenix connaît votre famille, vos aides actuelles et vos échéances pour des réponses ultra-personnalisées.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}