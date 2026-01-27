'use client';

import ChatInterface from '@/components/ChatInterface';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ChevronLeft className="h-5 w-5" />
            <span>Retour à l'accueil</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        <ChatInterface />
      </main>
    </div>
  );
}
