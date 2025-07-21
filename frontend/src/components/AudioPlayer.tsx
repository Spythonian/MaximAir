'use client';

import { useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
    audioFile: string;
    episodeId?: string;
    className?: string;
}

export default function AudioPlayer({ audioFile, episodeId, className = "w-full max-w-xs" }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [skipCount, setSkipCount] = useState(0);
    const [pauseCount, setPauseCount] = useState(0);
    const [seekCount, setSeekCount] = useState(0);
    const lastCurrentTime = useRef(0);

    // Start analytics session when audio starts playing
    useEffect(() => {
        if (!episodeId) return;

        const audio = audioRef.current;
        if (!audio) return;

        const startSession = async () => {
            try {
                const response = await fetch('http://localhost:5001/api/analytics/session/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ episodeId }),
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setSessionId(data.sessionId);
                }
            } catch (error) {
                console.error('Failed to start analytics session:', error);
            }
        };

        const handlePlay = () => {
            if (!sessionId) {
                startSession();
            }
        };

        const handlePause = () => {
            setPauseCount(prev => prev + 1);
        };

        const handleSeeked = () => {
            const currentTime = audio.currentTime;
            const timeDiff = Math.abs(currentTime - lastCurrentTime.current);
            
            // Consider it a seek if the time difference is more than 2 seconds
            if (timeDiff > 2) {
                setSeekCount(prev => prev + 1);
            }
            
            lastCurrentTime.current = currentTime;
        };

        const handleTimeUpdate = () => {
            const currentTime = audio.currentTime;
            const timeDiff = Math.abs(currentTime - lastCurrentTime.current);
            
            // Detect skips (large time jumps)
            if (timeDiff > 10) {
                setSkipCount(prev => prev + 1);
            }
            
            lastCurrentTime.current = currentTime;
        };

        const handleEnded = () => {
            updateSession(true);
        };

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('seeked', handleSeeked);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('seeked', handleSeeked);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [episodeId, sessionId]);

    // Update session periodically
    useEffect(() => {
        if (!sessionId) return;

        const interval = setInterval(() => {
            updateSession(false);
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [sessionId, skipCount, pauseCount, seekCount]);

    const updateSession = async (ended: boolean = false) => {
        if (!sessionId || !audioRef.current) return;

        try {
            await fetch(`http://localhost:5001/api/analytics/session/${sessionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentTime: audioRef.current.currentTime,
                    skipCount,
                    pauseCount,
                    seekCount,
                    ended,
                }),
            });
        } catch (error) {
            console.error('Failed to update analytics session:', error);
        }
    };

    return (
        <audio ref={audioRef} controls className={className}>
            <source src={`http://localhost:5001/uploads/${audioFile}`} type="audio/mpeg" />
            <source src={`http://localhost:5001/uploads/${audioFile}`} type="audio/wav" />
            Your browser does not support the audio element.
        </audio>
    );
}