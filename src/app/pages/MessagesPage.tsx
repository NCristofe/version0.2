import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Heart, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  text: string;
  userId: string;
  timestamp: Date;
}

const quickMessages = [
  'Te amo ❤️',
  'Você é tudo pra mim 💕',
  'Saudades 🥺',
  'Pensando em você 💭',
  'Você me completa 💖',
];

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Oi meu amor! 💕',
    userId: 'user1',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    text: 'Oi minha vida! Como você está? ❤️',
    userId: 'user2',
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: '3',
    text: 'Estou bem! Estava pensando em você 🥰',
    userId: 'user1',
    timestamp: new Date(Date.now() - 3400000),
  },
];

export default function MessagesPage() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('messages');
    return saved ? JSON.parse(saved) : initialMessages;
  });
  const [newMessage, setNewMessage] = useState('');
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text,
      userId: currentUser!,
      timestamp: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage('');
    setShowQuickMessages(false);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-screen flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-6 text-primary-foreground shadow-lg">
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8" fill="currentColor" />
          <div>
            <h1 className="text-2xl">Nossas Mensagens</h1>
            <p className="text-sm opacity-90">Sempre conectados 💕</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
        <AnimatePresence>
          {messages.map((message) => {
            const isCurrentUser = message.userId === currentUser;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-3xl px-5 py-3 shadow-md ${
                    isCurrentUser
                      ? 'bg-primary text-primary-foreground rounded-tr-md'
                      : 'bg-card border border-border rounded-tl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages */}
      <AnimatePresence>
        {showQuickMessages && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 bg-card border-t border-border"
          >
            <div className="flex gap-2 overflow-x-auto pb-2">
              {quickMessages.map((msg, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage(msg)}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-full whitespace-nowrap text-sm hover:bg-primary/20 transition-colors"
                >
                  {msg}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-4 bg-card border-t border-border shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQuickMessages(!showQuickMessages)}
            className={`p-3 rounded-full transition-colors ${
              showQuickMessages ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Smile size={20} />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(newMessage)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-3 bg-muted rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage(newMessage)}
            disabled={!newMessage.trim()}
            className="p-3 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Send size={20} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
