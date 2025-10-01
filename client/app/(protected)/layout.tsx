'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, LayoutDashboard, LogOut, Heart } from 'lucide-react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import DonationBanner from '@/components/DonationBanner';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-rose-100 text-rose-700'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </Link>
  );
};

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Heart className="h-12 w-12 text-rose-500 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Heart className="h-12 w-12 text-rose-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar de navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col">
        <div className="flex items-center space-x-2 mb-8">
          <Heart className="h-8 w-8 text-rose-500" />
          <span className="text-xl font-semibold text-slate-900">PhoenixCare</span>
        </div>

        <nav className="flex flex-col space-y-2">
          <NavLink href="/chat">
            <MessageSquare className="mr-3 h-5 w-5" />
            Assistant
          </NavLink>
          <NavLink href="/dashboard">
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Mon Dossier
          </NavLink>
        </nav>

        <div className="mt-auto">
          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.user_metadata?.name || 'Utilisateur'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            <button
              onClick={signOut}
              className="w-full flex items-center mt-4 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Se déconnecter
            </button>
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 flex flex-col">
        <DonationBanner />
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
