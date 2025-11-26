import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

const Chat = () => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const { socket, isConnected, onlineUsers } = useSocket();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      fetchMessages(selectedMatch._id);

      // Join the match room
      if (socket) {
        socket.emit('join-match', selectedMatch._id);
      }

      return () => {
        // Leave the match room when component unmounts or match changes
        if (socket) {
          socket.emit('leave-match', selectedMatch._id);
        }
      };
    }
  }, [selectedMatch, socket]);

  // Socket.io listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    const handleNewMessage = (message) => {
      // Only add message if it's for the current match
      if (selectedMatch && message.match === selectedMatch._id) {
        setMessages(prev => {
          // CHECK FOR DUPLICATES - prevent adding the same message twice
          const exists = prev.find(m => m._id === message._id);
          if (exists) {
            return prev; // Don't add if already exists
          }
          return [...prev, message];
        });

        // Update match list
        fetchMatches();
      } else {
        // Just update match list for other matches
        fetchMatches();
      }
    };

    // Listen for typing indicators
    const handleUserTyping = ({ matchId, userName }) => {
      if (selectedMatch && matchId === selectedMatch._id) {
        setIsTyping(true);
        setTypingUser(userName);
      }
    };

    const handleUserStoppedTyping = ({ matchId }) => {
      if (selectedMatch && matchId === selectedMatch._id) {
        setIsTyping(false);
        setTypingUser(null);
      }
    };

    // Listen for new matches
    const handleNewMatch = (matchData) => {
      fetchMatches();
      // You can show a notification here
      console.log('New match!', matchData);
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stopped-typing', handleUserStoppedTyping);
    socket.on('new-match', handleNewMatch);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stopped-typing', handleUserStoppedTyping);
      socket.off('new-match', handleNewMatch);
    };
  }, [socket, selectedMatch]);

  const fetchMatches = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/messages/matches', {
        withCredentials: true
      });
      setMatches(response.data);
      if (response.data.length > 0 && !selectedMatch) {
        setSelectedMatch(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (matchId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/api/messages/${matchId}`, {
        withCredentials: true
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch || !socket) return;

    setSending(true);
    const tempMessage = newMessage;
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const response = await axios.post(
        'http://localhost:3000/api/messages',
        {
          matchId: selectedMatch._id,
          text: tempMessage
        },
        { withCredentials: true }
      );

      // Add message to local state, checking for duplicates
      setMessages(prev => {
        const exists = prev.find(m => m._id === response.data._id);
        if (exists) {
          return prev;
        }
        return [...prev, response.data];
      });

      // Stop typing indicator
      const otherUser = getOtherUser(selectedMatch);
      socket.emit('typing-stop', {
        matchId: selectedMatch._id,
        receiverId: otherUser._id
      });

      // Update match list
      fetchMatches();
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(tempMessage); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !selectedMatch) return;

    const otherUser = getOtherUser(selectedMatch);

    // Emit typing start
    socket.emit('typing-start', {
      matchId: selectedMatch._id,
      receiverId: otherUser._id
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop', {
        matchId: selectedMatch._id,
        receiverId: otherUser._id
      });
    }, 2000);
  };

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInHours < 168) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getOtherPet = (match) => {
    return match.owner1._id === currentUser._id ? match.pet2 : match.pet1;
  };

  const getOtherUser = (match) => {
    return match.owner1._id === currentUser._id ? match.owner2 : match.owner1;
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  if (loading && matches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25c225]"></div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
            <button
              onClick={() => navigate('/main')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
          </div>
        </header>

        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Matches Yet</h2>
            <p className="text-gray-600 mb-6">
              Start swiping to find matches and chat with other pet owners!
            </p>
            <button
              onClick={() => navigate('/main')}
              className="bg-gradient-to-r from-[#87e98c] to-[#25c225] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Start Swiping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
            {isConnected && (
              <span className="flex items-center text-xs text-green-600">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                Connected
              </span>
            )}
          </div>
          <button
            onClick={() => navigate('/main')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Match List Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          {matches.map((match) => {
            const otherPet = getOtherPet(match);
            const otherUser = getOtherUser(match);
            const isSelected = selectedMatch?._id === match._id;
            const isOnline = isUserOnline(otherUser._id);

            return (
              <div
                key={match._id}
                onClick={() => setSelectedMatch(match)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-green-50' : ''
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={otherPet.images?.[0] || 'https://placehold.co/50x50/87e98c/ffffff?text=🐾'}
                      alt={otherPet.name}
                      className="w-14 h-14 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/50x50/87e98c/ffffff?text=🐾';
                      }}
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {otherPet.name}
                      </h3>
                      {match.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatTime(match.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {otherUser.fullname}
                    </p>
                    {match.lastMessage && (
                      <p className="text-sm text-gray-500 truncate">
                        {match.lastMessage.text}
                      </p>
                    )}
                  </div>
                  {match.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-[#25c225] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {match.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Area */}
        {selectedMatch ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <div className="relative">
                <img
                  src={getOtherPet(selectedMatch).images?.[0] || 'https://placehold.co/50x50/87e98c/ffffff?text=🐾'}
                  alt={getOtherPet(selectedMatch).name}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/50x50/87e98c/ffffff?text=🐾';
                  }}
                />
                {isUserOnline(getOtherUser(selectedMatch)._id) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">
                  {getOtherPet(selectedMatch).name}
                </h2>
                <p className="text-sm text-gray-600">
                  {getOtherUser(selectedMatch).fullname}
                  {isUserOnline(getOtherUser(selectedMatch)._id) && (
                    <span className="text-green-600"> • Online</span>
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isSender = message.sender._id === currentUser._id;

                return (
                  <div
                    key={message._id}
                    className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isSender
                        ? 'bg-gradient-to-r from-[#87e98c] to-[#25c225] text-white'
                        : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      <p className="break-words">{message.text}</p>
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Sent image"
                          className="mt-2 rounded-lg max-w-full"
                        />
                      )}
                      <p
                        className={`text-xs mt-1 ${isSender ? 'text-white/70' : 'text-gray-500'
                          }`}
                      >
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && typingUser && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                    <p className="text-sm text-gray-600">
                      {typingUser} is typing
                      <span className="typing-dots">
                        <span>.</span><span>.</span><span>.</span>
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#25c225]"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-gradient-to-r from-[#87e98c] to-[#25c225] text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-600">Select a match to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;