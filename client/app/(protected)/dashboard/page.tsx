'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useUserDocuments, useFamilyProfile } from '@/hooks/useSupabaseData';
import DocumentUpload from '@/components/DocumentUpload';
import OnboardingWizard from '@/components/OnboardingWizard';
import DashboardSidebar from '@/components/DashboardSidebar';
import QuietFragmentsCard from '@/components/QuietFragmentsCard';
import PhoenixJournal from '@/components/PhoenixJournal';
import DecoderCard from '@/components/DecoderCard';
import { supabase } from '@/lib/supabase';
import { Loader2, PauseCircle, FileText, Inbox, MessageSquare } from 'lucide-react';

type GuidedState = {
  situation?: string;
  priority?: string;
  next_step?: string;
};

const formatNextStep = (value?: string) => {
  if (!value) return '';
  const clean = value.trim();
  if (clean.length <= 120) return clean;
  return `${clean.slice(0, 117).trimEnd()}...`;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, session } = useSupabaseAuth();
  const { documents, loading: documentsLoading } = useUserDocuments();
  const { profile, loading: profileLoading } = useFamilyProfile();

  const [selectedTab, setSelectedTab] = useState('base');
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [guidedState, setGuidedState] = useState<GuidedState | null>(null);
  const [guidedLoading, setGuidedLoading] = useState(true);
  const [clearingStep, setClearingStep] = useState(false);

  const needsProfile = !profile?.name || !profile?.departement;

  useEffect(() => {
    const fetchGuidedState = async () => {
      if (!session?.access_token) {
        setGuidedLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/guided_state', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setGuidedState(data);
        }
      } catch (error) {
        console.warn('Impossible de récupérer guided_state', error);
      } finally {
        setGuidedLoading(false);
      }
    };

    fetchGuidedState();
  }, [session?.access_token]);

  const openChat = (message?: string) => {
    if (message) {
      router.push(`/chat?q=${encodeURIComponent(message)}`);
    } else {
      router.push('/chat');
    }
  };

  const handleDocumentUploaded = () => {
    setShowDocumentUpload(false);
    router.refresh();
  };

  const handleForgetStep = async () => {
    setClearingStep(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Session expirée');

      const response = await fetch('/api/guided_state/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clear: true }),
      });

      if (!response.ok) {
        throw new Error('Réinitialisation impossible');
      }

      setGuidedState(null);
      router.refresh();
    } catch (error) {
      console.error('Impossible d\'oublier la dernière étape', error);
    } finally {
      setClearingStep(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 text-rose-500 animate-spin mx-auto" />
          <p className="text-slate-600">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingWizard
        onComplete={() => {
          setShowOnboarding(false);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="h-full flex bg-slate-50">
      <DashboardSidebar
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        userEmail={user?.email}
        userName={profile?.name || undefined}
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
          {selectedTab === 'base' && (
            <div className="space-y-6">
              <BaseCard
                guidedState={guidedState}
                guidedLoading={guidedLoading}
                onResume={() => {
                  if (guidedState?.next_step) {
                    openChat(`Reprenons ici : ${guidedState.next_step}`);
                  } else {
                    openChat();
                  }
                }}
                onChangeSubject={() => openChat('Changeons de sujet. Aide-moi sur autre chose.')}
                onForgetStep={handleForgetStep}
                clearingStep={clearingStep}
              />

              <WhatWeighsCard onSelect={openChat} />

              {needsProfile && (
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="w-full rounded-2xl border border-dashed border-rose-300 bg-rose-50 px-4 py-3 text-left text-rose-700 hover:bg-rose-100"
                >
                  Confier davantage ma situation à Phoenix
                </button>
              )}

              <PhoenixJournal />

              <DecoderCard />

              <QuietFragmentsCard />
            </div>
          )}

          {selectedTab === 'documents' && (
            <DocumentsView
              documents={documents || []}
              loading={documentsLoading}
              onAdd={() => setShowDocumentUpload(true)}
              onAnalyze={(name) =>
                openChat(`Peux-tu analyser le document "${name}" et me résumer ce qui compte ?`)
              }
            />
          )}
        </div>
      </div>

      {showDocumentUpload && user && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <p className="text-sm uppercase text-slate-500">Déposer un document</p>
                <h3 className="text-lg font-semibold text-slate-900">Phoenix le gardera pour vous</h3>
              </div>
              <button
                onClick={() => setShowDocumentUpload(false)}
                className="text-2xl leading-none text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <DocumentUpload onDocumentUploaded={handleDocumentUploaded} userId={user.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BaseCard({
  guidedState,
  guidedLoading,
  onResume,
  onChangeSubject,
  onForgetStep,
  clearingStep,
}: {
  guidedState: GuidedState | null;
  guidedLoading: boolean;
  onResume: () => void;
  onChangeSubject: () => void;
  onForgetStep: () => void;
  clearingStep: boolean;
}) {
  const title = guidedState?.next_step ? 'On reprend où tu veux.' : 'On est là.';
  const description = guidedState?.situation
    ? guidedState.situation
    : 'Phoenix garde tout en mémoire. Tu peux faire une pause quand tu veux.';

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
          <PauseCircle className="h-6 w-6 text-rose-500" />
        </div>
        <div>
          <p className="uppercase tracking-wide text-xs text-slate-500">Base arrière</p>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        </div>
      </div>
      <p className="text-slate-700 leading-relaxed">{description}</p>
      {guidedState?.next_step && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
          <p className="text-sm text-slate-600">On s&apos;est arrêté ici :</p>
          <p className="text-base text-slate-900">{formatNextStep(guidedState.next_step)}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={onResume}
              disabled={guidedLoading}
              className="flex-1 rounded-xl bg-slate-900 text-white px-4 py-2 font-medium hover:bg-slate-800 disabled:opacity-40"
            >
              Reprendre
            </button>
            <button
              type="button"
              onClick={onChangeSubject}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:border-slate-300"
            >
              Changer de sujet
            </button>
            <button
              type="button"
              onClick={onForgetStep}
              disabled={clearingStep}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-slate-500 hover:border-slate-300 disabled:opacity-50"
            >
              {clearingStep ? 'En cours...' : 'Oublier cette étape'}
            </button>
          </div>
        </div>
      )}
      {!guidedState?.next_step && (
        <button
          onClick={onResume}
          disabled={guidedLoading}
          className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-medium hover:bg-slate-800 disabled:opacity-40"
        >
          {guidedLoading ? 'Recherche en cours...' : 'Reprendre avec Phoenix'}
        </button>
      )}
    </div>
  );
}

function WhatWeighsCard({ onSelect }: { onSelect: (message: string) => void }) {
  const options = [
    {
      id: 'courrier',
      label: 'Un courrier',
      helper: 'Besoin de décoder',
      prompt:
        'J’ai reçu un courrier administratif que je ne comprends pas. Aide-moi à le décoder point par point.',
    },
    {
      id: 'fatigue',
      label: 'La fatigue',
      helper: 'Je suis à bout',
      prompt: 'Je suis à bout et j’ai besoin que tu m’aides à faire une pause sans culpabiliser.',
    },
    {
      id: 'perdu',
      label: 'Je suis perdu(e)',
      helper: 'Je ne sais plus par quoi commencer',
      prompt: 'Je me sens perdu(e). Peux-tu me proposer une micro-action simple pour aujourd’hui ?',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <p className="text-sm uppercase tracking-wide text-slate-500">Qu’est-ce qui te pèse ?</p>
      <h2 className="text-xl font-semibold text-slate-900 mt-2">On traite une chose à la fois.</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.prompt)}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-left hover:border-rose-300 hover:bg-rose-50"
          >
            <div className="text-base font-medium text-slate-900">{option.label}</div>
            <div className="text-xs text-slate-500">{option.helper}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DocumentsView({
  documents,
  loading,
  onAdd,
  onAnalyze,
}: {
  documents: any[];
  loading: boolean;
  onAdd: () => void;
  onAnalyze: (name: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Documents</p>
          <h2 className="text-2xl font-semibold text-slate-900">On garde tout à portée de main</h2>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:border-slate-400"
        >
          Déposer un document
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Lecture des documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
          Aucun document pour le moment. Phoenix peut en garder sans limite.
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{doc.nom}</p>
                  <p className="text-xs text-slate-500">{doc.type || 'Document'} · {doc.date}</p>
                </div>
              </div>
              <button
                onClick={() => onAnalyze(doc.nom)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:border-rose-300 hover:text-rose-500"
              >
                <MessageSquare className="h-4 w-4" />
                Demander à Phoenix
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
