'use client';

import { useState } from 'react';

interface SocialShareProps {
  episodeId: string;
  episodeTitle: string;
  episodeDescription?: string;
  className?: string;
}

export default function SocialShare({ 
  episodeId, 
  episodeTitle, 
  episodeDescription, 
  className = '' 
}: SocialShareProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out this episode: ${episodeTitle}`;
  const shareUrl = `${currentUrl}?episode=${episodeId}`;

  const trackShare = async (platform: string) => {
    try {
      await fetch('http://localhost:5001/api/community/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episodeId,
          platform,
        }),
      });
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    trackShare('facebook');
    setShowShareMenu(false);
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    trackShare('twitter');
    setShowShareMenu(false);
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    trackShare('linkedin');
    setShowShareMenu(false);
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank');
    trackShare('whatsapp');
    setShowShareMenu(false);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this episode: ${episodeTitle}`);
    const body = encodeURIComponent(`I thought you might enjoy this episode from Iconic FM:\n\n${episodeTitle}\n\n${episodeDescription || ''}\n\nListen here: ${shareUrl}`);
    const url = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = url;
    trackShare('email');
    setShowShareMenu(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackShare('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
        title="Share episode"
      >
        <span className="text-lg">📤</span>
        <span className="text-sm font-medium">Share</span>
      </button>

      {showShareMenu && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-48">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">Share this episode</p>
          </div>
          
          <div className="py-2">
            <button
              onClick={shareToFacebook}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span className="mr-3 text-blue-600">📘</span>
              Facebook
            </button>
            
            <button
              onClick={shareToTwitter}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span className="mr-3 text-blue-400">🐦</span>
              Twitter
            </button>
            
            <button
              onClick={shareToLinkedIn}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span className="mr-3 text-blue-700">💼</span>
              LinkedIn
            </button>
            
            <button
              onClick={shareToWhatsApp}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span className="mr-3 text-green-600">💬</span>
              WhatsApp
            </button>
            
            <button
              onClick={shareViaEmail}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span className="mr-3 text-gray-600">✉️</span>
              Email
            </button>
            
            <div className="border-t border-gray-100 mt-2 pt-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3">📋</span>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
}