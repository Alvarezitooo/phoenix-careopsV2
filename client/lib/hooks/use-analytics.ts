import { useQuery } from "@tanstack/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * 📊 Types Analytics
 */
export interface AnalyticsOverview {
  total_interactions_30d: number;
  unique_users_30d: number;
  avg_cache_hit_rate: number;
  avg_response_time_ms: number;
}

export interface TopQuestion {
  question: string;
  count: number;
  avg_time_ms: number;
  avg_rating: number | null;
}

export interface KnowledgeGap {
  question: string;
  count: number;
  created_at: string;
}

export interface CachePerformance {
  date: string;
  total_requests: number;
  cached_requests: number;
  cache_hit_rate: number;
  avg_processing_time_ms: number;
}

export interface UserStat {
  user_id: string;
  total_questions: number;
  avg_rating: number | null;
  avg_response_time_ms: number;
  last_interaction: string;
}

/**
 * 🎯 Hook: useAnalyticsOverview
 */
export function useAnalyticsOverview() {
  return useQuery<AnalyticsOverview>({
    queryKey: ["analytics", "overview"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/analytics/overview`);
      if (!res.ok) throw new Error("Failed to fetch analytics overview");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 min
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5min
  });
}

/**
 * 📈 Hook: useTopQuestions
 */
export function useTopQuestions(limit = 20) {
  return useQuery<TopQuestion[]>({
    queryKey: ["analytics", "top-questions", limit],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/api/analytics/top-questions?limit=${limit}`
      );
      if (!res.ok) throw new Error("Failed to fetch top questions");
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

/**
 * 🔍 Hook: useKnowledgeGaps
 */
export function useKnowledgeGaps(limit = 20) {
  return useQuery<KnowledgeGap[]>({
    queryKey: ["analytics", "knowledge-gaps", limit],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/api/analytics/knowledge-gaps?limit=${limit}`
      );
      if (!res.ok) throw new Error("Failed to fetch knowledge gaps");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * ⚡ Hook: useCachePerformance
 */
export function useCachePerformance(days = 30) {
  return useQuery<CachePerformance[]>({
    queryKey: ["analytics", "cache-performance", days],
    queryFn: async () => {
      const res = await fetch(
        `${API_URL}/api/analytics/cache-performance?days=${days}`
      );
      if (!res.ok) throw new Error("Failed to fetch cache performance");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * 👥 Hook: useUserStats
 */
export function useUserStats() {
  return useQuery<UserStat[]>({
    queryKey: ["analytics", "user-stats"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/analytics/user-stats`);
      if (!res.ok) throw new Error("Failed to fetch user stats");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}
