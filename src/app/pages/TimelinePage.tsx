import React from 'react';
import { Calendar, MapPin, Plane, Heart, Coffee, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface Milestone {
  id: string;
  date: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const milestones: Milestone[] = [
  {
    id: '1',
    date: '23 de Agosto, 2025',
    title: 'Primeiro Encontro',
    description: 'O dia em que tudo começou... Nossos olhares se cruzaram e o resto é história 💕',
    icon: Heart,
    color: '#FF6B9D',
  },
  {
    id: '2',
    date: '15 de Setembro, 2025',
    title: 'Nossa Primeira Viagem',
    description: 'Escapada de fim de semana inesquecível. Tantas risadas e momentos especiais! 🗺️',
    icon: Plane,
    color: '#FFB6C1',
  },
  {
    id: '3',
    date: '20 de Outubro, 2025',
    title: 'Jantar Romântico',
    description: 'Uma noite mágica sob as estrelas. Você estava radiante! ✨',
    icon: Star,
    color: '#FFC8DD',
  },
  {
    id: '4',
    date: '5 de Novembro, 2025',
    title: 'Café da Manhã Surpresa',
    description: 'Você me surpreendeu com um café especial. Foi perfeito! ☕',
    icon: Coffee,
    color: '#FFB6C1',
  },
  {
    id: '5',
    date: '25 de Dezembro, 2025',
    title: 'Primeiro Natal Juntos',
    description: 'Celebramos nosso amor e criamos tradições que vamos guardar para sempre 🎄',
    icon: Heart,
    color: '#FF6B9D',
  },
  {
    id: '6',
    date: '1 de Janeiro, 2026',
    title: 'Ano Novo',
    description: 'Começamos um novo ano lado a lado, com muitos sonhos e planos 🎉',
    icon: Star,
    color: '#FFC8DD',
  },
];

export default function TimelinePage() {
  return (
    <div className="min-h-screen p-6 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-primary" />
          <h1 className="text-4xl text-primary">Nossa História</h1>
        </div>
        <p className="text-muted-foreground">Marcos do nosso relacionamento 📅</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent" />

        {/* Milestones */}
        <div className="space-y-8">
          {milestones.map((milestone, index) => {
            const Icon = milestone.icon;

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className="relative pl-20"
              >
                {/* Icon Circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.15 + 0.2, type: 'spring' }}
                  className="absolute left-0 w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-background"
                  style={{ backgroundColor: milestone.color }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </motion.div>

                {/* Content Card */}
                <motion.div
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="bg-card rounded-3xl p-5 shadow-lg border border-border hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin size={16} className="text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{milestone.date}</p>
                  </div>
                  <h3 className="text-xl mb-2" style={{ color: milestone.color }}>
                    {milestone.title}
                  </h3>
                  <p className="text-foreground/80 leading-relaxed">{milestone.description}</p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* End Marker */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: milestones.length * 0.15 + 0.3 }}
          className="relative pl-20 mt-8"
        >
          <div
            className="absolute left-0 w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-background bg-primary"
          >
            <Heart className="w-7 h-7 text-white" fill="currentColor" />
          </div>
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-5 border border-primary/20">
            <p className="text-center text-primary">
              E nossa história continua... 💕
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
