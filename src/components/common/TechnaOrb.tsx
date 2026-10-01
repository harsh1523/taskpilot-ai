import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform, Image } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { playSpinnerTickSound } from '../../services/soundEffects';

interface TechnaOrbProps {
  isListening: boolean;
  onPress: () => void;
  size?: number;
  variant?: 'full' | 'face';
}

export const TechnaOrb: React.FC<TechnaOrbProps> = ({
  isListening,
  onPress,
  size = 120,
  variant = 'full',
}) => {
  // Shared Floating Physics
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const ripple2Anim = useRef(new Animated.Value(0)).current;
  const sparklePulse = useRef(new Animated.Value(0)).current;

  // Face Variant: Natural Eye Blinking Animation
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (isListening && variant === 'full') {
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

    // 6. Natural Lifelike Blinking Loop for Robot Face
    const runBlinkSequence = () => {
      const isDouble = Math.random() > 0.65;
      Animated.sequence([
        // Close eyelids
        Animated.timing(blinkAnim, {
          toValue: 0.08,
          duration: 80,
          useNativeDriver: true,
        }),
        // Reopen
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
        }),
        ...(isDouble
          ? [
              Animated.delay(90),
              Animated.timing(blinkAnim, {
                toValue: 0.08,
                duration: 75,
                useNativeDriver: true,
              }),
              Animated.timing(blinkAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
            ]
          : []),
      ]).start(() => {
        // Random organic delay between 2.2s and 4.8s
        const nextDelay = 2200 + Math.random() * 2600;
        blinkTimer.current = setTimeout(runBlinkSequence, nextDelay);
      });
    };

    // Kick off blinking loop
    blinkTimer.current = setTimeout(runBlinkSequence, 1500);

    return () => {
      hoverLoop.stop();
      tiltLoop.stop();
      glowLoop.stop();
      sparkleLoop.stop();
      if (rippleLoop) rippleLoop.stop();
      if (ripple2Loop) ripple2Loop.stop();
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
    };
  }, [isListening, variant]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    playSpinnerTickSound(isListening ? 700 : 980);
    onPress();
  };

  // Organic Motion Physics
  const translateY = hoverAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: variant === 'face' ? [-2.5, 2.5] : isListening ? [-11, 11] : [-7, 7],
  });

  const rotate = tiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: variant === 'face' ? ['-2deg', '2deg'] : isListening ? ['-4.5deg', '4.5deg'] : ['-3deg', '3deg'],
  });

  const scaleX = hoverAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: isListening ? [0.96, 1, 1.045] : [0.98, 1, 1.025],
  });

  const scaleY = hoverAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: isListening ? [1.04, 1, 0.96] : [1.02, 1, 0.98],
  });

  // ==========================================
  // VARIANT: FACE (Floating Button Next to Create Task)
  // ==========================================
  if (variant === 'face') {
    const headWidth = size * 0.94;
    const headHeight = headWidth * 0.75; // aspect ratio 260x195

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.88}
        accessibilityLabel="Talk with Techna"
        style={[
          styles.faceButtonContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {/* Soft Ambient Radial Violet Glow Behind Head */}
        <View
          style={[
            styles.faceGlowHalo,
            {
              width: size * 1.15,
              height: size * 1.15,
              borderRadius: (size * 1.15) / 2,
            },
          ]}
          pointerEvents="none"
        />

        {/* Floating Head with Animated Blinking Eyes */}
        <Animated.View
          style={[
            styles.faceWrapper,
            {
              width: headWidth,
              height: headHeight,
              transform: [{ translateY }, { rotate }],
            },
          ]}
        >
          {/* Base Head: Glossy White Helmet with Dark Visor & Original Glowing Smile */}
          <Image
            source={require('../../../assets/techna_robot_head_base.png')}
            style={{ width: headWidth, height: headHeight }}
            resizeMode="contain"
          />

          {/* SVG Animated Glowing Purple Blinking Eyes Overlay */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
            pointerEvents="none"
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  transform: [{ scaleY: blinkAnim }],
                  // scale from eye vertical center
                },
              ]}
            >
              <Svg width={headWidth} height={headHeight} viewBox="0 0 260 195">
                <Defs>
                  <RadialGradient id="eyeGlowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <Stop offset="35%" stopColor="#F0ABFC" stopOpacity="0.95" />
                    <Stop offset="70%" stopColor="#C084FC" stopOpacity="0.9" />
                    <Stop offset="100%" stopColor="#9333EA" stopOpacity="0.6" />
                  </RadialGradient>
                </Defs>

                {/* Left Glowing Eye Arch (Arch when open, flattens to sleek eyelid line when blinking) */}
                <Path
                  d="M 68,84 C 73,69 86,69 96,84"
                  stroke="url(#eyeGlowGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M 68,84 C 73,69 86,69 96,84"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Right Glowing Eye Arch */}
                <Path
                  d="M 141,84 C 151,69 164,69 169,84"
                  stroke="url(#eyeGlowGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M 141,84 C 151,69 164,69 169,84"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </Animated.View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // ==========================================
  // VARIANT: FULL (Full 3D Companion Robot in Modal)
  // ==========================================
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

  // Face Button Variant Styles
  faceButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 18, 42, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(192, 132, 252, 0.42)',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
    position: 'relative',
    overflow: 'visible',
  },
  faceGlowHalo: {
    position: 'absolute',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    zIndex: 0,
  },
  faceWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    position: 'relative',
  },
});
