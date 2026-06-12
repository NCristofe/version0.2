import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Home, CalendarDays, Target, BookHeart, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { useGamification } from '../context/GamificationContext';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './UserAvatar';

const navigation = [
  { name: 'Início',     path: '/',          icon: Home },
  { name: 'Memórias',  path: '/memories',  icon: BookHeart },
  { name: 'Agenda',    path: '/calendar',  icon: CalendarDays },
  { name: 'Planos',    path: '/goals',     icon: Target },
  { name: 'Perfil',    path: '/profile',   icon: Trophy },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLevel, xpProgress } = useGamification();
  const { currentUser } = useAuth();
  const currentUserId = currentUser === 'user2' ? 'user2' : 'user1';

  return (
    <div className="min-h-screen pb-20">
      <Outlet />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl z-50">
        <div className="max-w-md mx-auto px-2 py-2">
          <div className="flex items-center justify-around">
            {navigation.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
              const Icon = item.icon;
              const isProfile = item.path === '/profile';

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative flex flex-col items-center gap-0.5 py-2 px-3 transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-2xl"
                      transition={{ type: 'spring', duration: 0.5 }}
                    />
                  )}

                  <div className="relative z-10">
                    {isProfile ? (
                      <div className="relative">
                        <UserAvatar
                          userId={currentUserId}
                          className={`w-6 h-6 transition-opacity ${isActive ? 'opacity-100' : 'opacity-70'}`}
                          fallbackClassName="text-sm bg-primary/10"
                        />
                        {/* XP progress ring */}
                        <svg className="absolute -inset-1.5 w-9 h-9 -top-1.5 -left-1.5" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/20" />
                          <circle
                            cx="18" cy="18" r="16"
                            fill="none" stroke="currentColor" strokeWidth="2"
                            strokeDasharray={`${2 * Math.PI * 16}`}
                            strokeDashoffset={`${2 * Math.PI * 16 * (1 - xpProgress / 100)}`}
                            strokeLinecap="round"
                            className={`transition-all duration-700 ${isActive ? 'text-primary' : 'text-primary/40'}`}
                            transform="rotate(-90 18 18)"
                          />
                        </svg>
                        <span className="absolute -top-1 -right-1 text-[8px] leading-none bg-primary text-white rounded-full w-3.5 h-3.5 flex items-center justify-center z-10">
                          {currentLevel.level}
                        </span>
                      </div>
                    ) : (
                      <Icon
                        size={22}
                        className={`transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                        fill={isActive ? 'currentColor' : 'none'}
                      />
                    )}
                  </div>

                  <span
                    className={`relative z-10 text-xs transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
