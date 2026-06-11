import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Plus, X, MapPin, Clock, AlignLeft,
} from 'lucide-react';
import {
  useAppData,
  EVENT_CATEGORIES,
  CalendarEvent,
  EventCategory,
} from '../context/AppDataContext';
import { useGamification } from '../context/GamificationContext';

const DAYS_OF_WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const EMPTY_FORM: Omit<CalendarEvent, 'id'> = {
  title: '',
  description: '',
  category: 'encontro',
  date: formatDate(new Date()),
  time: '19:00',
  location: '',
  color: '#FF6B9D',
};

export default function CalendarPage() {
  const { events, addEvent, deleteEvent, getEventsForDate, getUpcomingEvents } = useAppData();
  const { addXP } = useGamification();

  const today = formatDate(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<CalendarEvent, 'id'>>(EMPTY_FORM);
  const [activeFilter, setActiveFilter] = useState<EventCategory | 'todos'>('todos');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const eventDateSet = useMemo(() => {
    return new Set(events.map((e) => e.date));
  }, [events]);

  const selectedEvents = useMemo(() => {
    const list = getEventsForDate(selectedDate);
    if (activeFilter === 'todos') return list;
    return list.filter((e) => e.category === activeFilter);
  }, [selectedDate, getEventsForDate, activeFilter]);

  const upcomingEvents = getUpcomingEvents(5);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const openForm = (date?: string) => {
    setForm({ ...EMPTY_FORM, date: date ?? selectedDate });
    setShowForm(true);
  };

  const submitEvent = () => {
    if (!form.title.trim()) return;
    addEvent({ ...form, color: EVENT_CATEGORIES[form.category].color });
    addXP(30, 'Encontro registrado 📅');
    setShowForm(false);
  };

  return (
    <div className="min-h-screen max-w-md mx-auto pb-28">
      {/* Header */}
      <div className="px-6 pt-10 pb-4">
        <h1 className="text-3xl text-primary mb-1">Calendário</h1>
        <p className="text-muted-foreground text-sm">Datas e eventos de vocês dois 💕</p>
      </div>

      {/* Month Navigation */}
      <div className="px-4 mb-4">
        <div className="bg-card rounded-3xl p-4 shadow-lg border border-border">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h2 className="text-lg text-foreground">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_OF_WEEK.map((d, i) => (
              <div key={i} className="text-center text-xs text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              const hasEvent = eventDateSet.has(dateStr);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : isToday
                      ? 'bg-primary/15 text-primary'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <span>{day}</span>
                  {hasEvent && (
                    <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveFilter('todos')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all ${
              activeFilter === 'todos' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            Todos
          </button>
          {(Object.entries(EVENT_CATEGORIES) as [EventCategory, typeof EVENT_CATEGORIES[EventCategory]][]).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all ${
                activeFilter === key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Date Events */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base text-foreground">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </h3>
          <button
            onClick={() => openForm(selectedDate)}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>

        {selectedEvents.length > 0 ? (
          <div className="space-y-3">
            {selectedEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} onDelete={() => deleteEvent(ev.id)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-sm">Nenhum evento neste dia</p>
            <button
              onClick={() => openForm(selectedDate)}
              className="mt-3 text-primary text-sm"
            >
              + Adicionar evento
            </button>
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="px-4 mb-6">
          <h3 className="text-base text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Próximos Eventos
          </h3>
          <div className="space-y-2">
            {upcomingEvents.map((ev) => {
              const cat = EVENT_CATEGORIES[ev.category];
              const daysUntil = Math.ceil(
                (new Date(ev.date + 'T12:00:00').getTime() - Date.now()) / 86400000
              );
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: cat.color + '25' }}
                  >
                    {cat.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ev.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                      {ev.time && ` • ${ev.time}`}
                    </p>
                  </div>
                  <span className="text-xs text-primary flex-shrink-0">
                    {daysUntil === 0 ? 'Hoje!' : `${daysUntil}d`}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setShowForm(false)}
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
                <h3 className="text-xl text-primary">Novo Evento</h3>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <FormField label="Título">
                  <input
                    className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Nome do evento"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </FormField>

                <FormField label="Categoria">
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(EVENT_CATEGORIES) as [EventCategory, typeof EVENT_CATEGORIES[EventCategory]][]).map(([key, cat]) => (
                      <button
                        key={key}
                        onClick={() => setForm((f) => ({ ...f, category: key, color: cat.color }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all ${
                          form.category === key ? 'bg-primary/15 border border-primary/40' : 'bg-muted'
                        }`}
                      >
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="text-muted-foreground leading-tight text-center" style={{ fontSize: '10px' }}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Data">
                    <input
                      type="date"
                      className="w-full bg-muted rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Horário">
                    <input
                      type="time"
                      className="w-full bg-muted rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      value={form.time}
                      onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    />
                  </FormField>
                </div>

                <FormField label="Local (opcional)">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input
                      className="w-full bg-muted rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Ex: Restaurante, Cinema..."
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    />
                  </div>
                </FormField>

                <FormField label="Descrição (opcional)">
                  <div className="relative">
                    <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <textarea
                      className="w-full bg-muted rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      rows={2}
                      placeholder="Detalhes do evento..."
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                </FormField>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={submitEvent}
                  className="w-full bg-primary text-white py-4 rounded-2xl shadow-lg"
                >
                  Salvar Evento
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EventCard({ event, onDelete }: { event: CalendarEvent; onDelete: () => void }) {
  const [showDelete, setShowDelete] = useState(false);
  const cat = EVENT_CATEGORIES[event.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: cat.color + '25' }}
        >
          {cat.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground mb-0.5">{event.title}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {event.time && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />{event.time}
              </span>
            )}
            {event.location && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />{event.location}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
          )}
        </div>
        <button
          onClick={() => setShowDelete(!showDelete)}
          className="text-muted-foreground/50 hover:text-destructive p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="flex gap-2">
              <button
                onClick={onDelete}
                className="flex-1 py-2 rounded-xl bg-destructive/10 text-destructive text-sm"
              >
                Excluir
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-sm"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
