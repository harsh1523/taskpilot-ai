import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { playSpinnerTickSound } from '../../services/soundEffects';

interface TechnaOrbProps {
  isListening: boolean;
  onPress: () => void;
  size?: number;
}

export const TechnaOrb: React.FC<TechnaOrbProps> = ({
  isListening,
  onPress,
  size = 96,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const innerScaleAnim = useRef(new Animated.Value(1)).current;

  // Soundwave heights
  const wave1 = useRef(new Animated.Value(8)).current;
  const wave2 = useRef(new Animated.Value(14)).current;
  const wave3 = useRef(new Animated.Value(20)).current;
  const wave4 = useRef(new Animated.Value(14)).current;
  const wave5 = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    // Smooth continuous rotating Siri aura
    const rotationLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: isListening ? 4500 : 9000,
        useNativeDriver: true,
      })
    );
    rotationLoop.start();

    return () => rotationLoop.stop();
  }, [isListening]);

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isListening) {
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.16, duration: 750, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 0.98, duration: 750, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(innerScaleAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
            Animated.timing(innerScaleAnim, { toValue: 0.97, duration: 600, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 0.9, duration: 750, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.35, duration: 750, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(wave1, { toValue: 26, duration: 200, useNativeDriver: false }),
            Animated.timing(wave1, { toValue: 8, duration: 200, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave2, { toValue: 38, duration: 240, useNativeDriver: false }),
            Animated.timing(wave2, { toValue: 12, duration: 240, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave3, { toValue: 46, duration: 210, useNativeDriver: false }),
            Animated.timing(wave3, { toValue: 16, duration: 210, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave4, { toValue: 36, duration: 250, useNativeDriver: false }),
            Animated.timing(wave4, { toValue: 10, duration: 250, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave5, { toValue: 24, duration: 220, useNativeDriver: false }),
            Animated.timing(wave5, { toValue: 8, duration: 220, useNativeDriver: false }),
          ]),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
      innerScaleAnim.setValue(1);
      glowAnim.setValue(0.25);
      wave1.setValue(8);
      wave2.setValue(14);
      wave3.setValue(18);
      wave4.setValue(14);
      wave5.setValue(8);
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isListening]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    playSpinnerTickSound(isListening ? 700 : 1000);
    onPress();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const auraSize = size + 44;
  const haloSize = size + 14;

  return (
    <View style={styles.container}>
      {/* Layer 1: Ambient Siri Glow Field */}
      <Animated.View
        style={[
          styles.auraRing,
          {
            width: auraSize,
            height: auraSize,
            borderRadius: auraSize / 2,
            transform: [{ scale: pulseAnim }],
            opacity: isListening ? glowAnim : 0.35,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(56, 189, 248, 0.45)', 'rgba(236, 72, 153, 0.35)', 'rgba(139, 92, 246, 0.25)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Layer 2: Rotating Siri Multi-Chromatic Halo */}
      <Animated.View
        style={[
          styles.haloRing,
          {
            width: haloSize,
            height: haloSize,
            borderRadius: haloSize / 2,
            transform: [{ rotate: spin }],
            opacity: isListening ? 0.95 : 0.65,
          },
        ]}
      >
        <LinearGradient
          colors={['#00D2FF', '#8B5CF6', '#FF2A85', '#38BDF8', '#7928CA', '#00D2FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.haloGradient}
        />
      </Animated.View>

      {/* Layer 3: Tactile Siri Interactive Glass Core */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityLabel={isListening ? 'Stop listening' : 'Start Techna voice assistant'}
      >
        <Animated.View
          style={[
            styles.orbCoreWrapper,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: innerScaleAnim }],
            },
          ]}
        >
          {/* Rich Radial Siri Gradient */}
          <LinearGradient
            colors={['#1E1638', '#120F24', '#080811']}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.8, y: 0.9 }}
            style={styles.orbCoreGradient}
          >
            {/* Top Gloss Reflection */}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.6 }}
              style={styles.glossHighlight}
            />

            {/* Siri Animated Audio Ribbons */}
            <View style={styles.soundWaveGroup}>
              <Animated.View style={[styles.soundWaveBar, styles.wavePink, { height: wave1 }]} />
              <Animated.View style={[styles.soundWaveBar, styles.waveCyan, { height: wave2 }]} />
              <Animated.View style={[styles.soundWaveBar, styles.waveWhite, { height: wave3 }]} />
              <Animated.View style={[styles.soundWaveBar, styles.waveCyan, { height: wave4 }]} />
              <Animated.View style={[styles.soundWaveBar, styles.waveViolet, { height: wave5 }]} />
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  auraRing: {
    position: 'absolute',
    overflow: 'hidden',
  },
  haloRing: {
    position: 'absolute',
    padding: 2.5,
    overflow: 'hidden',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 8,
  },
  haloGradient: {
    flex: 1,
    borderRadius: 999,
  },
  orbCoreWrapper: {
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  orbCoreGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glossHighlight: {
    position: 'absolute',
    top: 0,
    left: '12%',
    right: '12%',
    height: '42%',
    borderRadius: 999,
  },
  soundWaveGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4.5,
    height: 48,
    zIndex: 2,
  },
  soundWaveBar: {
    width: 3.5,
    borderRadius: 2,
  },
  wavePink: {
    backgroundColor: '#FF2A85',
  },
  waveCyan: {
    backgroundColor: '#38BDF8',
  },
  waveWhite: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  waveViolet: {
    backgroundColor: '#A855F7',
  },
});
