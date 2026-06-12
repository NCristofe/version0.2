import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Heart, Flame } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useGamification } from '../context/GamificationContext';

export default function ChatPage() {
  const { messages, sendMessage, session, coupleProfile } = useAppData();
  const { incrementStat } = useGamification();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    incrementStat('messagesSent');
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background">
      {/* Header */}
      <div className="p-6 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
            <Heart className="w-6 h-6 text-primary" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-medium text-primary">{coupleProfile.coupleName}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-500" /> Conversa ativa
            </p>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.sender_id === session?.user?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 px-4 rounded-2xl shadow-sm text-sm ${
                    isMe
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-card border border-border rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-card border-t border-border pb-28 md:pb-6">
        <div className="flex items-center gap-2 bg-muted rounded-2xl p-2 px-4 shadow-inner">
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm py-2"
            placeholder="Envie um carinho..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            className="p-2 bg-primary text-white rounded-xl shadow-md"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}