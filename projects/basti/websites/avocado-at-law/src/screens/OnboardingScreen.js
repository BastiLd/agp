import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Avo from '../components/Avo';
import SpeechBubble from '../components/SpeechBubble';
import { IdleBounce } from '../components/Animations';
import { colors } from '../theme/colors';

// Begrüßungs-Flow wie bei Duolingo: Avo redet, stellt 2 kurze Fragen
// (Warum? + Tagesziel) und startet dann die App.
const STEPS = [
  {
    type: 'message',
    mood: 'happy',
    text: 'Hi, ich bin Avo! 🥑 Schön, dass du da bist. Ich helf dir, deine Rechte zu verstehen – easy und Schritt für Schritt.',
  },
  {
    type: 'choice',
    key: 'reason',
    mood: 'normal',
    text: 'Warum willst du das lernen?',
    options: [
      { label: 'Für die Schule', emoji: '📚', value: 'schule' },
      { label: 'Einfach neugierig', emoji: '🤔', value: 'neugier' },
      { label: 'Für den Alltag', emoji: '🛒', value: 'alltag' },
      { label: 'Für meinen ersten Job', emoji: '💼', value: 'job' },
    ],
  },
  {
    type: 'choice',
    key: 'dailyGoal',
    mood: 'normal',
    text: 'Wie viel willst du pro Tag schaffen?',
    options: [
      { label: 'Locker', emoji: '🌱', sub: '10 XP / Tag', value: 10 },
      { label: 'Normal', emoji: '🔥', sub: '20 XP / Tag', value: 20 },
      { label: 'Ehrgeizig', emoji: '🚀', sub: '40 XP / Tag', value: 40 },
    ],
  },
  {
    type: 'message',
    mood: 'happy',
    text: 'Mega! Schon mit ein paar Minuten am Tag wirst du richtig fit in deinen Rechten. 💪',
  },
  {
    type: 'message',
    mood: 'happy',
    text: 'Lass uns mit deiner ersten Lektion starten! 🚀',
    final: true,
  },
];

export default function OnboardingScreen({ onDone }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const step = STEPS[index];
  const selectedValue = step.key ? answers[step.key] : null;
  const canContinue = step.type !== 'choice' || selectedValue !== undefined;

  function select(value) {
    setAnswers((a) => ({ ...a, [step.key]: value }));
  }

  function next() {
    if (index + 1 < STEPS.length) {
      setIndex(index + 1);
    } else {
      onDone({
        reason: answers.reason ?? null,
        dailyGoal: answers.dailyGoal ?? 20,
      });
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.avoRow}>
          <IdleBounce>
            <Avo size={92} mood={step.mood} />
          </IdleBounce>
          <SpeechBubble>{step.text}</SpeechBubble>
        </View>

        {step.type === 'choice' && (
          <View style={styles.options}>
            {step.options.map((opt) => {
              const active = selectedValue === opt.value;
              return (
                <Pressable
                  key={String(opt.value)}
                  onPress={() => select(opt.value)}
                  style={({ pressed }) => [
                    styles.option,
                    active && styles.optionActive,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                      {opt.label}
                    </Text>
                    {opt.sub && <Text style={styles.optionSub}>{opt.sub}</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={next}
          disabled={!canContinue}
          style={({ pressed }) => [
            styles.cta,
            !canContinue && styles.ctaDisabled,
            pressed && canContinue && styles.ctaPressed,
          ]}
        >
          <Text style={styles.ctaText}>{step.final ? "Los geht's" : 'Weiter'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    padding: 20,
    paddingTop: 36,
  },
  avoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  options: {
    marginTop: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: '#EFF7E2',
  },
  optionPressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }],
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 14,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  optionLabelActive: {
    color: colors.primaryDark,
  },
  optionSub: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
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
  ctaDisabled: {
    backgroundColor: colors.locked,
    borderBottomColor: '#AEB6A2',
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
});
