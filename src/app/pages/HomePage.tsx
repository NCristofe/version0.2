import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import { useAppData, MOODS, MoodType } from '../context/AppDataContext';
import {
  Heart, Calendar, LogOut, Clock, Flame, Zap, ChevronRight,
  Target, Sparkles, BookHeart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';

const START_DATE = new Date('2025-08-23T00:00:00');
const ONE_YEAR_DATE = new Date('2026-08-23T00:00:00');

interface TimeLeft {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeElapsed(): TimeLeft {
  const now = new Date();
  const diff = now.getTime() - START_DATE.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30.44);
  const years = Math.floor(days / 365.25);

  return {
    years,
    months: months % 12,
    days: Math.floor((days % 365.25) % 30.44),
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
  };
}

function calculateCountdown(): TimeLeft {
  const now = new Date();
  const diff = ONE_YEAR_DATE.getTime() - now.getTime();

  if (diff <= 0) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30.44);

  return {
    years: 0,
    months: months,
    days: days % 30,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
  };
}

export default function HomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { xp, currentLevel, xpProgress, xpToNextLevel } = useGamification();
  const { streak, getTodayCheckIn, addCheckIn, recordActivity, getUpcomingEvents, memories, goals } = useAppData();

  const [timeElapsed, setTimeElapsed] = useState(calculateTimeElapsed());
  const [countdown, setCountdown] = useState(calculateCountdown());
  const [showSpecialDates, setShowSpecialDates] = useState(false);

  const todayCheckIn = getTodayCheckIn();
  const upcomingEvents = getUpcomingEvents(2);
  const activeGoals = goals.filter((g) => g.status === 'em_andamento');
  const recentMemories = memories.slice(0, 3);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(calculateTimeElapsed());
      setCountdown(calculateCountdown());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const specialDates = [
    { date: '23 de Agosto de 2025', event: 'Início do nosso amor', emoji: '💕' },
    { date: '23 de Agosto de 2026', event: '1 ano de namoro', emoji: '🎉' },
  ];

  const handleMood = (mood: MoodType) => {
    addCheckIn(mood);
    recordActivity();
  };

  return (
    <div className="min-h-screen p-5 max-w-md mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl text-primary mb-0.5">Nosso Amor</h1>
          <p className="text-muted-foreground text-sm">em Tempo Real 💖</p>
        </div>
        <button
          onClick={logout}
          className="p-3 rounded-full hover:bg-destructive/10 text-destructive transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Streak + XP Row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Streak */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/profile')}
          className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100 shadow-sm text-left"
        >
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Streak</span>
          </div>
          <p className="text-2xl text-orange-500">{streak.current} dias</p>
          <p className="text-xs text-muted-foreground">Recorde: {streak.longest}d</p>
        </motion.button>

        {/* XP */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => navigate('/profile')}
          className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-100 shadow-sm text-left"
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{currentLevel.emoji} {currentLevel.name}</span>
          </div>
          <p className="text-2xl text-primary">{xp} XP</p>
          <div className="mt-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-primary"
            />
          </div>
          {xpToNextLevel > 0 && <p className="text-xs text-muted-foreground mt-0.5">faltam {xpToNextLevel} XP</p>}
        </motion.button>
      </div>

      {/* Daily Check-in (if not done) */}
      <AnimatePresence>
        {!todayCheckIn && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-2xl p-4 border border-border shadow-sm mb-5"
          >
            <p className="text-sm text-muted-foreground mb-3">☀️ Como você está hoje?</p>
            <div className="flex gap-2">
              {(Object.entries(MOODS) as [MoodType, typeof MOODS[MoodType]][]).map(([key, mood]) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleMood(key)}
                  className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-muted hover:bg-primary/10 transition-colors"
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs text-muted-foreground">{mood.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
        {todayCheckIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-2xl p-3 border border-border shadow-sm mb-5 flex items-center gap-3"
          >
            <span className="text-2xl">{MOODS[todayCheckIn.mood].emoji}</span>
            <div>
              <p className="text-sm text-foreground">Check-in feito!</p>
              <p className="text-xs text-muted-foreground">Você está {MOODS[todayCheckIn.mood].label.toLowerCase()} hoje</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Counter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-sm rounded-3xl p-8 mb-5 border border-primary/20 shadow-xl"
      >
        <div className="text-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Heart className="w-12 h-12 text-primary mx-auto mb-3" fill="currentColor" />
          </motion.div>
          <h2 className="text-2xl text-primary mb-1">Juntos há</h2>
          <p className="text-sm text-muted-foreground">Desde 23 de Agosto de 2025</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <TimeUnit label="Anos" value={timeElapsed.years} />
          <TimeUnit label="Meses" value={timeElapsed.months} />
          <TimeUnit label="Dias" value={timeElapsed.days} />
          <TimeUnit label="Horas" value={timeElapsed.hours} />
          <TimeUnit label="Minutos" value={timeElapsed.minutes} />
          <TimeUnit label="Segundos" value={timeElapsed.seconds} />
        </div>
      </motion.div>

      {/* Countdown to 1 Year */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-3xl p-6 mb-5 border border-border shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-primary" />
          <h3 className="text-lg">Faltam para 1 ano juntos</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TimeUnit label="Meses" value={countdown.months} small />
          <TimeUnit label="Dias" value={countdown.days} small />
          <TimeUnit label="Horas" value={countdown.hours} small />
          <TimeUnit label="Minutos" value={countdown.minutes} small />
        </div>
      </motion.div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-4 border border-border shadow-sm mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Próximos Eventos
            </h3>
            <button onClick={() => navigate('/calendar')} className="text-xs text-primary">Ver todos</button>
          </div>
          <div className="space-y-2">
            {upcomingEvents.map((ev) => {
              const daysUntil = Math.ceil((new Date(ev.date + 'T12:00:00').getTime() - Date.now()) / 86400000);
              return (
                <div key={ev.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: ev.color + '25' }}>
                    {ev.color ? '📅' : '📅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ev.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className="text-xs text-primary flex-shrink-0">{daysUntil === 0 ? 'Hoje!' : `${daysUntil}d`}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Goals Summary */}
      {activeGoals.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          onClick={() => navigate('/goals')}
          className="w-full bg-card rounded-2xl p-4 border border-border shadow-sm mb-5 text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Metas em Andamento
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">{activeGoals.length} meta{activeGoals.length > 1 ? 's' : ''} ativa{activeGoals.length > 1 ? 's' : ''}</p>
          <div className="mt-2 space-y-1.5">
            {activeGoals.slice(0, 2).map((g) => (
              <div key={g.id} className="flex items-center gap-2">
                <span className="text-sm">{g.name}</span>
                {g.targetValue && (
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min((g.currentValue / g.targetValue) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.button>
      )}

      {/* Recent Memories */}
      {recentMemories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-4 border border-border shadow-sm mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-foreground flex items-center gap-2">
              <BookHeart className="w-4 h-4 text-primary" />
              Últimas Memórias
            </h3>
            <button onClick={() => navigate('/memories')} className="text-xs text-primary">Ver todas</button>
          </div>
          <div className="space-y-2">
            {recentMemories.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-xl">
                  {m.emotion === 'feliz' ? '😊' : m.emotion === 'apaixonado' ? '😍' : m.emotion === 'grato' ? '🥰' : '😎'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                {m.liked && <Heart className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="currentColor" />}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="grid grid-cols-3 gap-3 mb-5"
      >
        <QuickAction emoji="📅" label="Calendário" onClick={() => navigate('/calendar')} />
        <QuickAction emoji="🎯" label="Metas" onClick={() => navigate('/goals')} />
        <QuickAction emoji="💫" label="Extras" onClick={() => navigate('/extras')} />
      </motion.div>

      {/* Special Dates Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowSpecialDates(!showSpecialDates)}
        className="w-full bg-primary text-primary-foreground py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 mb-4"
      >
        <Calendar size={20} />
        <span>Datas Especiais</span>
      </motion.button>

      {/* Special Dates List */}
      <AnimatePresence>
        {showSpecialDates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {specialDates.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card p-4 rounded-2xl border border-border shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{item.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{item.date}</p>
                      <p className="font-medium">{item.event}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimeUnit({ label, value, small = false }: { label: string; value: number; small?: boolean }) {
  return (
    <div className={`bg-card/80 backdrop-blur-sm rounded-2xl ${small ? 'p-3' : 'p-4'} text-center border border-border/50`}>
      <motion.div
        key={value}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`font-bold text-primary ${small ? 'text-2xl' : 'text-3xl'} mb-1`}
      >
        {value.toString().padStart(2, '0')}
      </motion.div>
      <div className={`text-muted-foreground ${small ? 'text-xs' : 'text-sm'}`}>{label}</div>
    </div>
  );
}

function QuickAction({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="bg-card rounded-2xl p-3 border border-border shadow-sm flex flex-col items-center gap-2"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </motion.button>
  );
}
