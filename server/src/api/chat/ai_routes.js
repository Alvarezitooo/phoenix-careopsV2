/**
 * Routes Express pour l'API conversationnelle IA
 * Passerelle entre Express et FastAPI Python
 */

import express from 'express';
import axios from 'axios';
import { createSuccessResponse, createErrorResponse } from '../../types/api.js';
import { asyncHandler } from '../../utils/errors.js';

const router = express.Router();

// Configuration du client Python
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

// Middleware pour proxifier les requêtes vers l'API Python
const proxyToPython = async (req, res, endpoint, method = 'POST') => {
  try {
    const config = {
      method,
      url: `${PYTHON_API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      }
    };

    if (method !== 'GET' && req.body) {
      config.data = req.body;
    }

    if (method === 'GET' && req.query) {
      config.params = req.query;
    }

    const response = await axios(config);
    res.json(createSuccessResponse(response.data));

  } catch (error) {
    console.error(`Erreur proxy Python ${endpoint}:`, error.message);

    if (error.response) {
      // Erreur de l'API Python
      res.status(error.response.status).json(
        createErrorResponse(
          error.response.data?.detail || 'Erreur de l\'API IA',
          `PYTHON_API_ERROR_${error.response.status}`
        )
      );
    } else {
      // Erreur de connexion
      res.status(503).json(
        createErrorResponse(
          'Service IA temporairement indisponible',
          'SERVICE_UNAVAILABLE'
        )
      );
    }
  }
};

// Route principale pour envoyer un message
router.post('/send', asyncHandler(async (req, res) => {
  await proxyToPython(req, res, '/api/chat/send');
}));

// Route pour le streaming de réponse
router.post('/stream', asyncHandler(async (req, res) => {
  try {
    const response = await axios({
      method: 'POST',
      url: `${PYTHON_API_URL}/api/chat/stream`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      data: req.body,
      responseType: 'stream'
    });

    // Proxification du stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    response.data.pipe(res);

  } catch (error) {
    console.error('Erreur streaming:', error.message);
    res.status(503).json(
      createErrorResponse(
        'Erreur lors du streaming de la réponse',
        'STREAMING_ERROR'
      )
    );
  }
}));

// Route pour récupérer l'historique de conversation
router.get('/conversations/:conversation_id', asyncHandler(async (req, res) => {
  await proxyToPython(req, res, `/api/chat/conversations/${req.params.conversation_id}`, 'GET');
}));

// Route pour effacer une conversation
router.delete('/conversations/:conversation_id', asyncHandler(async (req, res) => {
  await proxyToPython(req, res, `/api/chat/conversations/${req.params.conversation_id}`, 'DELETE');
}));

// Route de santé pour vérifier la disponibilité de l'API Python
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_API_URL}/health`, {
      timeout: 5000
    });

    res.json(createSuccessResponse({
      status: 'healthy',
      python_api: response.data,
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    res.status(503).json(
      createErrorResponse(
        'API IA indisponible',
        'AI_SERVICE_DOWN',
        { python_api_url: PYTHON_API_URL }
      )
    );
  }
}));

// Route pour les suggestions de questions
router.post('/suggestions', asyncHandler(async (req, res) => {
  await proxyToPython(req, res, '/api/chat/suggestions');
}));

export default router;