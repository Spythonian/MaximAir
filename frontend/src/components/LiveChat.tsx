'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface ChatMessage {
  _id: string;
  message: string;
  username: string;
  userId: {
    _id: string;
    username: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  messageType: 'user' | 'system';
  createdAt: string;
  metadata?: any;
}

interface LiveChatProps {
  streamId?: string;
  scheduleId?: string;
  title?: string;
  className?: string;
}

export default function LiveChat({ streamId, scheduleId, title, className = '' }: LiveChatProps) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!streamId && !scheduleId) return;

    fetchMessages();
    
    // Poll for new messages every 2 seconds
    const interval = setInterval(fetchMessages, 2000);
    setConnected(true);

    return () => {
      clearInterval(interval);
      setConnected(false);
    };
  }, [streamId, scheduleId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const endpoint = streamId ? `/livechat/stream/${streamId}` : `/livechat/schedule/${scheduleId}`;
      const response = await api.get(endpoint);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    try {
      const payload = {
        message: newMessage.trim(),
        ...(streamId ? { streamId } : { scheduleId })
      };

      await api.post('/livechat/message', payload);
      setNewMessage('');
      // Fetch messages immediately to show the new message
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDisplayName = (message: ChatMessage) => {
    if (message.messageType === 'system') return 'System';
    if (message.userId?.profile?.firstName && message.userId?.profile?.lastName) {
      return `${message.userId.profile.firstName} ${message.userId.profile.lastName}`;
    }
    return message.userId?.username || message.username || 'Anonymous';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-2">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden flex flex-col ${className}`}>
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">Live Chat</h3>
            {title && <p className="text-xs text-red-100">{title}</p>}
          </div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-300' : 'bg-red-300'}`}></span>
            <span className="text-xs">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto max-h-96 min-h-64"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs mt-1">Be the first to say something!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message._id} className="flex space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                  message.messageType === 'system' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {message.messageType === 'system' ? '🤖' : getDisplayName(message).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-sm font-medium ${
                      message.messageType === 'system' ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {getDisplayName(message)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm break-words ${
                    message.messageType === 'system' ? 'text-blue-700 italic' : 'text-gray-700'
                  }`}>
                    {message.message}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      {user ? (
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              maxLength={500}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {newMessage.length}/500 characters
            </span>
            <span className="text-xs text-gray-500">
              Logged in as {user.username}
            </span>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Please log in to participate in the chat
          </p>
          <button
            onClick={() => window.location.href = '/admin/login'}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Log In →
          </button>
        </div>
      )}
    </div>
  );
}