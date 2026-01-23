'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MailOpen, ArrowRight } from 'lucide-react';

export default function DecoderCard() {
  const [courrier, setCourrier] = useState('');
  const router = useRouter();

  const handleDecode = (event: React.FormEvent) => {
    event.preventDefault();
    if (!courrier.trim()) return;

    const message = `Peux-tu décoder ce courrier selon ce format précis ?

Ce que c'est : (phrase simple)
Ce qui est vraiment important : (3 points maximum)
Ce qui n'est pas demandé : (liste courte)
Prochaine micro-action : (une seule étape)

Courrier : """${courrier.trim()}"""`;

    const encoded = encodeURIComponent(message);
    router.push(`/chat?q=${encoded}`);
  };

  return (
    <form onSubmit={handleDecode} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
          <MailOpen className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Décodeur administratif</p>
          <h3 className="text-lg font-semibold text-slate-900">Comprendre un courrier</h3>
        </div>
      </div>
      <p className="text-sm text-slate-500">
        Colle ici le texte du courrier. Phoenix ouvrira le chat avec un message déjà prêt et te répondra point par point.
      </p>
      <textarea
        value={courrier}
        onChange={(event) => setCourrier(event.target.value)}
        placeholder="Copier le contenu de la lettre ou les passages importants..."
        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-800 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
        rows={4}
      />
      <button
        type="submit"
        disabled={!courrier.trim()}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-40"
      >
        Laisser Phoenix décoder
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
