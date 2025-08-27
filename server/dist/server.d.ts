/**
 * 🕊️ PhoenixCare - Architecture Monolitique Optimisée
 *
 * 🔥 SOLUTION RECOMMANDÉE : Custom Next Server + Express
 * ✅ 1 seul processus Node.js
 * ✅ 1 seul port Railway
 * ✅ 0 conflit, 0 proxy, 0 zombie process
 *
 * Architecture : Express gère les API, Next.js gère les pages/assets
 * Tout dans un seul container Docker avec PID 1 propre
 */
declare const nextApp: import("next/dist/server/next.js").NextServer;
export default nextApp;
//# sourceMappingURL=server.d.ts.map