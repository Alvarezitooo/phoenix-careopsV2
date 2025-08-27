import React from 'react';
import Link from 'next/link';
import {
  Heart,
  Home,
  Users,
  FileText,
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { uiCopy } from '@/lib/uiCopy';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const navigation = [
    { name: uiCopy.nav.dashboard, href: '/app', icon: Home },
    { name: uiCopy.nav.children, href: '/app/children', icon: Users },
    { name: uiCopy.nav.documents, href: '/app/documents', icon: FileText },
    { name: uiCopy.nav.consents, href: '/app/consents', icon: Settings },
  ];

  const handleLogout = () => {
    // Supprimer le cookie de session
    document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // Rediriger vers la page d'accueil
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-rose-500" />
              <span className="text-xl font-semibold text-slate-900">PhoenixCare</span>
            </div>

            {/* User info et déconnexion */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <User className="h-4 w-4" />
                <span>{uiCopy.dashboard.welcome.replace('{name}', 'Parent')}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-slate-300 focus:outline-none"
              >
                <LogOut className="h-4 w-4" />
                <span>{uiCopy.nav.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm border-r border-slate-200 min-h-[calc(100vh-4rem)]">
          <div className="p-6">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center space-x-3 px-4 py-3 text-slate-700 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors focus:ring-2 focus:ring-rose-300 focus:outline-none group"
                  >
                    <item.icon className="h-5 w-5 text-slate-500 group-hover:text-rose-500" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
