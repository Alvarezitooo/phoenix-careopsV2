'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Settings
} from 'lucide-react';

interface DashboardSidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  userEmail?: string;
  userName?: string;
}

export default function DashboardSidebar({
  selectedTab,
  onTabChange,
  userEmail,
  userName
}: DashboardSidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Charger l'état de la sidebar depuis localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Persister l'état
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  const menuItems = [
    { id: 'base', label: 'Base arrière', icon: Heart },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  const SidebarContent = () => (
    <>
      {/* Header avec logo */}
      <div className={`p-4 border-b border-slate-200 ${isCollapsed ? 'px-2' : ''}`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <span className="font-semibold text-slate-900">PhoenixCare</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center mx-auto">
              <Heart className="h-5 w-5 text-rose-500" />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = selectedTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer avec profil */}
      <div className={`p-3 border-t border-slate-200 space-y-2 ${isCollapsed ? 'px-2' : ''}`}>
        {!isCollapsed ? (
          <>
            <div className="bg-slate-100 rounded-lg p-3 mb-2">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-900 truncate">
                  {userName || userEmail?.split('@')[0]}
                </span>
              </div>
              <p className="text-xs text-slate-600 truncate">{userEmail}</p>
            </div>

            <button
              onClick={() => router.push('/profil')}
              className="w-full flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">Paramètres</span>
            </button>

            <button
              onClick={() => router.push('/logout')}
              className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Déconnexion</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push('/profil')}
              className="w-full flex items-center justify-center p-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Paramètres"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={() => router.push('/logout')}
              className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Bouton hamburger mobile */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-lg border border-slate-200"
      >
        {isMobileOpen ? (
          <X className="h-6 w-6 text-slate-700" />
        ) : (
          <Menu className="h-6 w-6 text-slate-700" />
        )}
      </button>

      {/* Overlay mobile */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-40 transition-transform duration-300 flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Sidebar desktop */}
      <div
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent />

        {/* Bouton toggle desktop */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
          title={isCollapsed ? 'Déplier la sidebar' : 'Rétracter la sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          )}
        </button>
      </div>
    </>
  );
}
