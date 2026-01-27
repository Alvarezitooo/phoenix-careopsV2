'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import { Heart, Loader2, MessageSquare, Book, FileText, Users } from 'lucide-react';

type GuidedState = {
  situation?: string;
  priority?: string;
  next_step?: string;
};

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuth();
  const [guidedState, setGuidedState] = useState<GuidedState | null>(null);
  const [guidedLoading, setGuidedLoading] = useState(true);
  const [errorGuidedState, setErrorGuidedState] = useState<string | null>(null);
  const [isClearingStep, setIsClearingStep] = useState(false);

  useEffect(() => {
    const fetchGuidedState = async () => {
      if (!user) {
        setGuidedLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          setGuidedLoading(false);
          return;
        }

        const response = await fetch('/api/guided_state', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setGuidedState(data);
        } else if (response.status !== 404) {
          const errorData = await response.json();
          setErrorGuidedState(errorData.detail || 'Impossible de récupérer la dernière étape.');
        }
      } catch (error) {
        console.error('Failed to fetch guided state:', error);
        setErrorGuidedState('Connexion instable. Réessaye plus tard.');
      } finally {
        setGuidedLoading(false);
      }
    };

    fetchGuidedState();
  }, [user]);

  const handleResume = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (guidedState?.next_step) {
      router.push(`/guide?q=${encodeURIComponent(`Reprenons ici : ${guidedState.next_step}`)}`);
    } else {
      router.push('/guide');
    }
  };

  const handleForgetStep = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsClearingStep(true);
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
        throw new Error('Erreur de réinitialisation');
      }

      setGuidedState(null);
      setErrorGuidedState(null);
    } catch (error) {
      console.error('Impossible d\'oublier l\'étape', error);
      setErrorGuidedState('Impossible d\'oublier cette étape pour le moment.');
    } finally {
      setIsClearingStep(false);
    }
  };

  if (authLoading || guidedLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
        <p className="mt-4 text-slate-600">Chargement...</p>
      </div>
    );
  }

  const IntentionButton = ({ href, icon: Icon, title, subtitle }: { href: string; icon: React.ElementType; title: string; subtitle: string }) => (
    <Link href={user ? href : '/login'} className="block rounded-2xl border border-slate-200 bg-white p-6 text-left hover:border-rose-300 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
          <Icon className="h-6 w-6 text-rose-500" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-900">
            <Heart className="h-6 w-6 text-rose-500" />
            <span className="font-semibold tracking-tight">PhoenixCare</span>
          </Link>
          <div className="space-x-4 text-sm">
            {user ? (
              <Link href="/logout" className="text-slate-600 hover:text-slate-900">
                Déconnexion
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-slate-600 hover:text-slate-900">
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center rounded-full bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
                >
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-12">
          
          <section className="text-center">
            <p className="text-lg font-medium text-rose-600">Base arrière</p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-semibold text-slate-900">Bonjour{user ? `, ${user.user_metadata.name || user.email.split('@')[0]}` : ''}.</h1>
            <p className="mt-4 text-lg text-slate-700 max-w-2xl mx-auto">
              Prenez un instant. Aucune urgence, aucune tâche. Nous sommes là.
            </p>
          </section>

          {user && guidedState?.next_step && (
            <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <p className="text-sm uppercase tracking-wide text-slate-500">Repère précédent</p>
              <p className="text-lg text-slate-800">On s'était arrêté ici : "{guidedState.next_step}"</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleResume}
                  className="flex-1 rounded-xl bg-slate-900 text-white px-4 py-3 font-medium hover:bg-slate-800 transition-colors"
                >
                  Reprendre le fil
                </button>
                <button
                  type="button"
                  onClick={handleForgetStep}
                  disabled={isClearingStep}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  {isClearingStep ? 'En cours...' : 'Changer de sujet'}
                </button>
              </div>
              {errorGuidedState && <p className="text-sm text-red-600">{errorGuidedState}</p>}
            </section>
          )}

          {(!user || !guidedState?.next_step) && (
            <section>
              <h2 className="text-center text-2xl font-semibold text-slate-800 mb-2">Aujourd'hui, je suis là pour...</h2>
              <p className="text-center text-slate-600 mb-8">Choisissez une porte d'entrée. Une seule chose à la fois.</p>
              <div className="grid gap-4 sm:grid-cols-1">
                <IntentionButton 
                  href="/guide"
                  icon={MessageSquare}
                  title="... être écouté(e) et guidé(e)."
                  subtitle="Ouvrir une conversation pour y voir plus clair."
                />
                <IntentionButton 
                  href="/journal"
                  icon={Book}
                  title="... mettre mes pensées au clair."
                  subtitle="Écrire dans un espace privé, sans jugement."
                />
                <IntentionButton 
                  href="/decodeur"
                  icon={FileText}
                  title="... déchiffrer un langage administratif."
                  subtitle="Traduire un courrier ou un document complexe."
                />
                <IntentionButton 
                  href="/fragments"
                  icon={Users}
                  title="... juste lire, sans interagir."
                  subtitle="Parcourir des témoignages anonymes."
                />
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PhoenixCare · Une seule action à la fois.</p>
          <div className="mt-2 space-x-4">
            <Link href="/cgu" className="hover:text-slate-800">CGU</Link>
            <Link href="/mentions-legales" className="hover:text-slate-800">Mentions Légales</Link>
            <Link href="/politique-confidentialite" className="hover:text-slate-800">Confidentialité</Link>
            <Link href="/charte" className="hover:text-slate-800">Notre Charte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
