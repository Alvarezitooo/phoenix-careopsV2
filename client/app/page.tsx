'use client';

import Link from 'next/link';
import { Heart, FileText, Zap, Frown, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext'; // Assuming this context exists
import ResumeCard from '@/components/ResumeCard'; // Import ResumeCard

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useSupabaseAuth(); // Get user and auth loading state
  const [guidedState, setGuidedState] = useState<any>(null);
  const [isLoadingGuidedState, setIsLoadingGuidedState] = useState(true);
  const [errorGuidedState, setErrorGuidedState] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuidedState = async () => {
      if (!user || isAuthLoading) {
        setIsLoadingGuidedState(false);
        return;
      }

      try {
        const token = await user.getIdToken(); // Get the ID token for authorization
        const response = await fetch('/api/guided_state', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setGuidedState(data);
        } else if (response.status === 404) {
          setGuidedState(null); // No guided state found
        } else {
          const errorData = await response.json();
          setErrorGuidedState(errorData.detail || 'Erreur lors de la récupération de l&apos;état guidé.');
        }
      } catch (error) {
        console.error("Failed to fetch guided state:", error);
        setErrorGuidedState('Impossible de se connecter au serveur pour récupérer l&apos;état guidé.');
      } finally {
        setIsLoadingGuidedState(false);
      }
    };

    fetchGuidedState();
  }, [user, isAuthLoading]);

  const handleCardClick = (initialMessage: string) => {
    router.push(`/chat?initialMessage=${encodeURIComponent(initialMessage)}`);
  };

  // Show loading spinner while auth or guided state is loading
  if (isAuthLoading || isLoadingGuidedState) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
        <p className="mt-4 text-slate-600">Chargement...</p>
      </div>
    );
  }

  // If user is not logged in, show the default landing page (or redirect to login)
  if (!user) {
    // This part should ideally redirect to login or show a login prompt
    // For now, it will show the default cards, but a user won't be able to chat without login
    // The chat page itself handles the login check.
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header - Reused/Adapted */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-rose-500" />
                <span className="text-xl font-semibold text-slate-900">PhoenixCare</span>
              </div>
              <div className="space-x-3">
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-slate-900 font-medium"
                >
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="bg-rose-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-rose-600 transition-colors focus:ring-2 focus:ring-rose-300 focus:outline-none"
                >
                  Créer un compte
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 tracking-tight mb-8 max-w-3xl">
            Comment puis-je vous accompagner aujourd&apos;hui ?
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
            {/* Card 1: Administratif */}
            <button
              onClick={() => router.push('/login')} // Redirect to login if not authenticated
              className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 hover:shadow-lg hover:border-rose-300 transition-all duration-200 flex flex-col items-center text-center space-y-4"
            >
              <FileText className="h-12 w-12 text-blue-500" />
              <h2 className="text-xl font-semibold text-slate-800">Administratif</h2>
              <p className="text-slate-600">MDPH, CAF, allocations, dossiers...</p>
            </button>

            {/* Card 2: Fatigue */}
            <button
              onClick={() => router.push('/login')} // Redirect to login if not authenticated
              className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 hover:shadow-lg hover:border-rose-300 transition-all duration-200 flex flex-col items-center text-center space-y-4"
            >
              <Frown className="h-12 w-12 text-yellow-500" />
              <h2 className="text-xl font-semibold text-slate-800">Fatigue & Épuisement</h2>
              <p className="text-slate-600">Besoin de souffler, de soutien moral...</p>
            </button>

            {/* Card 3: Perdu */}
            <button
              onClick={() => router.push('/login')} // Redirect to login if not authenticated
              className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 hover:shadow-lg hover:border-rose-300 transition-all duration-200 flex flex-col items-center text-center space-y-4"
            >
              <Zap className="h-12 w-12 text-rose-500" />
              <h2 className="text-xl font-semibold text-slate-800">Je suis perdu(e)</h2>
              <p className="text-slate-600">Besoin d'orientation, de clarté...</p>
            </button>
          </div>
        </main>

        <footer className="bg-slate-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-slate-400 text-sm">© {new Date().getFullYear()} PhoenixCare. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    );
  }

  // If user is logged in and guided state is loaded
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header - Reused/Adapted */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-rose-500" />
              <span className="text-xl font-semibold text-slate-900">PhoenixCare</span>
            </div>
            <div className="space-x-3">
              <Link
                href="/login"
                className="text-slate-600 hover:text-slate-900 font-medium"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="bg-rose-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-rose-600 transition-colors focus:ring-2 focus:ring-rose-300 focus:outline-none"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        {errorGuidedState && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
            <p>{errorGuidedState}</p>
          </div>
        )}

        {guidedState ? (
          // Display ResumeCard if guided state exists
          <ResumeCard guidedState={guidedState} />
        ) : (
          // Else, display the 3 action cards
          <>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 tracking-tight mb-8 max-w-3xl">
              Comment puis-je vous accompagner aujourd&apos;hui ?
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
              {/* Card 1: Administratif */}
              <button
                onClick={() => handleCardClick("J&apos;ai besoin d&apos;aide pour mes démarches administratives.")}
                className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 hover:shadow-lg hover:border-rose-300 transition-all duration-200 flex flex-col items-center text-center space-y-4"
              >
                <FileText className="h-12 w-12 text-blue-500" />
                <h2 className="text-xl font-semibold text-slate-800">Administratif</h2>
                <p className="text-slate-600">MDPH, CAF, allocations, dossiers...</p>
              </button>

              {/* Card 2: Fatigue */}
              <button
                onClick={() => handleCardClick("Je me sens fatigué(e) et dépassé(e).")}
                className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 hover:shadow-lg hover:border-rose-300 transition-all duration-200 flex flex-col items-center text-center space-y-4"
              >
                <Frown className="h-12 w-12 text-yellow-500" />
                <h2 className="text-xl font-semibold text-slate-800">Fatigue & Épuisement</h2>
                <p className="text-slate-600">Besoin de souffler, de soutien moral...</p>
              </button>

              {/* Card 3: Perdu */}
              <button
                onClick={() => handleCardClick("Je ne sais pas par où commencer ou quoi faire.")}
                className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 hover:shadow-lg hover:border-rose-300 transition-all duration-200 flex flex-col items-center text-center space-y-4"
              >
                <Zap className="h-12 w-12 text-rose-500" />
                <h2 className="text-xl font-semibold text-slate-800">Je suis perdu(e)</h2>
                <p className="text-slate-600">Besoin d'orientation, de clarté...</p>
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer - Reused/Adapted */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} PhoenixCare. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}