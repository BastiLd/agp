import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Ein runder Level-Kreis im Lernpfad (Duolingo-Stil).
// locked = gesperrt (grau + Schloss), completed = geschafft (Häkchen),
// sonst = offen (Stern).
export default function LevelCircle({ locked = false, completed = false, onPress }) {
  const bg = locked ? colors.locked : colors.primary;
  const shadow = locked ? '#AEB6A2' : colors.primaryDark;

  let icon = 'star';
  if (locked) icon = 'lock-closed';
  else if (completed) icon = 'checkmark';

  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      style={({ pressed }) => [
        styles.circle,
        { backgroundColor: bg, borderColor: shadow },
        pressed && !locked && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={38} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderBottomWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ translateY: 2 }],
    borderBottomWidth: 4,
  },
});
