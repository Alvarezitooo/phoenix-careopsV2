'use client';

import { useState } from 'react';
import { Aide } from '@/types';
import { fetchAides } from '@/lib/api';
import { AideCard } from '@/components/AideCard';

export default function HomePage() {
  const [codePostal, setCodePostal] = useState('');
  const [typeHandicap, setTypeHandicap] = useState('');
  const [aides, setAides] = useState<Aide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSearched(true);

    try {
      const result = await fetchAides(codePostal, typeHandicap);
      setAides(result);
    } catch (err) {
      setError('Impossible de récupérer les aides. Veuillez vérifier que le backend est bien démarré et accessible.');
      setAides([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-900">PhoenixCare 🕊️</h1>
        <p className="text-gray-600 mt-2">Votre assistant pour trouver les aides adaptées à votre situation.</p>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={codePostal}
              onChange={(e) => setCodePostal(e.target.value)}
              placeholder="Votre code postal (ex: 75001)"
              className="p-3 border rounded-md focus:ring-2 focus:ring-blue-500 transition"
              required
            />
            <input
              type="text"
              value={typeHandicap}
              onChange={(e) => setTypeHandicap(e.target.value)}
              placeholder="Type de handicap (ex: autisme)"
              className="p-3 border rounded-md focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Recherche en cours...
              </>
            ) : (
              'Trouver les aides'
            )}
          </button>
        </form>
      </div>

      {error && <p className="text-red-500 text-center font-semibold">{error}</p>}

      {searched && !isLoading && !error && aides.length === 0 && (
        <p className="text-center text-gray-700">Aucune aide trouvée pour ces critères.</p>
      )}

      <div className="grid gap-4">
        {aides.map((aide) => (
          <AideCard key={aide.id} aide={aide} />
        ))}
      </div>
    </main>
  );
}