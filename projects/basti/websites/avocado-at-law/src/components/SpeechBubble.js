import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

// Eine Sprechblase wie bei Duolingo. Sie steht rechts neben Avo;
// der kleine Pfeil links zeigt auf Avo.
export default function SpeechBubble({ children }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.tail} />
      <View style={styles.bubble}>
        <Text style={styles.text}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tail: {
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderRightWidth: 13,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.card,
    marginTop: 22,
  },
  bubble: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 23,
    fontWeight: '600',
  },
});
