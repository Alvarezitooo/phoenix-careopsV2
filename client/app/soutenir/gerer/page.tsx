'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, CreditCard, Loader2, ExternalLink } from 'lucide-react';

export default function GererAbonnementPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      // Note: En production, il faudra récupérer le customerId depuis Supabase
      // Pour l'instant, on redirige directement vers le portail Stripe
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_URL}/api/stripe/customer-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 'cus_placeholder' // TODO: Récupérer depuis Supabase user metadata
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Impossible de charger le portail de gestion. Contactez-nous par email.');
      }
    } catch (error) {
      console.error('Erreur portail Stripe:', error);
      setError('Une erreur est survenue. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-rose-500" />
            <span className="text-xl font-semibold">PhoenixCare</span>
          </Link>
          <Link href="/soutenir" className="text-rose-600 hover:text-rose-700">
            ← Retour
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-4">
              <CreditCard className="h-8 w-8 text-rose-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Gérer mon abonnement
            </h1>
            <p className="text-slate-600">
              Accédez au portail Stripe pour gérer votre abonnement
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                Ce que vous pouvez faire :
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Voir vos factures et paiements</li>
                <li>• Mettre à jour votre moyen de paiement</li>
                <li>• Modifier ou annuler votre abonnement</li>
                <li>• Télécharger vos reçus fiscaux</li>
              </ul>
            </div>

            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="w-full bg-rose-500 text-white py-4 rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Chargement...</span>
                </>
              ) : (
                <>
                  <span>Accéder au portail Stripe</span>
                  <ExternalLink className="h-5 w-5" />
                </>
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Vous serez redirigé vers le portail sécurisé Stripe pour gérer votre abonnement.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">
              Besoin d&apos;aide ?
            </h3>
            <p className="text-slate-600 mb-4">
              Si vous rencontrez un problème, n&apos;hésitez pas à nous contacter :
            </p>
            <a
              href="mailto:support@phoenixcare.fr"
              className="text-rose-600 hover:text-rose-700 font-medium"
            >
              support@phoenixcare.fr
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
