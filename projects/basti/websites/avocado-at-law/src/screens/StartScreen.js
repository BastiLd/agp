import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Avo from '../components/Avo';
import SpeechBubble from '../components/SpeechBubble';
import { colors } from '../theme/colors';

// Der erste Bildschirm: Begrüßung mit Avo und großem Start-Knopf.
export default function StartScreen({ onStart }) {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>Avocado at Law</Text>
        <Text style={styles.subtitle}>Recht lernen – spielerisch & einfach</Text>
      </View>

      <View style={styles.middle}>
        <Avo size={150} mood="happy" />
        <View style={styles.bubbleWrap}>
          <SpeechBubble>
            Hi, ich bin Avo! 🥑 Ich bring dir deine Rechte bei – ganz einfach und Schritt für Schritt. Keine Sorge, ich erklär dir alles.
          </SpeechBubble>
        </View>
      </View>

      <View style={styles.bottom}>
        <Pressable
          onPress={onStart}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>Los geht's</Text>
        </Pressable>
        <Text style={styles.disclaimer}>⚖️ Demo – keine Rechtsberatung</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'center',
    marginTop: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 6,
  },
  middle: {
    alignItems: 'center',
  },
  bubbleWrap: {
    flexDirection: 'row',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  bottom: {
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 13,
    color: colors.textMuted,
  },
});
