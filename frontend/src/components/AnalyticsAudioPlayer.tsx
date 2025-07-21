'use client';

import { useState, useRef, useEffect } from 'react';
import { analyticsTracker, trackEpisodePlay } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';

interface Episode {
  _id: string;
  title: string;
  audioFile?: string;
  duration: string;
}

interface AnalyticsAudioPlayerProps {
  episode: Episode;
  className?: string;
}

export default function AnalyticsAudioPlayer({ episode, className = '' }: AnalyticsAudioPlayerProps) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const [lastReportedTime, setLastReportedTime] = useState(0);

  // Convert duration string (HH:MM:SS) to seconds
  const parseDuration = (durationStr: string): number => {
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start analytics session when play begins
  const startAnalyticsSession = async () => {
    if (!hasStartedSession && episode._id) {
      const sessionId = await analyticsTracker.startSession(episode._id, user?.id);
      if (sessionId) {
        setHasStartedSession(true);
        // Also track the episode play
        await trackEpisodePlay(episode._id);
      }
    }
  };

  // Update analytics with current progress
  const updateAnalytics = async (currentTime: number, ended: boolean = false) => {
    if (hasStartedSession && (Math.abs(currentTime - lastReportedTime) >= 30 || ended)) {
      await analyticsTracker.updateSession(currentTime, ended);
      setLastReportedTime(currentTime);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    setLoading(true);
    try {
      if (isPlaying) {
        audioRef.current.pause();
        analyticsTracker.trackPause();
      } else {
        await startAnalyticsSession();
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    analyticsTracker.trackSeek();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    
    const newVolume = parseFloat(e.target.value);
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    analyticsTracker.trackSkip();
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      updateAnalytics(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      updateAnalytics(audio.duration, true);
      setHasStartedSession(false);
    };

    const handleError = () => {
      setLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [hasStartedSession, lastReportedTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hasStartedSession) {
        analyticsTracker.endSession();
      }
    };
  }, [hasStartedSession]);

  if (!episode.audioFile) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <p className="text-gray-500 text-center">Audio file not available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <audio
        ref={audioRef}
        src={`http://localhost:5001/uploads/${episode.audioFile}`}
        preload="metadata"
      />
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{episode.title}</h3>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            onClick={() => handleSkip(-10)}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Skip back 10s"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            disabled={loading}
            className="flex items-center justify-center w-12 h-12 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <button
            onClick={() => handleSkip(10)}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Skip forward 10s"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414zm6 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.757 2.829 1 1 0 11-1.415-1.414A3.987 3.987 0 0014 12a3.987 3.987 0 00-.172-1.415 1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-500 w-8">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {hasStartedSession && (
        <div className="text-xs text-green-600 text-center">
          📊 Analytics tracking active
        </div>
      )}
    </div>
  );
}