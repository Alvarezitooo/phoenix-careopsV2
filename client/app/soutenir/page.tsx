'use client';

import { Heart, Coffee, Users, Star } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Stripe Price IDs
const STRIPE_PRICE_IDS = {
  essential: 'price_1SDgQbGqCED3zWAv9CumyPpt', // 5€/mois - Soutien Essentiel
  generous: 'price_1SDgR8GqCED3zWAvADexF6yv',  // 10€/mois - Soutien Généreux
  patron: 'price_1SDgRXGqCED3zWAvpfhOnDCf',    // 20€/mois - Soutien Héroïque
};

export default function SoutenirPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, tier: string) => {
    setLoading(tier);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url; // Redirige vers Stripe Checkout
      } else {
        alert('Erreur lors de la création de la session de paiement');
      }
    } catch (error) {
      console.error('Erreur Stripe:', error);
      alert('Une erreur est survenue. Réessayez plus tard.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header simple */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-rose-500" />
            <span className="text-xl font-semibold">PhoenixCare</span>
          </Link>
          <Link href="/chat" className="text-rose-600 hover:text-rose-700">
            ← Retour au chat
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Heart className="h-16 w-16 text-rose-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Soutenir Phoenix 🕊️
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Phoenix reste <strong>gratuit pour toutes les familles</strong> grâce à la générosité
            de parents et de soutiens comme vous.
          </p>
        </div>

        {/* Mission Phoenix */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-12">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6 text-center">
            🚀 Phoenix - Bêta Test en Cours
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto">
            PhoenixCare est en phase de test pour aider les familles d&apos;enfants
            en situation de handicap à naviguer les démarches administratives.
          </p>
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 bg-rose-50 px-4 py-2 rounded-full">
              <span className="text-3xl font-bold text-rose-600">100%</span>
              <span className="text-slate-700 font-medium">Gratuit · Toujours</span>
            </div>
          </div>
        </div>

        {/* Options de don */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <Coffee className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Soutien Essentiel</h3>
            <p className="text-slate-600 mb-4">
              Soutenez PhoenixCare avec un petit geste
            </p>
            <div className="text-2xl font-bold text-slate-900 mb-4">5€/mois</div>
            <button
              onClick={() => handleSubscribe(STRIPE_PRICE_IDS.essential, 'essential')}
              disabled={loading !== null}
              className="w-full bg-amber-500 text-white py-3 rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'essential' ? 'Chargement...' : 'Choisir ce palier ☕'}
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-rose-200 hover:shadow-md transition-shadow relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                💝 Populaire
              </span>
            </div>
            <Heart className="h-12 w-12 text-rose-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Soutien Généreux</h3>
            <p className="text-slate-600 mb-4">
              Aidez Phoenix à grandir et aider plus de familles
            </p>
            <div className="text-2xl font-bold text-slate-900 mb-4">10€/mois</div>
            <button
              onClick={() => handleSubscribe(STRIPE_PRICE_IDS.generous, 'generous')}
              disabled={loading !== null}
              className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'generous' ? 'Chargement...' : 'Choisir ce palier 💝'}
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <Star className="h-12 w-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Soutien Héroïque</h3>
            <p className="text-slate-600 mb-4">
              Devenez mécène de Phoenix et de l&apos;inclusion
            </p>
            <div className="text-2xl font-bold text-slate-900 mb-4">20€/mois</div>
            <button
              onClick={() => handleSubscribe(STRIPE_PRICE_IDS.patron, 'patron')}
              disabled={loading !== null}
              className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'patron' ? 'Chargement...' : 'Choisir ce palier ⭐'}
            </button>
          </div>
        </div>

        {/* Transparence */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            💡 Transparence totale
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 mb-4">
              PhoenixCare reste <strong>100% gratuit</strong> pour les familles.
            </p>
            <p className="text-slate-600">
              Les coûts de fonctionnement (IA, hébergement) sont couverts par des
              contributions volontaires de la communauté.
            </p>
            <p className="text-slate-600 mt-4">
              <strong>Objectif :</strong> Pérenniser le service pour aider un maximum de familles.
            </p>
          </div>
        </div>

        {/* Mission personnelle */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-8">
            💝 Pourquoi Phoenix existe
          </h2>
          <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-sm border border-slate-200">
            <p className="text-lg text-slate-700 italic mb-4">
              &quot;En tant que papa d&apos;un enfant en situation de handicap, je connais
              ce défi administratif. Phoenix est né de ce vécu : simplifier
              l&apos;accès aux aides pour toutes les familles qui font face au même défi.&quot;
            </p>
            <div className="font-semibold text-slate-900">— Matthieu, créateur de Phoenix</div>
          </div>

          {/* Lien gestion abonnement */}
          <div className="max-w-2xl mx-auto mt-8 bg-slate-50 border border-slate-200 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Déjà contributeur ?
                </h3>
                <p className="text-sm text-slate-600">
                  Gérez votre abonnement (factures, annulation...)
                </p>
              </div>
              <Link
                href="/soutenir/gerer"
                className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors font-medium whitespace-nowrap"
              >
                Gérer mon abonnement
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}