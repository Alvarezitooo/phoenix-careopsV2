// 🚀 API Route Next.js pour Phoenix RAG
import { NextRequest, NextResponse } from 'next/server';

// Env var validée (via BFF, pas direct)
const RAG_SERVER_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, context } = body;

    // 🔐 Récupérer le token Supabase du header Authorization
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return NextResponse.json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentification requise'
        }
      }, { status: 401 });
    }

    console.log(`📨 Requête chat: ${message.substring(0, 50)}... (user: ${userId})`);

    // Appel direct au serveur RAG avec contexte utilisateur ET token
    const ragResponse = await fetch(`${RAG_SERVER_URL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 🔐 Transmettre le token
      },
      body: JSON.stringify({
        message,
        user_id: userId,
        context: context || {} // Transmettre le contexte utilisateur
      }),
    });

    if (!ragResponse.ok) {
      throw new Error(`RAG Error: ${ragResponse.status}`);
    }

    const ragData = await ragResponse.json();

    // Format compatible avec useChat (avec suggestions)
    return NextResponse.json({
      response: ragData.answer || ragData.response,
      timestamp: ragData.timestamp,
      sources: ragData.sources || [],
      suggestions: ragData.suggestions || [],
      processing_time: ragData.processing_time
    });

  } catch (error) {
    console.error('Erreur API chat:', error);

    return NextResponse.json({
      error: {
        code: 'RAG_ERROR',
        message: 'Erreur lors du traitement de votre message'
      }
    }, { status: 500 });
  }
}