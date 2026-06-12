import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../../supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useAuth } from './AuthContext'; // Importar useAuth

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
  userId: 'user1' | 'user2'; // Adicionado userId
  createdAt: string;
}

export type MoodType = 'otimo' | 'bom' | 'normal' | 'ruim';

export interface CheckIn {
  id: string;
  date: string;
  mood: MoodType;
  userId: 'user1' | 'user2'; // Adicionado userId
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
  userId: 'user1' | 'user2'; // Adicionado userId
  createdAt: string;
  imageUrls?: string[];
}

export interface Message {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
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
  avatarUrl?: string; // Adicionado avatarUrl
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
  messages: Message[];
  loading: boolean;
  session: Session | null;
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
  addMemory: (m: Omit<Memory, 'id' | 'createdAt'>, files?: File[]) => Promise<void>;
  toggleMemoryLike: (id: string) => void;
  toggleMemoryFavorite: (id: string) => void;
  deleteMemory: (id: string) => void;
  // Chat
  sendMessage: (text: string) => Promise<void>;
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
  updatePersonProfile: (personId: 'user1' | 'user2', updates: Partial<PersonProfile>, file?: File) => Promise<void>; // Alterado para updatePersonProfile
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
      user1: { name: 'Natanael', nickname: '', city: '', favoriteColor: '', favoriteFood: '', favoriteHobby: '', avatarUrl: '' },
      user2: { name: 'Geovanna', nickname: '', city: '', favoriteColor: '', favoriteFood: '', favoriteHobby: '', avatarUrl: '' },
      coupleName: 'Nosso Amor',
      startDate: '2025-08-23',
    },
    answeredQuestionIds: [],
    messages: [],
    loading: true,
    session: null,
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Falha ao salvar no localStorage (Cota excedida). Limpe seu cache.', e);
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const { currentUser } = useAuth(); // Obter o usuário logado

  // Sincronização Inicial com Supabase
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setData(prev => ({ ...prev, session }));

      if (session?.user) {
        setData(prev => ({ ...prev, loading: true }));
        try {
          // Tenta carregar o perfil do casal persistido no Supabase
          const { data: profile, error: pError } = await supabase
            .from('profiles')
            .select('couple_profile')
            .eq('user_id', session.user.id)
            .single();

          if (profile?.couple_profile && !pError) {
            setData(prev => ({
              ...prev,
              coupleProfile: profile.couple_profile as CoupleProfile
            }));
          }

          // Exemplo de busca de dados reais ao iniciar
          const { data: events } = await supabase
            .from('events')
            .select('*');
            
          if (events) {
            setData(prev => ({ 
              ...prev, 
              events: events.map((e: any) => ({
                ...e,
                date: e.event_date, // mapeando do nome da coluna SQL para o seu tipo TS
                time: e.event_time
              })),
            }));
          }
        } catch (error) {
          console.error('Erro ao carregar dados do Supabase:', error);
        } finally {
          setData(prev => ({ ...prev, loading: false }));
        }
      } else {
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    initSession();

    // Inscrição Realtime para Chat
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setData(prev => ({
            ...prev,
            messages: [...prev.messages, payload.new as Message]
          }));
        }
      )
      .subscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setData(prev => ({ ...prev, session }));
    });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const set = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => updater(prev));
  }, []);

  // ── Events ──────────────────────────────────────────────────────────────────
  const addEvent = useCallback(async (e: Omit<CalendarEvent, 'id'>) => {
    const newId = uid();
    // Otimista: Atualiza local primeiro
    set((p) => ({ ...p, events: [...p.events, { ...e, id: newId }] }));

    // Persiste no Supabase se houver sessão
    if (data.session?.user) {
      await supabase.from('events').insert([{
        title: e.title,
        description: e.description,
        category: e.category,
        event_date: e.date,
        event_time: e.time,
        location: e.location,
        color: e.color
      }]);
    }
  }, [set]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    set((p) => ({ ...p, events: p.events.map((e) => e.id === id ? { ...e, ...updates } : e) }));
    
    if (data.session?.user) {
      await supabase.from('events').update(updates).eq('id', id);
    }
  }, [set]);

  const deleteEvent = useCallback(async (id: string) => {
    set((p) => ({ ...p, events: p.events.filter((e) => e.id !== id) }));

    if (data.session?.user) {
      await supabase.from('events').delete().eq('id', id);
    }
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
  const addGoal = useCallback(async (g: Omit<Goal, 'id' | 'createdAt' | 'userId'>) => {
    const newId = uid();
    const createdAt = new Date().toISOString();
    if (!currentUser) return; // Não permite adicionar sem usuário logado
    set((p) => ({ ...p, goals: [...p.goals, { ...g, id: newId, createdAt, userId: currentUser as 'user1' | 'user2' }] }));

    if (data.session?.user) {
      await supabase.from('goals').insert([{
        name: g.name,
        description: g.description,
        category: g.category,
        target_value: g.targetValue,
        current_value: g.currentValue,
        deadline: g.deadline,
        status: g.status
        // TODO: Adicionar couple_id e user_id no Supabase para metas
      }]);
    }
  }, [set, currentUser, data.session?.user]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    set((p) => ({ ...p, goals: p.goals.map((g) => g.id === id ? { ...g, ...updates } : g) }));
    if (data.session?.user) {
      await supabase.from('goals').update(updates).eq('id', id);
    }
  }, [set]);

  const deleteGoal = useCallback(async (id: string) => {
    set((p) => ({ ...p, goals: p.goals.filter((g) => g.id !== id) }));
    if (data.session?.user) {
      await supabase.from('goals').delete().eq('id', id);
    }
  }, [set]);

  // ── Memories ─────────────────────────────────────────────────────────────────
  const addMemory = useCallback(async (m: Omit<Memory, 'id' | 'createdAt' | 'userId'>, files?: File[]) => {
    if (!currentUser) return; // Não permite adicionar sem usuário logado
    let uploadedUrls: string[] = m.imageUrls || [];

    if (data.session?.user) {
      // 1. Upload das imagens para o Storage (se houver arquivos)
      if (files && files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${data.session.user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('memories')
            .upload(filePath, file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('memories')
              .getPublicUrl(filePath);
            uploadedUrls.push(publicUrl);
          }
        }
      }

      // 2. Inserção no Banco de Dados
      await supabase.from('memories').insert([{
        title: m.title,
        description: m.description,
        memory_date: m.date,
        emotion: m.emotion,
        location: m.location,
        image_urls: uploadedUrls,
        user_id: data.session.user.id // Este user_id do Supabase é diferente do 'user1'/'user2'
      }]);
    }

    // Atualização do estado local (UI)
    set((p) => ({
      ...p,
      memories: [{ ...m, imageUrls: uploadedUrls, id: uid(), createdAt: new Date().toISOString(), userId: currentUser as 'user1' | 'user2' }, ...p.memories]
    }));
  }, [set, currentUser, data.session?.user]);

  const toggleMemoryLike = useCallback((id: string) => {
    set((p) => ({ ...p, memories: p.memories.map((m) => m.id === id ? { ...m, liked: !m.liked } : m) }));
    if (data.session?.user) {
      // Lógica de update no supabase aqui...
    }
  }, [set]);

  const toggleMemoryFavorite = useCallback((id: string) => {
    set((p) => ({ ...p, memories: p.memories.map((m) => m.id === id ? { ...m, favorited: !m.favorited } : m) }));
  }, [set]);

  const deleteMemory = useCallback(async (id: string) => {
    set((p) => ({ ...p, memories: p.memories.filter((m) => m.id !== id) }));
    if (data.session?.user) {
      await supabase.from('memories').delete().eq('id', id);
    }
  }, [set, data.session?.user]);

  // ── Chat ─────────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!data.session?.user || !text.trim()) return;
    
    const { error } = await supabase.from('messages').insert([{
      text,
      sender_id: data.session.user.id,
      // Aqui assumimos que o RLS cuidará do couple_id ou que você buscará o id do casal no perfil
    }]);

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }, [data.session]);

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
    if (!currentUser) return; // Não permite adicionar sem usuário logado
    set((p) => ({
      ...p,
      checkIns: [
        { id: uid(), date, mood, userId: currentUser as 'user1' | 'user2' },
        ...p.checkIns.filter((c) => c.date !== date),
      ],
    }));
    // TODO: Persistir check-in no Supabase com userId
  }, [set, currentUser]);

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
  const updatePersonProfile = useCallback(async (personId: 'user1' | 'user2', updates: Partial<PersonProfile>, file?: File) => {
    let avatarUrl = updates.avatarUrl;

    if (file && data.session?.user) {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${personId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${data.session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('memories') // Reutilizando o bucket 'memories' existente
        .upload(filePath, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('memories')
          .getPublicUrl(filePath);
        avatarUrl = publicUrl;
      }
    }

    const profileUpdates = {
      ...updates,
      ...(avatarUrl ? { avatarUrl } : {}),
    };

    set((p) => ({
      ...p,
      coupleProfile: {
        ...p.coupleProfile,
        [personId]: { ...p.coupleProfile[personId], ...profileUpdates },
      },
    }));

    // Persistir os dados do perfil no Supabase para que não se percam ao deslogar
    if (data.session?.user) {
      await supabase.from('profiles').upsert({
        user_id: data.session.user.id,
        couple_profile: {
          ...data.coupleProfile,
          [personId]: { ...data.coupleProfile[personId], ...profileUpdates }
        },
        updated_at: new Date().toISOString()
      });
    }
  }, [set, data.session?.user, data.coupleProfile]);

  return (
    <AppDataContext.Provider value={{
      ...data,
      addEvent, updateEvent, deleteEvent, getEventsForDate, getUpcomingEvents,
      addGoal, updateGoal, deleteGoal,
      addMemory, toggleMemoryLike, toggleMemoryFavorite, deleteMemory,
      sendMessage,
      addCapsule, openCapsule,
      addWish, deleteWish,
      answerQuestion, getDailyQuestion, getRandomQuestion,
      addCheckIn, getTodayCheckIn,
      recordActivity,
      updatePersonProfile,
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
