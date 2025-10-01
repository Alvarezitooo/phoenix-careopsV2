import express from 'express';
import { aideRouter } from '../routes/aides.js';
import chatRouter from './chat/routes.js';
// import aiChatRouter from './chat/ai_routes.js'; // Désactivé temporairement
import { DocumentsService } from '../services/documentsService.js';
import { ProceduresService } from '../services/proceduresService.js';
import { validateQuery } from '../middlewares/validation.js';
import { schemas } from '../validators/apiSchemas.js';
import { asyncHandler } from '../utils/errors.js';
import { createSuccessResponse } from '../types/api.js';

const apiRouter = express.Router();

// Toutes les routes montées ici sont protégées par le authMiddleware dans server.ts

// Monte les routes spécifiques
apiRouter.use('/aides', aideRouter);
apiRouter.use('/chat', chatRouter);
// apiRouter.use('/ai-chat', aiChatRouter); // Désactivé temporairement

// Routes pour les documents
apiRouter.get('/documents',
  validateQuery(schemas.documents.search),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const documents = await DocumentsService.getUserDocuments(userId);

    // Format pour compatibilité avec le frontend existant
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      createdAt: doc.created_at,
      size: formatFileSize(doc.size),
      mimeType: doc.mime_type,
      filePath: doc.file_path,
    }));

    res.json(createSuccessResponse({ documents: formattedDocuments }));
  })
);

// Routes pour les procédures
apiRouter.get('/procedures',
  validateQuery(schemas.procedures.search),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const procedures = await ProceduresService.getUserProcedures(userId);

    // Format pour compatibilité avec le frontend existant
    const formattedProcedures = procedures.map(proc => ({
      id: proc.id,
      name: proc.name,
      status: formatProcedureStatus(proc.status),
      details: proc.details,
      dueDate: proc.due_date ? proc.due_date.split('T')[0] : undefined,
      completedDate: proc.completed_date ? proc.completed_date.split('T')[0] : undefined,
    }));

    res.json(createSuccessResponse({ procedures: formattedProcedures }));
  })
);

// Route pour les statistiques du dashboard
apiRouter.get('/dashboard/stats',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const [documents, procedureStats] = await Promise.all([
      DocumentsService.getUserDocuments(userId),
      ProceduresService.getProcedureStats(userId),
    ]);

    const stats = {
      documents: {
        total: documents.length,
        totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
      },
      procedures: procedureStats,
    };

    res.json(createSuccessResponse({ stats }));
  })
);

// Fonctions utilitaires
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatProcedureStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
    action_required: 'Action requise',
    completed: 'Complété',
    rejected: 'Rejeté',
  };
  return statusMap[status] || status;
}

export default apiRouter;
