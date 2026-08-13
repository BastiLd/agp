import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// Ein Antwort-Knopf im Quiz.
// "state" steuert die Farbe: 'idle' (normal), 'correct' (grün), 'wrong' (rot).
// "index" bestimmt den Buchstaben im Badge (0 = A, 1 = B, ...).
export default function AnswerButton({ label, index = 0, onPress, state = 'idle', disabled = false }) {
  let bg = colors.card;
  let border = colors.border;
  let txt = colors.text;

  if (state === 'correct') {
    bg = colors.correctBg;
    border = colors.correct;
    txt = colors.correct;
  } else if (state === 'wrong') {
    bg = colors.wrongBg;
    border = colors.wrong;
    txt = colors.wrong;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: border },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={[styles.badge, { borderColor: border }]}>
        <Text style={[styles.badgeText, { color: txt }]}>{LETTERS[index] ?? '?'}</Text>
      </View>
      <Text style={[styles.label, { color: txt }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginVertical: 6,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }],
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  label: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
});
