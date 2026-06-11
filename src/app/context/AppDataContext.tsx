import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EventCategory =
  | 'encontro'
  | 'aniversario'
  | 'viagem'
  | 'financeiro'
  | 'meta'
  | 'estudos'
  | 'trabalho'
  | 'personalizado';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string; // ISO date string YYYY-MM-DD
  time: string;
  location: string;
  color: string;
}

export type GoalCategory = 'financeira' | 'viagem' | 'objetivo' | 'experiencia' | 'personalizada';
export type GoalStatus = 'em_andamento' | 'concluida' | 'pausada';

export interface Goal {
  id: string;
  name: string;
  description: string;
  category: GoalCategory;
  targetValue?: number;
  currentValue: number;
  deadline: string;
  status: GoalStatus;
  createdAt: string;
}

export type MoodType = 'otimo' | 'bom' | 'normal' | 'ruim';

export interface CheckIn {
  id: string;
  date: string;
  mood: MoodType;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  emotion: 'feliz' | 'apaixonado' | 'grato' | 'divertido';
  liked: boolean;
  favorited: boolean;
  createdAt: string;
}

export interface TimeCapsule {
  id: string;
  title: string;
  message: string;
  openDate: string; // ISO date string
  createdAt: string;
  opened: boolean;
}

export interface WishItem {
  id: string;
  name: string;
  description: string;
  link?: string;
  category: string;
  priority: 'alta' | 'media' | 'baixa';
  owner: string;
}

export interface CoupleQuestion {
  id: string;
  question: string;
  myAnswer?: string;
  partnerAnswer?: string;
  answeredAt?: string;
}

export interface StreakState {
  current: number;
  longest: number;
  lastActivityDate: string;
}

export interface CoupleProfile {
  user1: PersonProfile;
  user2: PersonProfile;
  coupleName: string;
  startDate: string;
  engagementDate?: string;
  weddingDate?: string;
}

export interface PersonProfile {
  name: string;
  nickname: string;
  city: string;
  favoriteColor: string;
  favoriteFood: string;
  favoriteHobby: string;
}

// ─── Category config ─────────────────────────────────────────────────────────

export const EVENT_CATEGORIES: Record<EventCategory, { label: string; emoji: string; color: string }> = {
  encontro:    { label: 'Encontro',    emoji: '❤️',  color: '#FF6B9D' },
  aniversario: { label: 'Aniversário', emoji: '🎂',  color: '#FFB347' },
  viagem:      { label: 'Viagem',      emoji: '✈️',  color: '#4FC3F7' },
  financeiro:  { label: 'Financeiro',  emoji: '💰',  color: '#81C784' },
  meta:        { label: 'Meta',        emoji: '🎯',  color: '#BA68C8' },
  estudos:     { label: 'Estudos',     emoji: '🎓',  color: '#64B5F6' },
  trabalho:    { label: 'Trabalho',    emoji: '💼',  color: '#90A4AE' },
  personalizado:{ label: 'Personalizado',emoji: '📌', color: '#F06292' },
};

export const GOAL_CATEGORIES: Record<GoalCategory, { label: string; emoji: string }> = {
  financeira:   { label: 'Financeira',   emoji: '💰' },
  viagem:       { label: 'Viagem',       emoji: '✈️' },
  objetivo:     { label: 'Objetivo',     emoji: '🎯' },
  experiencia:  { label: 'Experiência',  emoji: '❤️' },
  personalizada:{ label: 'Personalizada',emoji: '📌' },
};

export const MOODS: Record<MoodType, { label: string; emoji: string; color: string }> = {
  otimo:  { label: 'Ótimo',  emoji: '😊', color: '#81C784' },
  bom:    { label: 'Bom',    emoji: '🙂', color: '#64B5F6' },
  normal: { label: 'Normal', emoji: '😐', color: '#FFB347' },
  ruim:   { label: 'Ruim',   emoji: '😔', color: '#EF9A9A' },
};

export const EMOTIONS = [
  { id: 'feliz',      label: 'Feliz',      emoji: '😊' },
  { id: 'apaixonado', label: 'Apaixonado', emoji: '😍' },
  { id: 'grato',      label: 'Grato',      emoji: '🥰' },
  { id: 'divertido',  label: 'Divertido',  emoji: '😎' },
] as const;

const DAILY_QUESTIONS: string[] = [
  'Qual foi seu momento favorito conosco?',
  'O que você mais admira em mim?',
  'Qual viagem você gostaria de fazer juntos?',
  'O que te fez sorrir hoje?',
  'Qual memória nossa você mais atesora?',
  'O que você quer fazer juntos esse fim de semana?',
  'Qual foi o momento mais engraçado que vivemos?',
  'O que você ama no nosso relacionamento?',
  'Qual sonho você quer realizar comigo?',
  'O que você aprendeu com o nosso relacionamento?',
];

// ─── State ────────────────────────────────────────────────────────────────────

interface AppData {
  events: CalendarEvent[];
  goals: Goal[];
  memories: Memory[];
  capsules: TimeCapsule[];
  wishes: WishItem[];
  questions: CoupleQuestion[];
  checkIns: CheckIn[];
  streak: StreakState;
  coupleProfile: CoupleProfile;
  answeredQuestionIds: string[];
}

interface AppDataContextType extends AppData {
  // Events
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventsForDate: (date: string) => CalendarEvent[];
  getUpcomingEvents: (n?: number) => CalendarEvent[];
  // Goals
  addGoal: (g: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  // Memories
  addMemory: (m: Omit<Memory, 'id' | 'createdAt'>) => void;
  toggleMemoryLike: (id: string) => void;
  toggleMemoryFavorite: (id: string) => void;
  deleteMemory: (id: string) => void;
  // Capsules
  addCapsule: (c: Omit<TimeCapsule, 'id' | 'createdAt' | 'opened'>) => void;
  openCapsule: (id: string) => void;
  // Wishes
  addWish: (w: Omit<WishItem, 'id'>) => void;
  deleteWish: (id: string) => void;
  // Questions
  answerQuestion: (id: string, answer: string) => void;
  getDailyQuestion: () => CoupleQuestion;
  getRandomQuestion: () => CoupleQuestion;
  // Check-in
  addCheckIn: (mood: MoodType) => void;
  getTodayCheckIn: () => CheckIn | null;
  // Streak
  recordActivity: () => void;
  // Profile
  updateCoupleProfile: (profile: Partial<CoupleProfile>) => void;
}

const STORAGE_KEY = 'nosso_amor_appdata_v1';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function defaultData(): AppData {
  const questionObjects = DAILY_QUESTIONS.map((q, i) => ({
    id: `q${i}`,
    question: q,
  }));

  return {
    events: [
      {
        id: uid(),
        title: '1 Ano Juntos! 🥂',
        description: 'Um ano do início do nosso amor',
        category: 'aniversario',
        date: '2026-08-23',
        time: '00:00',
        location: '',
        color: '#FF6B9D',
      },
    ],
    goals: [],
    memories: [],
    capsules: [],
    wishes: [],
    questions: questionObjects,
    checkIns: [],
    streak: { current: 0, longest: 0, lastActivityDate: '' },
    coupleProfile: {
      user1: { name: 'Eu', nickname: '', city: '', favoriteColor: '', favoriteFood: '', favoriteHobby: '' },
      user2: { name: 'Amor', nickname: '', city: '', favoriteColor: '', favoriteFood: '', favoriteHobby: '' },
      coupleName: 'Nosso Amor',
      startDate: '2025-08-23',
    },
    answeredQuestionIds: [],
  };
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const def = defaultData();
      // merge questions to always have full pool
      return {
        ...def,
        ...parsed,
        questions: def.questions.map((dq: CoupleQuestion) => {
          const existing = parsed.questions?.find((q: CoupleQuestion) => q.id === dq.id);
          return existing ?? dq;
        }),
      };
    }
  } catch {}
  return defaultData();
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const set = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      return next;
    });
  }, []);

  // ── Events ──────────────────────────────────────────────────────────────────
  const addEvent = useCallback((e: Omit<CalendarEvent, 'id'>) => {
    set((p) => ({ ...p, events: [...p.events, { ...e, id: uid() }] }));
  }, [set]);

  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    set((p) => ({ ...p, events: p.events.map((e) => e.id === id ? { ...e, ...updates } : e) }));
  }, [set]);

  const deleteEvent = useCallback((id: string) => {
    set((p) => ({ ...p, events: p.events.filter((e) => e.id !== id) }));
  }, [set]);

  const getEventsForDate = useCallback((date: string) => {
    return data.events.filter((e) => e.date === date);
  }, [data.events]);

  const getUpcomingEvents = useCallback((n = 3) => {
    const now = today();
    return [...data.events]
      .filter((e) => e.date >= now)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, n);
  }, [data.events]);

  // ── Goals ────────────────────────────────────────────────────────────────────
  const addGoal = useCallback((g: Omit<Goal, 'id' | 'createdAt'>) => {
    set((p) => ({ ...p, goals: [...p.goals, { ...g, id: uid(), createdAt: new Date().toISOString() }] }));
  }, [set]);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    set((p) => ({ ...p, goals: p.goals.map((g) => g.id === id ? { ...g, ...updates } : g) }));
  }, [set]);

  const deleteGoal = useCallback((id: string) => {
    set((p) => ({ ...p, goals: p.goals.filter((g) => g.id !== id) }));
  }, [set]);

  // ── Memories ─────────────────────────────────────────────────────────────────
  const addMemory = useCallback((m: Omit<Memory, 'id' | 'createdAt'>) => {
    set((p) => ({ ...p, memories: [{ ...m, id: uid(), createdAt: new Date().toISOString() }, ...p.memories] }));
  }, [set]);

  const toggleMemoryLike = useCallback((id: string) => {
    set((p) => ({ ...p, memories: p.memories.map((m) => m.id === id ? { ...m, liked: !m.liked } : m) }));
  }, [set]);

  const toggleMemoryFavorite = useCallback((id: string) => {
    set((p) => ({ ...p, memories: p.memories.map((m) => m.id === id ? { ...m, favorited: !m.favorited } : m) }));
  }, [set]);

  const deleteMemory = useCallback((id: string) => {
    set((p) => ({ ...p, memories: p.memories.filter((m) => m.id !== id) }));
  }, [set]);

  // ── Capsules ──────────────────────────────────────────────────────────────────
  const addCapsule = useCallback((c: Omit<TimeCapsule, 'id' | 'createdAt' | 'opened'>) => {
    set((p) => ({ ...p, capsules: [...p.capsules, { ...c, id: uid(), createdAt: new Date().toISOString(), opened: false }] }));
  }, [set]);

  const openCapsule = useCallback((id: string) => {
    set((p) => ({ ...p, capsules: p.capsules.map((c) => c.id === id ? { ...c, opened: true } : c) }));
  }, [set]);

  // ── Wishes ────────────────────────────────────────────────────────────────────
  const addWish = useCallback((w: Omit<WishItem, 'id'>) => {
    set((p) => ({ ...p, wishes: [...p.wishes, { ...w, id: uid() }] }));
  }, [set]);

  const deleteWish = useCallback((id: string) => {
    set((p) => ({ ...p, wishes: p.wishes.filter((w) => w.id !== id) }));
  }, [set]);

  // ── Questions ─────────────────────────────────────────────────────────────────
  const answerQuestion = useCallback((id: string, answer: string) => {
    set((p) => ({
      ...p,
      questions: p.questions.map((q) =>
        q.id === id ? { ...q, myAnswer: answer, answeredAt: new Date().toISOString() } : q
      ),
      answeredQuestionIds: p.answeredQuestionIds.includes(id) ? p.answeredQuestionIds : [...p.answeredQuestionIds, id],
    }));
  }, [set]);

  const getDailyQuestion = useCallback((): CoupleQuestion => {
    const unanswered = data.questions.filter((q) => !q.myAnswer);
    if (unanswered.length === 0) return data.questions[0];
    const dayIndex = Math.floor(Date.now() / 86400000) % unanswered.length;
    return unanswered[dayIndex];
  }, [data.questions]);

  const getRandomQuestion = useCallback((): CoupleQuestion => {
    const unanswered = data.questions.filter((q) => !q.myAnswer);
    const pool = unanswered.length > 0 ? unanswered : data.questions;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [data.questions]);

  // ── Check-in ──────────────────────────────────────────────────────────────────
  const addCheckIn = useCallback((mood: MoodType) => {
    const date = today();
    set((p) => ({
      ...p,
      checkIns: [
        { id: uid(), date, mood },
        ...p.checkIns.filter((c) => c.date !== date),
      ],
    }));
  }, [set]);

  const getTodayCheckIn = useCallback((): CheckIn | null => {
    return data.checkIns.find((c) => c.date === today()) ?? null;
  }, [data.checkIns]);

  // ── Streak ────────────────────────────────────────────────────────────────────
  const recordActivity = useCallback(() => {
    const t = today();
    set((p) => {
      if (p.streak.lastActivityDate === t) return p;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      const newCurrent = p.streak.lastActivityDate === yStr ? p.streak.current + 1 : 1;
      const newLongest = Math.max(p.streak.longest, newCurrent);
      return { ...p, streak: { current: newCurrent, longest: newLongest, lastActivityDate: t } };
    });
  }, [set]);

  // ── Profile ───────────────────────────────────────────────────────────────────
  const updateCoupleProfile = useCallback((profile: Partial<CoupleProfile>) => {
    set((p) => ({ ...p, coupleProfile: { ...p.coupleProfile, ...profile } }));
  }, [set]);

  return (
    <AppDataContext.Provider value={{
      ...data,
      addEvent, updateEvent, deleteEvent, getEventsForDate, getUpcomingEvents,
      addGoal, updateGoal, deleteGoal,
      addMemory, toggleMemoryLike, toggleMemoryFavorite, deleteMemory,
      addCapsule, openCapsule,
      addWish, deleteWish,
      answerQuestion, getDailyQuestion, getRandomQuestion,
      addCheckIn, getTodayCheckIn,
      recordActivity,
      updateCoupleProfile,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
