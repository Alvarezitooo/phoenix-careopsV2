-- 🗄️ SCHÉMA BASE DE DONNÉES PHOENIX CARE - MÉMOIRE IA
-- À exécuter dans Supabase SQL Editor

-- Table conversations pour mémoire chat
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table user_memories pour souvenirs long terme
CREATE TABLE IF NOT EXISTS user_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  memory_content TEXT NOT NULL,
  memory_type VARCHAR(50) DEFAULT 'general',
  importance_score INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table aides (existante - améliorée)
CREATE TABLE IF NOT EXISTS aides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Table documents uploadés
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100),
  file_path VARCHAR(500),
  analysis_result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table profils enfants
CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  child_name VARCHAR(255),
  age INTEGER,
  condition_name VARCHAR(255),
  severity_level VARCHAR(50),
  additional_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_type ON user_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_aides_region ON aides(region);
CREATE INDEX IF NOT EXISTS idx_aides_type_handicap ON aides USING GIN(type_handicap);
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_child_profiles_user_id ON child_profiles(user_id);

-- RLS (Row Level Security) pour sécurité
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;

-- Policies RLS (utilisateurs peuvent accéder à leurs propres données)
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own memories" ON user_memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON user_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own documents" ON user_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON user_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own child profiles" ON child_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own child profiles" ON child_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own child profiles" ON child_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Aides publiques (lecture seule pour tous)
CREATE POLICY "Anyone can view aides" ON aides
  FOR SELECT USING (true);

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memories_updated_at BEFORE UPDATE ON user_memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aides_updated_at BEFORE UPDATE ON aides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_child_profiles_updated_at BEFORE UPDATE ON child_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion données d'exemple aides
INSERT INTO aides (nom, description, organisme, region, type_handicap, montant_min, montant_max, conditions) VALUES
('Allocation d''Éducation de l''Enfant Handicapé (AEEH)', 'Aide financière destinée à compenser les frais d''éducation et de soins apportés à un enfant en situation de handicap', 'CAF/MSA', 'National', ARRAY['tous'], 142.70, 1140.24, '{"age_max": 20, "taux_incapacite_min": 80}'::jsonb),
('Prestation de Compensation du Handicap (PCH)', 'Aide personnalisée destinée à financer les besoins liés à la perte d''autonomie des personnes handicapées', 'Conseil Départemental', 'National', ARRAY['tous'], 0, 1807.14, '{"age_max": 75, "evaluation_equipe": true}'::jsonb),
('Allocation Adulte Handicapé (AAH)', 'Allocation de solidarité destinée à assurer un revenu minimum aux adultes handicapés', 'CAF/MSA', 'National', ARRAY['tous'], 971.37, 971.37, '{"age_min": 20, "taux_incapacite_min": 80}'::jsonb)
ON CONFLICT DO NOTHING;