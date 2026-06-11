import React, { useState } from 'react';
import { Sparkles, Gift, Heart, Star, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

const quizQuestions: QuizQuestion[] = [
  {
    question: 'Qual foi o dia do nosso primeiro encontro?',
    options: ['20 de Agosto', '23 de Agosto', '25 de Agosto', '30 de Agosto'],
    correctAnswer: 1,
  },
  {
    question: 'Qual é a nossa comida favorita para comer juntos?',
    options: ['Pizza', 'Sushi', 'Massas', 'Hambúrguer'],
    correctAnswer: 0,
  },
  {
    question: 'Onde foi nossa primeira viagem juntos?',
    options: ['Praia', 'Montanha', 'Cidade histórica', 'Campo'],
    correctAnswer: 0,
  },
];

const surprises = [
  { text: 'Você é incrível! ✨', emoji: '💖' },
  { text: 'Te amo mais que tudo! ❤️', emoji: '🥰' },
  { text: 'Você ilumina meus dias! ☀️', emoji: '😊' },
  { text: 'Meu amor por você cresce a cada dia! 📈', emoji: '💕' },
  { text: 'Você é meu tudo! 🌟', emoji: '💝' },
];

export default function ExtrasPage() {
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [surprise, setSurprise] = useState<string | null>(null);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);

    setTimeout(() => {
      if (answerIndex === quizQuestions[currentQuestion].correctAnswer) {
        setScore(score + 1);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setQuizComplete(true);
      }
    }, 1000);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setQuizComplete(false);
    setSelectedAnswer(null);
    setShowQuiz(false);
  };

  const showSurprise = () => {
    const randomSurprise = surprises[Math.floor(Math.random() * surprises.length)];
    setSurprise(randomSurprise.text);

    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#FF6B9D', '#FFB6C1', '#FFC8DD'],
    });

    setTimeout(() => setSurprise(null), 3000);
  };

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-4xl text-primary">Extras</h1>
        </div>
        <p className="text-muted-foreground">Momentos especiais e surpresas 🎉</p>
      </div>

      {/* Main Content */}
      {!showQuiz ? (
        <div className="space-y-4">
          {/* Quiz Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowQuiz(true)}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white p-6 rounded-3xl shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl mb-1">Quiz do Amor</h3>
                <p className="text-sm opacity-90">Teste seus conhecimentos sobre nós!</p>
              </div>
            </div>
          </motion.button>

          {/* Surprise Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={showSurprise}
            className="w-full bg-gradient-to-r from-accent to-secondary text-white p-6 rounded-3xl shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Gift className="w-8 h-8" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl mb-1">Mensagem Surpresa</h3>
                <p className="text-sm opacity-90">Receba uma mensagem especial!</p>
              </div>
            </div>
          </motion.button>

          {/* Fun Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-3xl p-6 shadow-lg border border-border"
          >
            <h3 className="text-xl mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              <span>Estatísticas do Nosso Amor</span>
            </h3>
            <div className="space-y-3">
              <StatItem label="Mensagens trocadas" value="∞" />
              <StatItem label="Sorrisos compartilhados" value="milhões" />
              <StatItem label="Momentos especiais" value="incontáveis" />
              <StatItem label="Nível de amor" value="100%" color="#FF6B9D" />
            </div>
          </motion.div>
        </div>
      ) : (
        <div>
          {!quizComplete ? (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%`,
                    }}
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {currentQuestion + 1}/{quizQuestions.length}
                </span>
              </div>

              {/* Question */}
              <div className="bg-card rounded-3xl p-6 shadow-lg border border-border">
                <h3 className="text-xl mb-6">{quizQuestions[currentQuestion].question}</h3>

                <div className="space-y-3">
                  {quizQuestions[currentQuestion].options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect =
                      selectedAnswer !== null &&
                      index === quizQuestions[currentQuestion].correctAnswer;
                    const isWrong = selectedAnswer !== null && isSelected && !isCorrect;

                    return (
                      <motion.button
                        key={index}
                        whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
                        whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                        onClick={() => selectedAnswer === null && handleAnswerSelect(index)}
                        disabled={selectedAnswer !== null}
                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                          isCorrect
                            ? 'border-green-500 bg-green-50'
                            : isWrong
                            ? 'border-destructive bg-destructive/10'
                            : 'border-border bg-background hover:border-primary'
                        }`}
                      >
                        {option}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="bg-card rounded-3xl p-8 shadow-lg border border-border">
                <Heart className="w-20 h-20 text-primary mx-auto mb-4" fill="currentColor" />
                <h2 className="text-3xl text-primary mb-4">Quiz Completo!</h2>
                <p className="text-4xl mb-2">
                  {score}/{quizQuestions.length}
                </p>
                <p className="text-muted-foreground mb-6">
                  {score === quizQuestions.length
                    ? 'Perfeito! Você me conhece muito bem! 💕'
                    : score >= quizQuestions.length / 2
                    ? 'Muito bom! Estamos cada vez mais conectados! 💖'
                    : 'Precisamos passar mais tempo juntos! 😊'}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetQuiz}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl shadow-lg"
                >
                  Voltar
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Surprise Modal */}
      <AnimatePresence>
        {surprise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="bg-card rounded-3xl p-8 shadow-2xl max-w-sm text-center"
            >
              <Heart className="w-16 h-16 text-primary mx-auto mb-4" fill="currentColor" />
              <p className="text-2xl">{surprise}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatItem({
  label,
  value,
  color = '#4A4A4A',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
