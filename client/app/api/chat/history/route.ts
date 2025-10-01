// 📜 API Route pour l'historique chat
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        error: { code: 'MISSING_USER_ID', message: 'userId requis' }
      }, { status: 400 });
    }

    // Pour le moment, retourner historique vide
    // Plus tard on pourra implémenter la persistence
    return NextResponse.json({
      messages: [],
      context: {}
    });

  } catch (error) {
    console.error('Erreur API historique:', error);
    return NextResponse.json({
      error: { code: 'HISTORY_ERROR', message: 'Erreur lors de la récupération' }
    }, { status: 500 });
  }
}