import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { playSpinnerTickSound } from '../../services/soundEffects';

interface TechnaOrbProps {
  isListening: boolean;
  onPress: () => void;
  size?: number;
}

export const TechnaOrb: React.FC<TechnaOrbProps> = ({
  isListening,
  onPress,
  size = 72,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const wave1 = useRef(new Animated.Value(12)).current;
  const wave2 = useRef(new Animated.Value(24)).current;
  const wave3 = useRef(new Animated.Value(18)).current;
  const wave4 = useRef(new Animated.Value(30)).current;
  const wave5 = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isListening) {
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 0.9, duration: 800, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.35, duration: 800, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(wave1, { toValue: 34, duration: 240, useNativeDriver: false }),
            Animated.timing(wave1, { toValue: 8, duration: 240, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave2, { toValue: 42, duration: 280, useNativeDriver: false }),
            Animated.timing(wave2, { toValue: 12, duration: 280, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave3, { toValue: 36, duration: 220, useNativeDriver: false }),
            Animated.timing(wave3, { toValue: 14, duration: 220, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave4, { toValue: 44, duration: 260, useNativeDriver: false }),
            Animated.timing(wave4, { toValue: 10, duration: 260, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave5, { toValue: 30, duration: 300, useNativeDriver: false }),
            Animated.timing(wave5, { toValue: 12, duration: 300, useNativeDriver: false }),
          ]),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.2);
      wave1.setValue(10);
      wave2.setValue(16);
      wave3.setValue(12);
      wave4.setValue(18);
      wave5.setValue(8);
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isListening]);

  const handlePress = () => {
    playSpinnerTickSound(isListening ? 700 : 1000);
    onPress();
  };

  const auraSize = size + 36;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.auraRing,
          {
            width: auraSize,
            height: auraSize,
            borderRadius: auraSize / 2,
            transform: [{ scale: pulseAnim }],
            opacity: isListening ? glowAnim : 0.2,
          },
        ]}
      />
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.82}
        accessibilityLabel={isListening ? 'Stop listening' : 'Start Techna voice assistant'}
      >
        <LinearGradient
          colors={colors.gradients.technaOrb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.orbCore,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <View style={styles.soundWaveGroup}>
            <Animated.View style={[styles.soundWaveBar, { height: wave1 }]} />
            <Animated.View style={[styles.soundWaveBar, { height: wave2 }]} />
            <Animated.View style={[styles.soundWaveBar, { height: wave3 }]} />
            <Animated.View style={[styles.soundWaveBar, { height: wave4 }]} />
            <Animated.View style={[styles.soundWaveBar, { height: wave5 }]} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  auraRing: {
    position: 'absolute',
    backgroundColor: 'rgba(168, 85, 247, 0.28)',
  },
  orbCore: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
  soundWaveGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 44,
  },
  soundWaveBar: {
    width: 3.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
});
