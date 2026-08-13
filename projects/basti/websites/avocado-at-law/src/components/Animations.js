import React, { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';

// Auf dem Web kann der "native driver" nicht genutzt werden.
const useNative = Platform.OS !== 'web';

// IdleBounce: lässt sein Kind sanft auf und ab wippen (für Avo).
export function IdleBounce({ children, distance = 8, duration = 1400, style }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, useNativeDriver: useNative }),
        Animated.timing(v, { toValue: 0, duration, useNativeDriver: useNative }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration]);

  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });
  return <Animated.View style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>;
}

// PopIn: lässt sein Kind kurz "hineinploppen" (für Feedback-Karten).
export function PopIn({ children, style }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 6, tension: 90, useNativeDriver: useNative }).start();
  }, [v]);

  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}
