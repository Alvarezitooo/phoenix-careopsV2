'use client';

import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext'; // Assuming this context exists for user ID

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get('initialMessage');
  const { user } = useSupabaseAuth(); // Get user from context

  if (!user) {
    // Redirect to login or show a message if user is not authenticated
    // For now, just display a message. A proper redirect would be router.push('/login');
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-slate-700">Veuillez vous connecter pour accéder au chat.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <ChatInterface userId={user.id} initialMessage={initialMessage || undefined} />
    </div>
  );
}
