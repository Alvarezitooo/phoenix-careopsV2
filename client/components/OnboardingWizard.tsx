'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import { Heart, ArrowRight, ArrowLeft, Users, MapPin, User, Loader2, Sparkles } from 'lucide-react';

type Child = {
  name: string;
  age: number | '';
  handicap_type: string;
};

export default function OnboardingWizard({ onComplete }: { onComplete?: () => void }) {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    departement: '',
    situation: 'parent_solo' as 'parent_solo' | 'couple' | 'autre',
  });

  const [children, setChildren] = useState<Child[]>([
    { name: '', age: '', handicap_type: '' }
  ]);

  const addChild = () => {
    setChildren([...children, { name: '', age: '', handicap_type: '' }]);
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index));
    }
  };

  const updateChild = (index: number, field: keyof Child, value: any) => {
    const newChildren = [...children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setChildren(newChildren);
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return true; // Toujours ok pour l'accueil
      case 2:
        return formData.name.trim() !== '';
      case 3:
        return children.some(child => child.name.trim() !== '');
      case 4:
        return formData.departement.trim() !== '';
      default:
        return true;
    }
  };

  const handleFinish = async () => {
    setSaving(true);

    try {
      if (!user) throw new Error('Non connecté');

      // 1. Créer le profil famille
      const { data: profileData, error: profileError } = await supabase
        .from('family_profiles')
        .insert([{
          user_id: user.id,
          name: formData.name,
          departement: formData.departement,
          situation: formData.situation,
          nb_enfants: children.filter(c => c.name.trim() !== '').length,
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      // 2. Ajouter les enfants
      const childrenToInsert = children
        .filter(child => child.name.trim() !== '')
        .map(child => ({
          family_id: profileData.id,
          name: child.name,
          age: child.age === '' ? null : Number(child.age),
          handicap_type: child.handicap_type,
        }));

      if (childrenToInsert.length > 0) {
        const { error: childrenError } = await supabase
          .from('children')
          .insert(childrenToInsert);

        if (childrenError) throw childrenError;
      }

      // 3. Rediriger vers le dashboard
      if (onComplete) {
        onComplete();
      } else {
        router.push('/dashboard');
        router.refresh();
      }

    } catch (error: any) {
      console.error('Erreur onboarding:', error);
      alert('Erreur lors de la sauvegarde. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-rose-50 via-white to-purple-50 z-50 overflow-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-4">
              <Heart className="h-8 w-8 text-rose-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Bienvenue sur Phoenix
            </h1>
            <p className="text-slate-600">
              Prenons quelques instants pour personnaliser votre expérience
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i <= step ? 'w-12 bg-rose-500' : 'w-8 bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Accueil */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                  Phoenix vous accompagne
                </h2>
                <p className="text-slate-600 text-lg mb-6">
                  Pour vous aider au mieux, Phoenix a besoin de comprendre votre situation familiale.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-sm text-blue-800">
                    <strong>🔒 Vos données sont privées</strong> : Elles restent dans votre espace personnel
                    et permettent à Phoenix de personnaliser ses réponses à votre situation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Informations parent */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <User className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-slate-900">
                  Parlons de vous
                </h2>
                <p className="text-slate-600">
                  Comment souhaitez-vous être appelé(e) ?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Votre nom ou prénom
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Marie, Thomas..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-lg"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Votre situation familiale
                </label>
                <select
                  value={formData.situation}
                  onChange={(e) => setFormData({ ...formData, situation: e.target.value as any })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-lg"
                >
                  <option value="parent_solo">Parent solo</option>
                  <option value="couple">En couple</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Enfants */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Users className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-slate-900">
                  Vos enfants
                </h2>
                <p className="text-slate-600">
                  Parlez-nous de votre ou vos enfants
                </p>
              </div>

              {children.map((child, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-slate-900">Enfant {index + 1}</h3>
                    {children.length > 1 && (
                      <button
                        onClick={() => removeChild(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Retirer
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={child.name}
                    onChange={(e) => updateChild(index, 'name', e.target.value)}
                    placeholder="Prénom de l'enfant"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={child.age}
                      onChange={(e) => updateChild(index, 'age', e.target.value === '' ? '' : parseInt(e.target.value))}
                      placeholder="Âge"
                      min="0"
                      max="30"
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={child.handicap_type}
                      onChange={(e) => updateChild(index, 'handicap_type', e.target.value)}
                      placeholder="Type de handicap"
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={addChild}
                className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-rose-400 hover:text-rose-600 transition-colors"
              >
                + Ajouter un autre enfant
              </button>
            </div>
          )}

          {/* Step 4: Localisation */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <MapPin className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-slate-900">
                  Votre département
                </h2>
                <p className="text-slate-600">
                  Les aides et démarches varient selon votre département
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Numéro de département
                </label>
                <input
                  type="text"
                  value={formData.departement}
                  onChange={(e) => setFormData({ ...formData, departement: e.target.value })}
                  placeholder="Ex: 75 (Paris), 69 (Rhône), 13 (Bouches-du-Rhône)..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-lg"
                  autoFocus
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>✅ C'est presque terminé !</strong> Phoenix est maintenant prêt à vous accompagner
                  avec des réponses personnalisées à votre situation.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Retour</span>
              </button>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canContinue()}
                className="flex items-center space-x-2 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continuer</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canContinue() || saving}
                className="flex items-center space-x-2 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Finalisation...</span>
                  </>
                ) : (
                  <>
                    <span>Commencer</span>
                    <Sparkles className="h-5 w-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
