import { SystemPublicSettings } from '../App';

export type RealtimeEventCallback = (data: any) => void;

class RealtimeClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<RealtimeEventCallback>> = new Map();
  private isConnecting: boolean = false;
  private currentUserId: string = '';
  private currentEmail: string = '';
  private currentCountry: string = '';
  private broadcastChannel: BroadcastChannel | null = null;
  private heartbeatInterval: any = null;
  private lastSettingsData: SystemPublicSettings | null = null;

  constructor() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('rafiq_realtime_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this.notifyListeners(event.data.type, event.data.payload);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel initialization fallback');
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.forceSync();
        }
      });
      window.addEventListener('focus', () => {
        this.forceSync();
      });
    }
  }

  public init(userId: string, email?: string, country?: string) {
    if (this.currentUserId === userId && this.currentEmail === email && this.eventSource) {
      return;
    }
    this.currentUserId = userId;
    this.currentEmail = email || '';
    this.currentCountry = country || '';
    this.connect();
    this.startFastHeartbeat();
  }

  private connect() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (e) {}
    }

    this.isConnecting = true;
    const query = new URLSearchParams({
      userId: this.currentUserId || '',
      email: this.currentEmail || '',
      country: this.currentCountry || '',
      _t: Date.now().toString(),
    });

    try {
      this.eventSource = new EventSource(`/api/realtime/events?${query.toString()}`);

      this.eventSource.onopen = () => {
        this.isConnecting = false;
      };

      // Handle general message event
      this.eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.settings) {
            this.lastSettingsData = parsed.settings;
            this.notifyListeners('settings', parsed.settings);
          }
          if (parsed.type) {
            this.notifyListeners(parsed.type, parsed.data || parsed.settings);
          }
        } catch (e) {}
      };

      // Handle specific events
      const eventNames = [
        'connected',
        'settings_updated',
        'system_settings_updated',
        'payment_methods_updated',
        'plans_updated',
        'subscription_updated',
        'user_updated',
        'providers_updated',
        'user_usage_reset',
      ];

      eventNames.forEach((evName) => {
        this.eventSource?.addEventListener(evName, (event: any) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.settings) {
              this.lastSettingsData = parsed.settings;
              this.notifyListeners('settings', parsed.settings);
            }
            this.notifyListeners(evName, parsed.data || parsed.settings || parsed);
          } catch (e) {}
        });
      });

      this.eventSource.onerror = () => {
        this.isConnecting = false;
        try {
          this.eventSource?.close();
        } catch (e) {}
        this.eventSource = null;
        // Fast reconnect after 1.5s
        setTimeout(() => {
          if (!this.eventSource) {
            this.connect();
          }
        }, 1500);
      };
    } catch (err) {
      console.warn('EventSource connect failed, using fast fallback sync:', err);
    }
  }

  // Fast sub-second synchronization loop
  private startFastHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    // Polls every 800ms when document is visible to guarantee absolute < 1-second sync
    this.heartbeatInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.forceSync();
      }
    }, 850);
  }

  public async forceSync(): Promise<SystemPublicSettings | null> {
    try {
      const query = new URLSearchParams({
        _t: Date.now().toString(),
        userId: this.currentUserId || '',
        email: this.currentEmail || '',
        country: this.currentCountry || '',
      });

      const res = await fetch(`/api/public/settings?${query.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (res.ok) {
        const data: SystemPublicSettings = await res.json();
        // Check if changed
        if (JSON.stringify(data) !== JSON.stringify(this.lastSettingsData)) {
          this.lastSettingsData = data;
          this.notifyListeners('settings', data);
          this.broadcastLocally('settings_updated', data);
        }
        return data;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  public subscribe(eventType: string, callback: RealtimeEventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // If we already have cached settings, provide it immediately
    if (eventType === 'settings' && this.lastSettingsData) {
      callback(this.lastSettingsData);
    }

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  public notifyListeners(eventType: string, payload: any) {
    // Notify specific event listeners
    const evListeners = this.listeners.get(eventType);
    if (evListeners) {
      evListeners.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in realtime listener for ${eventType}:`, e);
        }
      });
    }

    // Also notify wildcard '*'
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.forEach((cb) => {
        try {
          cb({ type: eventType, payload });
        } catch (e) {}
      });
    }

    // Dispatch global custom event on window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rafiq_realtime_event', { detail: { type: eventType, payload } }));
      if (eventType === 'settings' || eventType === 'settings_updated' || eventType === 'system_settings_updated') {
        window.dispatchEvent(new CustomEvent('system_settings_updated', { detail: payload }));
      }
      if (eventType === 'payment_methods_updated') {
        window.dispatchEvent(new CustomEvent('payment_methods_updated', { detail: payload }));
      }
      if (eventType === 'plans_updated') {
        window.dispatchEvent(new CustomEvent('plans_updated', { detail: payload }));
      }
      if (eventType === 'subscription_updated' || eventType === 'user_updated') {
        window.dispatchEvent(new CustomEvent('subscription_updated', { detail: payload }));
      }
    }
  }

  public broadcastLocally(eventType: string, payload: any) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: eventType, payload });
      } catch (e) {}
    }
  }

  public destroy() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (e) {}
    }
    this.listeners.clear();
  }
}

export const realtimeClient = new RealtimeClient();
