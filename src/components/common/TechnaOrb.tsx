import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform, Image, Easing } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse, Path, Rect, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { playSpinnerTickSound } from '../../services/soundEffects';

export type RobotFaceMode = 'idle' | 'waves' | 'done';

const DONE_PIXELS: Record<string, string[]> = {
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
};

const RobotFaceDone: React.FC<{ size: number }> = React.memo(({ size }) => {
  const popAnim = useRef(new Animated.Value(0.35)).current;
  const glowAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.spring(popAnim, {
      toValue: 1,
      friction: 5,
      tension: 115,
      useNativeDriver: true,
    }).start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.15,
          duration: 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.85,
          duration: 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, []);

  const word = ['D', 'O', 'N', 'E'];
  const scale = size / 180;
  const pxSize = 1.6 * scale;
  const pxGap = 0.5 * scale;
  const charW = 5 * pxSize + 4 * pxGap;
  const charSpacing = 2.4 * scale;
  const totalW = 4 * charW + 3 * charSpacing;
  const totalH = 7 * pxSize + 6 * pxGap;
  const vw = (142 / 368) * size;
  const vh = (101 / 368) * size;
  const startX = (vw - totalW) / 2;
  const startY = (vh - totalH) / 2;

  const emerald = '#34D399';

  return (
    <Animated.View
      style={[
        styles.faceDoneContainer,
        {
          transform: [{ scale: popAnim }],
          opacity: glowAnim,
        },
      ]}
    >
      <Svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`}>
        <Defs>
          <RadialGradient id="doneVisorAura" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
            <Stop offset="65%" stopColor="#34D399" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={vw / 2} cy={vh / 2} rx={vw * 0.42} ry={vh * 0.38} fill="url(#doneVisorAura)" />
        {word.map((ch, chIdx) => {
          const matrix = DONE_PIXELS[ch];
          const cx = startX + chIdx * (charW + charSpacing);
          return (
            <G key={`done-ch-${chIdx}`}>
              {matrix.map((row, r) => {
                const py = startY + r * (pxSize + pxGap);
                return row.split('').map((bit, c) => {
                  if (bit !== '1') return null;
                  const px = cx + c * (pxSize + pxGap);
                  return (
                    <G key={`px-${chIdx}-${r}-${c}`}>
                      <Rect
                        x={px - 0.8}
                        y={py - 0.8}
                        width={pxSize + 1.6}
                        height={pxSize + 1.6}
                        rx={0.6}
                        fill={emerald}
                        opacity={0.35}
                      />
                      <Rect
                        x={px}
                        y={py}
                        width={pxSize}
                        height={pxSize}
                        rx={0.4}
                        fill={emerald}
                      />
                      <Rect
                        x={px + 0.4}
                        y={py + 0.4}
                        width={pxSize - 0.8}
                        height={pxSize - 0.8}
                        rx={0.2}
                        fill="#FFFFFF"
                        opacity={0.96}
                      />
                    </G>
                  );
                });
              })}
            </G>
          );
        })}
      </Svg>
    </Animated.View>
  );
});

const RobotFaceWaves: React.FC<{ size: number; color?: string }> = React.memo(({ size, color = '#38BDF8' }) => {
  const bars = useRef([0, 1, 2, 3, 4, 5, 6].map(() => new Animated.Value(0.2))).current;

  useEffect(() => {
    const configs = [
      { min: 0.25, max: 0.65, dur: 360 },
      { min: 0.3, max: 0.85, dur: 300 },
      { min: 0.35, max: 1.15, dur: 260 },
      { min: 0.4, max: 1.35, dur: 230 },
      { min: 0.35, max: 1.15, dur: 280 },
      { min: 0.3, max: 0.85, dur: 320 },
      { min: 0.25, max: 0.65, dur: 370 },
    ];

    const loops = bars.map((b, i) => {
      const c = configs[i];
      return Animated.loop(
        Animated.sequence([
          Animated.timing(b, {
            toValue: c.max,
            duration: c.dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(b, {
            toValue: c.min,
            duration: c.dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    });

    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);

  const scale = size / 180;
  const barW = Math.max(2.6, 3.2 * scale);
  const barGap = Math.max(2.2, 3.2 * scale);
  const baseHeight = 22 * scale;

  return (
    <View style={styles.faceWaveContainer}>
      {bars.map((barAnim, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.faceWaveBar,
            {
              width: barW,
              height: baseHeight,
              marginHorizontal: barGap / 2,
              borderRadius: barW / 2,
              backgroundColor: color,
              transform: [{ scaleY: barAnim }],
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.95,
              shadowRadius: 5,
            },
          ]}
        >
          <View
            style={{
              width: Math.max(1.2, barW - 1.4),
              height: '75%',
              backgroundColor: '#FFFFFF',
              borderRadius: barW / 4,
              opacity: 0.95,
            }}
          />
        </Animated.View>
      ))}
    </View>
  );
});

interface TechnaOrbProps {
  isListening: boolean;
  onPress: () => void;
  size?: number;
  variant?: 'full' | 'face';
  faceMode?: RobotFaceMode;
}

export const TechnaOrb: React.FC<TechnaOrbProps> = ({
  isListening,
  onPress,
  size = 120,
  variant = 'full',
  faceMode,
}) => {
  const activeFaceMode: RobotFaceMode = faceMode !== undefined ? faceMode : isListening ? 'waves' : 'idle';
  // Harmonic Floating Physics
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const tapScale = useRef(new Animated.Value(1)).current;

  // Stardust Floating Sparkles
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

  // Concentric Audio Ripples
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const ripple2Anim = useRef(new Animated.Value(0)).current;

  // Natural Eye Blinking
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 1. Organic Weightless Floating Levitation (Harmonic Sine Physics)
    const hoverLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverAnim, {
          toValue: 1,
          duration: isListening ? 850 : 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: -1,
          duration: isListening ? 850 : 1800,
          easing: Easing.inOut(Easing.sin),
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
          duration: isListening ? 950 : 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: -1,
          duration: isListening ? 950 : 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    tiltLoop.start();

    // 3. Ground Thruster Glow Breathing
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.28,
          duration: isListening ? 850 : 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.82,
          duration: isListening ? 850 : 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    // 4. Cheerful Waving Hand Gesture (Full 3D Robot)
    let waveLoop: Animated.CompositeAnimation | null = null;
    if (variant === 'full') {
      waveLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: isListening ? 220 : 340,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: -1,
            duration: isListening ? 220 : 340,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      waveLoop.start();
    }

    // 5. Stardust Sparkles Floating in 3D Space
    const s1Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle1, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sparkle1, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(600),
      ])
    );
    s1Loop.start();

    const s2Loop = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(sparkle2, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sparkle2, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    s2Loop.start();

    const s3Loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(sparkle3, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sparkle3, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    s3Loop.start();

    // 6. Dual Concentric Listening Ripple Rings
    let rippleLoop: Animated.CompositeAnimation | null = null;
    let ripple2Loop: Animated.CompositeAnimation | null = null;
    if (isListening && variant === 'full') {
      rippleAnim.setValue(0);
      ripple2Anim.setValue(0);

      rippleLoop = Animated.loop(
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      );
      rippleLoop.start();

      ripple2Loop = Animated.loop(
        Animated.sequence([
          Animated.delay(550),
          Animated.timing(ripple2Anim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      ripple2Loop.start();
    } else {
      rippleAnim.setValue(0);
      ripple2Anim.setValue(0);
    }

    // 7. Natural Lifelike Blinking Loop for Robot Face
    const runBlinkSequence = () => {
      const isDouble = Math.random() > 0.65;
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.08,
          duration: 75,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 105,
          useNativeDriver: true,
        }),
        ...(isDouble
          ? [
              Animated.delay(90),
              Animated.timing(blinkAnim, {
                toValue: 0.08,
                duration: 70,
                useNativeDriver: true,
              }),
              Animated.timing(blinkAnim, {
                toValue: 1,
                duration: 95,
                useNativeDriver: true,
              }),
            ]
          : []),
      ]).start(() => {
        const nextDelay = 2200 + Math.random() * 2600;
        blinkTimer.current = setTimeout(runBlinkSequence, nextDelay);
      });
    };

    blinkTimer.current = setTimeout(runBlinkSequence, 1500);

    return () => {
      hoverLoop.stop();
      tiltLoop.stop();
      glowLoop.stop();
      if (waveLoop) waveLoop.stop();
      s1Loop.stop();
      s2Loop.stop();
      s3Loop.stop();
      if (rippleLoop) rippleLoop.stop();
      if (ripple2Loop) ripple2Loop.stop();
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
    };
  }, [isListening, variant]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    // Elastic tactile squish & bounce spring on tap
    Animated.sequence([
      Animated.timing(tapScale, {
        toValue: 0.91,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(tapScale, {
        toValue: 1,
        friction: 4,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();

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
    outputRange: isListening ? [0.965, 1, 1.035] : [0.98, 1, 1.025],
  });

  const scaleY = hoverAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: isListening ? [1.035, 1, 0.965] : [1.02, 1, 0.98],
  });

  // ==========================================
  // VARIANT: FACE (Floating Button Next to Create Task)
  // ==========================================
  if (variant === 'face') {
    const headWidth = size * 1.06;
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
          },
        ]}
      >
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
                  d="M 79,84 C 84,69 97,69 107,84"
                  stroke="url(#eyeGlowGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M 79,84 C 84,69 97,69 107,84"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Right Glowing Eye Arch */}
                <Path
                  d="M 152,84 C 162,69 175,69 180,84"
                  stroke="url(#eyeGlowGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M 152,84 C 162,69 175,69 180,84"
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
  const robotHeight = size * (470 / 368);
  const shadowWidth = size * 0.82;
  const shadowHeight = size * 0.32;
  const pivotX = (282 / 368) * size;
  const pivotY = (216 / 470) * robotHeight;

  const armRotate = waveAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: isListening ? ['-14deg', '14deg'] : ['-10deg', '10deg'],
  });

  return (
    <View style={[styles.container, { width: size + 36, height: robotHeight + 36 }]}>
      {/* 1. Concentric Listening Ripple Energy Rings */}
      {isListening && (
        <>
          <Animated.View
            style={[
              styles.rippleRing,
              {
                width: size * 1.3,
                height: size * 1.3,
                borderRadius: (size * 1.3) / 2,
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
                width: size * 1.3,
                height: size * 1.3,
                borderRadius: (size * 1.3) / 2,
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

      {/* 2. Floating 3D Stardust Sparkles */}
      {/* Sparkle 1 (Top Right) */}
      <Animated.View
        style={[
          styles.sparkleItem,
          {
            top: '12%',
            right: '6%',
            opacity: sparkle1.interpolate({
              inputRange: [0, 0.4, 0.8, 1],
              outputRange: [0, 0.95, 0.7, 0],
            }),
            transform: [
              {
                translateY: sparkle1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [6, -18],
                }),
              },
              {
                scale: sparkle1.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.6, 1.25, 0.7],
                }),
              },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Ionicons name="sparkles" size={18} color="#E879F9" />
      </Animated.View>

      {/* Sparkle 2 (Mid Left) */}
      <Animated.View
        style={[
          styles.sparkleItem,
          {
            top: '40%',
            left: '4%',
            opacity: sparkle2.interpolate({
              inputRange: [0, 0.5, 0.85, 1],
              outputRange: [0, 0.88, 0.5, 0],
            }),
            transform: [
              {
                translateY: sparkle2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, -14],
                }),
              },
              {
                scale: sparkle2.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1.1, 0.55],
                }),
              },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Ionicons name="sparkles" size={14} color="#38BDF8" />
      </Animated.View>

      {/* Sparkle 3 (Top Left) */}
      <Animated.View
        style={[
          styles.sparkleItem,
          {
            top: '16%',
            left: '12%',
            opacity: sparkle3.interpolate({
              inputRange: [0, 0.4, 0.8, 1],
              outputRange: [0, 0.9, 0.5, 0],
            }),
            transform: [
              {
                translateY: sparkle3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, -20],
                }),
              },
              {
                scale: sparkle3.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1.15, 0.6],
                }),
              },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Ionicons name="sparkles" size={16} color="#FBBF24" />
      </Animated.View>

      {/* 3. Floating 3D Robot Companion with Waving Arm & Tap Bounce */}
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
              width: size,
              height: robotHeight,
              transform: [
                { translateY },
                { rotate },
                { scaleX },
                { scaleY },
                { scale: tapScale },
              ],
            },
          ]}
        >
          <Image
            source={
              activeFaceMode === 'idle'
                ? require('../../../assets/techna_robot_no_arm.png')
                : require('../../../assets/techna_robot_no_arm_blank_visor.png')
            }
            style={{ width: size, height: robotHeight }}
            resizeMode="contain"
          />
          {/* Pivoting Animated Waving Right Arm */}
          <Animated.View
            style={{
              position: 'absolute',
              left: pivotX,
              top: pivotY,
              width: 0,
              height: 0,
              zIndex: 4,
              transform: [{ rotate: armRotate }],
            }}
          >
            <Image
              source={require('../../../assets/techna_robot_arm.png')}
              style={{
                position: 'absolute',
                left: -pivotX,
                top: -pivotY,
                width: size,
                height: robotHeight,
              }}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Dynamic Visor Display: Waves when listening, DONE when action completes */}
          {activeFaceMode !== 'idle' && (
            <View
              style={[
                styles.fullVisorDisplayContainer,
                {
                  left: (103 / 368) * size,
                  top: (53 / 470) * robotHeight,
                  width: (142 / 368) * size,
                  height: (101 / 470) * robotHeight,
                },
              ]}
              pointerEvents="none"
            >
              {activeFaceMode === 'waves' && <RobotFaceWaves size={size} color="#38BDF8" />}
              {activeFaceMode === 'done' && <RobotFaceDone size={size} />}
            </View>
          )}
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
    position: 'relative',
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
  sparkleItem: {
    position: 'absolute',
    zIndex: 3,
  },

  // Face Button Variant Styles (Clean Floating Character Face without enclosing circle)
  faceButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  faceWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    position: 'relative',
  },
  fullVisorDisplayContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    backgroundColor: 'transparent',
  },
  faceWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  faceWaveBar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceDoneContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
