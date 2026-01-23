'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import QuietFragmentsCard from '@/components/QuietFragmentsCard';
import { Heart, Loader2 } from 'lucide-react';

type GuidedState = {
  situation?: string;
  priority?: string;
  next_step?: string;
};

const formatNextStep = (value?: string) => {
  if (!value) return '';
  const clean = value.trim();
  if (clean.length <= 120) return clean;
  return `${clean.slice(0, 117).trimEnd()}...`;
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
      router.push(`/chat?q=${encodeURIComponent(`Reprenons ici : ${guidedState.next_step}`)}`);
    } else {
      router.push('/chat');
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
      router.refresh();
    } catch (error) {
      console.error('Impossible d\'oublier l\'étape', error);
      setErrorGuidedState('Impossible d\'oublier cette étape pour le moment.');
    } finally {
      setIsClearingStep(false);
    }
  };

  const handleChangeSubject = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/chat?q=Changeons de sujet. Aide-moi sur autre chose.');
  };

  const handleNeed = (message: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push(`/chat?q=${encodeURIComponent(message)}`);
  };

  if (authLoading || guidedLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
        <p className="mt-4 text-slate-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900">
            <Heart className="h-6 w-6 text-rose-500" />
            <span className="font-semibold tracking-tight">PhoenixCare</span>
          </div>
          <div className="space-x-4 text-sm">
            {user ? (
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                Accéder à ma base
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <p className="text-sm uppercase tracking-wide text-slate-500">Base arrière</p>
            <h1 className="text-4xl font-semibold text-slate-900">On est là.</h1>
            <p className="text-lg text-slate-700">
              PhoenixCare n&apos;est pas un agenda. C&apos;est un endroit où déposer, faire une pause et reprendre quand
              vous le décidez.
            </p>
            {guidedState?.situation && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Dernier repère retenu</p>
                <p className="mt-1">{guidedState.situation}</p>
              </div>
            )}
            {errorGuidedState && (
              <p className="text-sm text-red-600">{errorGuidedState}</p>
            )}
            {guidedState?.next_step ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                <p className="text-sm text-slate-600">On s&apos;était arrêté ici :</p>
                <p className="text-base text-slate-900">{formatNextStep(guidedState.next_step)}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={handleResume}
                    className="flex-1 rounded-xl bg-slate-900 text-white px-4 py-2 font-medium hover:bg-slate-800"
                  >
                    Reprendre
                  </button>
                  <button
                    type="button"
                    onClick={handleChangeSubject}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:border-slate-300"
                  >
                    Changer de sujet
                  </button>
                  <button
                    type="button"
                    onClick={handleForgetStep}
                    disabled={isClearingStep}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-slate-500 hover:border-slate-300 disabled:opacity-50"
                  >
                    {isClearingStep ? 'En cours...' : 'Oublier cette étape'}
                  </button>
                </div>
              </div>
            ) : (
            <button
              onClick={handleResume}
              className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-medium hover:bg-slate-800"
            >
              Reprendre à mon rythme
            </button>
            )}
            <p className="text-xs text-slate-500">
              Vous pouvez vous arrêter à tout moment. Phoenix reprendra exactement où vous en étiez.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-sm uppercase tracking-wide text-slate-500">Qu&apos;est-ce qui pèse maintenant ?</p>
            <h2 className="text-2xl font-semibold text-slate-900">Une seule chose à traiter.</h2>
            <p className="text-sm text-slate-600 mt-2">
              Choisissez ce qui vous alourdit. Phoenix ouvrira le chat avec la bonne question déjà prête.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => handleNeed('Aide-moi à décoder un courrier que je viens de recevoir.')} 
                className="rounded-2xl border border-slate-300 px-4 py-3 text-left hover:border-rose-300"
              >
                <span className="font-medium text-slate-900">Un courrier</span>
                <p className="text-xs text-slate-500">Je veux comprendre</p>
              </button>
              <button
                onClick={() => handleNeed('Je suis épuisé(e). Aide-moi à ralentir sans culpabiliser.')} 
                className="rounded-2xl border border-slate-300 px-4 py-3 text-left hover:border-rose-300"
              >
                <span className="font-medium text-slate-900">La fatigue</span>
                <p className="text-xs text-slate-500">J&apos;ai besoin d&apos;une pause</p>
              </button>
              <button
                onClick={() => handleNeed('Je me sens perdu(e). Propose-moi une micro-action pour redémarrer.')} 
                className="rounded-2xl border border-slate-300 px-4 py-3 text-left hover:border-rose-300"
              >
                <span className="font-medium text-slate-900">Je suis perdu(e)</span>
                <p className="text-xs text-slate-500">Tu peux m&apos;orienter ?</p>
              </button>
            </div>
          </section>

          <QuietFragmentsCard />

          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <p className="text-sm uppercase tracking-wide text-slate-500">Notre promesse</p>
            <h2 className="text-2xl font-semibold text-slate-900">PhoenixCare est une base arrière.</h2>
            <p className="text-slate-700">
              Pas d&apos;agenda, pas de compte à rebours. Juste des micro-actions quand vous vous sentez prêt, un journal
              silencieux quand il faut déposer, et des mots d&apos;autres parents quand le cœur devient lourd.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <p className="text-sm uppercase tracking-wide text-slate-500">Charte éthique du silence</p>
            <h2 className="text-2xl font-semibold text-slate-900">Respect radical du calme et de la vie privée.</h2>
            <p className="text-slate-700">
              PhoenixCare suit quatre piliers : regard détourné, amnistie de l&apos;absence, neutralité de la mémoire, posture de l&apos;ombre.
            </p>
            <Link
              href="/charte"
              className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:border-slate-300"
            >
              Lire la charte en entier
            </Link>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-xs text-slate-500">
          © {new Date().getFullYear()} PhoenixCare · Une seule action à la fois.
        </div>
      </footer>
    </div>
  );
}
