'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, CheckCircle } from 'lucide-react';

// Composant séparé pour le contenu qui utilise useSearchParams
function SuccessContent() {
  const searchParams = useSearchParams();
  const session_id = searchParams.get('session_id');

  useEffect(() => {
    // TODO: Optionnel - Vérifier le paiement côté serveur avec session_id
    console.log('Paiement réussi! Session ID:', session_id);
  }, [session_id]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Merci pour votre soutien ! 💝
        </h1>

        <p className="text-lg text-slate-600 mb-6">
          Votre abonnement a été créé avec succès. Vous allez recevoir un email de confirmation de Stripe.
        </p>

        <div className="bg-rose-50 rounded-xl p-6 mb-8">
          <Heart className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-slate-700">
            Grâce à vous, PhoenixCare peut continuer à accompagner gratuitement
            des centaines de familles d'enfants en situation de handicap.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/chat"
            className="block w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors"
          >
            Retour au chat
          </Link>
          <Link
            href="/"
            className="block w-full text-slate-600 hover:text-slate-900 py-3 rounded-xl font-medium transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>

        <p className="text-sm text-slate-500 mt-6">
          Numéro de session : {session_id?.slice(0, 20)}...
        </p>
      </div>
    </div>
  );
}

// Page principale avec Suspense boundary
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
