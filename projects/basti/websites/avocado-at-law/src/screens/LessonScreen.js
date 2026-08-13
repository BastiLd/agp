import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnswerButton from '../components/AnswerButton';
import ProgressBar from '../components/ProgressBar';
import Avo from '../components/Avo';
import SpeechBubble from '../components/SpeechBubble';
import { IdleBounce, PopIn } from '../components/Animations';
import { colors } from '../theme/colors';

const XP_PER_CORRECT = 10;

// Quiz-Bildschirm: geht Schritt für Schritt durch eine Lektion.
// Es gibt Lern-Karten (Avo erklärt) und Quizfragen.
export default function LessonScreen({ lesson, onFinish, onExit }) {
  const steps = lesson.steps;
  const total = steps.length;

  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState(null); // gewählte Antwort (null = noch keine)
  const [earnedXp, setEarnedXp] = useState(0);
  const [finished, setFinished] = useState(false);

  const step = steps[stepIndex];
  const answered = selected !== null;
  const isCorrect = answered && step.type === 'question' && selected === step.correctIndex;

  function choose(i) {
    if (answered) return;
    setSelected(i);
    if (i === step.correctIndex) setEarnedXp((xp) => xp + XP_PER_CORRECT);
  }

  function goNext() {
    if (stepIndex + 1 < total) {
      setStepIndex(stepIndex + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  }

  function answerState(i) {
    if (!answered) return 'idle';
    if (i === step.correctIndex) return 'correct';
    if (i === selected) return 'wrong';
    return 'idle';
  }

  // ---- Abschluss-Bildschirm ----
  if (finished) {
    const questionCount = steps.filter((s) => s.type === 'question').length;
    const correct = earnedXp / XP_PER_CORRECT;
    return (
      <View style={styles.resultContainer}>
        <IdleBounce>
          <Avo size={160} mood="happy" />
        </IdleBounce>
        <Text style={styles.resultTitle}>Lektion geschafft! 🎉</Text>
        <Text style={styles.resultSub}>
          Du hast {correct} von {questionCount} Fragen richtig.
        </Text>
        <View style={styles.xpPill}>
          <Ionicons name="star" size={20} color={colors.accent} />
          <Text style={styles.xpPillText}>+{earnedXp} XP</Text>
        </View>
        <Pressable
          onPress={() => onFinish(earnedXp)}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>Zurück zum Lernpfad</Text>
        </Pressable>
        <Text style={styles.disclaimer}>⚖️ Demo – keine Rechtsberatung</Text>
      </View>
    );
  }

  const progress = (stepIndex + (answered || step.type === 'info' ? 1 : 0)) / total;
  const showFooter = step.type === 'info' || answered;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onExit} hitSlop={10}>
          <Ionicons name="close" size={28} color={colors.textMuted} />
        </Pressable>
        <View style={styles.progressWrap}>
          <ProgressBar progress={progress} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {step.type === 'info' ? (
          // ----- Lern-Karte: Avo bringt etwas bei -----
          <View style={styles.infoWrap}>
            <View style={styles.avoRow}>
              <Avo size={96} mood="happy" />
              <SpeechBubble>{step.text}</SpeechBubble>
            </View>
          </View>
        ) : (
          // ----- Quizfrage -----
          <View>
            <Text style={styles.counter}>QUIZ</Text>
            <Text style={styles.question}>{step.question}</Text>

            {step.options.map((opt, i) => (
              <AnswerButton
                key={i}
                index={i}
                label={opt}
                state={answerState(i)}
                disabled={answered}
                onPress={() => choose(i)}
              />
            ))}

            {answered && (
              <PopIn
                style={[
                  styles.feedbackCard,
                  { backgroundColor: isCorrect ? colors.correctBg : colors.wrongBg },
                ]}
              >
                <View style={styles.feedbackRow}>
                  <Avo size={64} mood={isCorrect ? 'happy' : 'sad'} />
                  <View style={styles.feedbackTextWrap}>
                    <Text
                      style={[
                        styles.feedbackTitle,
                        { color: isCorrect ? colors.correct : colors.wrong },
                      ]}
                    >
                      {isCorrect ? `Richtig! +${XP_PER_CORRECT} XP` : 'Nicht ganz …'}
                    </Text>
                    <Text style={styles.feedbackText}>{step.explanation}</Text>
                  </View>
                </View>

                {step.lawyerMode && (
                  <View style={styles.lawyerCard}>
                    <Text style={styles.lawyerTitle}>👔 Avo im Anwalts-Modus</Text>
                    <Text style={styles.lawyerCasual}>„{step.lawyerMode.casual}"</Text>
                    <Text style={styles.lawyerFormal}>Juristisch: {step.lawyerMode.formal}</Text>
                  </View>
                )}
              </PopIn>
            )}
          </View>
        )}
      </ScrollView>

      {showFooter && (
        <View style={styles.footer}>
          <Pressable
            onPress={goNext}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaText}>
              {step.type === 'info'
                ? 'Verstanden!'
                : stepIndex + 1 < total
                ? 'Weiter'
                : 'Lektion abschließen'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  progressWrap: {
    flex: 1,
    marginLeft: 14,
  },
  body: {
    padding: 20,
    paddingBottom: 24,
  },
  infoWrap: {
    marginTop: 24,
  },
  avoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  counter: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  question: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 18,
    lineHeight: 28,
  },
  feedbackCard: {
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 21,
  },
  lawyerCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 14,
  },
  lawyerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 6,
  },
  lawyerCasual: {
    fontSize: 15,
    fontStyle: 'italic',
    color: colors.text,
    marginBottom: 4,
  },
  lawyerFormal: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cta: {
    backgroundColor: colors.primary,
    borderBottomColor: colors.primaryDark,
    borderBottomWidth: 5,
    borderRadius: 18,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  ctaPressed: {
    transform: [{ translateY: 2 }],
    borderBottomWidth: 3,
  },
  ctaText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Abschluss-Bildschirm
  resultContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 16,
    textAlign: 'center',
  },
  resultSub: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 18,
    marginBottom: 28,
  },
  xpPillText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  disclaimer: {
    marginTop: 18,
    fontSize: 13,
    color: colors.textMuted,
  },
});
