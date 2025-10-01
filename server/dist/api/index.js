import { Router } from "express";
const r = Router();
// GET /api/ok
r.get("/ok", (_req, res) => res.json({ ok: true }));
// POST /api/echo
r.post("/echo", (req, res) => res.json({ received: req.body }));
// Routes aides existantes (si tu veux les garder)
r.use("/aides", async (req, res) => {
    // Simulation temporaire
    res.json({
        aides: [
            {
                id: "1",
                nom: "Test Aide",
                description: "Aide de test",
                region: "Paris"
            }
        ]
    });
});
export default r;
//# sourceMappingURL=index.js.map