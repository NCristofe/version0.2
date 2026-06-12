import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useGamification } from '../context/GamificationContext';
import {
  Check,
  CheckCheck,
  Edit3,
  FileText,
  Image as ImageIcon,
  Mic,
  MoreHorizontal,
  Paperclip,
  Reply,
  Search,
  Send,
  Smile,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from '../components/UserAvatar';

type UserId = 'user1' | 'user2';

interface ChatAttachment {
  id: string;
  type: 'image' | 'audio' | 'file';
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

interface ReplyPreview {
  id: string;
  text: string;
  userId: UserId;
}

interface ChatMessage {
  id: string;
  text: string;
  userId: UserId;
  timestamp: string;
  editedAt?: string;
  deletedForEveryone?: boolean;
  deletedFor?: UserId[];
  reactions?: Record<string, UserId[]>;
  starredBy?: UserId[];
  replyTo?: ReplyPreview;
  attachments?: ChatAttachment[];
}

const STORAGE_KEY = 'messages';
const reactions = ['❤️', '😂', '😍', '🥺', '🔥', '👏'];
const quickMessages = [
  'Te amo ❤️',
  'Você é tudo pra mim',
  'Saudades',
  'Pensando em você',
  'Me liga quando puder',
  'Cheguei bem',
];

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    text: 'Oi meu amor!',
    userId: 'user1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    reactions: { '❤️': ['user2'] },
  },
  {
    id: '2',
    text: 'Oi minha vida! Como você está?',
    userId: 'user2',
    timestamp: new Date(Date.now() - 3500000).toISOString(),
  },
  {
    id: '3',
    text: 'Estou bem! Estava pensando em você',
    userId: 'user1',
    timestamp: new Date(Date.now() - 3400000).toISOString(),
  },
];

function normalizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return initialMessages;

  return raw.map((message: any) => ({
    id: String(message.id ?? Date.now()),
    text: String(message.text ?? ''),
    userId: message.userId === 'user2' ? 'user2' : 'user1',
    timestamp: new Date(message.timestamp ?? Date.now()).toISOString(),
    editedAt: message.editedAt,
    deletedForEveryone: Boolean(message.deletedForEveryone),
    deletedFor: Array.isArray(message.deletedFor) ? message.deletedFor : [],
    reactions: message.reactions ?? {},
    starredBy: Array.isArray(message.starredBy) ? message.starredBy : [],
    replyTo: message.replyTo,
    attachments: Array.isArray(message.attachments) ? message.attachments : [],
  }));
}

function loadMessages() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeMessages(JSON.parse(saved));
  } catch {}
  return initialMessages;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('file-read-error'));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MessagesPage() {
  const { currentUser } = useAuth();
  const { coupleProfile } = useAppData();
  const { incrementStat, unlockAchievement } = useGamification();
  const currentUserId: UserId = currentUser === 'user2' ? 'user2' : 'user1';
  const otherUserId: UserId = currentUserId === 'user1' ? 'user2' : 'user1';

  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyPreview | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const otherProfile = coupleProfile[otherUserId];
  const currentProfile = coupleProfile[currentUserId];

  const visibleMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((message) => {
      if (message.deletedFor?.includes(currentUserId)) return false;
      if (!q) return true;
      const text = message.deletedForEveryone ? '' : message.text.toLowerCase();
      const files = message.attachments?.some((attachment) => attachment.name.toLowerCase().includes(q));
      return text.includes(q) || files;
    });
  }, [messages, search, currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length]);

  const updateMessage = (id: string, updater: (message: ChatMessage) => ChatMessage) => {
    setMessages((current) => current.map((message) => (message.id === id ? updater(message) : message)));
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    if (editingMessageId) {
      updateMessage(editingMessageId, (message) => ({
        ...message,
        text: trimmed,
        editedAt: new Date().toISOString(),
      }));
      setEditingMessageId(null);
      setInput('');
      return;
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      text: trimmed,
      userId: currentUserId,
      timestamp: new Date().toISOString(),
      reactions: {},
      starredBy: [],
      replyTo: replyTo ?? undefined,
      attachments,
    };

    setMessages((current) => [...current, message]);
    setInput('');
    setReplyTo(null);
    setAttachments([]);
    setShowQuickMessages(false);
    incrementStat('messagesSent');
    unlockAchievement('first_message');
  };

  const attachFiles = async (event: React.ChangeEvent<HTMLInputElement>, kind: 'image' | 'file') => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    const picked = files.slice(0, Math.max(0, 8 - attachments.length));
    const nextAttachments = await Promise.all(
      picked.map(async (file) => ({
        id: crypto.randomUUID(),
        type: kind === 'image' && file.type.startsWith('image/') ? 'image' : 'file',
        name: file.name,
        url: await fileToDataUrl(file),
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      } satisfies ChatAttachment)),
    );

    setAttachments((current) => [...current, ...nextAttachments]);
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
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      const file = new File([blob], `audio-${Date.now()}.webm`, { type: blob.type });
      const url = await fileToDataUrl(file);
      setAttachments((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          type: 'audio',
          name: 'Mensagem de voz',
          url,
          mimeType: blob.type,
          size: blob.size,
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

  const reactToMessage = (messageId: string, emoji: string) => {
    updateMessage(messageId, (message) => {
      const nextReactions = { ...(message.reactions ?? {}) };
      Object.keys(nextReactions).forEach((key) => {
        nextReactions[key] = nextReactions[key].filter((id) => id !== currentUserId);
        if (nextReactions[key].length === 0) delete nextReactions[key];
      });

      nextReactions[emoji] = [...(nextReactions[emoji] ?? []), currentUserId];
      return { ...message, reactions: nextReactions };
    });
    setActiveMessageId(null);
  };

  const toggleStar = (messageId: string) => {
    updateMessage(messageId, (message) => {
      const starredBy = message.starredBy ?? [];
      return {
        ...message,
        starredBy: starredBy.includes(currentUserId)
          ? starredBy.filter((id) => id !== currentUserId)
          : [...starredBy, currentUserId],
      };
    });
  };

  const deleteForMe = (messageId: string) => {
    updateMessage(messageId, (message) => ({
      ...message,
      deletedFor: [...new Set([...(message.deletedFor ?? []), currentUserId])],
    }));
    setActiveMessageId(null);
  };

  const deleteForEveryone = (messageId: string) => {
    updateMessage(messageId, (message) => ({
      ...message,
      text: '',
      attachments: [],
      deletedForEveryone: true,
    }));
    setActiveMessageId(null);
  };

  const beginEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setInput(message.text);
    setReplyTo(null);
    setAttachments([]);
    setActiveMessageId(null);
  };

  const beginReply = (message: ChatMessage) => {
    setReplyTo({
      id: message.id,
      text: message.deletedForEveryone ? 'Mensagem apagada' : message.text || message.attachments?.[0]?.name || 'Anexo',
      userId: message.userId,
    });
    setActiveMessageId(null);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-screen flex flex-col max-w-md mx-auto bg-background">
      <div className="bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="p-4 flex items-center gap-3">
          <UserAvatar userId={otherUserId} className="w-12 h-12" fallbackClassName="text-2xl bg-primary/10" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg text-foreground truncate">{otherProfile.name}</h1>
            <p className="text-xs text-muted-foreground">
              {input ? `${currentProfile.name} digitando...` : 'online agora'}
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
            const isCurrentUser = message.userId === currentUserId;
            const isActive = activeMessageId === message.id;
            const isStarred = message.starredBy?.includes(currentUserId);

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                  <UserAvatar userId={message.userId} className="w-8 h-8 shrink-0" fallbackClassName="text-base bg-primary/10" />
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
                        {message.attachments && message.attachments.length > 0 && (
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
                      <span>{formatTime(message.timestamp)}</span>
                      {isCurrentUser && (message.deletedForEveryone ? <Check size={13} /> : <CheckCheck size={13} />)}
                    </div>
                  </button>

                  {message.reactions && Object.keys(message.reactions).length > 0 && (
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
                        onDeleteForMe={() => deleteForMe(message.id)}
                        onDeleteForEveryone={() => deleteForEveryone(message.id)}
                        onStar={() => toggleStar(message.id)}
                        onReact={(emoji) => reactToMessage(message.id, emoji)}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {isCurrentUser && (
                  <UserAvatar userId={message.userId} className="w-8 h-8 shrink-0" fallbackClassName="text-base bg-primary/10" />
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
                    onClick={() => sendMessage(message)}
                    className="px-4 py-2 rounded-full bg-primary/10 text-primary whitespace-nowrap text-sm"
                  >
                    {message}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {(replyTo || editingMessageId || attachments.length > 0 || isRecording) && (
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
              {attachments.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-muted border border-border">
                      {attachment.type === 'image' ? (
                        <img src={attachment.url} alt={attachment.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground px-2">
                          {attachment.type === 'audio' ? <Mic className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          <span className="text-[10px] truncate max-w-full">{attachment.name}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))}
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

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Mensagem"
            rows={1}
            className="flex-1 max-h-28 min-h-11 px-4 py-3 bg-muted rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          {input.trim() || attachments.length > 0 || editingMessageId ? (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => sendMessage(input)}
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
            onChange={(event) => attachFiles(event, 'image')}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => attachFiles(event, 'file')}
          />
        </div>
      </div>
    </div>
  );
}

function AttachmentView({ attachment }: { attachment: ChatAttachment }) {
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
        {reactions.map((emoji) => (
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

function ActionButton({ icon, label, onClick }: { icon: React.ReactElement; label: string; onClick: () => void }) {
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
