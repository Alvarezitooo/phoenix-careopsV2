'use client';

import { useState } from 'react';
import { MessageCircle, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackButtonProps {
  formUrl?: string;
}

export default function FeedbackButton({
  formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSd2lcEiNqX1PGq1x2hegIhITsXdlbcqpBL8ri6T1aEmYnxFxg/viewform?usp=header'
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Ne pas afficher si l'utilisateur a fermé
  if (isDismissed) return null;

  const handleOpenForm = () => {
    window.open(formUrl, '_blank');
    setIsOpen(false);
  };

  return (
    <>
      {/* Bouton flottant discret */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="group bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
          aria-label="Donner votre avis"
        >
          <MessageCircle className="h-6 w-6" />

          {/* Badge "Beta" */}
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
            Beta
          </span>
        </button>

        {/* Tooltip au survol */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-slate-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
            Donnez votre avis
            <div className="absolute top-full right-4 w-2 h-2 bg-slate-900 transform rotate-45 -mt-1"></div>
          </div>
        </div>
      </motion.div>

      {/* Modal de feedback */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 z-50"
            >
              {/* Bouton fermer */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Contenu */}
              <div className="text-center space-y-6">
                <div>
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-rose-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Votre avis compte !
                  </h3>
                  <p className="text-slate-600">
                    Vous testez PhoenixIA en avant-première. Vos retours sont essentiels pour améliorer notre assistant IA.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2">
                  <p className="text-sm text-slate-700 font-medium">📊 Ce questionnaire permet de :</p>
                  <ul className="text-sm text-slate-600 space-y-1 ml-4">
                    <li>• Améliorer la précision des réponses</li>
                    <li>• Identifier les bugs et problèmes</li>
                    <li>• Prioriser les nouvelles fonctionnalités</li>
                  </ul>
                  <p className="text-xs text-slate-500 mt-3">⏱️ Durée : 3-5 minutes</p>
                </div>

                {/* Boutons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleOpenForm}
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold py-3 rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
                  >
                    Donner mon avis
                    <ExternalLink className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-500 hover:text-slate-700 text-sm transition-colors"
                  >
                    Plus tard
                  </button>

                  <button
                    onClick={() => {
                      setIsDismissed(true);
                      setIsOpen(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs transition-colors"
                  >
                    Ne plus afficher
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
