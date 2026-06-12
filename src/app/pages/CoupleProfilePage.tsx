import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useGamification, LEVELS } from '../context/GamificationContext';
import { UserAvatar } from '../components/UserAvatar';
import {
  Trophy,
  Star,
  Flame,
  Heart,
  Zap,
  Lock,
  ChevronRight,
  Gift,
  Sparkles,
  Target,
  CheckCircle2,
  Circle,
  CalendarHeart,
  MessageCircle,
  Camera,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const START_DATE = new Date('2025-08-23T00:00:00');

function getDaysTogether() {
  return Math.floor((Date.now() - START_DATE.getTime()) / (1000 * 60 * 60 * 24));
}

function getLoveMeterLevel(days: number) {
  if (days >= 365) return { label: 'Amor Lendário', color: '#880E4F', emoji: '💎', percent: 100 };
  if (days >= 180) return { label: 'Amor Profundo', color: '#C2185B', emoji: '❤️‍🔥', percent: 85 };
  if (days >= 100) return { label: 'Amor Forte', color: '#E91E8C', emoji: '💖', percent: 70 };
  if (days >= 30) return { label: 'Amor Crescente', color: '#FF6B9D', emoji: '💗', percent: 50 };
  if (days >= 7) return { label: 'Amor Florescendo', color: '#FF8FAB', emoji: '🌸', percent: 30 };
  return { label: 'Amor Nascente', color: '#FFB6C1', emoji: '🌱', percent: 15 };
}

const DAILY_CHALLENGES_POOL = [
  { id: 'dc1', text: 'Envie uma mensagem carinhosa hoje', emoji: '💌', xp: 10, icon: MessageCircle },
  { id: 'dc2', text: 'Adicione uma foto à galeria', emoji: '📸', xp: 15, icon: Camera },
  { id: 'dc3', text: 'Registre um marco especial', emoji: '⭐', xp: 20, icon: CalendarHeart },
  { id: 'dc4', text: 'Faça o Quiz do Amor', emoji: '🧠', xp: 25, icon: Sparkles },
  { id: 'dc5', text: 'Diga o quanto você ama', emoji: '❤️', xp: 10, icon: Heart },
];

const surprises = [
  { text: 'Você é incrível! ✨', emoji: '💖' },
  { text: 'Te amo mais que tudo! ❤️', emoji: '🥰' },
  { text: 'Você ilumina meus dias! ☀️', emoji: '😊' },
  { text: 'Meu amor por você cresce a cada dia! 📈', emoji: '💕' },
  { text: 'Você é meu tudo! 🌟', emoji: '💝' },
  { text: 'Cada dia ao seu lado é um presente! 🎁', emoji: '🫶' },
  { text: 'Nossa história é a mais bonita! 📖', emoji: '💓' },
];

const DAILY_STORAGE_KEY = 'daily_challenges_v1';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function loadDailyChallenges(): { date: string; completed: string[] } {
  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { date: getTodayKey(), completed: [] };
}

type TabType = 'conquistas' | 'historico' | 'desafios';

export default function CoupleProfilePage() {
  const { currentUser } = useAuth();
  const { coupleProfile, updatePersonProfile } = useAppData();
  const navigate = useNavigate();
  const {
    xp,
    currentLevel,
    nextLevel,
    xpProgress,
    xpToNextLevel,
    achievements,
    stats,
    unlockAchievement,
    addXP,
  } = useGamification();

  const [activeTab, setActiveTab] = useState<TabType>('conquistas');
  const [surprise, setSurprise] = useState<{ text: string; emoji: string } | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [dailyState, setDailyState] = useState(loadDailyChallenges);
  const [newXPPop, setNewXPPop] = useState<string | null>(null);
  const prevLevel = React.useRef(currentLevel.level);

  const daysTogether = getDaysTogether();
  const currentUserId = currentUser === 'user2' ? 'user2' : 'user1';
  const otherUserId = currentUserId === 'user1' ? 'user2' : 'user1';
  const currentProfile = coupleProfile[currentUserId];
  const otherProfile = coupleProfile[otherUserId];
  const loveMeter = getLoveMeterLevel(daysTogether);

  // reset daily challenges if new day
  useEffect(() => {
    const today = getTodayKey();
    if (dailyState.date !== today) {
      const fresh = { date: today, completed: [] };
      setDailyState(fresh);
      localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(fresh));
    }
  }, [dailyState.date]);

  useEffect(() => {
    unlockAchievement('profile_visited');
  }, [unlockAchievement]);

  useEffect(() => {
    if (currentLevel.level > prevLevel.current) {
      setShowLevelUp(true);
      confetti({ particleCount: 220, spread: 130, origin: { y: 0.5 }, colors: ['#FF6B9D', '#FFB6C1', '#FFC8DD', '#FF3D7F'] });
      setTimeout(() => setShowLevelUp(false), 3500);
    }
    prevLevel.current = currentLevel.level;
  }, [currentLevel.level]);

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  const showSurprise = () => {
    const pick = surprises[Math.floor(Math.random() * surprises.length)];
    setSurprise(pick);
    addXP(5, 'Mensagem Surpresa 🎁');
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#FF6B9D', '#FFB6C1', '#FFC8DD'] });
    setTimeout(() => setSurprise(null), 3000);
  };

  const completeChallenge = useCallback((challengeId: string, xpAmount: number, label: string) => {
    if (dailyState.completed.includes(challengeId)) return;
    const updated = { ...dailyState, completed: [...dailyState.completed, challengeId] };
    setDailyState(updated);
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(updated));
    addXP(xpAmount, label);
    setNewXPPop(`+${xpAmount} XP`);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#FF6B9D', '#FFB6C1'] });
    setTimeout(() => setNewXPPop(null), 2000);
  }, [dailyState, addXP]);

  const changeProfileImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updatePersonProfile(currentUserId, { avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const dailyCompletedCount = dailyState.completed.length;
  const dailyTotalCount = DAILY_CHALLENGES_POOL.length;

  return (
    <div className="min-h-screen max-w-md mx-auto pb-28">

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-rose-400 to-red-400" />
        {/* decorative bubbles */}
        <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-8 w-16 h-16 rounded-full bg-white/10" />

        <div className="relative p-6 pt-10 pb-12 text-white">
          <div className="text-center mb-5">
            {/* Couple Avatars */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="relative"
              >
                <UserAvatar
                  userId={currentUserId}
                  className="w-20 h-20 border-4 border-white/70 shadow-xl"
                  fallbackClassName="bg-white/25 text-4xl text-white"
                />
                <label
                  htmlFor="profile-avatar-upload"
                  title="Mudar foto de perfil"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white text-primary border border-white/80 shadow-lg flex items-center justify-center cursor-pointer"
                >
                  <Camera size={16} />
                </label>
                <input
                  id="profile-avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={changeProfileImage}
                  className="sr-only"
                />
              </motion.div>

              <motion.div
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="flex flex-col items-center"
              >
                <Heart className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" />
                <span className="text-[10px] text-white/80 mt-0.5">{daysTogether}d</span>
              </motion.div>

              <motion.div
                initial={{ scale: 0, rotate: 20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="relative"
              >
                <UserAvatar
                  userId={otherUserId}
                  className="w-20 h-20 border-4 border-white/70 shadow-xl"
                  fallbackClassName="bg-white/25 text-4xl text-white"
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-2xl text-white mb-1 drop-shadow">
                {currentProfile.name} & {otherProfile.name}
              </h1>
              <p className="text-white/80 text-sm">{daysTogether} dias de amor juntos 💕</p>
            </motion.div>
          </div>

          {/* Level Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-2xl"
                >
                  {currentLevel.emoji}
                </motion.span>
                <div>
                  <p className="text-[11px] text-white/70 uppercase tracking-wider">Nível {currentLevel.level}</p>
                  <p className="text-white">{currentLevel.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-lg">{xp} XP</p>
                {nextLevel && (
                  <p className="text-white/70 text-xs">faltam {xpToNextLevel} XP</p>
                )}
              </div>
            </div>

            {/* XP Bar */}
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
                className="h-full rounded-full bg-white shadow-lg relative overflow-hidden"
              >
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
              </motion.div>
            </div>
            {nextLevel && (
              <div className="flex justify-between mt-1">
                <span className="text-white/60 text-xs">{currentLevel.name}</span>
                <span className="text-white/60 text-xs">{nextLevel.emoji} {nextLevel.name}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Love Meter */}
      <div className="px-4 -mt-5 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-card rounded-3xl p-5 shadow-xl border border-border"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{loveMeter.emoji}</span>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Medidor de Amor</p>
                <p className="text-foreground">{loveMeter.label}</p>
              </div>
            </div>
            <span className="text-primary text-lg">{loveMeter.percent}%</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${loveMeter.percent}%` }}
              transition={{ duration: 1.4, ease: 'easeOut', delay: 0.7 }}
              className="h-full rounded-full relative overflow-hidden"
              style={{ background: `linear-gradient(90deg, #FFB6C1, ${loveMeter.color})` }}
            >
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </motion.div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {daysTogether < 365 ? `${365 - daysTogether} dias para 1 ano juntos 🎉` : 'Vocês chegaram ao amor eterno! 👑'}
          </p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-3"
        >
          <StatCard emoji="📅" value={daysTogether.toString()} label="Dias Juntos" gradientFrom="from-pink-100" gradientTo="to-rose-50" />
          <StatCard emoji="💬" value={stats.messagesSent.toString()} label="Mensagens" gradientFrom="from-red-50" gradientTo="to-pink-50" />
          <StatCard emoji="🏆" value={unlockedAchievements.length.toString()} label="Conquistas" gradientFrom="from-rose-50" gradientTo="to-fuchsia-50" />
          <StatCard emoji="⭐" value={xp.toString()} label="XP Total" gradientFrom="from-pink-50" gradientTo="to-red-50" />
        </motion.div>
      </div>

      {/* Daily Challenges Card */}
      <div className="px-4 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="bg-card rounded-3xl p-5 shadow-lg border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-primary flex items-center gap-2">
              <Target className="w-5 h-5" />
              Desafios do Dia
            </h3>
            <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full">
              <span className="text-primary text-sm">{dailyCompletedCount}/{dailyTotalCount}</span>
              {dailyCompletedCount === dailyTotalCount && <span className="text-sm">🎉</span>}
            </div>
          </div>

          {/* Progress bar for daily */}
          <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
            <motion.div
              animate={{ width: `${(dailyCompletedCount / dailyTotalCount) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500"
            />
          </div>

          <div className="space-y-3">
            {DAILY_CHALLENGES_POOL.map((challenge, idx) => {
              const done = dailyState.completed.includes(challenge.id);
              const ChallengeIcon = challenge.icon;
              return (
                <motion.button
                  key={challenge.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + idx * 0.07 }}
                  onClick={() => {
                    if (!done) completeChallenge(challenge.id, challenge.xp, challenge.text);
                  }}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${
                    done
                      ? 'bg-primary/8 border-primary/20 opacity-70'
                      : 'bg-muted/40 border-border hover:border-primary/30 active:scale-98'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${done ? 'bg-primary/20' : 'bg-muted'}`}>
                    {done
                      ? <CheckCircle2 className="w-5 h-5 text-primary" />
                      : <ChallengeIcon className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {challenge.text}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Zap className={`w-3.5 h-3.5 ${done ? 'text-primary/50' : 'text-primary'}`} />
                    <span className={`text-xs ${done ? 'text-muted-foreground' : 'text-primary'}`}>+{challenge.xp}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {dailyCompletedCount === dailyTotalCount && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 text-center p-3 bg-primary/10 rounded-2xl"
            >
              <p className="text-primary">🎊 Todos os desafios concluídos hoje!</p>
              <p className="text-xs text-muted-foreground mt-1">Novos desafios amanhã</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Levels Road Map */}
      <div className="px-4 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-card rounded-3xl p-5 shadow-lg border border-border"
        >
          <h3 className="text-xl text-primary mb-4 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Caminho do Casal
          </h3>
          <div className="relative">
            {/* connector line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-muted" />
            <div className="space-y-3">
              {LEVELS.map((level, idx) => {
                const isReached = xp >= level.minXP;
                const isCurrent = currentLevel.level === level.level;
                return (
                  <motion.div
                    key={level.level}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.08 }}
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all relative ${
                      isCurrent
                        ? 'bg-primary/10 border border-primary/30'
                        : isReached
                        ? 'bg-muted/40'
                        : 'opacity-35'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm z-10 flex-shrink-0"
                      style={{
                        backgroundColor: isReached ? level.color + '25' : 'transparent',
                        border: `2px solid ${isReached ? level.color : '#e5e7eb'}`,
                      }}
                    >
                      {level.emoji}
                    </div>
                    <div className="flex-1">
                      <p className={isCurrent ? 'text-primary' : 'text-foreground'}>{level.name}</p>
                      <p className="text-xs text-muted-foreground">{level.minXP} XP</p>
                    </div>
                    {isReached && !isCurrent && (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                    {isCurrent && (
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0"
                      />
                    )}
                    {!isReached && !isCurrent && (
                      <Lock className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex rounded-2xl bg-muted p-1 gap-1">
          {(['conquistas', 'historico', 'desafios'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl transition-all text-xs ${
                activeTab === tab
                  ? 'bg-card shadow-md text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'conquistas' ? '🏆 Conquistas' : tab === 'historico' ? '⚡ Histórico' : '🎯 Extras'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 mb-6">
        <AnimatePresence mode="wait">
          {activeTab === 'conquistas' && (
            <motion.div
              key="conquistas"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {unlockedAchievements.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    Conquistado ({unlockedAchievements.length})
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {unlockedAchievements.map((ach, idx) => (
                      <motion.div
                        key={ach.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-card rounded-2xl p-4 border border-primary/20 shadow-sm relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-full" />
                        <motion.span
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity, delay: idx * 0.3 }}
                          className="text-3xl mb-2 block"
                        >
                          {ach.emoji}
                        </motion.span>
                        <p className="text-sm text-foreground leading-tight mb-1">{ach.title}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{ach.description}</p>
                        <div className="mt-2 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-primary" />
                          <span className="text-xs text-primary">+{ach.xpReward} XP</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {lockedAchievements.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    A conquistar ({lockedAchievements.length})
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {lockedAchievements.map((ach, idx) => (
                      <motion.div
                        key={ach.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-muted/50 rounded-2xl p-4 border border-border opacity-55"
                      >
                        <span className="text-3xl mb-2 block grayscale opacity-40">{ach.emoji}</span>
                        <p className="text-sm text-muted-foreground leading-tight mb-1">{ach.title}</p>
                        <p className="text-xs text-muted-foreground/60 leading-tight">{ach.description}</p>
                        <div className="mt-2 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">+{ach.xpReward} XP</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'historico' && (
            <motion.div
              key="historico"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {[
                { days: 365, label: '1 Ano Juntos! 🥂', xp: 300 },
                { days: 180, label: '6 Meses de Amor ❤️', xp: 150 },
                { days: 100, label: '100 Dias Juntos! 🎊', xp: 100 },
                { days: 30, label: '1 Mês Apaixonados 🌙', xp: 60 },
                { days: 7, label: '1 Semana Juntos 🌱', xp: 25 },
                { days: 0, label: 'Primeiro Passo 💕', xp: 20 },
              ]
                .filter((m) => daysTogether >= m.days)
                .map((milestone, idx) => {
                  const date = new Date(START_DATE.getTime() + milestone.days * 86400000);
                  return (
                    <motion.div
                      key={milestone.days}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Flame className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{milestone.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm">+{milestone.xp}</span>
                      </div>
                    </motion.div>
                  );
                })}

              {daysTogether === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-3 text-primary/30" />
                  <p>Sua história está começando agora! 💕</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'desafios' && (
            <motion.div
              key="desafios"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground mb-2">
                Explore mais recursos do nosso app
              </p>

              {/* Quiz Link */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/extras')}
                className="w-full flex items-center gap-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100 shadow-sm text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground">Quiz do Amor</p>
                  <p className="text-xs text-muted-foreground">Teste o quanto vocês se conhecem</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>

              {/* Gallery Link */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/gallery')}
                className="w-full flex items-center gap-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-4 border border-rose-100 shadow-sm text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-red-400 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground">Nossa Galeria</p>
                  <p className="text-xs text-muted-foreground">Momentos especiais juntos</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>

              {/* Timeline Link */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/timeline')}
                className="w-full flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 shadow-sm text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                  <CalendarHeart className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground">Linha do Tempo</p>
                  <p className="text-xs text-muted-foreground">Nossa história em marcos</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>

              {/* Stats detail */}
              <div className="bg-card rounded-2xl p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  Suas conquistas em números
                </p>
                <div className="space-y-2">
                  <DetailStat label="Quizzes completados" value={stats.quizCompleted} emoji="🧠" />
                  <DetailStat label="Quizzes perfeitos" value={stats.perfectQuizzes} emoji="🏆" />
                  <DetailStat label="Mensagens enviadas" value={stats.messagesSent} emoji="💌" />
                  <DetailStat label="Desafios hoje" value={dailyCompletedCount} emoji="🎯" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Surprise Button */}
      <div className="px-4 mb-8">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={showSurprise}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white p-5 rounded-3xl shadow-lg"
        >
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <Gift className="w-7 h-7" />
            </motion.div>
            <div className="flex-1 text-left">
              <h3 className="text-lg mb-0.5">Mensagem Surpresa</h3>
              <p className="text-sm opacity-80">Receba amor + 5 XP! 💖</p>
            </div>
            <ChevronRight className="w-5 h-5 opacity-70" />
          </div>
        </motion.button>
      </div>

      {/* XP Pop Notification */}
      <AnimatePresence>
        {newXPPop && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>{newXPPop} ganho!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Modal */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring' }}
              className="bg-card rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: 4, duration: 0.5 }}
                className="text-7xl mb-4 block"
              >
                {currentLevel.emoji}
              </motion.div>
              <h2 className="text-3xl text-primary mb-2">Novo Nível!</h2>
              <p className="text-xl mb-1">{currentLevel.name}</p>
              <p className="text-muted-foreground">Vocês estão evoluindo juntos! 💕</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Surprise Modal */}
      <AnimatePresence>
        {surprise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setSurprise(null)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="bg-card rounded-3xl p-8 shadow-2xl max-w-sm text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                {surprise.emoji}
              </motion.div>
              <p className="text-2xl text-foreground">{surprise.text}</p>
              <p className="text-primary mt-3 text-sm">+5 XP ganho! ⭐</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  emoji, value, label, gradientFrom, gradientTo,
}: {
  emoji: string; value: string; label: string; gradientFrom: string; gradientTo: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl p-4 border border-primary/10 shadow-sm`}
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl text-primary mb-0.5">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </motion.div>
  );
}

function DetailStat({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
        <span>{emoji}</span> {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
