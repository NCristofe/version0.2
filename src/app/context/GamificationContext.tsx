import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getLocalDateKey } from '../lib/date';
import { supabase } from '../../supabase';
import { useAuth } from './AuthContext';

const GAMIFICATION_ROW_ID = 'couple';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface Level {
  level: number;
  name: string;
  emoji: string;
  minXP: number;
  maxXP: number;
  color: string;
}

export interface XPEvent {
  id: string;
  amount: number;
  reason: string;
  timestamp: string;
}

export interface GamificationState {
  xp: number;
  achievements: Achievement[];
  xpHistory: XPEvent[];
  stats: {
    messagesSent: number;
    quizCompleted: number;
    perfectQuizzes: number;
  };
}

export interface DailyChallengeState {
  date: string;
  completed: string[];
}

interface GamificationContextType {
  xp: number;
  currentLevel: Level;
  nextLevel: Level | null;
  xpToNextLevel: number;
  xpProgress: number;
  achievements: Achievement[];
  xpHistory: XPEvent[];
  stats: GamificationState['stats'];
  lastXPGain: { amount: number; reason: string } | null;
  dailyChallenges: DailyChallengeState;
  addXP: (amount: number, reason: string) => void;
  unlockAchievement: (id: string) => void;
  incrementStat: (stat: keyof GamificationState['stats']) => void;
  clearLastXPGain: () => void;
  /**
   * Marca um desafio diário como concluído E dá o XP, mas só na primeira vez
   * no dia que uma ação REAL correspondente acontecer (enviar mensagem,
   * adicionar foto, etc.) - não existe mais um botão "marquei que fiz".
   */
  completeDailyChallenge: (id: string, xpAmount: number, reason: string) => void;
}

export const LEVELS: Level[] = [
  { level: 1, name: 'Pombinhos', emoji: '🐦', minXP: 0, maxXP: 100, color: '#FFB6C1' },
  { level: 2, name: 'Apaixonados', emoji: '💕', minXP: 100, maxXP: 300, color: '#FF6B9D' },
  { level: 3, name: 'Inseparáveis', emoji: '💖', minXP: 300, maxXP: 600, color: '#E91E8C' },
  { level: 4, name: 'Almas Gêmeas', emoji: '✨', minXP: 600, maxXP: 1000, color: '#C2185B' },
  { level: 5, name: 'Amor Eterno', emoji: '👑', minXP: 1000, maxXP: 9999, color: '#880E4F' },
];

const START_DATE = new Date('2025-08-23T00:00:00');

const DAYS_TOGETHER = Math.floor((Date.now() - START_DATE.getTime()) / (1000 * 60 * 60 * 24));

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_login',
    title: 'Primeiro Passo',
    description: 'Entrou no nosso app pela primeira vez',
    emoji: '💕',
    xpReward: 20,
    unlocked: true,
    unlockedAt: START_DATE.toISOString(),
  },
  {
    id: 'first_message',
    title: 'Palavras de Amor',
    description: 'Enviou sua primeira mensagem',
    emoji: '💌',
    xpReward: 15,
    unlocked: false,
  },
  {
    id: 'ten_messages',
    title: 'Conversadores',
    description: 'Enviou 10 mensagens',
    emoji: '💬',
    xpReward: 40,
    unlocked: false,
  },
  {
    id: 'fifty_messages',
    title: 'Inseparáveis no Chat',
    description: 'Enviou 50 mensagens',
    emoji: '🔥',
    xpReward: 80,
    unlocked: false,
  },
  {
    id: 'quiz_first',
    title: 'Conhecedor do Amor',
    description: 'Completou o Quiz do Amor',
    emoji: '🧠',
    xpReward: 30,
    unlocked: false,
  },
  {
    id: 'quiz_perfect',
    title: 'Perfeição',
    description: 'Acertou todas as perguntas do quiz',
    emoji: '🏆',
    xpReward: 50,
    unlocked: false,
  },
  {
    id: 'one_week',
    title: 'Uma Semana',
    description: '7 dias juntos',
    emoji: '🌱',
    xpReward: 25,
    unlocked: DAYS_TOGETHER >= 7,
    unlockedAt: DAYS_TOGETHER >= 7 ? new Date(START_DATE.getTime() + 7 * 86400000).toISOString() : undefined,
  },
  {
    id: 'one_month',
    title: 'Um Mês Apaixonados',
    description: '30 dias juntos',
    emoji: '🌙',
    xpReward: 60,
    unlocked: DAYS_TOGETHER >= 30,
    unlockedAt: DAYS_TOGETHER >= 30 ? new Date(START_DATE.getTime() + 30 * 86400000).toISOString() : undefined,
  },
  {
    id: 'hundred_days',
    title: '100 Dias!',
    description: '100 dias juntos',
    emoji: '🎊',
    xpReward: 100,
    unlocked: DAYS_TOGETHER >= 100,
    unlockedAt: DAYS_TOGETHER >= 100 ? new Date(START_DATE.getTime() + 100 * 86400000).toISOString() : undefined,
  },
  {
    id: 'six_months',
    title: 'Seis Meses de Amor',
    description: '180 dias juntos',
    emoji: '❤️',
    xpReward: 150,
    unlocked: DAYS_TOGETHER >= 180,
    unlockedAt: DAYS_TOGETHER >= 180 ? new Date(START_DATE.getTime() + 180 * 86400000).toISOString() : undefined,
  },
  {
    id: 'one_year',
    title: 'Um Ano Juntos',
    description: '365 dias juntos',
    emoji: '🥂',
    xpReward: 300,
    unlocked: DAYS_TOGETHER >= 365,
    unlockedAt: DAYS_TOGETHER >= 365 ? new Date(START_DATE.getTime() + 365 * 86400000).toISOString() : undefined,
  },
  {
    id: 'profile_visited',
    title: 'Nosso Perfil',
    description: 'Visitou o perfil do casal',
    emoji: '💎',
    xpReward: 10,
    unlocked: false,
  },
];

function computeInitialXP(achievements: Achievement[]): number {
  return achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0);
}

function getLevelForXP(xp: number): Level {
  return [...LEVELS].reverse().find((l) => xp >= l.minXP) ?? LEVELS[0];
}

const STORAGE_KEY = 'gamification_v2';
const DAILY_CHALLENGES_KEY = 'daily_challenges_v1';

function getTodayKey() {
  return getLocalDateKey();
}

function loadDailyChallenges(): DailyChallengeState {
  try {
    const raw = localStorage.getItem(DAILY_CHALLENGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyChallengeState;
      if (parsed.date === getTodayKey()) return parsed;
    }
  } catch {}
  return { date: getTodayKey(), completed: [] };
}

function loadState(): GamificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  const achievements = INITIAL_ACHIEVEMENTS;
  const xp = computeInitialXP(achievements);
  return {
    xp,
    achievements,
    xpHistory: [],
    stats: { messagesSent: 0, quizCompleted: 0, perfectQuizzes: 0 },
  };
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [state, setState] = useState<GamificationState>(loadState);
  const [lastXPGain, setLastXPGain] = useState<{ amount: number; reason: string } | null>(null);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallengeState>(loadDailyChallenges);
  const dailyChallengesRef = useRef(dailyChallenges);
  const hasSyncedRef = useRef(false); // evita subir o estado local antes de saber o que já tem no servidor

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    dailyChallengesRef.current = dailyChallenges;
    localStorage.setItem(DAILY_CHALLENGES_KEY, JSON.stringify(dailyChallenges));
  }, [dailyChallenges]);

  // Ao logar: se já existe gamificação salva no servidor, ela vira a fonte da
  // verdade (assim os dois aparelhos do casal veem o mesmo XP/conquistas).
  // Se ainda não existe nada lá, sobe o progresso local em vez de perdê-lo.
  useEffect(() => {
    hasSyncedRef.current = false;

    if (!session?.user) return;

    let cancelled = false;

    (async () => {
      const { data: row, error } = await supabase
        .from('gamification_state')
        .select('*')
        .eq('id', GAMIFICATION_ROW_ID)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Erro ao buscar gamificação no Supabase:', error);
        toast.error('Não foi possível carregar XP e conquistas salvos no servidor.');
      } else if (row) {
        setState({
          xp: row.xp,
          achievements: row.achievements,
          xpHistory: row.xp_history,
          stats: row.stats,
        });
        if (row.daily_challenges?.date === getTodayKey()) {
          setDailyChallenges(row.daily_challenges);
        }
      } else {
        const { error: upsertError } = await supabase.from('gamification_state').upsert({
          id: GAMIFICATION_ROW_ID,
          xp: state.xp,
          achievements: state.achievements,
          xp_history: state.xpHistory,
          stats: state.stats,
          daily_challenges: dailyChallengesRef.current,
          updated_at: new Date().toISOString(),
        });
        if (upsertError) console.error('Erro ao subir gamificação inicial para o Supabase:', upsertError);
      }

      hasSyncedRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Depois da primeira sincronização, toda mudança local também é salva no servidor.
  useEffect(() => {
    if (!session?.user || !hasSyncedRef.current) return;

    supabase.from('gamification_state').upsert({
      id: GAMIFICATION_ROW_ID,
      xp: state.xp,
      achievements: state.achievements,
      xp_history: state.xpHistory,
      stats: state.stats,
      daily_challenges: dailyChallenges,
      updated_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) {
        console.error('Erro ao salvar gamificação no Supabase:', error);
        toast.error('Não foi possível salvar seu progresso no servidor.');
      }
    });
  }, [state, dailyChallenges, session?.user]);

  const currentLevel = getLevelForXP(state.xp);
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1) ?? null;
  const xpToNextLevel = nextLevel ? nextLevel.minXP - state.xp : 0;
  const xpProgress = nextLevel
    ? ((state.xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
    : 100;

  const addXP = useCallback((amount: number, reason: string) => {
    const event: XPEvent = {
      id: Date.now().toString(),
      amount,
      reason,
      timestamp: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      xp: prev.xp + amount,
      xpHistory: [event, ...prev.xpHistory].slice(0, 50),
    }));
    setLastXPGain({ amount, reason });
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setState((prev) => {
      const achievement = prev.achievements.find((a) => a.id === id);
      if (!achievement || achievement.unlocked) return prev;

      const updated = prev.achievements.map((a) =>
        a.id === id ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a
      );
      return { ...prev, achievements: updated, xp: prev.xp + achievement.xpReward };
    });
  }, []);

  const incrementStat = useCallback((stat: keyof GamificationState['stats']) => {
    setState((prev) => ({
      ...prev,
      stats: { ...prev.stats, [stat]: prev.stats[stat] + 1 },
    }));
  }, []);

  const clearLastXPGain = useCallback(() => setLastXPGain(null), []);

  const completeDailyChallenge = useCallback((id: string, xpAmount: number, reason: string) => {
    const today = getTodayKey();
    const current = dailyChallengesRef.current.date === today ? dailyChallengesRef.current : { date: today, completed: [] };
    if (current.completed.includes(id)) return; // já ganhou esse bônus hoje

    setDailyChallenges({ date: today, completed: [...current.completed, id] });
    addXP(xpAmount, reason);
  }, [addXP]);

  return (
    <GamificationContext.Provider
      value={{
        xp: state.xp,
        currentLevel,
        nextLevel,
        xpToNextLevel,
        xpProgress,
        achievements: state.achievements,
        xpHistory: state.xpHistory,
        stats: state.stats,
        lastXPGain,
        dailyChallenges,
        addXP,
        unlockAchievement,
        incrementStat,
        clearLastXPGain,
        completeDailyChallenge,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
}
