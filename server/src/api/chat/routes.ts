import { Router } from 'express';
import { chatController } from './controller.js';
import { authMiddleware } from '../../middlewares/auth.js';

const router = Router();

// 🤖 Chat IA Routes
router.post('/message', authMiddleware, chatController.sendMessage);
router.get('/history', authMiddleware, chatController.getHistory);
router.post('/memory', authMiddleware, chatController.saveMemory);
router.delete('/reset', authMiddleware, chatController.resetConversation);

// 📄 Document analysis
router.post('/analyze-document', authMiddleware, chatController.analyzeDocument);

// 🧠 Memory management
router.get('/memory/:userId', authMiddleware, chatController.getUserMemory);
router.patch('/memory/:userId', authMiddleware, chatController.updateMemory);

export default router;