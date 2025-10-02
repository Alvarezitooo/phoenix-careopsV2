'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { useFamilyProfile } from '@/hooks/useSupabaseData';
import { supabase } from '@/lib/supabase';
import { User, MapPin, Users, Plus, Trash2, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

type Child = {
  id?: string;
  name: string;
  age: number | '';
  handicap_type: string;
  description?: string;
};

export default function ProfilPage() {
  const { user } = useSupabaseAuth();
  const { profile, children: existingChildren, loading: profileLoading } = useFamilyProfile();

  const [formData, setFormData] = useState({
    name: '',
    departement: '',
    situation: 'parent_solo' as 'parent_solo' | 'couple' | 'autre',
  });

  const [children, setChildren] = useState<Child[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Charger les données existantes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        departement: profile.departement || '',
        situation: profile.situation || 'parent_solo',
      });
    }
    if (existingChildren && existingChildren.length > 0) {
      setChildren(existingChildren.map(child => ({
        id: child.id,
        name: child.name || '',
        age: child.age || '',
        handicap_type: child.handicap_type || '',
        description: child.description || '',
      })));
    }
  }, [profile, existingChildren]);

  const addChild = () => {
    setChildren([...children, { name: '', age: '', handicap_type: '', description: '' }]);
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const updateChild = (index: number, field: keyof Child, value: any) => {
    const newChildren = [...children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setChildren(newChildren);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      if (!user) throw new Error('Non connecté');

      // 1. Sauvegarder le profil famille
      const { data: profileData, error: profileError } = await supabase
        .from('family_profiles')
        .upsert([{
          user_id: user.id,
          name: formData.name,
          departement: formData.departement,
          situation: formData.situation,
          nb_enfants: children.length,
          updated_at: new Date().toISOString(),
        }], { onConflict: 'user_id' })
        .select()
        .single();

      if (profileError) throw profileError;

      // 2. Supprimer les enfants existants pour repartir de zéro
      if (profile?.id) {
        await supabase
          .from('children')
          .delete()
          .eq('family_id', profileData.id);
      }

      // 3. Insérer les nouveaux enfants
      if (children.length > 0) {
        const childrenToInsert = children
          .filter(child => child.name.trim() !== '')
          .map(child => ({
            family_id: profileData.id,
            name: child.name,
            age: child.age === '' ? null : Number(child.age),
            handicap_type: child.handicap_type,
            description: child.description || null,
          }));

        if (childrenToInsert.length > 0) {
          const { error: childrenError } = await supabase
            .from('children')
            .insert(childrenToInsert);

          if (childrenError) throw childrenError;
        }
      }

      setMessage({ type: 'success', text: 'Profil enregistré avec succès !' });

      // Recharger la page après 1.5s pour afficher les nouvelles données
      setTimeout(() => window.location.reload(), 1500);

    } catch (error: any) {
      console.error('Erreur sauvegarde profil:', error);
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Mon Profil Famille</h1>
          <p className="text-slate-600 mt-2">
            Ces informations permettent à Phoenix de personnaliser ses réponses
          </p>
        </div>

        {/* Message de succès/erreur */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Formulaire Profil Parent */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center space-x-2">
            <User className="h-6 w-6 text-rose-500" />
            <span>Informations parent référent</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Prénom Nom"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Département
              </label>
              <input
                type="text"
                value={formData.departement}
                onChange={(e) => setFormData({ ...formData, departement: e.target.value })}
                placeholder="75 (Paris), 69 (Rhône), etc."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Situation familiale
              </label>
              <select
                value={formData.situation}
                onChange={(e) => setFormData({ ...formData, situation: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="parent_solo">Parent solo</option>
                <option value="couple">En couple</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
        </div>

        {/* Formulaire Enfants */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
              <Users className="h-6 w-6 text-rose-500" />
              <span>Mes enfants ({children.length})</span>
            </h2>
            <button
              onClick={addChild}
              className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Ajouter un enfant</span>
            </button>
          </div>

          {children.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p>Aucun enfant enregistré</p>
              <button
                onClick={addChild}
                className="mt-4 text-rose-600 hover:text-rose-700 font-medium"
              >
                Ajouter votre premier enfant
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {children.map((child, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 relative">
                  <button
                    onClick={() => removeChild(index)}
                    className="absolute top-2 right-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer cet enfant"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>

                  <div className="grid md:grid-cols-2 gap-4 pr-12">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => updateChild(index, 'name', e.target.value)}
                        placeholder="Prénom de l'enfant"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Âge
                      </label>
                      <input
                        type="number"
                        value={child.age}
                        onChange={(e) => updateChild(index, 'age', e.target.value === '' ? '' : parseInt(e.target.value))}
                        placeholder="Âge"
                        min="0"
                        max="30"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Type de handicap ou trouble
                      </label>
                      <input
                        type="text"
                        value={child.handicap_type}
                        onChange={(e) => updateChild(index, 'handicap_type', e.target.value)}
                        placeholder="Autisme, trisomie 21, troubles DYS, etc."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Notes complémentaires (optionnel)
                      </label>
                      <textarea
                        value={child.description || ''}
                        onChange={(e) => updateChild(index, 'description', e.target.value)}
                        placeholder="Besoins spécifiques, accompagnement, etc."
                        rows={2}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton Enregistrer */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleSave}
            disabled={saving || !formData.name.trim()}
            className="bg-rose-500 text-white px-8 py-3 rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Enregistrer mon profil</span>
              </>
            )}
          </button>
        </div>

        {/* Info box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Pourquoi ces informations ?</p>
              <p className="text-blue-700">
                Phoenix utilise votre profil pour personnaliser ses réponses et vous proposer
                les aides adaptées à votre situation familiale et votre département.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
