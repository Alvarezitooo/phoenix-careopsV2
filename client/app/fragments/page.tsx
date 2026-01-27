'use client';

import QuietFragmentsCard from '@/components/QuietFragmentsCard';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function FragmentsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ChevronLeft className="h-5 w-5" />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">Fragments de silence</h1>
        <p className="text-slate-600 mb-8">Des pensées et des expériences partagées, anonymement. Un lieu pour lire et se sentir moins seul(e).</p>
        <QuietFragmentsCard />
      </main>
    </div>
  );
}
