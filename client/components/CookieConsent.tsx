'use client';

import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Vérifier si le consentement a déjà été donné
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Petit délai pour ne pas agresser l'utilisateur dès l'arrivée
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  const handleRefuse = () => {
    localStorage.setItem('cookie_consent', JSON.stringify({
      accepted: false,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-fadeIn">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            {/* Icône */}
            <div className="flex-shrink-0">
              <Cookie className="h-8 w-8 text-rose-500" />
            </div>

            {/* Contenu */}
            <div className="flex-1 space-y-3">
              <h3 className="text-lg md:text-xl font-bold text-slate-900">
                🍪 Cookies et données personnelles
              </h3>

              <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                Phoenix utilise des cookies essentiels pour vous offrir une meilleure expérience (authentification, préférences).
                Nous respectons votre vie privée et ne vendons jamais vos données.
                Consultez notre{' '}
                <a
                  href="/politique-confidentialite"
                  className="text-rose-600 hover:text-rose-700 underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  politique de confidentialité
                </a>
                {' '}pour en savoir plus.
              </p>

              {/* Boutons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAccept}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  ✅ Accepter
                </button>

                <button
                  onClick={handleRefuse}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  ❌ Refuser
                </button>

                <a
                  href="/politique-confidentialite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-slate-50 text-slate-600 px-6 py-3 rounded-xl font-medium transition-all duration-200 border-2 border-slate-200 text-center"
                >
                  📖 En savoir plus
                </a>
              </div>
            </div>

            {/* Bouton fermer (compte comme refus) */}
            <button
              onClick={handleRefuse}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Barre décorative */}
        <div className="h-2 bg-gradient-to-r from-purple-500 via-rose-500 to-pink-500"></div>
      </div>
    </div>
  );
}
