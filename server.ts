import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { processCompanionChat, processCompanionChatStream, generateDailyReview } from './server/geminiService.js';
import { adminRouter } from './server/routes/adminRoutes.js';
import { userSubscriptionRouter } from './server/routes/userSubscriptionRoutes.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes FIRST
  app.use('/api/admin', adminRouter);
  app.use('/api', userSubscriptionRouter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Rafiq AI Companion', timestamp: new Date().toISOString() });
  });

  app.post('/api/companion/chat-stream', async (req, res) => {
    try {
      const { message, history, profile, items, mediaBase64, mediaMimeType } = req.body;
      if (!message && !mediaBase64) {
        return res.status(400).json({ error: 'Message or media parameter is required' });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const result = await processCompanionChatStream(
        message || (profile?.language === 'ar' ? 'لقد أرفقت هذه الصورة/الفيديو لك' : 'I attached this media for you'),
        history || [],
        profile || {},
        items || [],
        (chunkText) => {
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        },
        mediaBase64,
        mediaMimeType
      );

      res.write(`data: ${JSON.stringify({
        done: true,
        replyText: result.replyText,
        actions: result.actions,
        createdOrUpdatedItems: result.createdOrUpdatedItems,
        updatedProfile: result.updatedProfile,
      })}\n\n`);
      res.end();
    } catch (error: unknown) {
      console.error('Chat stream endpoint error:', error);
      const errMessage = error instanceof Error ? error.message : 'Internal server error';
      if (!res.headersSent) {
        return res.status(500).json({ error: errMessage });
      } else {
        res.write(`data: ${JSON.stringify({ error: errMessage })}\n\n`);
        return res.end();
      }
    }
  });

  app.post('/api/companion/chat', async (req, res) => {
    try {
      const { message, history, profile, items, mediaBase64, mediaMimeType } = req.body;
      if (!message && !mediaBase64) {
        return res.status(400).json({ error: 'Message or media parameter is required' });
      }

      const result = await processCompanionChat(
        message || (profile?.language === 'ar' ? 'لقد أرفقت هذه الصورة/الفيديو لك' : 'I attached this media for you'),
        history || [],
        profile || {},
        items || [],
        mediaBase64,
        mediaMimeType
      );

      return res.json(result);
    } catch (error: unknown) {
      console.error('Chat endpoint error:', error);
      const errMessage = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ error: errMessage });
    }
  });

  app.post('/api/companion/review-day', async (req, res) => {
    try {
      const { profile, todayItems } = req.body;
      const reviewText = await generateDailyReview(profile || {}, todayItems || []);
      return res.json({ reviewText });
    } catch (error: unknown) {
      console.error('Review endpoint error:', error);
      const errMessage = error instanceof Error ? error.message : 'Failed to generate review';
      return res.status(500).json({ error: errMessage });
    }
  });

  // API 404 catch-all
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
