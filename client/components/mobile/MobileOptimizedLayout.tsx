'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  MessageCircle,
  FileText,
  Users,
  Settings,
  ChevronUp,
  ChevronDown,
  Mic,
  MicOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface MobileLayoutProps {
  children: React.ReactNode;
  currentPage: 'home' | 'chat' | 'documents' | 'community' | 'settings';
}

export function MobileOptimizedLayout({ children, currentPage }: MobileLayoutProps) {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Détection clavier mobile
  useEffect(() => {
    const updateViewport = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(vh);

      // Détection ouverture clavier (heuristique)
      const isKeyboard = vh < window.screen.height * 0.75;
      setIsKeyboardOpen(isKeyboard);
    };

    updateViewport();
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.addEventListener('resize', updateViewport);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  return (
    <div
      className="flex flex-col bg-slate-50 overflow-hidden"
      style={{ height: viewportHeight || '100vh' }}
    >
      {/* Header Mobile */}
      <MobileHeader
        currentPage={currentPage}
        onMenuClick={() => setShowBottomSheet(true)}
      />

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 overflow-hidden',
          isKeyboardOpen ? 'pb-0' : 'pb-16' // Espace pour bottom nav
        )}
      >
        {children}
      </main>

      {/* Bottom Navigation - Masqué si clavier ouvert */}
      <AnimatePresence>
        {!isKeyboardOpen && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40"
          >
            <BottomNavigation currentPage={currentPage} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Menu */}
      <MobileBottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
      />

      {/* Safe Area Spacer */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </div>
  );
}

// Header mobile avec contrôles contextuels
function MobileHeader({
  currentPage,
  onMenuClick
}: {
  currentPage: string;
  onMenuClick: () => void;
}) {
  const getPageTitle = (page: string) => {
    switch (page) {
      case 'home': return 'PhoenixCare';
      case 'chat': return 'Assistant IA';
      case 'documents': return 'Mes Documents';
      case 'community': return 'Communauté';
      case 'settings': return 'Paramètres';
      default: return 'PhoenixCare';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-slate-900 truncate">
          {getPageTitle(currentPage)}
        </h1>
      </div>

      {/* Actions contextuelles */}
      <div className="flex items-center gap-2">
        {currentPage === 'chat' && <VoiceButton />}
        {currentPage === 'documents' && (
          <Button variant="ghost" size="sm">
            <FileText className="w-4 h-4" />
          </Button>
        )}
      </div>
    </header>
  );
}

// Navigation bottom avec haptic feedback
function BottomNavigation({ currentPage }: { currentPage: string }) {
  const navItems = [
    { id: 'home', label: 'Accueil', icon: Home, href: '/dashboard' },
    { id: 'chat', label: 'Assistant', icon: MessageCircle, href: '/chat' },
    { id: 'documents', label: 'Documents', icon: FileText, href: '/documents' },
    { id: 'community', label: 'Communauté', icon: Users, href: '/community' },
    { id: 'settings', label: 'Paramètres', icon: Settings, href: '/settings' }
  ];

  const handleNavClick = (item: any) => {
    // Haptic feedback sur mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Navigation
    window.location.href = item.href;
  };

  return (
    <nav className="bg-white border-t border-slate-200 px-2 py-1">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg transition-colors min-w-0 flex-1',
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-700 active:bg-slate-100'
              )}
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: item.id === 'home' ? 0 : 0.1 }}
            >
              <div className={cn(
                'p-1.5 rounded-lg transition-colors',
                isActive && 'bg-blue-100'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium mt-1 truncate">
                {item.label}
              </span>

              {/* Indicateur actif */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 left-1/2 w-1 h-1 bg-blue-600 rounded-full"
                  style={{ x: '-50%' }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

// Bottom Sheet pour menu mobile
function MobileBottomSheet({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const constraintsRef = useRef(null);

  const handleDragEnd = (event: any, info: PanInfo) => {
    // Fermer si glissement vers le bas > 50px
    if (info.offset.y > 50) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={constraintsRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
            style={{ maxHeight: '80vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-8 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Menu
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="px-6 py-4 space-y-2">
              {[
                { label: 'Notifications', icon: '🔔', href: '/notifications' },
                { label: 'Mes favoris', icon: '⭐', href: '/favorites' },
                { label: 'Historique', icon: '📚', href: '/history' },
                { label: 'Aide & Support', icon: '❓', href: '/help' },
                { label: 'À propos', icon: 'ℹ️', href: '/about' }
              ].map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium text-slate-900">{item.label}</span>
                </motion.a>
              ))}
            </div>

            {/* Safe area */}
            <div className="h-safe-area-inset-bottom" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Bouton vocal optimisé mobile
function VoiceButton() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  const toggleRecording = () => {
    if (!isSupported) return;

    setIsRecording(!isRecording);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(isRecording ? [50] : [50, 50, 50]);
    }

    // TODO: Intégrer SpeechRecognition API
  };

  if (!isSupported) return null;

  return (
    <motion.button
      onClick={toggleRecording}
      className={cn(
        'p-3 rounded-full transition-all duration-200',
        isRecording
          ? 'bg-red-500 text-white shadow-lg'
          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
      )}
      whileTap={{ scale: 0.9 }}
      animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
      transition={isRecording ? { repeat: Infinity, duration: 1 } : {}}
    >
      {isRecording ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </motion.button>
  );
}

// Chat mobile avec keyboard aware
export function MobileChatInterface() {
  const [message, setMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateKeyboardHeight = () => {
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        const keyboardHeight = window.innerHeight - visualViewport.height;
        setKeyboardHeight(Math.max(0, keyboardHeight));
      }
    };

    window.visualViewport?.addEventListener('resize', updateKeyboardHeight);
    return () => {
      window.visualViewport?.removeEventListener('resize', updateKeyboardHeight);
    };
  }, []);

  // Auto-scroll lors de l'ouverture du clavier
  useEffect(() => {
    if (keyboardHeight > 0) {
      messagesRef.current?.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [keyboardHeight]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto p-4 pb-4"
        style={{ paddingBottom: keyboardHeight > 0 ? '1rem' : '1rem' }}
      >
        {/* Messages content */}
      </div>

      {/* Input zone avec compensation clavier */}
      <div
        className="border-t border-slate-200 bg-white p-4"
        style={{
          marginBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px',
          transition: 'margin-bottom 0.2s ease-out'
        }}
      >
        <div className="flex gap-3 items-end">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tapez votre question..."
            className="flex-1 px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
            style={{ minHeight: '44px' }} // Touch target
          />
          <Button
            size="lg"
            className="rounded-2xl px-4 h-11"
            disabled={!message.trim()}
          >
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook pour détection de type d'appareil
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window;

      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024 && isTouchDevice) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  return deviceType;
}