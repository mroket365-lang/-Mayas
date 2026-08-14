import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { processCompanionChat, processCompanionChatStream, generateDailyReview, decomposeTaskWithAI } from './server/geminiService.js';
import { adminRouter } from './server/routes/adminRoutes.js';
import { userSubscriptionRouter } from './server/routes/userSubscriptionRoutes.js';
import { authRouter } from './server/routes/authRoutes.js';
import { db, FeatureFlagConfig } from './server/db/database.js';
import { realtimeSyncService } from './server/services/realtimeSyncService.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Strict anti-cache middleware for ALL API requests (prevents browser, Railway, CDN & proxy caching)
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // Real-Time Server-Sent Events (SSE) stream for instant (< 50ms) admin variable synchronization
  const handleRealtimeStream = (req: express.Request, res: express.Response) => {
    const userId = (req.query.userId as string) || '';
    const email = (req.query.email as string) || '';
    const country = (req.query.country as string) || '';
    const clientId = 'client_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const client = {
      id: clientId,
      res,
      userId,
      email,
      country,
      connectedAt: Date.now(),
    };

    realtimeSyncService.addClient(client);

    req.on('close', () => {
      realtimeSyncService.removeClient(clientId);
    });
  };

  app.get('/api/realtime/events', handleRealtimeStream);
  app.get('/api/public/realtime-events', handleRealtimeStream);

  // Public Real-Time System Settings & Feature Flags API Endpoint
  app.get('/api/public/settings', (req, res) => {
    const settings = db.getSettings();
    const userId = (req.query.userId as string) || '';
    const email = (req.query.email as string) || '';
    const country = (req.query.country as string) || '';

    const evaluateFeature = (config?: FeatureFlagConfig): boolean => {
      if (!config || config.mode === 'hidden') return false;
      if (config.mode === 'everyone') return true;

      if (config.mode === 'specific_user') {
        const target = (config.allowedUserId || '').toLowerCase().trim();
        return !!target && (userId.toLowerCase().trim() === target || email.toLowerCase().trim() === target);
      }

      if (config.mode === 'allowed_users_list') {
        const list = (config.allowedUsersList || '')
          .toLowerCase()
          .split(',')
          .map((s) => s.trim());
        return list.includes(userId.toLowerCase().trim()) || list.includes(email.toLowerCase().trim());
      }

      if (config.mode === 'region') {
        const allowedRegions = (config.allowedRegion || '')
          .toUpperCase()
          .split(',')
          .map((s) => s.trim());
        return allowedRegions.includes(country.toUpperCase().trim());
      }

      return false;
    };

    const privateCandidAllowed = evaluateFeature(settings.privateCandidVisibility);
    const maritalSupportAllowed = evaluateFeature(settings.maritalSupportVisibility);

    return res.json({
      maintenanceMode: Boolean(settings.maintenanceMode),
      newRegistrationsEnabled: Boolean(settings.newRegistrationsEnabled),
      multiAIEnabled: Boolean(settings.multiAIEnabled),
      voiceEnabled: Boolean(settings.voiceEnabled),
      privateCandidAllowed,
      maritalSupportAllowed,
      privateCandidMode: settings.privateCandidVisibility?.mode || 'hidden',
      maritalSupportMode: settings.maritalSupportVisibility?.mode || 'hidden',
      updatedAt: (settings as any).updatedAt || new Date().toISOString(),
      plans: db.getPlans().filter((p) => p.active),
      paymentMethods: (settings.paymentMethods || []).filter((p) => p.enabled),
    });
  });

  // API Routes FIRST
  app.use('/api/admin', adminRouter);
  app.use('/api', userSubscriptionRouter);
  app.use('/api', authRouter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Rafiq AI Companion', timestamp: new Date().toISOString() });
  });

  app.post('/api/companion/chat-stream', async (req, res) => {
    try {
      const { message, history, profile, items, mediaBase64, mediaMimeType, clientTimeContext } = req.body;
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
        mediaMimeType,
        clientTimeContext
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
      const { message, history, profile, items, mediaBase64, mediaMimeType, clientTimeContext } = req.body;
      if (!message && !mediaBase64) {
        return res.status(400).json({ error: 'Message or media parameter is required' });
      }

      const result = await processCompanionChat(
        message || (profile?.language === 'ar' ? 'لقد أرفقت هذه الصورة/الفيديو لك' : 'I attached this media for you'),
        history || [],
        profile || {},
        items || [],
        mediaBase64,
        mediaMimeType,
        clientTimeContext
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

  app.post('/api/companion/decompose-task', async (req, res) => {
    try {
      const { title, description, language } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Task title is required' });
      }
      const subtaskTitles = await decomposeTaskWithAI(title, description, language || 'ar');
      return res.json({ subtaskTitles });
    } catch (error: unknown) {
      console.error('Decompose task endpoint error:', error);
      const errMessage = error instanceof Error ? error.message : 'Failed to decompose task';
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
