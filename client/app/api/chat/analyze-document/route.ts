// 📄 API Route Next.js pour l'analyse de documents avec Phoenix IA
import { NextRequest, NextResponse } from 'next/server';

// Env var validée (API Routes = côté serveur, donc pas NEXT_PUBLIC_)
const RAG_SERVER_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document, userId, documentType, fileName } = body;

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

    console.log(`📄 Analyse document: ${fileName} (type: ${documentType}, user: ${userId})`);

    // Appel au serveur RAG pour analyser le document
    const ragResponse = await fetch(`${RAG_SERVER_URL}/api/chat/analyze-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 🔐 Transmettre le token
      },
      body: JSON.stringify({
        document,
        userId,
        documentType,
        fileName
      }),
    });

    if (!ragResponse.ok) {
      const errorData = await ragResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `RAG Error: ${ragResponse.status}`);
    }

    const ragData = await ragResponse.json();

    // Format compatible avec DocumentUpload
    return NextResponse.json({
      analysis: ragData.analysis || ragData.fullAnalysis,
      fullAnalysis: ragData.fullAnalysis || ragData.analysis,
      suggestions: ragData.suggestions || [],
      fileName: ragData.fileName || fileName,
      timestamp: ragData.timestamp
    });

  } catch (error: any) {
    console.error('Erreur API analyze-document:', error);

    return NextResponse.json({
      error: {
        code: 'ANALYSIS_ERROR',
        message: error.message || 'Erreur lors de l\'analyse du document'
      }
    }, { status: 500 });
  }
}
