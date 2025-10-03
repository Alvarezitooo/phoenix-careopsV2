"use client";

import {
  useAnalyticsOverview,
  useTopQuestions,
  useKnowledgeGaps,
} from "@/lib/hooks/use-analytics";

export default function AnalyticsPage() {
  const { data: overview, isLoading: overviewLoading } =
    useAnalyticsOverview();
  const { data: topQuestions, isLoading: questionsLoading } =
    useTopQuestions(10);
  const { data: gaps, isLoading: gapsLoading } = useKnowledgeGaps(10);

  if (overviewLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">📊 Analytics Dashboard</h1>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">📊 Analytics Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Interactions (30j)"
          value={overview?.total_interactions_30d || 0}
          icon="💬"
        />
        <StatCard
          title="Utilisateurs uniques"
          value={overview?.unique_users_30d || 0}
          icon="👥"
        />
        <StatCard
          title="Cache Hit Rate"
          value={`${overview?.avg_cache_hit_rate || 0}%`}
          icon="⚡"
        />
        <StatCard
          title="Temps de réponse"
          value={`${Math.round(overview?.avg_response_time_ms || 0)}ms`}
          icon="⏱️"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Questions */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📈 Top Questions</h2>
          {questionsLoading ? (
            <p>Chargement...</p>
          ) : (
            <div className="space-y-3">
              {topQuestions && topQuestions.length > 0 ? (
                topQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <p className="font-medium text-sm">{q.question}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {q.count} fois • {Math.round(q.avg_time_ms)}ms
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Aucune donnée disponible</p>
              )}
            </div>
          )}
        </section>

        {/* Knowledge Gaps */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🔍 Gaps Knowledge Base</h2>
          <p className="text-sm text-gray-600 mb-4">
            Questions sans sources → Docs à ajouter
          </p>
          {gapsLoading ? (
            <p>Chargement...</p>
          ) : (
            <div className="space-y-3">
              {gaps && gaps.length > 0 ? (
                gaps.map((gap, idx) => (
                  <div
                    key={idx}
                    className="border-l-4 border-red-500 pl-4 py-2"
                  >
                    <p className="font-medium text-sm">{gap.question}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {gap.count} fois • {new Date(gap.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-green-600">
                  ✅ Aucun gap détecté ! Toutes les questions ont des sources.
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Action Items */}
      <section className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-3">💡 Actions Recommandées</h3>
        <ul className="space-y-2 text-sm">
          {gaps && gaps.length > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-red-500">⚠️</span>
              <span>
                <strong>{gaps.length} questions sans sources</strong> - Ajouter
                des documents pour combler ces gaps
              </span>
            </li>
          )}
          {overview && overview.avg_cache_hit_rate < 50 && (
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">⚠️</span>
              <span>
                <strong>Cache hit rate faible ({overview.avg_cache_hit_rate}%)</strong> - Optimiser le cache TTL
              </span>
            </li>
          )}
          {overview && overview.avg_response_time_ms > 3000 && (
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">⚠️</span>
              <span>
                <strong>Temps de réponse élevé ({Math.round(overview.avg_response_time_ms)}ms)</strong> - Envisager optimisation RAG
              </span>
            </li>
          )}
          {(!gaps || gaps.length === 0) &&
            overview &&
            overview.avg_cache_hit_rate >= 50 &&
            overview.avg_response_time_ms <= 3000 && (
              <li className="flex items-start gap-2">
                <span className="text-green-500">✅</span>
                <span>
                  <strong>Tout est optimal !</strong> Continue comme ça 🚀
                </span>
              </li>
            )}
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
