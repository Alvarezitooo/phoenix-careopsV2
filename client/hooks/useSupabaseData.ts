// 📊 Hooks pour récupérer les données depuis Supabase
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import type {
  UserAide,
  UserDocument,
  UserDeadline,
  FamilyProfile,
  Child,
  UserAideInsert,
  UserDocumentInsert,
  UserDeadlineInsert,
  FamilyProfileUpdate
} from '@/types/supabase';

// Hook pour les aides de l'utilisateur
export function useUserAides() {
  const { user } = useSupabaseAuth();
  const [aides, setAides] = useState<UserAide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAides = async () => {
      try {
        const { data, error } = await supabase
          .from('user_aides')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAides(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAides();
  }, [user]);

  return { aides, loading, error };
}

// Hook pour les documents de l'utilisateur
export function useUserDocuments() {
  const { user } = useSupabaseAuth();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      try {
        const { data, error } = await supabase
          .from('user_documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  return { documents, loading, error };
}

// Hook pour les échéances de l'utilisateur
export function useUserDeadlines() {
  const { user } = useSupabaseAuth();
  const [deadlines, setDeadlines] = useState<UserDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchDeadlines = async () => {
      try {
        const { data, error } = await supabase
          .from('user_deadlines')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (error) throw error;
        setDeadlines(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDeadlines();
  }, [user]);

  return { deadlines, loading, error };
}

// Hook pour le profil famille
export function useFamilyProfile() {
  const { user } = useSupabaseAuth();
  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        // Récupérer le profil famille
        const { data: profileData, error: profileError } = await supabase
          .from('family_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        setProfile(profileData);

        // Récupérer les enfants si profil existe
        if (profileData) {
          const { data: childrenData, error: childrenError } = await supabase
            .from('children')
            .select('*')
            .eq('family_id', profileData.id);

          if (childrenError) throw childrenError;
          setChildren(childrenData || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, children, loading, error };
}

// Hook pour ajouter des données
export function useSupabaseActions() {
  const { user } = useSupabaseAuth();

  const addAide = async (aide: Omit<UserAideInsert, 'user_id'>) => {
    if (!user) throw new Error('Non connecté');

    const { data, error } = await supabase
      .from('user_aides')
      .insert([{ ...aide, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const addDocument = async (document: Omit<UserDocumentInsert, 'user_id'>) => {
    if (!user) throw new Error('Non connecté');

    const { data, error } = await supabase
      .from('user_documents')
      .insert([{ ...document, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const addDeadline = async (deadline: Omit<UserDeadlineInsert, 'user_id'>) => {
    if (!user) throw new Error('Non connecté');

    const { data, error } = await supabase
      .from('user_deadlines')
      .insert([{ ...deadline, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateProfile = async (profileData: FamilyProfileUpdate) => {
    if (!user) throw new Error('Non connecté');

    const { data, error } = await supabase
      .from('family_profiles')
      .upsert([{ ...profileData, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return {
    addAide,
    addDocument,
    addDeadline,
    updateProfile,
  };
}