'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  _id: string;
  userId: {
    _id: string;
    username: string;
    profile: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
    };
  };
  content: string;
  likes: number;
  createdAt: string;
  replies?: Comment[];
}

interface CommentsSectionProps {
  episodeId: string;
}

export default function CommentsSection({ episodeId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { user, token } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [episodeId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/community/comments/episode/${episodeId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:5001/api/community/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          episodeId,
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        setNewComment('');
        fetchComments(); // Refresh comments
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (parentId: string) => {
    if (!user || !token || !replyContent.trim()) return;

    try {
      const response = await fetch('http://localhost:5001/api/community/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          episodeId,
          content: replyContent.trim(),
          parentId,
        }),
      });

      if (response.ok) {
        setReplyContent('');
        setReplyingTo(null);
        fetchComments(); // Refresh comments
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const likeComment = async (commentId: string) => {
    if (!user || !token) return;

    try {
      const response = await fetch(`http://localhost:5001/api/community/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchComments(); // Refresh to update like counts
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getDisplayName = (user: Comment['userId']) => {
    if (!user) return 'Anonymous';
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user.username;
  };

  const getInitials = (user: Comment['userId']) => {
    if (!user) return 'AN';
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Comments</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        Comments ({comments.length})
      </h3>

      {/* Add Comment Form */}
      {user ? (
        <form onSubmit={submitComment} className="mb-6">
          <div className="flex space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              {user.profile.avatar ? (
                <img
                  src={user.profile.avatar}
                  alt={getDisplayName({ _id: user._id, username: user.username, profile: user.profile })}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {getInitials({ _id: user._id, username: user.username, profile: user.profile })}
                </span>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this episode..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={3}
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {newComment.length}/1000
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">Sign in to join the conversation</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment._id} className="flex space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              {comment.userId?.profile?.avatar ? (
                <img
                  src={comment.userId.profile.avatar}
                  alt={getDisplayName(comment.userId)}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {getInitials(comment.userId)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-gray-900">
                  {getDisplayName(comment.userId)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-gray-700 mb-2">{comment.content}</p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => likeComment(comment._id)}
                  className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
                  disabled={!user}
                >
                  <span>👍</span>
                  <span className="text-sm">{comment.likes}</span>
                </button>
                {user && (
                  <button
                    onClick={() => setReplyingTo(comment._id)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Reply
                  </button>
                )}
              </div>

              {/* Reply Form */}
              {replyingTo === comment._id && (
                <div className="mt-3 ml-4">
                  <div className="flex space-x-2">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      rows={2}
                      maxLength={1000}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitReply(comment._id)}
                      disabled={!replyContent.trim()}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 ml-4 space-y-4">
                  {comment.replies.map((reply) => (
                    <div key={reply._id} className="flex space-x-3">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {reply.userId?.profile?.avatar ? (
                          <img
                            src={reply.userId.profile.avatar}
                            alt={getDisplayName(reply.userId)}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-xs font-medium">
                            {getInitials(reply.userId)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {getDisplayName(reply.userId)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{reply.content}</p>
                        <button
                          onClick={() => likeComment(reply._id)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors mt-1"
                          disabled={!user}
                        >
                          <span className="text-sm">👍</span>
                          <span className="text-xs">{reply.likes}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">💬</div>
          <h4 className="text-lg font-medium text-gray-900 mb-1">No comments yet</h4>
          <p className="text-gray-500">Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
}
