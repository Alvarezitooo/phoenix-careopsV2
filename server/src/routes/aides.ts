
import express from 'express';
import { aideQuerySchema } from '../validators/aideSchema.js';
import { getAides } from '../services/aidesService.js';

export const aideRouter = express.Router();

aideRouter.get('/', async (req, res) => {
  const parsed = aideQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const aides = await getAides(parsed.data);
    res.json({ aides });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
