'use client';

import { useState } from 'react';
import {
  User, Calendar, FileText, AlertCircle, CheckCircle,
  Plus, Edit2, Euro, Clock, MapPin, Phone, MessageSquare, HelpCircle, Loader2, Sparkles
} from 'lucide-react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useUserAides, useUserDocuments, useUserDeadlines, useFamilyProfile } from '@/hooks/useSupabaseData';
import { useRouter } from 'next/navigation';
import DocumentUpload from '@/components/DocumentUpload';
import InterconnectionDemo from '@/components/InterconnectionDemo';
import OnboardingWizard from '@/components/OnboardingWizard';
import DashboardSidebar from '@/components/DashboardSidebar';
import ReactMarkdown from 'react-markdown';

export default function DashboardPage() {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedTab, setSelectedTab] = useState('resume');
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddAide, setShowAddAide] = useState(false);
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [dismissedWelcome, setDismissedWelcome] = useState(false);

  // Hooks pour récupérer les données
  const { aides, loading: aidesLoading } = useUserAides();
  const { documents, loading: documentsLoading } = useUserDocuments();
  const { deadlines, loading: deadlinesLoading } = useUserDeadlines();
  const { profile, children, loading: profileLoading } = useFamilyProfile();

  const askPhoenix = (question: string) => {
    const encodedQuestion = encodeURIComponent(question);
    router.push(`/chat?q=${encodedQuestion}`);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif': case 'valide': return 'text-green-600 bg-green-50';
      case 'en_attente': case 'expire_bientot': return 'text-orange-600 bg-orange-50';
      case 'refuse': case 'expire': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'haute': return 'text-red-600 bg-red-50';
      case 'moyenne': return 'text-orange-600 bg-orange-50';
      case 'basse': return 'text-blue-600 bg-blue-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'renouvellement': return '🔄';
      case 'rdv': return '👥';
      case 'demarche': return '📋';
      default: return '📅';
    }
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (days: number) => {
    if (days < 0) return 'text-red-700 bg-red-100';
    if (days <= 7) return 'text-red-600 bg-red-50';
    if (days <= 30) return 'text-orange-600 bg-orange-50';
    return 'text-slate-600 bg-slate-50';
  };

  const handleDocumentUploaded = () => {
    setShowDocumentUpload(false);
    // Rafraîchir la liste de documents en rechargeant la page
    window.location.reload();
  };

  // 🔄 Générer insights auto au chargement (si données disponibles)
  const generateInsights = async () => {
    if (!aides?.length && !deadlines?.length && !documents?.length) return;

    setInsightsLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error('Session expirée');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/summary/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user?.id,
          context: { aides, deadlines, documents, profile }
        }),
      });

      if (!response.ok) throw new Error('Erreur génération insights');

      const data = await response.json();
      setInsights(data.summary);
    } catch (error) {
      console.error('Erreur insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Détection nouvel utilisateur (compte créé < 24h et aucune donnée)
  const isNewUser = !aidesLoading && !documentsLoading &&
    !aides?.length && !documents?.length && !deadlines?.length;


  // Afficher wizard si nouveau utilisateur (pas de profil)
  if (!profileLoading && !profile && !showOnboarding) {
    setShowOnboarding(true);
  }

  if (profileLoading) {
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Chargement de votre dossier...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={() => {
      setShowOnboarding(false);
      router.refresh();
    }} />;
  }

  return (
    <div className="h-full flex bg-slate-50">
      {/* Sidebar */}
      <DashboardSidebar
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        userEmail={user?.email}
        userName={profile?.name}
      />

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-8">
        {/* Bannière Bêta Feedback */}
        <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
              BÊTA
            </div>
            <div>
              <p className="text-slate-800 font-medium">Votre avis compte !</p>
              <p className="text-slate-600 text-sm">Aidez-nous à améliorer PhoenixIA en 3 minutes</p>
            </div>
          </div>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSd2lcEiNqX1PGq1x2hegIhITsXdlbcqpBL8ri6T1aEmYnxFxg/viewform?usp=header"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
          >
            📝 Donner mon avis
          </a>
        </div>

        {/* Header */}
        <div className="mb-8 flex justify-between items-start pt-12 md:pt-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Mon Dossier Familial</h1>
            <p className="text-slate-600 mt-2 text-sm md:text-base">
              Bienvenue {user?.email || profile?.name}, voici un aperçu de votre situation
            </p>
          </div>
          <button
            onClick={() => router.push('/profil')}
            className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Edit2 className="h-4 w-4 text-slate-600" />
            <span className="text-slate-700 font-medium">Mon Profil</span>
          </button>
        </div>


        {/* Contenu Résumé */}
        {selectedTab === 'resume' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Banner d'accueil nouveaux utilisateurs */}
              {isNewUser && !dismissedWelcome && (
                <div className="bg-gradient-to-br from-purple-500 via-rose-500 to-pink-500 rounded-2xl p-6 md:p-8 text-white shadow-xl animate-fadeIn">
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">
                    👋 Bienvenue {profile?.name} !
                  </h2>
                  <p className="text-purple-50 mb-6">
                    Phoenix est prêt à vous aider. Voici comment démarrer :
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <button
                      onClick={() => router.push('/chat?q=Quelles aides puis-je demander pour mon enfant ?')}
                      className="bg-white/20 hover:bg-white/30 p-4 rounded-xl text-left transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                    >
                      <div className="text-2xl mb-2">💰</div>
                      <div className="font-semibold mb-1">Découvrir mes aides</div>
                      <div className="text-sm text-purple-100">AEEH, PCH, AJPP...</div>
                    </button>

                    <button
                      onClick={() => setShowDocumentUpload(true)}
                      className="bg-white/20 hover:bg-white/30 p-4 rounded-xl text-left transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                    >
                      <div className="text-2xl mb-2">📄</div>
                      <div className="font-semibold mb-1">Analyser un document</div>
                      <div className="text-sm text-purple-100">Notification MDPH...</div>
                    </button>

                    <button
                      onClick={() => router.push('/chat')}
                      className="bg-white/20 hover:bg-white/30 p-4 rounded-xl text-left transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                    >
                      <div className="text-2xl mb-2">💬</div>
                      <div className="font-semibold mb-1">Poser une question</div>
                      <div className="text-sm text-purple-100">Phoenix répond à tout</div>
                    </button>
                  </div>

                  <button
                    onClick={() => setDismissedWelcome(true)}
                    className="text-white/80 hover:text-white text-sm underline transition-colors"
                  >
                    Masquer ce message
                  </button>
                </div>
              )}

              {/* Insights automatiques (si données disponibles) */}
              {!isNewUser && (aides?.length > 0 || deadlines?.length > 0) && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <Sparkles className="h-6 w-6 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">📊 Votre situation en un coup d&apos;œil</h3>

                      {insightsLoading ? (
                        <div className="space-y-2 animate-pulse">
                          <div className="h-4 bg-white/20 rounded w-3/4"></div>
                          <div className="h-4 bg-white/20 rounded w-1/2"></div>
                        </div>
                      ) : insights ? (
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-sm prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{insights}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="space-y-2 text-sm text-blue-50">
                          <p>✅ Vous avez {aides?.length || 0} aide(s) active(s)</p>
                          {deadlines?.filter(d => getDaysUntil(d.date) <= 30).length > 0 && (
                            <p>⚠️ {deadlines.filter(d => getDaysUntil(d.date) <= 30).length} échéance(s) ce mois-ci</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => router.push('/chat?q=Explique-moi ma situation en détail')}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  >
                    💬 Discuter avec Phoenix
                  </button>
                </div>
              )}

              <div className="bg-white rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">👨‍👩‍👧‍👦 Ma Famille</h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-700">{profile?.name || user?.email} - Parent référent</span>
                  </div>
                  {children?.map((enfant, index) => (
                    <div key={enfant.id} className="flex items-center space-x-3">
                      <span className="text-lg">👶</span>
                      <span className="text-slate-700">
                        {enfant.name} ({enfant.age} ans{enfant.handicap_type ? `, ${enfant.handicap_type}` : ''})
                      </span>
                    </div>
                  ))}
                  {profile && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-500">
                        Situation: {profile.situation || 'Non renseigné'}
                        {profile.departement && ` • ${profile.departement}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <InterconnectionDemo />
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">🚨 Alertes</h3>
                <div className="space-y-3">
                  {deadlines?.filter(d => getDaysUntil(d.date) <= 7).length > 0 ? (
                    deadlines.filter(d => getDaysUntil(d.date) <= 7).map(deadline => (
                      <div key={deadline.id} className="flex items-start justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-orange-800">{deadline.titre}</p>
                            <p className="text-xs text-orange-600">
                              {getDaysUntil(deadline.date) === 0 ? "Aujourd'hui" :
                               getDaysUntil(deadline.date) === 1 ? "Demain" :
                               `Dans ${getDaysUntil(deadline.date)} jours`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => askPhoenix(`Aide-moi pour : ${deadline.titre}`)}
                          className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded transition-colors"
                          title="Demander aide à Phoenix"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">Aucune alerte pour le moment ✅</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenu Aides */}
        {selectedTab === 'aides' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold text-slate-900">💰 Mes Aides et Allocations</h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => askPhoenix('Quelles autres aides puis-je demander pour ma situation ?')}
                  className="px-4 py-2 border border-rose-500 text-rose-600 rounded-lg hover:bg-rose-50 transition-all duration-200"
                >
                  💡 Découvrir
                </button>
                <button
                  onClick={() => setShowAddAide(true)}
                  className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-all duration-200 hover:scale-105"
                >
                  + Ajouter une aide
                </button>
              </div>
            </div>
            <div className="grid gap-4">
              {aidesLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 text-rose-500 animate-spin mx-auto mb-2" />
                  <p className="text-slate-600">Chargement de vos aides...</p>
                </div>
              ) : aides?.length > 0 ? (
                aides.map((aide) => (
                  <div key={aide.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{aide.nom}</h3>
                        <p className="text-slate-600">{aide.montant}</p>
                        {aide.echeance && (
                          <p className="text-xs text-orange-600 mt-1">
                            Échéance: {new Date(aide.echeance).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(aide.statut)}`}>
                          {aide.statut.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => askPhoenix(`Comment renouveler ou optimiser mon aide ${aide.nom} ?`)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Demander à Phoenix"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600">Aucune aide enregistrée pour le moment.</p>
                  <button
                    onClick={() => askPhoenix('Quelles aides puis-je demander pour ma situation familiale ?')}
                    className="mt-4 text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Découvrir les aides disponibles
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contenu Documents */}
        {selectedTab === 'documents' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900">📄 Mes Documents</h2>
              <button
                onClick={() => setShowDocumentUpload(true)}
                className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors"
              >
                + Ajouter document
              </button>
            </div>
            <div className="grid gap-4">
              {documentsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 text-rose-500 animate-spin mx-auto mb-2" />
                  <p className="text-slate-600">Chargement de vos documents...</p>
                </div>
              ) : documents?.length > 0 ? (
                documents.map((doc) => (
                  <div key={doc.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3 flex-1">
                        <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{doc.nom}</h3>
                          <p className="text-sm text-slate-600">{doc.type} • {doc.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(doc.statut)}`}>
                          {doc.statut.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => askPhoenix(`Analyse ce document : ${doc.nom} (type: ${doc.type}). Explique-moi son contenu et les actions à réaliser.`)}
                          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                          title="Analyser avec Phoenix IA"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Analyser</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600">Aucun document pour le moment.</p>
                  <button
                    onClick={() => setShowDocumentUpload(true)}
                    className="mt-4 text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Ajouter votre premier document
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contenu Planning */}
        {selectedTab === 'planning' && (
          <div className="space-y-6">
            {/* Vue d'ensemble */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Urgences</p>
                    <p className="text-xl font-bold text-slate-900">
                      {deadlines?.filter(e => getDaysUntil(e.date) <= 7).length || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Ce mois-ci</p>
                    <p className="text-xl font-bold text-slate-900">
                      {deadlines?.filter(e => getDaysUntil(e.date) <= 30 && getDaysUntil(e.date) > 0).length || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">À venir</p>
                    <p className="text-xl font-bold text-slate-900">
                      {deadlines?.filter(e => getDaysUntil(e.date) > 30).length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des échéances */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-900">📅 Prochaines Échéances</h2>
                <button
                  onClick={() => setShowAddDeadline(true)}
                  className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-all duration-200 hover:scale-105"
                >
                  + Ajouter échéance
                </button>
              </div>

              <div className="space-y-3">
                {deadlinesLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 text-rose-500 animate-spin mx-auto mb-2" />
                    <p className="text-slate-600">Chargement de vos échéances...</p>
                  </div>
                ) : deadlines?.length > 0 ? (
                  deadlines
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((echeance) => {
                      const daysUntil = getDaysUntil(echeance.date);
                      return (
                        <div key={echeance.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-4 flex-1">
                              <span className="text-2xl">{getTypeIcon(echeance.type)}</span>
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-900">{echeance.titre}</h3>
                                <div className="flex items-center space-x-4 mt-1">
                                  <p className="text-sm text-slate-600">
                                    {new Date(echeance.date).toLocaleDateString('fr-FR', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioriteColor(echeance.priorite)}`}>
                                    {echeance.priorite}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(daysUntil)}`}>
                                {daysUntil < 0
                                  ? `Passé de ${Math.abs(daysUntil)} jour${Math.abs(daysUntil) > 1 ? 's' : ''}`
                                  : daysUntil === 0
                                  ? "Aujourd'hui"
                                  : daysUntil === 1
                                  ? "Demain"
                                  : `Dans ${daysUntil} jours`
                                }
                              </span>
                              <button
                                onClick={() => askPhoenix(`Comment préparer et réussir : ${echeance.titre} ? Quels documents et démarches ?`)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Aide de Phoenix"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-600">Aucune échéance programmée.</p>
                    <button
                      onClick={() => askPhoenix('Quelles sont les démarches importantes à prévoir pour ma situation ?')}
                      className="mt-4 text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Planifier mes prochaines démarches
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ajouter Aide */}
      {showAddAide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">💰 Ajouter une aide</h3>
              <button
                onClick={() => setShowAddAide(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const nom = formData.get('nom') as string;
              const montant = formData.get('montant') as string;
              const statut = formData.get('statut') as string;
              const echeance = formData.get('echeance') as string;

              try {
                const { supabase } = await import('@/lib/supabase');
                const { error } = await supabase.from('user_aides').insert([{
                  user_id: user?.id,
                  nom,
                  montant,
                  statut,
                  echeance: echeance || null
                }]);

                if (error) throw error;

                setShowAddAide(false);
                router.refresh();
              } catch (error) {
                console.error('Erreur ajout aide:', error);
                alert('Erreur lors de l&apos;ajout de l&apos;aide');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom de l&apos;aide *
                </label>
                <input
                  type="text"
                  name="nom"
                  placeholder="Ex: AEEH Base, PCH, AAH..."
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Montant
                </label>
                <input
                  type="text"
                  name="montant"
                  placeholder="Ex: 142€/mois, 1200€/an..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Statut *
                </label>
                <select
                  name="statut"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                >
                  <option value="actif">✅ Actif</option>
                  <option value="en_attente">⏳ En attente</option>
                  <option value="refuse">❌ Refusé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date d&apos;échéance (optionnel)
                </label>
                <input
                  type="date"
                  name="echeance"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAide(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all font-medium"
                >
                  Ajouter l&apos;aide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajouter Échéance */}
      {showAddDeadline && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">📅 Ajouter une échéance</h3>
              <button
                onClick={() => setShowAddDeadline(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const titre = formData.get('titre') as string;
              const date = formData.get('date') as string;
              const type = formData.get('type') as string;
              const priorite = formData.get('priorite') as string;

              try {
                const { supabase } = await import('@/lib/supabase');
                const { error } = await supabase.from('user_deadlines').insert([{
                  user_id: user?.id,
                  titre,
                  date,
                  type,
                  priorite
                }]);

                if (error) throw error;

                setShowAddDeadline(false);
                router.refresh();
              } catch (error) {
                console.error('Erreur ajout échéance:', error);
                alert('Erreur lors de l&apos;ajout de l&apos;échéance');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  name="titre"
                  placeholder="Ex: RDV MDPH, Renouvellement AEEH..."
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type *
                </label>
                <select
                  name="type"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                >
                  <option value="rdv">👥 Rendez-vous</option>
                  <option value="renouvellement">🔄 Renouvellement</option>
                  <option value="demarche">📋 Démarche administrative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Priorité *
                </label>
                <select
                  name="priorite"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                >
                  <option value="haute">🔴 Haute</option>
                  <option value="moyenne">🟡 Moyenne</option>
                  <option value="basse">🔵 Basse</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddDeadline(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all font-medium"
                >
                  Créer l&apos;échéance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload Document */}
      {showDocumentUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ajouter un document</h3>
              <button
                onClick={() => setShowDocumentUpload(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <DocumentUpload
              onDocumentUploaded={handleDocumentUploaded}
              userId={user?.id || ''}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  </div>
  );
}