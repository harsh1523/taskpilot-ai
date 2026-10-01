import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform, Image } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
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
  size = 110,
}) => {
  // Animation Values
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Organic Floating Hover (Levitation)
    const hoverLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverAnim, {
          toValue: 1,
          duration: isListening ? 650 : 1500,
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: -1,
          duration: isListening ? 650 : 1500,
          useNativeDriver: true,
        }),
      ])
    );
    hoverLoop.start();

    // 2. Playful Body Tilt
    const tiltLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, {
          toValue: 1,
          duration: isListening ? 750 : 1800,
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: -1,
          duration: isListening ? 750 : 1800,
          useNativeDriver: true,
        }),
      ])
    );
    tiltLoop.start();

    // 3. Subtle Breathing / Hover Scale
    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: isListening ? 450 : 1200,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: isListening ? 450 : 1200,
          useNativeDriver: true,
        }),
      ])
    );
    waveLoop.start();

    // 4. Ground Thruster Glow Inverse-Breathing
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.25,
          duration: isListening ? 650 : 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.85,
          duration: isListening ? 650 : 1500,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    // 5. Listening Soundwave Ripple Rings
    let rippleLoop: Animated.CompositeAnimation | null = null;
    if (isListening) {
      rippleAnim.setValue(0);
      rippleLoop = Animated.loop(
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      );
      rippleLoop.start();
    } else {
      rippleAnim.setValue(0);
    }

    return () => {
      hoverLoop.stop();
      tiltLoop.stop();
      waveLoop.stop();
      glowLoop.stop();
      if (rippleLoop) rippleLoop.stop();
    };
  }, [isListening]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    playSpinnerTickSound(isListening ? 700 : 1000);
    onPress();
  };

  // Interpolated Motion
  const translateY = hoverAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: isListening ? [-9, 9] : [-6, 6],
  });

  const rotate = tiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3.5deg', '3.5deg'],
  });

  const scale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isListening ? [0.98, 1.05] : [0.99, 1.02],
  });

  const robotHeight = size * 1.26;
  const shadowWidth = size * 0.75;
  const shadowHeight = size * 0.28;

  return (
    <View style={[styles.container, { width: size + 20, height: robotHeight + 24 }]}>
      {/* 1. Concentric Listening Ripple Energy Rings */}
      {isListening && (
        <Animated.View
          style={[
            styles.rippleRing,
            {
              width: size * 1.35,
              height: size * 1.35,
              borderRadius: (size * 1.35) / 2,
              transform: [
                {
                  scale: rippleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.75, 1.45],
                  }),
                },
              ],
              opacity: rippleAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.75, 0.35, 0],
              }),
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* 2. Floating Robot Companion (Touchable) */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.92}
        accessibilityLabel={isListening ? 'Stop listening to Techna' : 'Talk with Techna'}
        style={styles.touchable}
      >
        <Animated.View
          style={[
            styles.robotWrapper,
            {
              transform: [{ translateY }, { rotate }, { scale }],
            },
          ]}
        >
          <Image
            source={require('../../../assets/techna_robot.png')}
            style={{ width: size, height: robotHeight }}
            resizeMode="contain"
          />
        </Animated.View>
      </TouchableOpacity>

      {/* 3. Glowing Neon Purple Levitation / Thruster Underglow */}
      <Animated.View
        style={[
          styles.groundShadow,
          {
            width: shadowWidth,
            height: shadowHeight,
            bottom: 2,
            transform: [{ scale: glowScale }],
            opacity: isListening ? 0.95 : 0.72,
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={shadowWidth} height={shadowHeight} viewBox="0 0 100 40">
          <Defs>
            <RadialGradient id="thrusterGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#C084FC" stopOpacity="0.9" />
              <Stop offset="35%" stopColor="#9333EA" stopOpacity="0.6" />
              <Stop offset="75%" stopColor="#6B21A8" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50" cy="20" rx="48" ry="18" fill="url(#thrusterGlow)" />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  robotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  groundShadow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  rippleRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#C084FC',
    zIndex: 0,
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
  },
});
