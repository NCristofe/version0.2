import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, X, Heart, Star, MapPin, MessageSquare,
  Smile, RefreshCw, Send, CheckCircle2, Camera,
} from 'lucide-react';
import {
  useAppData,
  EMOTIONS,
  MOODS,
  Memory,
  MoodType,
  CoupleProfile,
} from '../context/AppDataContext';
import { useGamification } from '../context/GamificationContext';
import confetti from 'canvas-confetti';

type TabType = 'memorias' | 'perguntas' | 'checkin';

function fileToImageUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 1600;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      image.onerror = () => reject(new Error('Imagem inválida.'));
      image.src = String(reader.result);
    };

    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

// ─── Memories Tab ─────────────────────────────────────────────────────────────

function MemoriasTab() {
  const { memories, addMemory, toggleMemoryLike, toggleMemoryFavorite, deleteMemory, coupleProfile } = useAppData();
  const { addXP } = useGamification();
  const [showForm, setShowForm] = useState(false);
  const [filterEmotion, setFilterEmotion] = useState<string | 'todos'>('todos');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageError, setImageError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', date: new Date().toISOString().split('T')[0],
    location: '', emotion: 'feliz' as Memory['emotion'],
    liked: false, favorited: false, userId: 'user1' as 'user1' | 'user2', // userId será sobrescrito
  });

  const resetForm = () => {
    setForm({
      title: '', description: '', date: new Date().toISOString().split('T')[0],
      location: '', emotion: 'feliz', liked: false, favorited: false, userId: 'user1',
    });
    setImageUrls([]); // Limpar as URLs das imagens
    setSelectedFiles([]);
    setImageError('');
  };

  const handleImageSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'));
    event.target.value = '';

    if (files.length === 0) return;

    const remainingSlots = Math.max(0, 6 - imageUrls.length);
    const pickedFiles = files.slice(0, remainingSlots);

    if (pickedFiles.length < files.length) {
      setImageError('Você pode adicionar até 6 imagens por memória.');
    } else {
      setImageError('');
    }

    try {
      setSelectedFiles((current) => [...current, ...pickedFiles]);
      const processed = await Promise.all(pickedFiles.map(fileToImageUrl));
      setImageUrls((current) => [...current, ...processed]);
    } catch {
      setImageError('Não consegui carregar uma das imagens. Tente outra foto.');
    }
  };

  const submitMemory = async () => {
    if (!form.title.trim()) return;
    await addMemory(form, selectedFiles);
    addXP(20, 'Memória criada 💖');
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#FF6B9D', '#FFB6C1'] });
    setShowForm(false);
    resetForm();
  };

  const filtered = useMemo(() => {
    if (filterEmotion === 'todos') return memories;
    return memories.filter((m) => m.emotion === filterEmotion);
  }, [memories, filterEmotion]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{memories.length} memórias</p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-sm shadow-md"
        >
          <Plus className="w-4 h-4" /> Registrar
        </button>
      </div>

      {/* Emotion Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterEmotion('todos')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs ${filterEmotion === 'todos' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
        >
          Todos
        </button>
        {EMOTIONS.map((em) => (
          <button
            key={em.id}
            onClick={() => setFilterEmotion(em.id)}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${filterEmotion === em.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
          >
            {em.emoji} {em.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-5xl mb-3">🌸</div>
          <p className="mb-1">{memories.length === 0 ? 'Nenhuma memória ainda' : 'Nenhuma memória com este filtro'}</p>
          {memories.length === 0 && (
            <>
              <p className="text-sm mb-4">Registre os momentos especiais de vocês</p>
              <button onClick={() => setShowForm(true)} className="text-primary text-sm">+ Criar primeira memória</button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((m) => (
            <MemoryCard
              key={m.id}
              memory={m}
              onLike={() => toggleMemoryLike(m.id)} // TODO: Passar userId para like
              onFavorite={() => toggleMemoryFavorite(m.id)}
              onDelete={() => deleteMemory(m.id)}
              coupleProfile={coupleProfile}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <BottomSheet title="Nova Memória" onClose={() => { setShowForm(false); resetForm(); }}>
            <div className="space-y-4">
              <FormField label="Título">
                <input className="input-base" placeholder="Ex: Nosso primeiro pôr do sol" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </FormField>

              <FormField label="Como foi esse momento?">
                <div className="grid grid-cols-4 gap-2">
                  {EMOTIONS.map((em) => (
                    <button
                      key={em.id}
                      onClick={() => setForm((f) => ({ ...f, emotion: em.id as Memory['emotion'] }))}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${form.emotion === em.id ? 'bg-primary/15 border border-primary/40' : 'bg-muted'}`}
                    >
                      <span className="text-2xl">{em.emoji}</span>
                      <span className="text-xs text-muted-foreground">{em.label}</span>
                    </button>
                  ))}
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Data">
                  <input type="date" className="input-base" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </FormField>
                <FormField label="Local (opcional)">
                  <input className="input-base" placeholder="Onde?" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                </FormField>
              </div>

              <FormField label="Descrição (opcional)">
                <textarea className="input-base resize-none" rows={3} placeholder="Conte como foi..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </FormField>

              <FormField label="Fotos (opcional)">
                <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-5 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <Camera className="w-7 h-7 text-primary" />
                  <span className="text-sm text-foreground">Adicionar fotos</span>
                  <span className="text-xs text-muted-foreground">Até 6 imagens por memória</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelection}
                    className="sr-only"
                  />
                </label>

                {imageError && <p className="text-xs text-destructive mt-2">{imageError}</p>}

                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {imageUrls.map((url, index) => (
                      <div key={`${url.slice(0, 32)}-${index}`} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                        <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrls((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                          className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FormField>

              <button onClick={submitMemory} className="w-full bg-primary text-white py-4 rounded-2xl shadow-lg">Salvar Memória</button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemoryCard({ memory, onLike, onFavorite, onDelete, coupleProfile }: {
  memory: Memory;
  onLike: () => void;
  onFavorite: () => void;
  onDelete: () => void;
  coupleProfile: CoupleProfile; // Adicionado coupleProfile para obter o nome do usuário
}) {
  const [showDelete, setShowDelete] = useState(false);
  const emotion = EMOTIONS.find((e) => e.id === memory.emotion);
  const creatorName = memory.userId ? coupleProfile[memory.userId]?.name : 'Desconhecido';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <p className="text-foreground">{memory.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {emotion && <span className="text-sm">{emotion.emoji}</span>}
            <span className="text-xs text-muted-foreground">por {creatorName}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(memory.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {memory.location && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />{memory.location}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setShowDelete(!showDelete)} className="text-muted-foreground/50 p-1 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {memory.description && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{memory.description}</p>
      )}

      {memory.imageUrls && memory.imageUrls.length > 0 && (
        <div className={`grid gap-2 mb-3 ${memory.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {memory.imageUrls.slice(0, 4).map((url, index) => (
            <div
              key={`${memory.id}-${index}`}
              className={`relative overflow-hidden rounded-xl bg-muted ${memory.imageUrls?.length === 1 ? 'aspect-[4/3]' : 'aspect-square'}`}
            >
              <img src={url} alt={`${memory.title} - foto ${index + 1}`} className="w-full h-full object-cover" />
              {index === 3 && memory.imageUrls && memory.imageUrls.length > 4 && (
                <div className="absolute inset-0 bg-black/55 text-white flex items-center justify-center text-lg">
                  +{memory.imageUrls.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-border/50">
        <button onClick={onLike} className={`flex items-center gap-1.5 text-sm transition-colors ${memory.liked ? 'text-primary' : 'text-muted-foreground'}`}>
          <Heart className="w-4 h-4" fill={memory.liked ? 'currentColor' : 'none'} />
          <span>{memory.liked ? 'Curtido' : 'Curtir'}</span>
        </button>
        <button onClick={onFavorite} className={`flex items-center gap-1.5 text-sm transition-colors ${memory.favorited ? 'text-amber-500' : 'text-muted-foreground'}`}>
          <Star className="w-4 h-4" fill={memory.favorited ? 'currentColor' : 'none'} />
          <span>{memory.favorited ? 'Favoritado' : 'Favoritar'}</span>
        </button>
      </div>

      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 mt-3">
              <button onClick={onDelete} className="flex-1 py-2 rounded-xl bg-destructive/10 text-destructive text-sm">Excluir</button>
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-sm">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Questions Tab ─────────────────────────────────────────────────────────────

function PerguntasTab() {
  const { questions, getDailyQuestion, getRandomQuestion, answerQuestion } = useAppData();
  const { addXP } = useGamification();
  const [currentQ, setCurrentQ] = useState(() => getDailyQuestion());
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const answered = questions.filter((q) => q.myAnswer);

  const submitAnswer = () => {
    if (!answer.trim()) return;
    answerQuestion(currentQ.id, answer);
    addXP(10, 'Pergunta respondida 💬');
    setSubmitted(true);
    setAnswer('');
  };

  const nextQuestion = () => {
    const q = getRandomQuestion();
    setCurrentQ(q);
    setSubmitted(false);
    setAnswer('');
  };

  return (
    <div>
      {/* Daily Question Card */}
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-5 border border-primary/15 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-primary uppercase tracking-wider flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Pergunta do Dia
          </p>
          <button onClick={nextQuestion} className="text-muted-foreground hover:text-primary transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <p className="text-foreground mb-4 leading-relaxed">
          "{currentQ.question}"
        </p>

        {!submitted && !currentQ.myAnswer ? (
          <div className="space-y-3">
            <textarea
              className="w-full bg-white/80 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none border border-primary/20"
              rows={3}
              placeholder="Sua resposta..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={submitAnswer}
              className="w-full bg-primary text-white py-3 rounded-2xl flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Responder
            </motion.button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 rounded-xl p-3 border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-xs text-primary">Respondida!</span>
            </div>
            <p className="text-sm text-foreground">{currentQ.myAnswer}</p>
          </motion.div>
        )}
      </div>

      {/* History */}
      <div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between py-3 text-sm text-muted-foreground"
        >
          <span>Histórico de Respostas ({answered.length})</span>
          <Star className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3"
            >
              {answered.map((q) => (
                <div key={q.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">"{q.question}"</p>
                  <p className="text-sm text-foreground">{q.myAnswer}</p>
                  {q.answeredAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(q.answeredAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              ))}
              {answered.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Nenhuma resposta ainda
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Check-in Tab ─────────────────────────────────────────────────────────────

function CheckinTab() {
  const { addCheckIn, getTodayCheckIn, checkIns, recordActivity } = useAppData();
  const { addXP } = useGamification();
  const todayCheckIn = getTodayCheckIn();

  const handleMood = (mood: MoodType) => {
    if (todayCheckIn) return;
    addCheckIn(mood);
    recordActivity();
    addXP(5, 'Check-in diário ☀️');
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: ['#FF6B9D', '#FFB6C1'] });
  };

  // Last 7 check-ins
  const recent = checkIns.slice(0, 7);

  // Mood stats
  const moodCounts = Object.keys(MOODS).reduce((acc, k) => {
    acc[k as MoodType] = checkIns.filter((c) => c.mood === k).length;
    return acc;
  }, {} as Record<MoodType, number>);

  return (
    <div>
      {/* Today's check-in */}
      <div className="bg-card rounded-3xl p-5 border border-border shadow-sm mb-5">
        <p className="text-sm text-muted-foreground mb-3">Como foi seu dia hoje?</p>

        {todayCheckIn ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <div className="text-5xl mb-2">{MOODS[todayCheckIn.mood].emoji}</div>
            <p className="text-primary">{MOODS[todayCheckIn.mood].label}</p>
            <p className="text-xs text-muted-foreground mt-1">Check-in feito hoje! +5 XP</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {(Object.entries(MOODS) as [MoodType, typeof MOODS[MoodType]][]).map(([key, mood]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMood(key)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted hover:bg-primary/10 transition-colors"
              >
                <span className="text-3xl">{mood.emoji}</span>
                <span className="text-xs text-muted-foreground">{mood.label}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Mood stats */}
      {checkIns.length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm mb-4">
          <p className="text-sm text-foreground mb-3 flex items-center gap-2">
            <Smile className="w-4 h-4 text-primary" />
            Seus Humores
          </p>
          <div className="space-y-2">
            {(Object.entries(MOODS) as [MoodType, typeof MOODS[MoodType]][]).map(([key, mood]) => {
              const count = moodCounts[key];
              const total = checkIns.length;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-lg w-6">{mood.emoji}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: mood.color }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent history */}
      {recent.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">Últimos dias</p>
          <div className="flex gap-2">
            {recent.map((c) => {
              const mood = MOODS[c.mood];
              return (
                <div key={c.id} className="flex flex-col items-center gap-1">
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MemoriesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('memorias');

  const tabs: { key: TabType; label: string; emoji: string }[] = [
    { key: 'memorias',  label: 'Memórias',  emoji: '🌸' },
    { key: 'perguntas', label: 'Perguntas', emoji: '💬' },
    { key: 'checkin',   label: 'Humor',     emoji: '😊' },
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto pb-28">
      <div className="px-6 pt-10 pb-4">
        <h1 className="text-3xl text-primary mb-1">Memórias</h1>
        <p className="text-muted-foreground text-sm">Momentos, conversas e bem-estar 💕</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-5">
        <div className="flex rounded-2xl bg-muted p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-xl transition-all text-sm ${
                activeTab === tab.key
                  ? 'bg-card shadow-md text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'memorias'  && <MemoriasTab />}
            {activeTab === 'perguntas' && <PerguntasTab />}
            {activeTab === 'checkin'   && <CheckinTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28 }}
        className="bg-card w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl text-primary">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
