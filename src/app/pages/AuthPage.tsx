import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Heart, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppData } from '../context/AppDataContext';
import { UserAvatar } from '../components/UserAvatar';

export default function AuthPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const { authenticate, currentUser, isAuthenticated } = useAuth();
  const { coupleProfile } = useAppData();
  const navigate = useNavigate();
  const currentUserId = currentUser === 'user2' ? 'user2' : 'user1';
  const currentProfile = coupleProfile[currentUserId];

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    } else if (!currentUser) {
      navigate('/login');
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authenticate(password)) {
      navigate('/');
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 overflow-hidden relative">
      {/* Floating hearts background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/20"
            initial={{ y: '100vh', x: Math.random() * window.innerWidth }}
            animate={{
              y: '-100vh',
              rotate: 360,
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            style={{
              left: `${Math.random() * 100}%`,
            }}
          >
            <Heart size={20 + Math.random() * 30} fill="currentColor" />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-border">
          {/* Header */}
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <Heart className="w-16 h-16 text-primary mx-auto" fill="currentColor" />
            </motion.div>
            <h1 className="text-4xl mb-2 text-primary">Nosso Amor</h1>
            <div className="flex items-center justify-center gap-3 mt-3">
              <UserAvatar userId={currentUserId} className="w-12 h-12" fallbackClassName="bg-primary/10 text-2xl" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Entrando como</p>
                <p className="text-lg text-foreground">{currentProfile.name}</p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm mb-2 text-foreground/80">
                Digite sua senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-4 bg-input-background rounded-2xl border-2 transition-all focus:outline-none focus:border-primary ${
                    error ? 'border-destructive animate-shake' : 'border-border'
                  }`}
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-sm mt-2"
                >
                  Senha incorreta. Tente novamente! 💔
                </motion.p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              Entrar
            </motion.button>
          </form>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Trocar usuário
          </button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Criado com muito amor 💕
          </p>
        </div>
      </motion.div>
    </div>
  );
}
