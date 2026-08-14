import { Response } from 'express';
import { db, FeatureFlagConfig } from '../db/database.js';

export interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
  email?: string;
  country?: string;
  connectedAt: number;
}

class RealtimeSyncService {
  private clients: Map<string, SSEClient> = new Map();

  public addClient(client: SSEClient): void {
    this.clients.set(client.id, client);
    // Send immediate snapshot upon connection
    const evaluated = this.getEvaluatedSettings(client.userId, client.email, client.country);
    this.sendToClient(client, 'connected', {
      clientId: client.id,
      timestamp: Date.now(),
      settings: evaluated,
    });
  }

  public removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  public getEvaluatedSettings(userId?: string, email?: string, country?: string) {
    const settings = db.getSettings();
    const uId = (userId || '').toLowerCase().trim();
    const em = (email || '').toLowerCase().trim();
    const co = (country || '').toUpperCase().trim();

    const evaluateFeature = (config?: FeatureFlagConfig): boolean => {
      if (!config || config.mode === 'hidden') return false;
      if (config.mode === 'everyone') return true;

      if (config.mode === 'specific_user') {
        const target = (config.allowedUserId || '').toLowerCase().trim();
        return !!target && (uId === target || em === target);
      }

      if (config.mode === 'allowed_users_list') {
        const list = (config.allowedUsersList || '')
          .toLowerCase()
          .split(',')
          .map((s) => s.trim());
        return list.includes(uId) || list.includes(em);
      }

      if (config.mode === 'region') {
        const allowedRegions = (config.allowedRegion || '')
          .toUpperCase()
          .split(',')
          .map((s) => s.trim());
        return allowedRegions.includes(co);
      }

      return false;
    };

    return {
      maintenanceMode: Boolean(settings.maintenanceMode),
      newRegistrationsEnabled: Boolean(settings.newRegistrationsEnabled),
      multiAIEnabled: Boolean(settings.multiAIEnabled),
      voiceEnabled: Boolean(settings.voiceEnabled),
      privateCandidAllowed: evaluateFeature(settings.privateCandidVisibility),
      maritalSupportAllowed: evaluateFeature(settings.maritalSupportVisibility),
      privateCandidMode: settings.privateCandidVisibility?.mode || 'hidden',
      maritalSupportMode: settings.maritalSupportVisibility?.mode || 'hidden',
      updatedAt: settings.updatedAt || new Date().toISOString(),
      plans: db.getPlans().filter((p) => p.active),
      paymentMethods: (settings.paymentMethods || []).filter((p) => p.enabled),
    };
  }

  public broadcast(eventType: string, customPayload?: any): void {
    const now = Date.now();
    for (const [clientId, client] of this.clients.entries()) {
      try {
        const evaluated = this.getEvaluatedSettings(client.userId, client.email, client.country);
        const payload = {
          type: eventType,
          timestamp: now,
          settings: evaluated,
          data: customPayload,
        };
        client.res.write(`event: ${eventType}\n`);
        client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
        // Generic message event
        client.res.write(`event: message\n`);
        client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (err) {
        this.clients.delete(clientId);
      }
    }
  }

  private sendToClient(client: SSEClient, eventType: string, data: any): void {
    try {
      client.res.write(`event: ${eventType}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      this.clients.delete(client.id);
    }
  }

  public startHeartbeat(): void {
    setInterval(() => {
      for (const [clientId, client] of this.clients.entries()) {
        try {
          client.res.write(`event: ping\ndata: ${Date.now()}\n\n`);
        } catch (err) {
          this.clients.delete(clientId);
        }
      }
    }, 12000);
  }
}

export const realtimeSyncService = new RealtimeSyncService();
realtimeSyncService.startHeartbeat();
