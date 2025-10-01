import { NextResponse } from 'next/server';

export async function GET() {
  // API temporaire qui retourne des données vides
  // Les vraies données viennent des hooks Supabase
  return NextResponse.json([]);
}