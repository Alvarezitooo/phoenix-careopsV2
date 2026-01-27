'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Loader2, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
}

export default function JournalArchivesPage() {
  const { user } = useSupabaseAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('phoenix_journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setEntries(data || []);
      } catch (err: any) {
        setError('Impossible de charger les archives pour le moment.');
        console.error('Error fetching journal entries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [user]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 text-rose-500 animate-spin mx-auto" />
          <p className="mt-2 text-slate-600">Chargement des archives...</p>
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>;
    }

    if (entries.length === 0) {
      return (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
          <Inbox className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">Aucun écrit pour le moment</h3>
          <p className="mt-1 text-slate-500">Les pensées que vous déposerez dans le journal apparaîtront ici.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs text-slate-500 mb-2">
              {format(new Date(entry.created_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
            <p className="text-slate-800 whitespace-pre-wrap">{entry.content}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center">
          <Link href="/journal" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ChevronLeft className="h-5 w-5" />
            <span>Retour au journal</span>
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">Mes archives</h1>
          <p className="text-slate-600 mt-1">Vos écrits passés, conservés en privé.</p>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
