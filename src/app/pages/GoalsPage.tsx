import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, X, Target, Clock, ChevronRight, Lock, Unlock, Trash2,
  TrendingUp, Heart, Star,
} from 'lucide-react';
import {
  useAppData,
  GOAL_CATEGORIES,
  Goal,
  GoalCategory,
  TimeCapsule,
  WishItem,
} from '../context/AppDataContext';
import { useGamification } from '../context/GamificationContext';
import confetti from 'canvas-confetti';

type TabType = 'metas' | 'capsula' | 'desejos';

// ─── Goals Tab ────────────────────────────────────────────────────────────────

function GoalsTab() {
  const { goals, addGoal, updateGoal, deleteGoal } = useAppData();
  const { addXP, unlockAchievement } = useGamification();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', category: 'experiencia' as GoalCategory,
    targetValue: '', currentValue: '', deadline: '', status: 'em_andamento' as Goal['status'],
  });

  const submitGoal = () => {
    if (!form.name.trim()) return;
    addGoal({
      name: form.name,
      description: form.description,
      category: form.category,
      targetValue: form.targetValue ? Number(form.targetValue) : undefined,
      currentValue: Number(form.currentValue) || 0,
      deadline: form.deadline,
      status: 'em_andamento',
    });
    addXP(15, 'Nova meta criada 🎯');
    setShowForm(false);
    setForm({ name: '', description: '', category: 'experiencia', targetValue: '', currentValue: '', deadline: '', status: 'em_andamento' });
  };

  const completeGoal = (goal: Goal) => {
    updateGoal(goal.id, { status: 'concluida', currentValue: goal.targetValue ?? goal.currentValue });
    addXP(100, `Meta concluída: ${goal.name} 🏆`);
    unlockAchievement('quiz_first');
    confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, colors: ['#FF6B9D', '#FFB6C1', '#FFC8DD'] });
  };

  const updateProgress = (goal: Goal, value: number) => {
    updateGoal(goal.id, { currentValue: value });
  };

  const activeGoals = goals.filter((g) => g.status === 'em_andamento');
  const doneGoals = goals.filter((g) => g.status === 'concluida');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">{activeGoals.length} ativas • {doneGoals.length} concluídas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-sm shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          emoji="🎯"
          title="Nenhuma meta ainda"
          subtitle="Crie metas para vocês dois alcançarem juntos"
          onAction={() => setShowForm(true)}
          actionLabel="Criar primeira meta"
        />
      ) : (
        <div className="space-y-4">
          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onComplete={() => completeGoal(goal)}
              onDelete={() => deleteGoal(goal.id)}
              onUpdateProgress={(v) => updateProgress(goal, v)}
            />
          ))}
          {doneGoals.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground flex items-center gap-2 pt-2">
                <Star className="w-3 h-3 text-primary" />
                Concluídas ({doneGoals.length})
              </p>
              {doneGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onComplete={() => {}}
                  onDelete={() => deleteGoal(goal.id)}
                  onUpdateProgress={() => {}}
                  done
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Add Goal Sheet */}
      <AnimatePresence>
        {showForm && (
          <BottomSheet title="Nova Meta" onClose={() => setShowForm(false)}>
            <div className="space-y-4">
              <FormField label="Nome da Meta">
                <input
                  className="input-base"
                  placeholder="Ex: Viagem para a praia"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </FormField>

              <FormField label="Categoria">
                <div className="grid grid-cols-5 gap-2">
                  {(Object.entries(GOAL_CATEGORIES) as [GoalCategory, typeof GOAL_CATEGORIES[GoalCategory]][]).map(([key, cat]) => (
                    <button
                      key={key}
                      onClick={() => setForm((f) => ({ ...f, category: key }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all ${
                        form.category === key ? 'bg-primary/15 border border-primary/40' : 'bg-muted'
                      }`}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-muted-foreground" style={{ fontSize: '10px' }}>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Valor Alvo (opcional)">
                  <input
                    type="number"
                    className="input-base"
                    placeholder="Ex: 5000"
                    value={form.targetValue}
                    onChange={(e) => setForm((f) => ({ ...f, targetValue: e.target.value }))}
                  />
                </FormField>
                <FormField label="Valor Atual">
                  <input
                    type="number"
                    className="input-base"
                    placeholder="0"
                    value={form.currentValue}
                    onChange={(e) => setForm((f) => ({ ...f, currentValue: e.target.value }))}
                  />
                </FormField>
              </div>

              <FormField label="Prazo (opcional)">
                <input
                  type="date"
                  className="input-base"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </FormField>

              <FormField label="Descrição (opcional)">
                <textarea
                  className="input-base resize-none"
                  rows={2}
                  placeholder="Detalhes da meta..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </FormField>

              <button
                onClick={submitGoal}
                className="w-full bg-primary text-white py-4 rounded-2xl shadow-lg"
              >
                Criar Meta
              </button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

function GoalCard({
  goal, onComplete, onDelete, onUpdateProgress, done = false,
}: {
  goal: Goal;
  onComplete: () => void;
  onDelete: () => void;
  onUpdateProgress: (v: number) => void;
  done?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [progressInput, setProgressInput] = useState(goal.currentValue.toString());
  const cat = GOAL_CATEGORIES[goal.category];
  const progress = goal.targetValue ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-2xl p-4 border shadow-sm ${done ? 'border-primary/20 opacity-75' : 'border-border'}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
          {cat.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-foreground flex-1 truncate">{goal.name}</p>
            {done && <span className="text-xs text-primary">✓ Concluída</span>}
          </div>
          <p className="text-xs text-muted-foreground">{cat.label}</p>
          {goal.targetValue && (
            <>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500"
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-xs text-muted-foreground">{goal.currentValue.toLocaleString()}</span>
                <span className="text-xs text-primary">{Math.round(progress)}%</span>
                <span className="text-xs text-muted-foreground">{goal.targetValue.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground/50 p-1">
          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-3 border-t border-border space-y-3">
              {goal.description && (
                <p className="text-sm text-muted-foreground">{goal.description}</p>
              )}
              {goal.deadline && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Prazo: {new Date(goal.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}
                </p>
              )}
              {!done && goal.targetValue && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm outline-none"
                    value={progressInput}
                    onChange={(e) => setProgressInput(e.target.value)}
                    placeholder="Atualizar progresso"
                  />
                  <button
                    onClick={() => onUpdateProgress(Number(progressInput))}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>
                </div>
              )}
              {!done && (
                <div className="flex gap-2">
                  <button
                    onClick={onComplete}
                    className="flex-1 py-2 rounded-xl bg-primary/10 text-primary text-sm flex items-center justify-center gap-1"
                  >
                    <Star className="w-4 h-4" /> Concluir
                  </button>
                  <button
                    onClick={onDelete}
                    className="py-2 px-3 rounded-xl bg-destructive/10 text-destructive text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              {done && (
                <button
                  onClick={onDelete}
                  className="w-full py-2 rounded-xl bg-muted text-muted-foreground text-sm flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Remover
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Capsule Tab ──────────────────────────────────────────────────────────────

function CapsuleTab() {
  const { capsules, addCapsule, openCapsule } = useAppData();
  const { addXP } = useGamification();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', openDate: '' });

  const submitCapsule = () => {
    if (!form.title.trim() || !form.openDate) return;
    addCapsule({ title: form.title, message: form.message, openDate: form.openDate });
    addXP(20, 'Cápsula do tempo criada ⏳');
    setShowForm(false);
    setForm({ title: '', message: '', openDate: '' });
  };

  const canOpen = (c: TimeCapsule) => {
    return !c.opened && new Date(c.openDate) <= new Date();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{capsules.length} cápsulas</p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-sm shadow-md"
        >
          <Plus className="w-4 h-4" /> Nova Cápsula
        </button>
      </div>

      {capsules.length === 0 ? (
        <EmptyState
          emoji="⏳"
          title="Nenhuma cápsula ainda"
          subtitle="Crie mensagens para abrir no futuro"
          onAction={() => setShowForm(true)}
          actionLabel="Criar cápsula"
        />
      ) : (
        <div className="space-y-3">
          {capsules.map((c) => (
            <CapsuleCard key={c.id} capsule={c} canOpen={canOpen(c)} onOpen={() => openCapsule(c.id)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <BottomSheet title="Nova Cápsula do Tempo" onClose={() => setShowForm(false)}>
            <div className="space-y-4">
              <FormField label="Título">
                <input
                  className="input-base"
                  placeholder="Ex: Para o nosso 1° aniversário"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </FormField>
              <FormField label="Mensagem">
                <textarea
                  className="input-base resize-none"
                  rows={4}
                  placeholder="Escreva sua mensagem para o futuro..."
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              </FormField>
              <FormField label="Data de Abertura">
                <input
                  type="date"
                  className="input-base"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.openDate}
                  onChange={(e) => setForm((f) => ({ ...f, openDate: e.target.value }))}
                />
              </FormField>
              <button onClick={submitCapsule} className="w-full bg-primary text-white py-4 rounded-2xl shadow-lg">
                Criar Cápsula
              </button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

function CapsuleCard({ capsule, canOpen, onOpen }: { capsule: TimeCapsule; canOpen: boolean; onOpen: () => void }) {
  const [revealed, setRevealed] = useState(capsule.opened);
  const openDate = new Date(capsule.openDate + 'T12:00:00');
  const now = new Date();
  const daysLeft = Math.ceil((openDate.getTime() - now.getTime()) / 86400000);

  const handleOpen = () => {
    if (!canOpen) return;
    confetti({ particleCount: 180, spread: 100, origin: { y: 0.5 }, colors: ['#FF6B9D', '#FFB6C1'] });
    onOpen();
    setRevealed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-2xl p-4 border shadow-sm ${capsule.opened ? 'border-primary/20' : 'border-border'}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          {capsule.opened ? <Unlock className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div className="flex-1">
          <p className="text-foreground mb-0.5">{capsule.title}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {capsule.opened
              ? 'Aberta!'
              : canOpen
              ? 'Disponível para abrir!'
              : `Abre em ${daysLeft > 0 ? `${daysLeft} dias` : 'breve'}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {openDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {(revealed || capsule.opened) && capsule.message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-primary/20"
        >
          <p className="text-sm text-foreground leading-relaxed">💌 {capsule.message}</p>
        </motion.div>
      )}

      {canOpen && !capsule.opened && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleOpen}
          className="mt-3 w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm"
        >
          Abrir Cápsula ✨
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── Wishes Tab ───────────────────────────────────────────────────────────────

function WishesTab() {
  const { wishes, addWish, deleteWish } = useAppData();
  const { currentUser } = { currentUser: 'Eu' }; // simplified
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', link: '', category: 'Geral', priority: 'media' as WishItem['priority'],
  });

  const submitWish = () => {
    if (!form.name.trim()) return;
    addWish({ ...form, owner: 'Eu' });
    setShowForm(false);
    setForm({ name: '', description: '', link: '', category: 'Geral', priority: 'media' });
  };

  const PRIORITIES: { value: WishItem['priority']; label: string; color: string }[] = [
    { value: 'alta', label: 'Alta', color: '#FF6B9D' },
    { value: 'media', label: 'Média', color: '#FFB347' },
    { value: 'baixa', label: 'Baixa', color: '#81C784' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{wishes.length} desejos</p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-sm shadow-md"
        >
          <Plus className="w-4 h-4" /> Novo Desejo
        </button>
      </div>

      {wishes.length === 0 ? (
        <EmptyState
          emoji="⭐"
          title="Lista vazia"
          subtitle="Adicione coisas que você deseja receber ou fazer"
          onAction={() => setShowForm(true)}
          actionLabel="Adicionar desejo"
        />
      ) : (
        <div className="space-y-3">
          {wishes.map((w) => {
            const pr = PRIORITIES.find((p) => p.value === w.priority)!;
            return (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-4 border border-border shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground">{w.name}</p>
                    {w.description && <p className="text-xs text-muted-foreground mt-0.5">{w.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: pr.color + '25', color: pr.color }}
                      >
                        {pr.label}
                      </span>
                      {w.category && <span className="text-xs text-muted-foreground">{w.category}</span>}
                    </div>
                    {w.link && (
                      <a href={w.link} target="_blank" rel="noreferrer" className="text-xs text-primary mt-1 block truncate">
                        🔗 {w.link}
                      </a>
                    )}
                  </div>
                  <button onClick={() => deleteWish(w.id)} className="text-muted-foreground/50 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <BottomSheet title="Novo Desejo" onClose={() => setShowForm(false)}>
            <div className="space-y-4">
              <FormField label="Nome">
                <input className="input-base" placeholder="O que você deseja?" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </FormField>
              <FormField label="Prioridade">
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                      className={`flex-1 py-2 rounded-xl text-sm transition-all ${form.priority === p.value ? 'text-white' : 'bg-muted text-muted-foreground'}`}
                      style={form.priority === p.value ? { backgroundColor: p.color } : {}}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label="Categoria">
                <input className="input-base" placeholder="Ex: Roupa, Livro, Viagem..." value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
              </FormField>
              <FormField label="Descrição (opcional)">
                <textarea className="input-base resize-none" rows={2} placeholder="Detalhes..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </FormField>
              <FormField label="Link (opcional)">
                <input className="input-base" placeholder="https://..." value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
              </FormField>
              <button onClick={submitWish} className="w-full bg-primary text-white py-4 rounded-2xl shadow-lg">Salvar Desejo</button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('metas');

  const tabs: { key: TabType; label: string; emoji: string }[] = [
    { key: 'metas',   label: 'Metas',    emoji: '🎯' },
    { key: 'capsula', label: 'Cápsula',  emoji: '⏳' },
    { key: 'desejos', label: 'Desejos',  emoji: '⭐' },
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto pb-28">
      <div className="px-6 pt-10 pb-4">
        <h1 className="text-3xl text-primary mb-1">Planos do Casal</h1>
        <p className="text-muted-foreground text-sm">Metas, desejos e mensagens futuras 💫</p>
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
            {activeTab === 'metas'   && <GoalsTab />}
            {activeTab === 'capsula' && <CapsuleTab />}
            {activeTab === 'desejos' && <WishesTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function EmptyState({ emoji, title, subtitle, onAction, actionLabel }: {
  emoji: string; title: string; subtitle: string; onAction: () => void; actionLabel: string;
}) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <div className="text-5xl mb-3">{emoji}</div>
      <p className="mb-1">{title}</p>
      <p className="text-sm mb-4">{subtitle}</p>
      <button onClick={onAction} className="text-primary text-sm">
        + {actionLabel}
      </button>
    </div>
  );
}

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
