'use client';

import { Suspense } from 'react';
import ChatInterface from '@/components/ChatInterface';
import FeedbackButton from '@/components/FeedbackButton';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useSearchParams } from 'next/navigation';
import { useUserAides, useUserDocuments, useUserDeadlines, useFamilyProfile } from '@/hooks/useSupabaseData';

// Composant séparé pour le contenu qui utilise useSearchParams
function ChatContent() {
  const { user, loading: isLoading } = useSupabaseAuth();
  const searchParams = useSearchParams();
  const prefilledQuestion = searchParams.get('q');

  // Charger le contexte utilisateur pour personnaliser les réponses
  const { aides } = useUserAides();
  const { documents } = useUserDocuments();
  const { deadlines } = useUserDeadlines();
  const { profile } = useFamilyProfile();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <ChatInterface
        userId={user?.id || 'anonymous'}
        initialMessage={prefilledQuestion || undefined}
        userContext={{
          aides,
          documents,
          deadlines,
          profile
        }}
      />
      <FeedbackButton />
    </div>
  );
}

// Page principale avec Suspense boundary
export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
