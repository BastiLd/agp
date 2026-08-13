import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LevelCircle from '../components/LevelCircle';
import ProgressBar from '../components/ProgressBar';
import Avo from '../components/Avo';
import SpeechBubble from '../components/SpeechBubble';
import { lessons, pathLevels } from '../data/lessons';
import { colors } from '../theme/colors';

// Der Lernpfad (Home-Bildschirm): Streak, XP, Tagesziel und die Level-Kreise.
export default function PathScreen({
  xp = 0,
  streak = 0,
  dailyXp = 0,
  dailyGoal = 20,
  completedLessons = [],
  onSelectLesson,
}) {
  // Ein Level ist offen, wenn es Inhalte hat UND das vorige Level geschafft ist.
  function isUnlocked(i) {
    const lvl = pathLevels[i];
    if (!lessons[lvl.lessonId]) return false; // noch keine Inhalte -> gesperrt
    if (i === 0) return true;
    return completedLessons.includes(pathLevels[i - 1].lessonId);
  }

  const goalReached = dailyXp >= dailyGoal;
  const goalProgress = dailyGoal > 0 ? dailyXp / dailyGoal : 0;

  return (
    <View style={styles.container}>
      {/* Kopfzeile mit Streak + XP */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lernpfad</Text>
        <View style={styles.stats}>
          <View style={styles.pill}>
            <Ionicons name="flame" size={18} color="#FF8C42" />
            <Text style={styles.pillText}>{streak}</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="star" size={18} color={colors.accent} />
            <Text style={styles.pillText}>{xp}</Text>
          </View>
        </View>
      </View>

      {/* Tagesziel */}
      <View style={styles.goalCard}>
        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>
            {goalReached ? '🎉 Tagesziel erreicht!' : 'Tagesziel'}
          </Text>
          <Text style={styles.goalValue}>
            {dailyXp} / {dailyGoal} XP
          </Text>
        </View>
        <ProgressBar progress={goalProgress} />
      </View>

      <Text style={styles.disclaimer}>⚖️ Demo – keine Rechtsberatung</Text>

      <ScrollView contentContainerStyle={styles.path}>
        <View style={styles.intro}>
          <Avo size={64} mood="normal" />
          <SpeechBubble>Tipp auf den grünen Kreis und leg los! 👇</SpeechBubble>
        </View>

        {pathLevels.map((level, i) => {
          const unlocked = isUnlocked(i);
          const completed = completedLessons.includes(level.lessonId);
          const hasContent = !!lessons[level.lessonId];
          return (
            <View key={level.lessonId} style={styles.levelBlock}>
              {i > 0 && (
                <View style={styles.connector}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              )}
              <LevelCircle
                locked={!unlocked}
                completed={completed}
                onPress={() => onSelectLesson(level.lessonId)}
              />
              <Text style={[styles.levelTitle, !unlocked && styles.levelTitleLocked]}>
                {level.title}
              </Text>
              {!hasContent && <Text style={styles.soon}>bald</Text>}
            </View>
          );
        })}

        <Text style={styles.footerNote}>Mehr Lektionen kommen bald! 🌱</Text>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  stats: {
    flexDirection: 'row',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 8,
  },
  pillText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  goalCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 12,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  disclaimer: {
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  path: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 48,
  },
  intro: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  levelBlock: {
    alignItems: 'center',
  },
  connector: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginVertical: 3,
  },
  levelTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  levelTitleLocked: {
    color: colors.textMuted,
  },
  soon: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerNote: {
    marginTop: 28,
    fontSize: 14,
    color: colors.textMuted,
  },
});
