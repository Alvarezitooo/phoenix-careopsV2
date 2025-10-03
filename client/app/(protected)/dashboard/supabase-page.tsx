'use client';

import { useState } from 'react';
import {
  User, Calendar, FileText, AlertCircle, CheckCircle,
  Plus, Edit2, Euro, Clock, MapPin, Phone, MessageSquare, HelpCircle, Loader2
} from 'lucide-react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useUserAides, useUserDocuments, useUserDeadlines, useFamilyProfile } from '@/hooks/useSupabaseData';
import { useRouter } from 'next/navigation';
import DocumentUpload from '@/components/DocumentUpload';
import InterconnectionDemo from '@/components/InterconnectionDemo';

export default function SupabaseDashboardPage() {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedTab, setSelectedTab] = useState('resume');

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

  const handleDocumentAnalyzed = (analysis: string) => {
    setShowDocumentUpload(false);
    // TODO: Ajouter le document à la base Supabase
  };

  const tabs = [
    { id: 'resume', label: 'Résumé', icon: User },
    { id: 'aides', label: 'Mes Aides', icon: Euro },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'planning', label: 'Planning', icon: Calendar }
  ];

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

  return (
    <div className="h-full bg-slate-50 overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Mon Dossier Familial</h1>
          <p className="text-slate-600 mt-2">
            Bienvenue {user?.email || profile?.name}, voici un aperçu de votre situation
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-white rounded-xl p-1 shadow-sm">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenu Résumé */}
        {selectedTab === 'resume' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900">💰 Mes Aides et Allocations</h2>
              <button
                onClick={() => askPhoenix('Quelles autres aides puis-je demander pour ma situation ?')}
                className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors"
              >
                + Découvrir d&apos;autres aides
              </button>
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
                          onClick={() => askPhoenix(`Peux-tu m'expliquer ce document ${doc.nom} et me dire ce que je dois faire ?`)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Analyser avec Phoenix"
                        >
                          <HelpCircle className="h-4 w-4" />
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
                  onClick={() => askPhoenix('Quelles sont les prochaines démarches importantes à prévoir ?')}
                  className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors"
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

      {/* Modal Upload Document */}
      {showDocumentUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Analyser un document</h3>
              <button
                onClick={() => setShowDocumentUpload(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <DocumentUpload
              onDocumentAnalyzed={handleDocumentAnalyzed}
              userId={user?.id || ''}
            />
          </div>
        </div>
      )}
    </div>
  );
}