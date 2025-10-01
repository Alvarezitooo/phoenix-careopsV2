'use client';

import { Heart, Coffee, Users, Star } from 'lucide-react';
import Link from 'next/link';

export default function SoutenirPage() {
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

        {/* Stats impact */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-12">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6 text-center">
            L'impact de Phoenix
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-rose-600 mb-2">1,247</div>
              <div className="text-slate-600">Familles aidées</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-rose-600 mb-2">8,934</div>
              <div className="text-slate-600">Questions répondues</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-rose-600 mb-2">100%</div>
              <div className="text-slate-600">Gratuit toujours</div>
            </div>
          </div>
        </div>

        {/* Options de don */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <Coffee className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Un café</h3>
            <p className="text-slate-600 mb-4">
              Offrez un café à l'équipe Phoenix
            </p>
            <div className="text-2xl font-bold text-slate-900 mb-4">3€</div>
            <button className="w-full bg-amber-500 text-white py-3 rounded-xl font-medium hover:bg-amber-600 transition-colors">
              Offrir un café ☕
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-rose-200 hover:shadow-md transition-shadow relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                💝 Populaire
              </span>
            </div>
            <Heart className="h-12 w-12 text-rose-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Soutien mensuel</h3>
            <p className="text-slate-600 mb-4">
              Aidez Phoenix à grandir et aider plus de familles
            </p>
            <div className="text-2xl font-bold text-slate-900 mb-4">10€/mois</div>
            <button className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors">
              Soutenir Phoenix 💝
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <Star className="h-12 w-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Mécénat</h3>
            <p className="text-slate-600 mb-4">
              Devenez mécène de Phoenix et de l'inclusion
            </p>
            <div className="text-2xl font-bold text-slate-900 mb-4">25€/mois</div>
            <button className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors">
              Devenir mécène ⭐
            </button>
          </div>
        </div>

        {/* Transparence */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            💡 Transparence totale
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Nos coûts mensuels :
              </h3>
              <ul className="space-y-2 text-slate-600">
                <li>• IA (Gemini) : ~150€/mois</li>
                <li>• Hébergement : ~50€/mois</li>
                <li>• Développement : Bénévole</li>
                <li>• <strong>Total : ~200€/mois</strong></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Objectif actuel :
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">42 soutiens sur 60</span>
                  <span className="font-semibold">70%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div className="bg-rose-500 h-3 rounded-full" style={{width: '70%'}}></div>
                </div>
                <p className="text-sm text-slate-500">
                  Il nous manque 18 soutiens pour couvrir 100% des coûts !
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Témoignages */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-8">
            Ce que disent les familles
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <p className="text-slate-600 italic mb-4">
                "Phoenix m'a évité des mois de galère administrative.
                En 5 minutes j'avais toutes les réponses pour l'AEEH de mon fils."
              </p>
              <div className="font-semibold text-slate-900">— Marie, maman de Lucas (autisme)</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <p className="text-slate-600 italic mb-4">
                "Enfin un outil qui comprend vraiment nos problématiques.
                Je recommande Phoenix à tous les parents que je croise."
              </p>
              <div className="font-semibold text-slate-900">— Thomas, papa d'Emma (trisomie)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}