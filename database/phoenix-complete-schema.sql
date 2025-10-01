-- 🚀 SCHÉMA COMPLET PHOENIX CARE POUR PRODUCTION
-- À exécuter dans l'éditeur SQL de Supabase

-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 👥 Table des profils famille (extends auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.family_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT,
  situation TEXT CHECK (situation IN ('parent_solo', 'couple', 'autre')),
  departement TEXT,
  nb_enfants INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 👶 Table des enfants
CREATE TABLE IF NOT EXISTS public.children (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES public.family_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  handicap_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 💰 Table des aides personnelles de l'utilisateur
CREATE TABLE IF NOT EXISTS public.user_aides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  montant TEXT,
  statut TEXT CHECK (statut IN ('actif', 'en_attente', 'refuse')) DEFAULT 'en_attente',
  echeance DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📄 Table des documents utilisateur
CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  type TEXT,
  file_url TEXT,
  analysis TEXT,
  statut TEXT CHECK (statut IN ('valide', 'expire', 'expire_bientot')) DEFAULT 'valide',
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📅 Table des échéances personnelles
CREATE TABLE IF NOT EXISTS public.user_deadlines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('renouvellement', 'rdv', 'demarche')) DEFAULT 'demarche',
  priorite TEXT CHECK (priorite IN ('haute', 'moyenne', 'basse')) DEFAULT 'moyenne',
  completed BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 💬 Table des conversations (mise à jour)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🧠 Table des mémoires Phoenix (mise à jour)
CREATE TABLE IF NOT EXISTS public.user_memories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_content TEXT NOT NULL,
  memory_type VARCHAR(50) DEFAULT 'general',
  importance_score INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📚 Table des aides publiques (base de connaissance)
CREATE TABLE IF NOT EXISTS public.aides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  organisme VARCHAR(255),
  region VARCHAR(100),
  type_handicap TEXT[],
  montant_min DECIMAL(10,2),
  montant_max DECIMAL(10,2),
  conditions JSONB DEFAULT '{}'::jsonb,
  documents_requis TEXT[],
  url_info VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📊 Fonctions utilitaires
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 🔒 ACTIVATION ROW LEVEL SECURITY
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_aides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
-- Aides publiques : lecture libre pour tous

-- 🛡️ POLITIQUES DE SÉCURITÉ RLS

-- Family profiles
CREATE POLICY "Users can view own family profile" ON public.family_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own family profile" ON public.family_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own family profile" ON public.family_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Children
CREATE POLICY "Users can view own children" ON public.children FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.family_profiles WHERE id = family_id));
CREATE POLICY "Users can manage own children" ON public.children FOR ALL USING (auth.uid() = (SELECT user_id FROM public.family_profiles WHERE id = family_id));

-- User aides
CREATE POLICY "Users can view own aides" ON public.user_aides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own aides" ON public.user_aides FOR ALL USING (auth.uid() = user_id);

-- User documents
CREATE POLICY "Users can view own documents" ON public.user_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own documents" ON public.user_documents FOR ALL USING (auth.uid() = user_id);

-- User deadlines
CREATE POLICY "Users can view own deadlines" ON public.user_deadlines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own deadlines" ON public.user_deadlines FOR ALL USING (auth.uid() = user_id);

-- Conversations
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own conversations" ON public.conversations FOR ALL USING (auth.uid() = user_id);

-- Memories
CREATE POLICY "Users can view own memories" ON public.user_memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own memories" ON public.user_memories FOR ALL USING (auth.uid() = user_id);

-- Aides publiques (lecture pour tous)
CREATE POLICY "Anyone can view public aides" ON public.aides FOR SELECT USING (true);

-- ⚡ TRIGGERS pour updated_at automatique
CREATE TRIGGER update_family_profiles_updated_at BEFORE UPDATE ON public.family_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_aides_updated_at BEFORE UPDATE ON public.user_aides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_memories_updated_at BEFORE UPDATE ON public.user_memories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aides_updated_at BEFORE UPDATE ON public.aides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 🎯 INDEX pour les performances
CREATE INDEX IF NOT EXISTS idx_family_profiles_user_id ON public.family_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_children_family_id ON public.children(family_id);
CREATE INDEX IF NOT EXISTS idx_user_aides_user_id ON public.user_aides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_aides_statut ON public.user_aides(statut);
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_deadlines_user_id ON public.user_deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_deadlines_date ON public.user_deadlines(date);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON public.user_memories(user_id);

-- 🤖 FONCTION : Créer profil automatiquement après signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.family_profiles (user_id, name, nb_enfants)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Utilisateur'), 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 📋 DONNÉES DE DEMO pour tests
INSERT INTO public.aides (nom, description, organisme, region, type_handicap, montant_min, montant_max, conditions) VALUES
('Allocation d''Éducation de l''Enfant Handicapé (AEEH)', 'Aide financière destinée à compenser les frais d''éducation et de soins apportés à un enfant en situation de handicap', 'CAF/MSA', 'National', ARRAY['tous'], 142.70, 1140.24, '{"age_max": 20, "taux_incapacite_min": 80}'::jsonb),
('Prestation de Compensation du Handicap (PCH)', 'Aide personnalisée destinée à financer les besoins liés à la perte d''autonomie des personnes handicapées', 'Conseil Départemental', 'National', ARRAY['tous'], 0, 1807.14, '{"age_max": 75, "evaluation_equipe": true}'::jsonb),
('Allocation Adulte Handicapé (AAH)', 'Allocation de solidarité destinée à assurer un revenu minimum aux adultes handicapés', 'CAF/MSA', 'National', ARRAY['tous'], 971.37, 971.37, '{"age_min": 20, "taux_incapacite_min": 80}'::jsonb),
('Carte Mobilité Inclusion (CMI)', 'Carte permettant de faciliter la vie quotidienne des personnes en situation de handicap', 'MDPH', 'National', ARRAY['mobilité', 'tous'], 0, 0, '{"taux_incapacite_min": 80}'::jsonb)
ON CONFLICT DO NOTHING;