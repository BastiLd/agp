import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Platform, StatusBar as RNStatusBar, StyleSheet } from 'react-native';

import OnboardingScreen from './src/screens/OnboardingScreen';
import PathScreen from './src/screens/PathScreen';
import LessonScreen from './src/screens/LessonScreen';
import { lessons } from './src/data/lessons';
import { colors } from './src/theme/colors';
import {
  loadProgress,
  saveProgress,
  registerLessonDone,
  effectiveDailyXp,
} from './src/storage';

// Die Schaltzentrale der App.
// Sie lädt den gespeicherten Fortschritt, zeigt beim ersten Mal das Onboarding
// und merkt sich XP, Streak und geschaffte Lektionen.
export default function App() {
  const [progress, setProgress] = useState(null); // null = wird noch geladen
  const [screen, setScreen] = useState('path'); // 'onboarding' | 'path' | 'lesson'
  const [currentLessonId, setCurrentLessonId] = useState(null);

  // Fortschritt beim Start laden
  useEffect(() => {
    let active = true;
    loadProgress().then((p) => {
      if (!active) return;
      setProgress(p);
      setScreen(p.onboardingDone ? 'path' : 'onboarding');
    });
    return () => {
      active = false;
    };
  }, []);

  // Fortschritt setzen UND speichern
  function update(p) {
    setProgress(p);
    saveProgress(p);
  }

  function finishOnboarding({ reason, dailyGoal }) {
    update({ ...progress, onboardingDone: true, reason, dailyGoal });
    setScreen('path');
  }

  function selectLesson(lessonId) {
    if (!lessons[lessonId]) return; // Lektion gibt es noch nicht
    setCurrentLessonId(lessonId);
    setScreen('lesson');
  }

  function finishLesson(earnedXp) {
    update(registerLessonDone(progress, earnedXp, currentLessonId));
    setScreen('path');
  }

  // Solange der Fortschritt lädt: leerer Hintergrund
  if (!progress) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      {screen === 'onboarding' && <OnboardingScreen onDone={finishOnboarding} />}

      {screen === 'path' && (
        <PathScreen
          xp={progress.xp}
          streak={progress.streak}
          dailyXp={effectiveDailyXp(progress)}
          dailyGoal={progress.dailyGoal}
          completedLessons={progress.completedLessons}
          onSelectLesson={selectLesson}
        />
      )}

      {screen === 'lesson' && (
        <LessonScreen
          lesson={lessons[currentLessonId]}
          onFinish={finishLesson}
          onExit={() => setScreen('path')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
});
