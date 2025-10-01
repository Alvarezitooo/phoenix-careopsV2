'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const auth = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  const { signIn } = auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔐 Tentative de connexion avec:', email);

    try {
      const { data, error } = await signIn(email, password);

      console.log('📊 Réponse Supabase:', { data, error });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ Utilisateur connecté:', data.user.id);
        console.log('🔄 Redirection vers /dashboard...');

        // Attendre que les cookies soient mis à jour avant de rediriger
        await new Promise(resolve => setTimeout(resolve, 100));

        // Forcer un hard reload pour que le middleware détecte la session
        window.location.href = '/dashboard';
      } else {
        console.warn('⚠️ Pas d\'utilisateur dans la réponse');
        setError('Connexion réussie mais pas d\'utilisateur retourné');
      }
    } catch (err: any) {
      console.error('💥 Erreur catch:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
      console.log('🏁 Fin du processus de connexion');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Connexion à Phoenix</h1>
          <p className="text-slate-600 mt-2">Votre assistant social personnalisé</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>
        <div className="mt-8 text-center">
          <p className="text-slate-600">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="text-rose-600 hover:text-rose-700 font-medium">
              Créer un compte
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-slate-600 hover:text-slate-700 text-sm">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}