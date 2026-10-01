import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform, Image } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
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
  size = 120,
}) => {
  // Animation Values
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const ripple2Anim = useRef(new Animated.Value(0)).current;
  const sparklePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Organic Float Levitation
    const hoverLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverAnim, {
          toValue: 1,
          duration: isListening ? 600 : 1500,
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: -1,
          duration: isListening ? 600 : 1500,
          useNativeDriver: true,
        }),
      ])
    );
    hoverLoop.start();

    // 2. Playful Body Tilt & Balance
    const tiltLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, {
          toValue: 1,
          duration: isListening ? 700 : 1900,
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: -1,
          duration: isListening ? 700 : 1900,
          useNativeDriver: true,
        }),
      ])
    );
    tiltLoop.start();

    // 3. Ground Thruster Glow Inverse-Breathing
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.35,
          duration: isListening ? 600 : 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.8,
          duration: isListening ? 600 : 1500,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    // 4. Sparkle Shimmer Loop
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparklePulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(sparklePulse, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    sparkleLoop.start();

    // 5. Dual Concentric Listening Ripple Rings
    let rippleLoop: Animated.CompositeAnimation | null = null;
    let ripple2Loop: Animated.CompositeAnimation | null = null;
    if (isListening) {
      rippleAnim.setValue(0);
      ripple2Anim.setValue(0);

      rippleLoop = Animated.loop(
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        })
      );
      rippleLoop.start();

      ripple2Loop = Animated.loop(
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(ripple2Anim, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: true,
          }),
        ])
      );
      ripple2Loop.start();
    } else {
      rippleAnim.setValue(0);
      ripple2Anim.setValue(0);
    }

    return () => {
      hoverLoop.stop();
      tiltLoop.stop();
      glowLoop.stop();
      sparkleLoop.stop();
      if (rippleLoop) rippleLoop.stop();
      if (ripple2Loop) ripple2Loop.stop();
    };
  }, [isListening]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    playSpinnerTickSound(isListening ? 700 : 1000);
    onPress();
  };

  // Organic Motion Physics
  const translateY = hoverAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: isListening ? [-11, 11] : [-7, 7],
  });

  const rotate = tiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: isListening ? ['-4.5deg', '4.5deg'] : ['-3deg', '3deg'],
  });

  const scaleX = hoverAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: isListening ? [0.96, 1, 1.045] : [0.98, 1, 1.025],
  });

  const scaleY = hoverAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: isListening ? [1.04, 1, 0.96] : [1.02, 1, 0.98],
  });

  const robotHeight = size * 1.28;
  const shadowWidth = size * 0.78;
  const shadowHeight = size * 0.3;

  return (
    <View style={[styles.container, { width: size + 24, height: robotHeight + 28 }]}>
      {/* 1. Concentric Listening Ripple Energy Rings */}
      {isListening && (
        <>
          <Animated.View
            style={[
              styles.rippleRing,
              {
                width: size * 1.25,
                height: size * 1.25,
                borderRadius: (size * 1.25) / 2,
                transform: [
                  {
                    scale: rippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.75, 1.45],
                    }),
                  },
                ],
                opacity: rippleAnim.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0.8, 0.4, 0],
                }),
              },
            ]}
            pointerEvents="none"
          />
          <Animated.View
            style={[
              styles.rippleRing,
              {
                width: size * 1.25,
                height: size * 1.25,
                borderRadius: (size * 1.25) / 2,
                transform: [
                  {
                    scale: ripple2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.75, 1.45],
                    }),
                  },
                ],
                opacity: ripple2Anim.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0.7, 0.35, 0],
                }),
              },
            ]}
            pointerEvents="none"
          />
        </>
      )}

      {/* 2. Floating Magical Sparkle on Top-Right */}
      <Animated.View
        style={[
          styles.sparkleBadge,
          {
            top: size > 80 ? 6 : 0,
            right: size > 80 ? 10 : 2,
            opacity: sparklePulse.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.4, 1, 0.4],
            }),
            transform: [
              {
                scale: sparklePulse.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.85, 1.2, 0.85],
                }),
              },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Ionicons name="sparkles" size={size > 80 ? 16 : 11} color="#E879F9" />
      </Animated.View>

      {/* 3. Floating Robot Companion (Touchable) */}
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
              transform: [{ translateY }, { rotate }, { scaleX }, { scaleY }],
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

      {/* 4. Glowing Neon Purple Levitation Thruster Underglow */}
      <Animated.View
        style={[
          styles.groundShadow,
          {
            width: shadowWidth,
            height: shadowHeight,
            bottom: 2,
            transform: [{ scale: glowScale }],
            opacity: isListening ? 0.98 : 0.74,
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={shadowWidth} height={shadowHeight} viewBox="0 0 100 40">
          <Defs>
            <RadialGradient id="thrusterGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#C084FC" stopOpacity="0.95" />
              <Stop offset="32%" stopColor="#9333EA" stopOpacity="0.65" />
              <Stop offset="68%" stopColor="#6B21A8" stopOpacity="0.25" />
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
  sparkleBadge: {
    position: 'absolute',
    zIndex: 3,
  },
});
