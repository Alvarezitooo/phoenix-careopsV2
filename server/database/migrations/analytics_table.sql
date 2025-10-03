-- ============================================
-- 📊 TABLE ANALYTICS - PhoenixCare
-- ============================================
-- Track toutes les interactions RAG pour analytics

CREATE TABLE IF NOT EXISTS chat_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- User info (TEXT pour supporter users anonymes + auth users)
    user_id TEXT NOT NULL,

    -- Question
    question TEXT NOT NULL,
    question_length INT,

    -- Response
    response TEXT NOT NULL,
    response_length INT,

    -- Metadata RAG
    sources_used TEXT[], -- Array des sources utilisées
    num_sources INT DEFAULT 0,
    cached BOOLEAN DEFAULT FALSE,
    processing_time_ms INT, -- Temps de traitement en ms

    -- Feedback (à ajouter plus tard)
    feedback_rating INT CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_comment TEXT,

    -- Détection patterns
    has_suggestions BOOLEAN DEFAULT FALSE,
    num_suggestions INT DEFAULT 0

    -- Pas de FK car user_id peut être anonyme (TEXT) ou auth user (UUID as TEXT)
);

-- Index pour performance
CREATE INDEX idx_analytics_user_id ON chat_analytics(user_id);
CREATE INDEX idx_analytics_created_at ON chat_analytics(created_at DESC);
CREATE INDEX idx_analytics_cached ON chat_analytics(cached);

-- RLS (Row Level Security)
ALTER TABLE chat_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own analytics
CREATE POLICY "Users can view own analytics"
    ON chat_analytics
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- Policy: Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
    ON chat_analytics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy: Service role can insert (backend)
CREATE POLICY "Service can insert analytics"
    ON chat_analytics
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 📈 VUES ANALYTICS UTILES
-- ============================================

-- Vue: Top questions
CREATE OR REPLACE VIEW top_questions AS
SELECT
    question,
    COUNT(*) as count,
    AVG(processing_time_ms) as avg_time_ms,
    AVG(feedback_rating) as avg_rating
FROM chat_analytics
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY question
ORDER BY count DESC
LIMIT 50;

-- Vue: Questions sans sources (gaps knowledge base)
CREATE OR REPLACE VIEW questions_without_sources AS
SELECT
    question,
    COUNT(*) as count,
    created_at
FROM chat_analytics
WHERE num_sources = 0
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY question, created_at
ORDER BY count DESC;

-- Vue: Performance cache
CREATE OR REPLACE VIEW cache_performance AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_requests,
    SUM(CASE WHEN cached THEN 1 ELSE 0 END) as cached_requests,
    ROUND(100.0 * SUM(CASE WHEN cached THEN 1 ELSE 0 END) / COUNT(*), 2) as cache_hit_rate,
    AVG(processing_time_ms) as avg_processing_time_ms
FROM chat_analytics
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Vue: Stats par utilisateur
CREATE OR REPLACE VIEW user_stats AS
SELECT
    user_id,
    COUNT(*) as total_questions,
    AVG(feedback_rating) as avg_rating,
    AVG(processing_time_ms) as avg_response_time_ms,
    MAX(created_at) as last_interaction
FROM chat_analytics
GROUP BY user_id
ORDER BY total_questions DESC;

COMMENT ON TABLE chat_analytics IS 'Analytics des interactions RAG - PhoenixCare';
COMMENT ON VIEW top_questions IS 'Top 50 questions les plus posées (30 derniers jours)';
COMMENT ON VIEW questions_without_sources IS 'Questions sans sources = gaps knowledge base';
COMMENT ON VIEW cache_performance IS 'Performance du cache Redis par jour';
COMMENT ON VIEW user_stats IS 'Statistiques par utilisateur';
