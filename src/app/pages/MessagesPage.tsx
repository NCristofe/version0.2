import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  useAppData,
  Message,
  MessageAttachment,
  MessageReplyPreview,
  SharedCard,
  EVENT_CATEGORIES,
  GOAL_CATEGORIES,
  EMOTIONS,
} from '../context/AppDataContext';
import { useGamification } from '../context/GamificationContext';
import { usePresence } from '../context/PresenceContext';
import {
  BookHeart,
  CalendarHeart,
  Check,
  CheckCheck,
  Edit3,
  FileText,
  Image as ImageIcon,
  Mic,
  MoreHorizontal,
  Paperclip,
  Plus,
  Reply,
  Search,
  Send,
  Smile,
  Sparkles,
  Star,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from '../components/UserAvatar';

type UserId = 'user1' | 'user2';

interface PendingAttachment {
  id: string;
  file: File;
  type: MessageAttachment['type'];
  previewUrl: string;
}

const reactionEmojis = ['❤️', '😂', '😍', '🥺', '🔥', '👏'];
const quickMessages = [
  'Te amo ❤️',
  'Você é tudo pra mim',
  'Saudades',
  'Pensando em você',
  'Me liga quando puder',
  'Cheguei bem',
];

function classifyFile(file: File): MessageAttachment['type'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'file';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { coupleProfile, messages, memories, events, goals, sendMessage, editMessage, deleteMessageForMe, deleteMessageForEveryone, reactToMessage, toggleStarMessage, markMessagesRead } = useAppData();
  const { incrementStat, unlockAchievement, completeDailyChallenge } = useGamification();
  const { presence, setTyping } = usePresence();
  const currentUserId: UserId = currentUser === 'user2' ? 'user2' : 'user1';
  const otherUserId: UserId = currentUserId === 'user1' ? 'user2' : 'user1';

  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [showSharePicker, setShowSharePicker] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<MessageReplyPreview | null>(null);
  const [pendingCard, setPendingCard] = useState<SharedCard | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);

  const otherProfile = coupleProfile[otherUserId];

  const visibleMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((message) => {
      if (message.deletedFor.includes(currentUserId)) return false;
      if (!q) return true;
      const text = message.deletedForEveryone ? '' : message.text.toLowerCase();
      const files = message.attachments.some((attachment) => attachment.name.toLowerCase().includes(q));
      return text.includes(q) || files;
    });
  }, [messages, search, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length]);

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  // Libera os object URLs de preview quando o componente desmonta
  useEffect(() => () => {
    pendingAttachmentsRef.current.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
  }, []);

  // "Digitando..." de verdade: avisa o outro enquanto você escreve e some
  // sozinho depois de alguns segundos sem digitar (ou ao enviar).
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = (value: string) => {
    setInput(value);
    const hasText = value.trim().length > 0;
    setTyping(hasText);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (hasText) {
      typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000);
    }
  };

  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

  // Confirmação de leitura: marca como lida qualquer mensagem do outro que
  // ainda não foi vista, sempre que a conversa está aberta.
  useEffect(() => {
    const unreadIds = messages
      .filter((m) => m.senderId !== currentUserId && !m.readBy.includes(currentUserId))
      .map((m) => m.id);
    if (unreadIds.length > 0) markMessagesRead(unreadIds);
  }, [messages, currentUserId, markMessagesRead]);

  const sendCurrentMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed && pendingAttachments.length === 0 && !pendingCard) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTyping(false);

    if (editingMessageId) {
      const id = editingMessageId;
      setEditingMessageId(null);
      setInput('');
      await editMessage(id, trimmed);
      return;
    }

    const filesToSend = pendingAttachments.map((attachment) => attachment.file);
    const cardToSend = pendingCard ?? undefined;
    pendingAttachments.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));

    setInput('');
    setReplyTo(null);
    setPendingAttachments([]);
    setPendingCard(null);
    setShowQuickMessages(false);

    await sendMessage({ text: trimmed, replyTo: replyTo ?? undefined, attachments: filesToSend, sharedCard: cardToSend });
    incrementStat('messagesSent');
    unlockAchievement('first_message');
    completeDailyChallenge('dc1', 10, 'Mensagem carinhosa enviada 💌');
  };

  const shareMemory = (memory: (typeof memories)[number]) => {
    const emotion = EMOTIONS.find((e) => e.id === memory.emotion);
    setPendingCard({
      kind: 'memory',
      refId: memory.id,
      title: memory.title,
      subtitle: new Date(`${memory.date}T00:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
      emoji: emotion?.emoji ?? '💖',
      imageUrl: memory.imageUrls?.[0],
    });
    setShowSharePicker(false);
  };

  const shareEvent = (event: (typeof events)[number]) => {
    const category = EVENT_CATEGORIES[event.category];
    setPendingCard({
      kind: 'event',
      refId: event.id,
      title: event.title,
      subtitle: new Date(`${event.date}T00:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
      emoji: category.emoji,
      color: category.color,
    });
    setShowSharePicker(false);
  };

  const shareGoal = (goal: (typeof goals)[number]) => {
    const category = GOAL_CATEGORIES[goal.category];
    const progress = goal.targetValue ? `${goal.currentValue}/${goal.targetValue}` : `${goal.currentValue}`;
    setPendingCard({
      kind: 'goal',
      refId: goal.id,
      title: goal.name,
      subtitle: `${category.label} · ${progress}`,
      emoji: category.emoji,
    });
    setShowSharePicker(false);
  };

  const openSharedCard = (card: SharedCard) => {
    if (card.kind === 'memory') navigate('/memories');
    else if (card.kind === 'event') navigate('/calendar');
    else navigate('/goals');
  };

  const attachFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    const picked = files.slice(0, Math.max(0, 8 - pendingAttachments.length));
    const next: PendingAttachment[] = picked.map((file) => ({
      id: crypto.randomUUID(),
      file,
      type: classifyFile(file),
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingAttachments((current) => [...current, ...next]);
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments((current) => {
      const found = current.find((attachment) => attachment.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return current.filter((attachment) => attachment.id !== id);
    });
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      window.alert('Gravação de áudio não está disponível neste navegador.');
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      const file = new File([blob], `audio-${Date.now()}.webm`, { type: blob.type });
      setPendingAttachments((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          file,
          type: 'audio',
          previewUrl: URL.createObjectURL(file),
        },
      ]);
      setIsRecording(false);
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const beginEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setInput(message.text);
    setReplyTo(null);
    setActiveMessageId(null);
  };

  const beginReply = (message: Message) => {
    setReplyTo({
      id: message.id,
      text: message.deletedForEveryone ? 'Mensagem apagada' : message.text || message.attachments[0]?.name || 'Anexo',
      userId: message.senderId,
    });
    setActiveMessageId(null);
  };

  const formatTime = (createdAt: string) => {
    return new Date(createdAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const otherPresence = presence[otherUserId];
  const statusText = otherPresence.typing
    ? `${otherProfile.name} digitando...`
    : otherPresence.online
      ? 'online agora'
      : otherPresence.lastSeenAt
        ? `visto por último às ${formatTime(otherPresence.lastSeenAt)}`
        : 'offline';

  return (
    <div className="h-screen flex flex-col max-w-md mx-auto bg-background">
      <div className="bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="p-4 flex items-center gap-3">
          <UserAvatar userId={otherUserId} className="w-12 h-12" fallbackClassName="text-2xl bg-primary/10" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg text-foreground truncate">{otherProfile.name}</h1>
            <p className={`text-xs ${otherPresence.typing ? 'text-primary' : 'text-muted-foreground'}`}>
              {statusText}
            </p>
          </div>
          <button
            onClick={() => setShowSearch((value) => !value)}
            className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:text-primary transition-colors"
          >
            <Search size={19} />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden px-4 pb-3"
            >
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar mensagens ou arquivos"
                className="w-full px-4 py-3 rounded-2xl bg-muted outline-none focus:ring-2 focus:ring-primary/30"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-primary/5 to-background">
        <AnimatePresence initial={false}>
          {visibleMessages.map((message) => {
            const isCurrentUser = message.senderId === currentUserId;
            const isActive = activeMessageId === message.id;
            const isStarred = message.starredBy.includes(currentUserId);

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                  <UserAvatar userId={message.senderId} className="w-8 h-8 shrink-0" fallbackClassName="text-base bg-primary/10" />
                )}

                <div className={`max-w-[78%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <button
                    type="button"
                    onClick={() => setActiveMessageId(isActive ? null : message.id)}
                    className={`text-left w-full rounded-2xl px-4 py-3 shadow-sm ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground rounded-tr-md'
                        : 'bg-card border border-border rounded-tl-md'
                    }`}
                  >
                    {message.replyTo && (
                      <div className={`mb-2 rounded-xl px-3 py-2 border-l-2 ${
                        isCurrentUser ? 'bg-white/15 border-white/60' : 'bg-muted border-primary/60'
                      }`}>
                        <p className={`text-[11px] ${isCurrentUser ? 'text-white/80' : 'text-primary'}`}>
                          {coupleProfile[message.replyTo.userId].name}
                        </p>
                        <p className="text-xs opacity-80 line-clamp-2">{message.replyTo.text}</p>
                      </div>
                    )}

                    {message.deletedForEveryone ? (
                      <p className="italic opacity-70">Mensagem apagada</p>
                    ) : (
                      <>
                        {message.sharedCard && (
                          <div className="mb-2">
                            <SharedCardView card={message.sharedCard} onOpen={() => openSharedCard(message.sharedCard!)} isCurrentUser={isCurrentUser} />
                          </div>
                        )}
                        {message.attachments.length > 0 && (
                          <div className="space-y-2 mb-2">
                            {message.attachments.map((attachment) => (
                              <AttachmentView key={attachment.id} attachment={attachment} />
                            ))}
                          </div>
                        )}
                        {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
                      </>
                    )}

                    <div className={`flex items-center gap-1 mt-1 text-[11px] ${
                      isCurrentUser ? 'text-primary-foreground/75 justify-end' : 'text-muted-foreground'
                    }`}>
                      {isStarred && <Star className="w-3 h-3" fill="currentColor" />}
                      {message.editedAt && <span>editada</span>}
                      <span>{formatTime(message.createdAt)}</span>
                      {isCurrentUser && (
                        message.deletedForEveryone
                          ? <Check size={13} />
                          : <CheckCheck size={13} className={message.readBy.includes(otherUserId) ? 'text-sky-400' : ''} />
                      )}
                    </div>
                  </button>

                  {Object.keys(message.reactions).length > 0 && (
                    <div className={`flex gap-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      {Object.entries(message.reactions).map(([emoji, users]) => (
                        <span key={emoji} className="px-2 py-0.5 rounded-full bg-card border border-border text-xs shadow-sm">
                          {emoji} {users.length}
                        </span>
                      ))}
                    </div>
                  )}

                  <AnimatePresence>
                    {isActive && !message.deletedForEveryone && (
                      <MessageActions
                        isMine={isCurrentUser}
                        onReply={() => beginReply(message)}
                        onEdit={() => beginEdit(message)}
                        onDeleteForMe={() => deleteMessageForMe(message.id)}
                        onDeleteForEveryone={() => deleteMessageForEveryone(message.id)}
                        onStar={() => toggleStarMessage(message.id)}
                        onReact={(emoji) => {
                          reactToMessage(message.id, emoji);
                          setActiveMessageId(null);
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {isCurrentUser && (
                  <UserAvatar userId={message.senderId} className="w-8 h-8 shrink-0" fallbackClassName="text-base bg-primary/10" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {visibleMessages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhuma mensagem encontrada</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-card border-t border-border shadow-2xl pb-24 md:pb-4">
        <AnimatePresence initial={false}>
          {showQuickMessages && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="px-4 pt-3"
            >
              <div className="flex gap-2 overflow-x-auto pb-2">
                {quickMessages.map((message) => (
                  <button
                    key={message}
                    onClick={() => sendCurrentMessage(message)}
                    className="px-4 py-2 rounded-full bg-primary/10 text-primary whitespace-nowrap text-sm"
                  >
                    {message}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {(replyTo || editingMessageId || pendingAttachments.length > 0 || pendingCard || isRecording) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden px-4 pt-3"
            >
              {replyTo && (
                <PreviewBar
                  icon={<Reply className="w-4 h-4" />}
                  title={`Respondendo ${coupleProfile[replyTo.userId].name}`}
                  text={replyTo.text}
                  onClose={() => setReplyTo(null)}
                />
              )}
              {editingMessageId && (
                <PreviewBar
                  icon={<Edit3 className="w-4 h-4" />}
                  title="Editando mensagem"
                  text="Faça a alteração e envie novamente."
                  onClose={() => {
                    setEditingMessageId(null);
                    setInput('');
                  }}
                />
              )}
              {isRecording && (
                <PreviewBar
                  icon={<Mic className="w-4 h-4 text-destructive" />}
                  title="Gravando áudio"
                  text="Toque no microfone para parar e anexar."
                  onClose={stopRecording}
                />
              )}
              {pendingCard && (
                <PreviewBar
                  icon={<span>{pendingCard.emoji}</span>}
                  title={`Compartilhando ${pendingCard.kind === 'memory' ? 'memória' : pendingCard.kind === 'event' ? 'evento' : 'meta'}`}
                  text={pendingCard.title}
                  onClose={() => setPendingCard(null)}
                />
              )}
              {pendingAttachments.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {pendingAttachments.map((attachment) => (
                    <div key={attachment.id} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-muted border border-border">
                      {attachment.type === 'image' ? (
                        <img src={attachment.previewUrl} alt={attachment.file.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground px-2">
                          {attachment.type === 'audio' ? <Mic className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          <span className="text-[10px] truncate max-w-full">{attachment.file.name}</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 flex items-end gap-2">
          <button
            onClick={() => setShowQuickMessages((value) => !value)}
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              showQuickMessages ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Smile size={20} />
          </button>

          <button
            onClick={() => imageInputRef.current?.click()}
            className="w-11 h-11 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 hover:text-primary transition-colors"
          >
            <ImageIcon size={20} />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 hover:text-primary transition-colors"
          >
            <Paperclip size={20} />
          </button>

          <button
            onClick={() => setShowSharePicker(true)}
            title="Compartilhar memória, evento ou meta"
            className="w-11 h-11 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 hover:text-primary transition-colors"
          >
            <Sparkles size={20} />
          </button>

          <textarea
            value={input}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendCurrentMessage(input);
              }
            }}
            placeholder="Mensagem"
            rows={1}
            className="flex-1 max-h-28 min-h-11 px-4 py-3 bg-muted rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          {input.trim() || pendingAttachments.length > 0 || editingMessageId ? (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => sendCurrentMessage(input)}
              className="w-11 h-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0 shadow-lg"
            >
              <Send size={20} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                isRecording ? 'bg-destructive text-white animate-pulse' : 'bg-primary text-primary-foreground'
              }`}
            >
              <Mic size={20} />
            </motion.button>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={attachFiles}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={attachFiles}
          />
        </div>
      </div>

      <AnimatePresence>
        {showSharePicker && (
          <SharePickerSheet
            memories={memories}
            events={events}
            goals={goals}
            onClose={() => setShowSharePicker(false)}
            onPickMemory={shareMemory}
            onPickEvent={shareEvent}
            onPickGoal={shareGoal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AttachmentView({ attachment }: { attachment: MessageAttachment }) {
  if (attachment.type === 'image') {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl bg-black/10">
        <img src={attachment.url} alt={attachment.name} className="max-h-72 w-full object-cover" />
      </a>
    );
  }

  if (attachment.type === 'audio') {
    return <audio src={attachment.url} controls className="w-full max-w-full" />;
  }

  return (
    <a
      href={attachment.url}
      download={attachment.name}
      className="flex items-center gap-3 rounded-xl bg-black/10 px-3 py-2"
    >
      <FileText className="w-5 h-5 shrink-0" />
      <span className="min-w-0">
        <span className="block truncate text-sm">{attachment.name}</span>
        <span className="block text-xs opacity-70">{formatBytes(attachment.size)}</span>
      </span>
    </a>
  );
}

function SharedCardView({ card, onOpen, isCurrentUser }: { card: SharedCard; onOpen: () => void; isCurrentUser: boolean }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors ${
        isCurrentUser ? 'bg-white/15 hover:bg-white/20' : 'bg-muted hover:bg-muted/70'
      }`}
    >
      {card.imageUrl ? (
        <img src={card.imageUrl} alt={card.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
      ) : (
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: card.color ? `${card.color}30` : undefined }}
        >
          {card.emoji}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-[10px] uppercase tracking-wider ${isCurrentUser ? 'text-white/70' : 'text-primary'}`}>
          {card.kind === 'memory' ? 'Memória' : card.kind === 'event' ? 'Evento' : 'Meta'}
        </p>
        <p className="text-sm truncate">{card.title}</p>
        <p className={`text-xs truncate ${isCurrentUser ? 'text-white/70' : 'text-muted-foreground'}`}>{card.subtitle}</p>
      </div>
    </button>
  );
}

function SharePickerSheet({
  memories,
  events,
  goals,
  onClose,
  onPickMemory,
  onPickEvent,
  onPickGoal,
}: {
  memories: ReturnType<typeof useAppData>['memories'];
  events: ReturnType<typeof useAppData>['events'];
  goals: ReturnType<typeof useAppData>['goals'];
  onClose: () => void;
  onPickMemory: (memory: ReturnType<typeof useAppData>['memories'][number]) => void;
  onPickEvent: (event: ReturnType<typeof useAppData>['events'][number]) => void;
  onPickGoal: (goal: ReturnType<typeof useAppData>['goals'][number]) => void;
}) {
  const [tab, setTab] = useState<'memories' | 'events' | 'goals'>('memories');

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
        className="bg-card w-full max-w-md mx-auto rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-primary">Compartilhar</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex rounded-2xl bg-muted p-1 gap-1 mb-4">
          {([
            { key: 'memories' as const, label: 'Memórias', icon: BookHeart },
            { key: 'events' as const, label: 'Eventos', icon: CalendarHeart },
            { key: 'goals' as const, label: 'Metas', icon: Target },
          ]).map((option) => (
            <button
              key={option.key}
              onClick={() => setTab(option.key)}
              className={`flex-1 py-2 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 ${
                tab === option.key ? 'bg-card shadow-md text-primary' : 'text-muted-foreground'
              }`}
            >
              <option.icon className="w-3.5 h-3.5" />
              {option.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {tab === 'memories' && (
            memories.length === 0 ? (
              <EmptyPickerState text="Nenhuma memória registrada ainda" />
            ) : (
              memories.map((memory) => (
                <button
                  key={memory.id}
                  onClick={() => onPickMemory(memory)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted transition-colors text-left"
                >
                  {memory.imageUrls?.[0] ? (
                    <img src={memory.imageUrls[0]} alt={memory.title} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
                      {EMOTIONS.find((e) => e.id === memory.emotion)?.emoji ?? '💖'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{memory.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{memory.date}</p>
                  </div>
                </button>
              ))
            )
          )}

          {tab === 'events' && (
            events.length === 0 ? (
              <EmptyPickerState text="Nenhum evento na agenda ainda" />
            ) : (
              events.map((event) => {
                const category = EVENT_CATEGORIES[event.category];
                return (
                  <button
                    key={event.id}
                    onClick={() => onPickEvent(event)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: `${category.color}25` }}>
                      {category.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{event.date}</p>
                    </div>
                  </button>
                );
              })
            )
          )}

          {tab === 'goals' && (
            goals.length === 0 ? (
              <EmptyPickerState text="Nenhuma meta criada ainda" />
            ) : (
              goals.map((goal) => {
                const category = GOAL_CATEGORIES[goal.category];
                return (
                  <button
                    key={goal.id}
                    onClick={() => onPickGoal(goal)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
                      {category.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{goal.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {goal.targetValue ? `${goal.currentValue}/${goal.targetValue}` : goal.currentValue}
                      </p>
                    </div>
                  </button>
                );
              })
            )
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function EmptyPickerState({ text }: { text: string }) {
  return (
    <div className="text-center py-10 text-muted-foreground">
      <Plus className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function MessageActions({
  isMine,
  onReply,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
  onStar,
  onReact,
}: {
  isMine: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onStar: () => void;
  onReact: (emoji: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="rounded-2xl bg-card border border-border shadow-lg p-2"
    >
      <div className="flex gap-1 mb-2">
        {reactionEmojis.map((emoji) => (
          <button key={emoji} onClick={() => onReact(emoji)} className="w-8 h-8 rounded-full hover:bg-muted text-lg">
            {emoji}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1">
        <ActionButton icon={<Reply />} label="Responder" onClick={onReply} />
        <ActionButton icon={<Star />} label="Favoritar" onClick={onStar} />
        {isMine && <ActionButton icon={<Edit3 />} label="Editar" onClick={onEdit} />}
        <ActionButton icon={<Trash2 />} label="Apagar pra mim" onClick={onDeleteForMe} />
        {isMine && <ActionButton icon={<MoreHorizontal />} label="Apagar geral" onClick={onDeleteForEveryone} />}
      </div>
    </motion.div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactElement<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center hover:text-primary transition-colors"
    >
      {React.cloneElement(icon, { className: 'w-4 h-4' })}
    </button>
  );
}

function PreviewBar({
  icon,
  title,
  text,
  onClose,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted px-3 py-2 mb-2 border-l-4 border-primary">
      <div className="text-primary">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-primary">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{text}</p>
      </div>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
