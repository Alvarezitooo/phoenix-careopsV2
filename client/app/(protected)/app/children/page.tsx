'use client';

// Force cette page à être dynamique (pas de génération statique)
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';

const childSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  birthdate: z.string().min(1, 'Date de naissance requise'),
});
type ChildInput = z.infer<typeof childSchema>;

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  birthdate: string; // ISO yyyy-mm-dd
};

export default function ChildrenPage() {
  const [children, setChildren] = React.useState<Child[]>([]);
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChildInput>({ resolver: zodResolver(childSchema) });

  const onSubmit = (data: ChildInput) => {
    const newChild: Child = { id: crypto.randomUUID(), ...data };
    setChildren((prev) => [newChild, ...prev]);
    reset();
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Enfants</h1>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-500 text-white px-4 py-2 text-sm shadow-sm hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300"
        >
          Ajouter un enfant
        </button>
      </header>

      {children.length === 0 ? (
        <EmptyState onAdd={() => setOpen(true)} />
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((c) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-medium text-slate-900">
                {c.firstName} {c.lastName}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Né(e) le {formatDate(c.birthdate)}
              </p>
              <div className="mt-3 flex gap-2">
                <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                  Fiche créée
                </span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ajouter un enfant</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-300"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <form className="mt-4 grid gap-3" onSubmit={handleSubmit(onSubmit)} noValidate>
              <label className="grid gap-1 text-sm">
                <span>Prénom</span>
                <input
                  className="rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  type="text"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <span role="alert" className="text-xs text-red-600">
                    {errors.firstName.message}
                  </span>
                )}
              </label>

              <label className="grid gap-1 text-sm">
                <span>Nom</span>
                <input
                  className="rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  type="text"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <span role="alert" className="text-xs text-red-600">
                    {errors.lastName.message}
                  </span>
                )}
              </label>

              <label className="grid gap-1 text-sm">
                <span>Date de naissance</span>
                <input
                  className="rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  type="date"
                  {...register('birthdate')}
                />
                {errors.birthdate && (
                  <span role="alert" className="text-xs text-red-600">
                    {errors.birthdate.message}
                  </span>
                )}
              </label>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-60"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
      <p className="font-medium">Aucun enfant enregistré</p>
      <p className="mt-1 text-sm text-slate-600">
        Ajoutez la fiche de votre enfant pour organiser ses documents.
      </p>
      <button
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300"
      >
        Ajouter un enfant
      </button>
    </div>
  );
}

function formatDate(isoOrYmd: string) {
  const d = new Date(isoOrYmd);
  if (Number.isNaN(d.getTime())) return isoOrYmd;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
