import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
import { useAuth } from './AuthContext';
import { getLocalDateKey } from '../lib/date';

// Linha única que guarda o perfil do casal compartilhado entre os dois logins.
const COUPLE_PROFILE_ROW_ID = 'couple';

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
  likedBy: MessageUserSlot[];
  favoritedBy: MessageUserSlot[];
  // Calculados a partir de likedBy/favoritedBy relativo a quem está vendo (ver memoriesForUI).
  liked?: boolean;
  favorited?: boolean;
  userId: 'user1' | 'user2'; // Adicionado userId
  createdAt: string;
  imageUrls?: string[];
}

export type MessageUserSlot = 'user1' | 'user2';

export interface MessageAttachment {
  id: string;
  type: 'image' | 'audio' | 'file';
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface MessageReplyPreview {
  id: string;
  text: string;
  userId: MessageUserSlot;
}

// "Diferencial" do chat em relação a um WhatsApp normal: dá pra compartilhar
// uma memória, evento ou meta que já existe no app como um cartão na conversa.
export interface SharedCard {
  kind: 'memory' | 'event' | 'goal';
  refId: string;
  title: string;
  subtitle: string;
  emoji: string;
  color?: string;
  imageUrl?: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: MessageUserSlot;
  createdAt: string;
  editedAt?: string;
  deletedForEveryone: boolean;
  deletedFor: MessageUserSlot[];
  reactions: Record<string, MessageUserSlot[]>;
  starredBy: MessageUserSlot[];
  replyTo?: MessageReplyPreview;
  attachments: MessageAttachment[];
  sharedCard?: SharedCard;
  readBy: MessageUserSlot[];
}

interface MessageRow {
  id: string;
  text: string;
  sender_slot: MessageUserSlot;
  created_at: string;
  edited_at: string | null;
  deleted_for_everyone: boolean;
  deleted_for: MessageUserSlot[];
  reactions: Record<string, MessageUserSlot[]>;
  starred_by: MessageUserSlot[];
  reply_to: MessageReplyPreview | null;
  attachments: MessageAttachment[];
  shared_card: SharedCard | null;
  read_by: MessageUserSlot[];
}

function rowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    text: row.text,
    senderId: row.sender_slot,
    createdAt: row.created_at,
    editedAt: row.edited_at ?? undefined,
    deletedForEveryone: row.deleted_for_everyone,
    deletedFor: row.deleted_for ?? [],
    reactions: row.reactions ?? {},
    starredBy: row.starred_by ?? [],
    replyTo: row.reply_to ?? undefined,
    attachments: row.attachments ?? [],
    sharedCard: row.shared_card ?? undefined,
    readBy: row.read_by ?? [],
  };
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
}

interface AppDataContextType extends AppData {
  // Events
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventsForDate: (date: string) => CalendarEvent[];
  getUpcomingEvents: (n?: number) => CalendarEvent[];
  // Goals
  addGoal: (g: Omit<Goal, 'id' | 'createdAt' | 'userId'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  // Memories
  addMemory: (m: Omit<Memory, 'id' | 'createdAt' | 'userId' | 'likedBy' | 'favoritedBy' | 'liked' | 'favorited'>, files?: File[]) => Promise<void>;
  toggleMemoryLike: (id: string) => void;
  toggleMemoryFavorite: (id: string) => void;
  deleteMemory: (id: string) => void;
  // Chat
  sendMessage: (input: { text: string; replyTo?: MessageReplyPreview; attachments?: File[]; sharedCard?: SharedCard }) => Promise<void>;
  editMessage: (id: string, text: string) => Promise<void>;
  deleteMessageForMe: (id: string) => Promise<void>;
  deleteMessageForEveryone: (id: string) => Promise<void>;
  reactToMessage: (id: string, emoji: string) => Promise<void>;
  toggleStarMessage: (id: string) => Promise<void>;
  markMessagesRead: (ids: string[]) => Promise<void>;
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
// Fotos ficam numa chave separada: assim, se elas estourarem a cota do
// localStorage, o resto dos dados (metas, eventos, mensagens, check-ins)
// continua sendo salvo normalmente.
const IMAGES_STORAGE_KEY = 'nosso_amor_appdata_v1_images';

type ImageStore = Record<string, string[]>; // memoryId -> imageUrls

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function today() {
  return getLocalDateKey();
}

/**
 * Junta o que veio do Supabase com o que já existia localmente, sem apagar
 * nada: itens que ainda não sincronizaram (por falha de rede, RLS, etc.)
 * continuam aparecendo em vez de sumir na próxima vez que a página carregar.
 */
function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const remoteIds = new Set(remote.map((item) => item.id));
  const localOnly = local.filter((item) => !remoteIds.has(item.id));
  return [...remote, ...localOnly];
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
  };
}

function loadImages(): ImageStore {
  try {
    const raw = localStorage.getItem(IMAGES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const def = defaultData();
      const images = loadImages();
      const memories = (parsed.memories ?? def.memories).map((m: Memory) => ({
        ...m,
        imageUrls: images[m.id] ?? m.imageUrls ?? [],
        // Dados antigos salvos antes de likedBy/favoritedBy existirem (só tinham um boolean).
        likedBy: Array.isArray(m.likedBy) ? m.likedBy : [],
        favoritedBy: Array.isArray(m.favoritedBy) ? m.favoritedBy : [],
      }));
      // merge questions to always have full pool
      return {
        ...def,
        ...parsed,
        memories,
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
  // Salva as fotos separadamente do restante dos dados (ver IMAGES_STORAGE_KEY).
  const images: ImageStore = {};
  const lightMemories = data.memories.map((m) => {
    if (m.imageUrls && m.imageUrls.length > 0) {
      images[m.id] = m.imageUrls;
    }
    const { imageUrls, ...rest } = m;
    return rest;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, memories: lightMemories }));
  } catch (e) {
    console.error('Falha ao salvar dados no localStorage.', e);
    toast.error('Não foi possível salvar seus dados. O armazenamento do navegador está cheio.');
    return;
  }

  try {
    localStorage.setItem(IMAGES_STORAGE_KEY, JSON.stringify(images));
  } catch (e) {
    console.warn('Falha ao salvar fotos no localStorage (cota excedida).', e);
    toast.error('Suas fotos não couberam no armazenamento do navegador, mas o restante dos dados foi salvo. Tente remover fotos antigas de memórias.');
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const { currentUser, session } = useAuth();

  // Carrega os dados do casal do Supabase sempre que a sessão muda (login/logout)
  useEffect(() => {
    if (!session?.user) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    let cancelled = false;
    setData(prev => ({ ...prev, loading: true }));

    (async () => {
      try {
        // Perfil do casal é uma única linha compartilhada pelos dois logins
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('couple_profile, streak')
          .eq('id', COUPLE_PROFILE_ROW_ID)
          .maybeSingle();

        if (pError) {
          console.error('Erro ao buscar perfil do casal no Supabase:', pError);
          toast.error('Não foi possível carregar o perfil do casal salvo no servidor.');
        } else if (!cancelled && profile?.couple_profile) {
          setData(prev => ({
            ...prev,
            coupleProfile: profile.couple_profile as CoupleProfile
          }));
        }

        if (!cancelled && !pError) {
          if (profile?.streak) {
            // O servidor já tem um streak salvo: ele passa a ser a fonte da verdade.
            setData(prev => ({ ...prev, streak: profile.streak as StreakState }));
          } else {
            // Primeira sincronização: sobe o streak local (se houver) pro servidor
            // em vez de simplesmente perder o progresso que só existia neste aparelho.
            setData(prev => {
              if (prev.streak.current > 0 || prev.streak.lastActivityDate) {
                supabase.from('profiles').upsert({
                  id: COUPLE_PROFILE_ROW_ID,
                  couple_profile: prev.coupleProfile,
                  streak: prev.streak,
                  updated_at: new Date().toISOString(),
                }).then(({ error }) => {
                  if (error) console.error('Erro ao subir streak inicial para o Supabase:', error);
                });
              }
              return prev;
            });
          }
        }

        const { data: checkInRows, error: checkInsError } = await supabase
          .from('check_ins')
          .select('*');

        if (checkInsError) {
          console.error('Erro ao buscar check-ins do Supabase:', checkInsError);
          toast.error('Não foi possível carregar os check-ins salvos no servidor.');
        } else if (!cancelled && checkInRows) {
          const remoteCheckIns: CheckIn[] = checkInRows.map((c: any) => ({
            id: c.id,
            date: c.date,
            mood: c.mood,
            userId: c.user_slot === 'user2' ? 'user2' : 'user1',
          }));
          setData(prev => ({ ...prev, checkIns: mergeById(prev.checkIns, remoteCheckIns) }));
        }

        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('*');

        if (eventsError) {
          console.error('Erro ao buscar eventos do Supabase:', eventsError);
          toast.error('Não foi possível carregar os eventos salvos no servidor.');
        } else if (!cancelled && events) {
          const remoteEvents: CalendarEvent[] = events.map((e: any) => ({
            ...e,
            date: e.event_date, // mapeando do nome da coluna SQL para o seu tipo TS
            time: e.event_time,
          }));
          setData(prev => ({ ...prev, events: mergeById(prev.events, remoteEvents) }));
        }

        const { data: goalRows, error: goalsError } = await supabase
          .from('goals')
          .select('*');

        if (goalsError) {
          console.error('Erro ao buscar metas do Supabase:', goalsError);
          toast.error('Não foi possível carregar as metas salvas no servidor.');
        } else if (!cancelled && goalRows) {
          const remoteGoals: Goal[] = goalRows.map((g: any) => ({
            id: g.id,
            name: g.name,
            description: g.description ?? '',
            category: g.category,
            targetValue: g.target_value ?? undefined,
            currentValue: g.current_value ?? 0,
            deadline: g.deadline ?? '',
            status: g.status,
            userId: g.user_id === 'user2' ? 'user2' : 'user1',
            createdAt: g.created_at,
          }));
          setData(prev => ({ ...prev, goals: mergeById(prev.goals, remoteGoals) }));
        }

        const { data: memoryRows, error: memoriesError } = await supabase
          .from('memories')
          .select('*')
          .order('created_at', { ascending: false });

        if (memoriesError) {
          console.error('Erro ao buscar memórias do Supabase:', memoriesError);
          toast.error('Não foi possível carregar as memórias salvas no servidor.');
        } else if (!cancelled && memoryRows) {
          const remoteMemories: Memory[] = memoryRows.map((m: any) => ({
            id: m.id,
            title: m.title,
            description: m.description ?? '',
            date: m.memory_date ?? '',
            location: m.location ?? '',
            emotion: m.emotion,
            likedBy: m.liked_by ?? [],
            favoritedBy: m.favorited_by ?? [],
            userId: m.user_slot === 'user2' ? 'user2' : 'user1',
            createdAt: m.created_at,
            imageUrls: m.image_urls ?? [],
          }));
          setData(prev => ({ ...prev, memories: mergeById(prev.memories, remoteMemories) }));
        }

        const { data: capsuleRows, error: capsulesError } = await supabase
          .from('time_capsules')
          .select('*');

        if (capsulesError) {
          console.error('Erro ao buscar cápsulas do Supabase:', capsulesError);
          toast.error('Não foi possível carregar as cápsulas salvas no servidor.');
        } else if (!cancelled && capsuleRows) {
          const remoteCapsules: TimeCapsule[] = capsuleRows.map((c: any) => ({
            id: c.id,
            title: c.title,
            message: c.message,
            openDate: c.open_date,
            createdAt: c.created_at,
            opened: c.opened,
          }));
          setData(prev => ({ ...prev, capsules: mergeById(prev.capsules, remoteCapsules) }));
        }

        const { data: wishRows, error: wishesError } = await supabase
          .from('wishes')
          .select('*');

        if (wishesError) {
          console.error('Erro ao buscar desejos do Supabase:', wishesError);
          toast.error('Não foi possível carregar os desejos salvos no servidor.');
        } else if (!cancelled && wishRows) {
          const remoteWishes: WishItem[] = wishRows.map((w: any) => ({
            id: w.id,
            name: w.name,
            description: w.description ?? '',
            link: w.link ?? undefined,
            category: w.category ?? '',
            priority: w.priority,
            owner: w.owner ?? '',
          }));
          setData(prev => ({ ...prev, wishes: mergeById(prev.wishes, remoteWishes) }));
        }

        const { data: answerRows, error: answersError } = await supabase
          .from('question_answers')
          .select('*');

        if (answersError) {
          console.error('Erro ao buscar respostas de perguntas do Supabase:', answersError);
          toast.error('Não foi possível carregar as respostas das perguntas no servidor.');
        } else if (!cancelled && answerRows && currentUser) {
          const partnerSlot: 'user1' | 'user2' = currentUser === 'user1' ? 'user2' : 'user1';
          setData(prev => ({
            ...prev,
            questions: prev.questions.map((q) => {
              const mine = answerRows.find((a: any) => a.question_id === q.id && a.user_slot === currentUser);
              const partner = answerRows.find((a: any) => a.question_id === q.id && a.user_slot === partnerSlot);
              return {
                ...q,
                myAnswer: mine?.answer ?? q.myAnswer,
                answeredAt: mine?.answered_at ?? q.answeredAt,
                partnerAnswer: partner?.answer ?? q.partnerAnswer,
              };
            }),
          }));
        }

        const { data: messageRows, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Erro ao buscar mensagens do Supabase:', messagesError);
          toast.error('Não foi possível carregar as mensagens salvas no servidor.');
        } else if (!cancelled && messageRows) {
          setData(prev => ({
            ...prev,
            messages: (messageRows as MessageRow[]).map(rowToMessage),
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error);
        toast.error('Não foi possível conectar ao servidor. Seus dados locais continuam salvos neste aparelho.');
      } finally {
        if (!cancelled) setData(prev => ({ ...prev, loading: false }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, currentUser]);

  // Inscrição Realtime para Chat (independente da sessão; RLS controla o acesso)
  useEffect(() => {
    const upsertMessage = (row: MessageRow) => {
      const incoming = rowToMessage(row);
      setData(prev => {
        const exists = prev.messages.some(m => m.id === incoming.id);
        return {
          ...prev,
          messages: exists
            ? prev.messages.map(m => m.id === incoming.id ? incoming : m)
            : [...prev.messages, incoming],
        };
      });
    };

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => upsertMessage(payload.new as MessageRow)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => upsertMessage(payload.new as MessageRow)
      )
      .subscribe();

    return () => {
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
    const localId = uid();
    // Otimista: Atualiza local primeiro
    set((p) => ({ ...p, events: [...p.events, { ...e, id: localId }] }));

    // Persiste no Supabase se houver sessão
    if (session?.user) {
      const { data: inserted, error } = await supabase.from('events').insert([{
        title: e.title,
        description: e.description,
        category: e.category,
        event_date: e.date,
        event_time: e.time,
        location: e.location,
        color: e.color
      }]).select('id').single();

      if (error) {
        console.error('Erro ao salvar evento no Supabase:', error);
        toast.error('Não foi possível salvar o evento no servidor. Ele só existe neste aparelho por enquanto.');
      } else if (inserted?.id) {
        // Troca o id local pelo id real do banco, senão editar/excluir depois não vai encontrar a linha certa.
        set((p) => ({ ...p, events: p.events.map((ev) => ev.id === localId ? { ...ev, id: inserted.id } : ev) }));
      }
    }
  }, [set, session?.user]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    set((p) => ({ ...p, events: p.events.map((e) => e.id === id ? { ...e, ...updates } : e) }));

    if (session?.user) {
      const { error } = await supabase.from('events').update(updates).eq('id', id);
      if (error) {
        console.error('Erro ao atualizar evento no Supabase:', error);
        toast.error('Não foi possível salvar a alteração do evento no servidor.');
      }
    }
  }, [set, session?.user]);

  const deleteEvent = useCallback(async (id: string) => {
    set((p) => ({ ...p, events: p.events.filter((e) => e.id !== id) }));

    if (session?.user) {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) {
        console.error('Erro ao apagar evento no Supabase:', error);
        toast.error('Não foi possível apagar o evento no servidor.');
      }
    }
  }, [set, session?.user]);

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
    const localId = uid();
    const createdAt = new Date().toISOString();
    if (!currentUser) return; // Não permite adicionar sem usuário logado
    set((p) => ({ ...p, goals: [...p.goals, { ...g, id: localId, createdAt, userId: currentUser as 'user1' | 'user2' }] }));

    if (session?.user) {
      const { data: inserted, error } = await supabase.from('goals').insert([{
        name: g.name,
        description: g.description,
        category: g.category,
        target_value: g.targetValue,
        current_value: g.currentValue,
        deadline: g.deadline,
        status: g.status,
        user_id: currentUser,
      }]).select('id').single();

      if (error) {
        console.error('Erro ao salvar meta no Supabase:', error);
        toast.error('Não foi possível salvar a meta no servidor. Ela só existe neste aparelho por enquanto.');
      } else if (inserted?.id) {
        set((p) => ({ ...p, goals: p.goals.map((goal) => goal.id === localId ? { ...goal, id: inserted.id } : goal) }));
      }
    }
  }, [set, currentUser, session?.user]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    set((p) => ({ ...p, goals: p.goals.map((g) => g.id === id ? { ...g, ...updates } : g) }));
    if (session?.user) {
      const { error } = await supabase.from('goals').update(updates).eq('id', id);
      if (error) {
        console.error('Erro ao atualizar meta no Supabase:', error);
        toast.error('Não foi possível salvar a alteração da meta no servidor.');
      }
    }
  }, [set, session?.user]);

  const deleteGoal = useCallback(async (id: string) => {
    set((p) => ({ ...p, goals: p.goals.filter((g) => g.id !== id) }));
    if (session?.user) {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) {
        console.error('Erro ao apagar meta no Supabase:', error);
        toast.error('Não foi possível apagar a meta no servidor.');
      }
    }
  }, [set, session?.user]);

  // ── Memories ─────────────────────────────────────────────────────────────────
  const addMemory = useCallback(async (m: Omit<Memory, 'id' | 'createdAt' | 'userId' | 'likedBy' | 'favoritedBy' | 'liked' | 'favorited'>, files?: File[]) => {
    if (!currentUser) return; // Não permite adicionar sem usuário logado
    let uploadedUrls: string[] = m.imageUrls || [];
    let insertedId: string | null = null;

    if (session?.user) {
      // 1. Upload das imagens para o Storage (se houver arquivos)
      if (files && files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${uid()}.${fileExt}`;
          const filePath = `${session.user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('memories')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Erro ao enviar foto da memória:', uploadError);
            toast.error(`Não foi possível enviar "${file.name}": ${uploadError.message}`);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('memories')
            .getPublicUrl(filePath);
          uploadedUrls.push(publicUrl);
        }
      }

      // 2. Inserção no Banco de Dados
      const { data: inserted, error: insertError } = await supabase.from('memories').insert([{
        title: m.title,
        description: m.description,
        memory_date: m.date,
        emotion: m.emotion,
        location: m.location,
        image_urls: uploadedUrls,
        user_id: session.user.id, // Este user_id do Supabase é diferente do 'user1'/'user2'
        user_slot: currentUser,
      }]).select('id').single();

      if (insertError) {
        console.error('Erro ao salvar memória no Supabase:', insertError);
        toast.error('Não foi possível salvar a memória no servidor.');
      } else {
        insertedId = inserted?.id ?? null;
      }
    }

    // Atualização do estado local (UI)
    set((p) => ({
      ...p,
      memories: [{ ...m, imageUrls: uploadedUrls, id: insertedId ?? uid(), createdAt: new Date().toISOString(), userId: currentUser as 'user1' | 'user2', likedBy: [], favoritedBy: [] }, ...p.memories]
    }));
  }, [set, currentUser, session?.user]);

  const toggleMemoryLike = useCallback(async (id: string) => {
    if (!currentUser) return;
    const memory = data.memories.find((m) => m.id === id);
    if (!memory) return;
    const nextLikedBy = memory.likedBy.includes(currentUser)
      ? memory.likedBy.filter((u) => u !== currentUser)
      : [...memory.likedBy, currentUser];

    set((p) => ({ ...p, memories: p.memories.map((m) => m.id === id ? { ...m, likedBy: nextLikedBy } : m) }));

    if (session?.user) {
      const { error } = await supabase.from('memories').update({ liked_by: nextLikedBy }).eq('id', id);
      if (error) {
        console.error('Erro ao curtir memória no Supabase:', error);
        toast.error('Não foi possível salvar a curtida no servidor.');
      }
    }
  }, [set, currentUser, session?.user, data.memories]);

  const toggleMemoryFavorite = useCallback(async (id: string) => {
    if (!currentUser) return;
    const memory = data.memories.find((m) => m.id === id);
    if (!memory) return;
    const nextFavoritedBy = memory.favoritedBy.includes(currentUser)
      ? memory.favoritedBy.filter((u) => u !== currentUser)
      : [...memory.favoritedBy, currentUser];

    set((p) => ({ ...p, memories: p.memories.map((m) => m.id === id ? { ...m, favoritedBy: nextFavoritedBy } : m) }));

    if (session?.user) {
      const { error } = await supabase.from('memories').update({ favorited_by: nextFavoritedBy }).eq('id', id);
      if (error) {
        console.error('Erro ao favoritar memória no Supabase:', error);
        toast.error('Não foi possível salvar o favorito no servidor.');
      }
    }
  }, [set, currentUser, session?.user, data.memories]);

  const deleteMemory = useCallback(async (id: string) => {
    set((p) => ({ ...p, memories: p.memories.filter((m) => m.id !== id) }));
    if (session?.user) {
      const { error } = await supabase.from('memories').delete().eq('id', id);
      if (error) {
        console.error('Erro ao apagar memória no Supabase:', error);
        toast.error('Não foi possível apagar a memória no servidor.');
      }
    }
  }, [set, session?.user]);

  // ── Chat ─────────────────────────────────────────────────────────────────────
  const uploadChatAttachment = useCallback(async (file: File): Promise<MessageAttachment | null> => {
    if (!session?.user) return null;

    const fileExt = file.name.split('.').pop();
    const filePath = `chat/${session.user.id}/${uid()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('memories').upload(filePath, file);
    if (uploadError) {
      console.error('Erro ao enviar anexo:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from('memories').getPublicUrl(filePath);
    const type: MessageAttachment['type'] = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('audio/')
        ? 'audio'
        : 'file';

    return {
      id: uid(),
      type,
      name: file.name,
      url: publicUrl,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
    };
  }, [session?.user]);

  const sendMessage = useCallback(async (input: { text: string; replyTo?: MessageReplyPreview; attachments?: File[]; sharedCard?: SharedCard }) => {
    if (!session?.user || !currentUser) return;
    const text = input.text.trim();
    if (!text && (!input.attachments || input.attachments.length === 0) && !input.sharedCard) return;

    const uploaded = input.attachments && input.attachments.length > 0
      ? (await Promise.all(input.attachments.map(uploadChatAttachment))).filter((a): a is MessageAttachment => a !== null)
      : [];

    const { error } = await supabase.from('messages').insert([{
      text,
      sender_id: session.user.id,
      sender_slot: currentUser,
      reply_to: input.replyTo ?? null,
      attachments: uploaded,
      shared_card: input.sharedCard ?? null,
    }]);

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Não foi possível enviar a mensagem. Tente de novo.');
    }
  }, [session, currentUser, uploadChatAttachment]);

  const editMessage = useCallback(async (id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const { error } = await supabase.from('messages')
      .update({ text: trimmed, edited_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erro ao editar mensagem:', error);
      toast.error('Não foi possível editar a mensagem.');
    }
  }, []);

  const deleteMessageForMe = useCallback(async (id: string) => {
    if (!currentUser) return;
    const message = data.messages.find((m) => m.id === id);
    if (!message) return;

    const nextDeletedFor = message.deletedFor.includes(currentUser)
      ? message.deletedFor
      : [...message.deletedFor, currentUser];

    const { error } = await supabase.from('messages').update({ deleted_for: nextDeletedFor }).eq('id', id);
    if (error) {
      console.error('Erro ao apagar mensagem:', error);
      toast.error('Não foi possível apagar a mensagem.');
    }
  }, [currentUser, data.messages]);

  const deleteMessageForEveryone = useCallback(async (id: string) => {
    const { error } = await supabase.from('messages').update({
      text: '',
      attachments: [],
      deleted_for_everyone: true,
    }).eq('id', id);

    if (error) {
      console.error('Erro ao apagar mensagem:', error);
      toast.error('Não foi possível apagar a mensagem para todos.');
    }
  }, []);

  const reactToMessage = useCallback(async (id: string, emoji: string) => {
    if (!currentUser) return;
    const message = data.messages.find((m) => m.id === id);
    if (!message) return;

    // Cada pessoa só pode ter uma reação ativa por mensagem
    const nextReactions: Record<string, MessageUserSlot[]> = {};
    for (const [key, users] of Object.entries(message.reactions)) {
      const filtered = users.filter((u) => u !== currentUser);
      if (filtered.length > 0) nextReactions[key] = filtered;
    }
    nextReactions[emoji] = [...(nextReactions[emoji] ?? []), currentUser];

    const { error } = await supabase.from('messages').update({ reactions: nextReactions }).eq('id', id);
    if (error) {
      console.error('Erro ao reagir à mensagem:', error);
      toast.error('Não foi possível registrar a reação.');
    }
  }, [currentUser, data.messages]);

  const toggleStarMessage = useCallback(async (id: string) => {
    if (!currentUser) return;
    const message = data.messages.find((m) => m.id === id);
    if (!message) return;

    const nextStarredBy = message.starredBy.includes(currentUser)
      ? message.starredBy.filter((u) => u !== currentUser)
      : [...message.starredBy, currentUser];

    const { error } = await supabase.from('messages').update({ starred_by: nextStarredBy }).eq('id', id);
    if (error) {
      console.error('Erro ao favoritar mensagem:', error);
      toast.error('Não foi possível favoritar a mensagem.');
    }
  }, [currentUser, data.messages]);

  const markMessagesRead = useCallback(async (ids: string[]) => {
    if (!currentUser || ids.length === 0) return;

    const { error } = await supabase.rpc('mark_messages_read', {
      message_ids: ids,
      slot: currentUser,
    });

    if (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      return;
    }

    // Atualiza local também - a confirmação em tempo real via UPDATE chegaria
    // de volta de qualquer forma, mas isso evita esperar a viagem de ida e volta.
    set((p) => ({
      ...p,
      messages: p.messages.map((m) =>
        ids.includes(m.id) && !m.readBy.includes(currentUser as MessageUserSlot)
          ? { ...m, readBy: [...m.readBy, currentUser as MessageUserSlot] }
          : m
      ),
    }));
  }, [set, currentUser]);

  // ── Capsules ──────────────────────────────────────────────────────────────────
  const addCapsule = useCallback(async (c: Omit<TimeCapsule, 'id' | 'createdAt' | 'opened'>) => {
    const localId = uid();
    const createdAt = new Date().toISOString();
    set((p) => ({ ...p, capsules: [...p.capsules, { ...c, id: localId, createdAt, opened: false }] }));

    if (session?.user) {
      const { data: inserted, error } = await supabase.from('time_capsules').insert([{
        title: c.title,
        message: c.message,
        open_date: c.openDate,
        user_slot: currentUser,
      }]).select('id').single();

      if (error) {
        console.error('Erro ao salvar cápsula no Supabase:', error);
        toast.error('Não foi possível salvar a cápsula no servidor. Ela só existe neste aparelho por enquanto.');
      } else if (inserted?.id) {
        set((p) => ({ ...p, capsules: p.capsules.map((cap) => cap.id === localId ? { ...cap, id: inserted.id } : cap) }));
      }
    }
  }, [set, session?.user, currentUser]);

  const openCapsule = useCallback(async (id: string) => {
    set((p) => ({ ...p, capsules: p.capsules.map((c) => c.id === id ? { ...c, opened: true } : c) }));

    if (session?.user) {
      const { error } = await supabase.from('time_capsules').update({ opened: true }).eq('id', id);
      if (error) {
        console.error('Erro ao abrir cápsula no Supabase:', error);
        toast.error('Não foi possível salvar a abertura da cápsula no servidor.');
      }
    }
  }, [set, session?.user]);

  // ── Wishes ────────────────────────────────────────────────────────────────────
  const addWish = useCallback(async (w: Omit<WishItem, 'id'>) => {
    const localId = uid();
    set((p) => ({ ...p, wishes: [...p.wishes, { ...w, id: localId }] }));

    if (session?.user) {
      const { data: inserted, error } = await supabase.from('wishes').insert([{
        name: w.name,
        description: w.description,
        link: w.link,
        category: w.category,
        priority: w.priority,
        owner: w.owner,
      }]).select('id').single();

      if (error) {
        console.error('Erro ao salvar desejo no Supabase:', error);
        toast.error('Não foi possível salvar o desejo no servidor. Ele só existe neste aparelho por enquanto.');
      } else if (inserted?.id) {
        set((p) => ({ ...p, wishes: p.wishes.map((wish) => wish.id === localId ? { ...wish, id: inserted.id } : wish) }));
      }
    }
  }, [set, session?.user]);

  const deleteWish = useCallback(async (id: string) => {
    set((p) => ({ ...p, wishes: p.wishes.filter((w) => w.id !== id) }));

    if (session?.user) {
      const { error } = await supabase.from('wishes').delete().eq('id', id);
      if (error) {
        console.error('Erro ao apagar desejo no Supabase:', error);
        toast.error('Não foi possível apagar o desejo no servidor.');
      }
    }
  }, [set, session?.user]);

  // ── Questions ─────────────────────────────────────────────────────────────────
  const answerQuestion = useCallback(async (id: string, answer: string) => {
    if (!currentUser) return;
    const answeredAt = new Date().toISOString();
    set((p) => ({
      ...p,
      questions: p.questions.map((q) =>
        q.id === id ? { ...q, myAnswer: answer, answeredAt } : q
      ),
      answeredQuestionIds: p.answeredQuestionIds.includes(id) ? p.answeredQuestionIds : [...p.answeredQuestionIds, id],
    }));

    if (session?.user) {
      const { error } = await supabase.from('question_answers').upsert({
        question_id: id,
        user_slot: currentUser,
        answer,
        answered_at: answeredAt,
      }, { onConflict: 'question_id,user_slot' });

      if (error) {
        console.error('Erro ao salvar resposta no Supabase:', error);
        toast.error('Não foi possível salvar sua resposta no servidor.');
      }
    }
  }, [set, currentUser, session?.user]);

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
  const addCheckIn = useCallback(async (mood: MoodType) => {
    const date = today();
    if (!currentUser) return; // Não permite adicionar sem usuário logado
    const localId = uid();
    set((p) => ({
      ...p,
      checkIns: [
        { id: localId, date, mood, userId: currentUser as 'user1' | 'user2' },
        ...p.checkIns.filter((c) => c.date !== date),
      ],
    }));

    if (session?.user) {
      const { data: inserted, error } = await supabase.from('check_ins').insert([{
        date,
        mood,
        user_slot: currentUser,
      }]).select('id').single();

      if (error) {
        console.error('Erro ao salvar check-in no Supabase:', error);
        toast.error('Não foi possível salvar o check-in no servidor.');
      } else if (inserted?.id) {
        set((p) => ({ ...p, checkIns: p.checkIns.map((c) => c.id === localId ? { ...c, id: inserted.id } : c) }));
      }
    }
  }, [set, currentUser, session?.user]);

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
      const yStr = getLocalDateKey(yesterday);
      const newCurrent = p.streak.lastActivityDate === yStr ? p.streak.current + 1 : 1;
      const newLongest = Math.max(p.streak.longest, newCurrent);
      const newStreak: StreakState = { current: newCurrent, longest: newLongest, lastActivityDate: t };

      if (session?.user) {
        supabase.from('profiles').upsert({
          id: COUPLE_PROFILE_ROW_ID,
          couple_profile: p.coupleProfile,
          streak: newStreak,
          updated_at: new Date().toISOString(),
        }).then(({ error }) => {
          if (error) {
            console.error('Erro ao salvar streak no Supabase:', error);
            toast.error('Não foi possível salvar sua sequência de dias no servidor.');
          }
        });
      }

      return { ...p, streak: newStreak };
    });
  }, [set, session?.user]);

  // ── Profile ───────────────────────────────────────────────────────────────────
  const updatePersonProfile = useCallback(async (personId: 'user1' | 'user2', updates: Partial<PersonProfile>, file?: File) => {
    let avatarUrl = updates.avatarUrl;

    if (file && session?.user) {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${personId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('memories') // Reutilizando o bucket 'memories' existente
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro ao enviar foto de perfil:', uploadError);
        toast.error(`Não foi possível enviar a foto: ${uploadError.message}`);
      } else {
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

    // Persistir os dados do perfil no Supabase (linha única compartilhada pelo casal)
    // para que não se percam ao deslogar / trocar de dispositivo
    if (session?.user) {
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: COUPLE_PROFILE_ROW_ID,
        couple_profile: {
          ...data.coupleProfile,
          [personId]: { ...data.coupleProfile[personId], ...profileUpdates }
        },
        updated_at: new Date().toISOString()
      });

      if (upsertError) {
        console.error('Erro ao salvar perfil no Supabase:', upsertError);
        toast.error('Não foi possível salvar o perfil no servidor.');
      }
    }
  }, [set, session?.user, data.coupleProfile]);

  // Curtir/favoritar é por pessoa (likedBy/favoritedBy); aqui calculamos o
  // booleano relativo a quem está logado neste aparelho para a UI consumir.
  const memoriesForUI = useMemo(() => data.memories.map((m) => ({
    ...m,
    liked: currentUser ? m.likedBy.includes(currentUser) : false,
    favorited: currentUser ? m.favoritedBy.includes(currentUser) : false,
  })), [data.memories, currentUser]);

  return (
    <AppDataContext.Provider value={{
      ...data,
      memories: memoriesForUI,
      addEvent, updateEvent, deleteEvent, getEventsForDate, getUpcomingEvents,
      addGoal, updateGoal, deleteGoal,
      addMemory, toggleMemoryLike, toggleMemoryFavorite, deleteMemory,
      sendMessage, editMessage, deleteMessageForMe, deleteMessageForEveryone, reactToMessage, toggleStarMessage, markMessagesRead,
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
