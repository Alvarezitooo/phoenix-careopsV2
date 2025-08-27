'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, Loader2 } from 'lucide-react';
import { uiCopy } from '@/lib/uiCopy';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulation d'une connexion
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Définir le cookie de session
    document.cookie = 'session=ok; Path=/; SameSite=Lax; Max-Age=86400';

    // Rediriger vers le dashboard
    router.push('/app');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header avec logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-800 mb-6">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="h-12 w-12 text-rose-500" />
            <span className="text-3xl font-semibold text-slate-900">PhoenixCare</span>
          </div>
          <p className="text-slate-600">Connectez-vous à votre espace</p>
        </div>

        {/* Formulaire de connexion */}
        <motion.form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                {uiCopy.auth.login.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none transition-colors"
                placeholder="votre.email@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-rose-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-rose-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-rose-300 focus:outline-none flex items-center justify-center min-h-[48px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Connexion en cours...
                </>
              ) : (
                uiCopy.auth.login.submit
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Connexion simulée - Aucun mot de passe requis
            </p>
          </div>
        </motion.form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            Nouveau sur PhoenixCare ?{' '}
            <Link href="/" className="text-rose-600 hover:text-rose-700 font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
