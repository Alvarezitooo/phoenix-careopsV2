'use client';

import { useState } from 'react';
import { Heart, X } from 'lucide-react';
import Link from 'next/link';

export default function DonationBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Heart className="h-5 w-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm text-slate-700">
            <span className="font-medium">Phoenix est gratuit</span> grâce à la générosité de familles comme vous.
            <Link href="/soutenir" className="text-rose-600 hover:text-rose-700 ml-2 underline">
              Découvrir comment soutenir →
            </Link>
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-slate-600 p-1"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}