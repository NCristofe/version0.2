import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Heart, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { motion } from 'motion/react';
import geovannaAvatar from '../../assets/geovanna-avatar.png';

const users = [
  { id: 'user1', name: 'Natanael', color: '#FF6B9D', emoji: '👨', avatarUrl: undefined },
  { id: 'user2', name: 'Geovanna', color: '#FFB6C1', emoji: '👩', avatarUrl: geovannaAvatar },
];

export default function LoginPage() {
  const { login, hasPassedAuth } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!hasPassedAuth) {
      navigate('/auth');
    }
  }, [hasPassedAuth, navigate]);

  const handleUserSelect = (userId: string) => {
    login(userId);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <Heart className="w-16 h-16 text-primary mx-auto" fill="currentColor" />
          </motion.div>
          <h1 className="text-4xl mb-2 text-primary">Bem-vindo(a)!</h1>
          <p className="text-muted-foreground">Quem está acessando nosso amor?</p>
        </div>

        <div className="space-y-4">
          {users.map((user, index) => (
            <motion.button
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleUserSelect(user.id)}
              className="w-full bg-card p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all border-2 border-border hover:border-primary"
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  ) : (
                    <AvatarFallback className="text-3xl" style={{ backgroundColor: user.color + '20' }}>
                      {user.emoji}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Entrar como</span>
                  </div>
                  <p className="text-xl mt-1">{user.name}</p>
                </div>
                <Heart className="w-6 h-6 text-primary" fill="currentColor" />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
