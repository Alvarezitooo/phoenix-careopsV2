'use client';

import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Loader2, Lock, Inbox } from 'lucide-react';

type JournalStatus = 'idle' | 'saving' | 'saved' | 'queued' | 'error';

interface LocalEntry {
  id: string;
  content: string;
  createdAt: string;
}

const readQueue = (key: string): LocalEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as LocalEntry[];
  } catch (error) {
    console.warn('Impossible de lire le journal offline', error);
    return [];
  }
};

const writeQueue = (key: string, queue: LocalEntry[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(queue));
};

export default function PhoenixJournal() {
  const { user } = useSupabaseAuth();
  const [entry, setEntry] = useState('');
  const [status, setStatus] = useState<JournalStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPending, setHasPending] = useState(false);

  const storageKey = user ? `phoenix-journal-${user.id}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const queue = readQueue(storageKey);
    setHasPending(queue.length > 0);

    if (!queue.length || !user) return;

    const sync = async () => {
      for (const localEntry of readQueue(storageKey)) {
        try {
          const { error } = await supabase
            .from('phoenix_journal_entries')
            .insert({ user_id: user.id, content: localEntry.content, created_at: localEntry.createdAt });

          if (error) throw error;

          const remaining = readQueue(storageKey).filter((item) => item.id !== localEntry.id);
          writeQueue(storageKey, remaining);
        } catch (err) {
          console.warn('Sync journal impossible', err);
          setHasPending(true);
          return;
        }
      }
      setHasPending(readQueue(storageKey).length > 0);
    };

    sync();
  }, [storageKey, user]);

  const queueEntryLocally = (content: string) => {
    if (!storageKey) return;
    const queue = readQueue(storageKey);
    const payload: LocalEntry = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
    };
    queue.push(payload);
    writeQueue(storageKey, queue);
    setHasPending(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!entry.trim() || !user) return;

    setStatus('saving');
    setErrorMessage(null);

    try {
      const { error } = await supabase
        .from('phoenix_journal_entries')
        .insert({ user_id: user.id, content: entry.trim() });

      if (error) {
        throw error;
      }

      setEntry('');
      setStatus('saved');
    } catch (error: any) {
      queueEntryLocally(entry.trim());
      setEntry('');
      setStatus('queued');
      setErrorMessage('Connexion instable. Phoenix gardera ce message et le synchronisera plus tard.');
    }
  };

  const statusMessage = () => {
    switch (status) {
      case 'saved':
        return 'C&apos;est déposé. Tu peux fermer.';
      case 'queued':
        return 'C&apos;est déposé. Je le garderai jusqu&apos;à la prochaine connexion.';
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
            <Inbox className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">Journal Phoenix</p>
            <h3 className="text-lg font-semibold text-slate-900">Déposer sans répondre</h3>
          </div>
        </div>
        <Link href="/journal/archives" className="text-sm text-slate-500 hover:text-rose-600 underline decoration-dotted">
          Mes archives
        </Link>
      </div>
      <p className="text-sm text-slate-500 mt-4">
        Rien ne sera analysé automatiquement. Ce journal reste silencieux tant que tu ne demandes rien.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          value={entry}
          onChange={(event) => setEntry(event.target.value)}
          placeholder="Écrire ou déposer quelques mots..."
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
          rows={4}
          disabled={!user || status === 'saving'}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="h-4 w-4" />
            <span>Privé. Rien d&apos;obligatoire.</span>
            {hasPending && <span className="text-rose-500">Synchronisation en attente</span>}
          </div>
          <button
            type="submit"
            disabled={!entry.trim() || !user || status === 'saving'}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-white hover:bg-rose-600 disabled:opacity-50"
          >
            {status === 'saving' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Déposer
          </button>
        </div>
      </form>

      {statusMessage() && (
        <p className="mt-3 text-sm text-slate-700">{statusMessage()}</p>
      )}
      {errorMessage && (
        <p className="mt-2 text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
