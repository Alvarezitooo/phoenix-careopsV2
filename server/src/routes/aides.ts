
import express from 'express';
import { aideQuerySchema } from '../validators/aideSchema.js';
import { getAides } from '../services/aidesService.js';
import { API_ERRORS } from '../utils/errors.js';

export const aideRouter = express.Router();

aideRouter.get('/', async (req, res) => {
  const parsed = aideQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ 
      error: { 
        code: API_ERRORS.VALIDATION_FAILED, 
        details: parsed.error.flatten()
      } 
    });
  }

  try {
    const aides = await getAides(parsed.data);
    res.json({ aides });
  } catch (err: any) {
    console.error('[aidesRouter] Error fetching aides:', err);
    res.status(500).json({ 
      error: { 
        code: API_ERRORS.DB_FETCH_FAILED,
        message: "Une erreur est survenue lors de la récupération des aides."
      }
    });
  }
});
