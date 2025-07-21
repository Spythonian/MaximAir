// Client-side analytics tracking
class AnalyticsTracker {
  private currentSession: string | null = null;
  private sessionStartTime: number = 0;
  private lastUpdateTime: number = 0;
  private skipCount: number = 0;
  private pauseCount: number = 0;
  private seekCount: number = 0;
  private updateInterval: NodeJS.Timeout | null = null;

  // Start tracking a listening session
  async startSession(episodeId: string, userId?: string): Promise<string | null> {
    try {
      const response = await fetch('http://localhost:5001/api/analytics/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episodeId,
          userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.currentSession = data.sessionId;
        this.sessionStartTime = Date.now();
        this.lastUpdateTime = Date.now();
        this.skipCount = 0;
        this.pauseCount = 0;
        this.seekCount = 0;

        // Start periodic updates every 30 seconds
        this.startPeriodicUpdates();
        
        return this.currentSession;
      }
    } catch (error) {
      console.warn('Failed to start analytics session:', error);
    }
    return null;
  }

  // Update session with current playback position
  async updateSession(currentTime: number, ended: boolean = false): Promise<void> {
    if (!this.currentSession) return;

    try {
      await fetch(`http://localhost:5001/api/analytics/session/${this.currentSession}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentTime,
          skipCount: this.skipCount,
          pauseCount: this.pauseCount,
          seekCount: this.seekCount,
          ended
        })
      });

      this.lastUpdateTime = Date.now();

      if (ended) {
        this.endSession();
      }
    } catch (error) {
      console.warn('Failed to update analytics session:', error);
    }
  }

  // Track skip event
  trackSkip(): void {
    this.skipCount++;
  }

  // Track pause event
  trackPause(): void {
    this.pauseCount++;
  }

  // Track seek event
  trackSeek(): void {
    this.seekCount++;
  }

  // End the current session
  endSession(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.currentSession = null;
  }

  // Start periodic updates to keep session alive
  private startPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      // This will be called by the audio player with current time
      // We just keep the interval alive here
    }, 30000);
  }

  // Get current session ID
  getCurrentSession(): string | null {
    return this.currentSession;
  }

  // Check if session is active
  isSessionActive(): boolean {
    return this.currentSession !== null;
  }
}

// Create a singleton instance
export const analyticsTracker = new AnalyticsTracker();

// Page view tracking
export const trackPageView = async (path: string, userId?: string): Promise<void> => {
  try {
    await fetch('http://localhost:5001/api/analytics/pageview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        userId,
        referrer: document.referrer,
        userAgent: navigator.userAgent
      })
    });
  } catch (error) {
    console.warn('Failed to track page view:', error);
  }
};

// Episode play tracking (simplified)
export const trackEpisodePlay = async (episodeId: string): Promise<void> => {
  try {
    await fetch(`http://localhost:5001/api/episodes/${episodeId}/play`, {
      method: 'POST'
    });
  } catch (error) {
    console.warn('Failed to track episode play:', error);
  }
};

export default analyticsTracker;