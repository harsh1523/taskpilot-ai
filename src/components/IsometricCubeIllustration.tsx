import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Platform, Easing } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse, Rect, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

// Authentic 5x7 Retro Arcade Pixel Font for 'HELLO'
const PIXEL_CHARS: Record<string, string[]> = {
  H: [
    '10001',
    '10001',
    '10001',
    '11111',
    '10001',
    '10001',
    '10001',
  ],
  E: [
    '11111',
    '10000',
    '10000',
    '11110',
    '10000',
    '10000',
    '11111',
  ],
  L: [
    '10000',
    '10000',
    '10000',
    '10000',
    '10000',
    '10000',
    '11110',
  ],
  O: [
    '01110',
    '10001',
    '10001',
    '10001',
    '10001',
    '10001',
    '01110',
  ],
};

const WORD = ['H', 'E', 'L', 'L', 'O'];
const PIXEL_SIZE = 3.2;
const PIXEL_GAP = 0.8;
const CHAR_SPACING = 1.6 * (PIXEL_SIZE + PIXEL_GAP); // 6.4
const CHAR_WIDTH = 5 * PIXEL_SIZE + 4 * PIXEL_GAP; // 19.2
const TOTAL_WIDTH = 5 * CHAR_WIDTH + 4 * CHAR_SPACING; // 121.6
const TOTAL_HEIGHT = 7 * PIXEL_SIZE + 6 * PIXEL_GAP; // 27.2
const START_X = (142 - TOTAL_WIDTH) / 2; // 10.2
const START_Y = (101 - TOTAL_HEIGHT) / 2 + 2; // 38.9

/**
 * Retro Arcade / Game Boy style 8-bit pixel font display component
 */
const PixelHelloDisplay: React.FC<{ glowColor: string }> = React.memo(({ glowColor }) => {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 142 101">
      <Defs>
        <RadialGradient id="helloVisorAura" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={glowColor} stopOpacity="0.45" />
          <Stop offset="50%" stopColor={glowColor} stopOpacity="0.14" />
          <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Luminous atmospheric halo behind pixel text */}
      <Ellipse cx={71} cy={START_Y + TOTAL_HEIGHT / 2} rx={62} ry={18} fill="url(#helloVisorAura)" />

      {/* Render 5x7 Arcade Pixel Matrix */}
      {WORD.map((char, charIdx) => {
        const matrix = PIXEL_CHARS[char];
        const charX = START_X + charIdx * (CHAR_WIDTH + CHAR_SPACING);

        return (
          <G key={`char-${charIdx}`}>
            {matrix.map((rowStr, r) => {
              const py = START_Y + r * (PIXEL_SIZE + PIXEL_GAP);

              return rowStr.split('').map((cell, c) => {
                const px = charX + c * (PIXEL_SIZE + PIXEL_GAP);
                const isLit = cell === '1';

                if (!isLit) {
                  return null;
                }

                // Lit Active Pixel with multi-layer neon bloom & white-hot core
                return (
                  <G key={`px-${charIdx}-${r}-${c}`}>
                    {/* Outer neon bloom glow */}
                    <Rect
                      x={px - 1}
                      y={py - 1}
                      width={PIXEL_SIZE + 2}
                      height={PIXEL_SIZE + 2}
                      rx={1}
                      fill={glowColor}
                      opacity={0.36}
                    />
                    {/* Vibrant neon pixel body */}
                    <Rect
                      x={px}
                      y={py}
                      width={PIXEL_SIZE}
                      height={PIXEL_SIZE}
                      rx={0.6}
                      fill={glowColor}
                    />
                    {/* White-hot high-contrast pixel core */}
                    <Rect
                      x={px + 0.65}
                      y={py + 0.65}
                      width={PIXEL_SIZE - 1.3}
                      height={PIXEL_SIZE - 1.3}
                      rx={0.3}
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
  );
});

interface IsometricCubeIllustrationProps {
  size?: number;
  showHelloFace?: boolean;
  enableHandGesture?: boolean;
}

export const IsometricCubeIllustration: React.FC<IsometricCubeIllustrationProps> = ({
  size = 280,
  showHelloFace = false,
  enableHandGesture = false,
}) => {
  const { theme } = useTheme();
  const pixelGlowColor = theme?.primaryLight || '#38BDF8';

  // Animation Values
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const shadowScale = useRef(new Animated.Value(1)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const helloGlowAnim = useRef(new Animated.Value(0.85)).current;
  const helloScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Organic Float Levitation
    const hoverLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverAnim, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: -1,
          duration: 1700,
          useNativeDriver: true,
        }),
      ])
    );
    hoverLoop.start();

    // 2. Playful Zero-G Tilt & Pivot
    const tiltLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, {
          toValue: 1,
          duration: 2100,
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: -1,
          duration: 2100,
          useNativeDriver: true,
        }),
      ])
    );
    tiltLoop.start();

    // 3. Reactive Ground Thruster Breathing (Expands when closer to ground)
    const shadowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shadowScale, {
          toValue: 1.3,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(shadowScale, {
          toValue: 0.8,
          duration: 1700,
          useNativeDriver: true,
        }),
      ])
    );
    // 4. Drifting Magical Floating Sparkles
    const s1Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle1, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(sparkle1, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    s1Loop.start();

    const s2Loop = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(sparkle2, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(sparkle2, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    s2Loop.start();

    const s3Loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(sparkle3, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(sparkle3, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    s3Loop.start();

    // 5. Friendly Hand-Waving Greeting Gesture
    let waveLoop: Animated.CompositeAnimation | null = null;
    if (enableHandGesture) {
      waveLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 250,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: -1,
            duration: 250,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      waveLoop.start();
    }

    // 6. Cyber Face Visor HELLO Pulsing Glow
    let helloGlowLoop: Animated.CompositeAnimation | null = null;
    if (showHelloFace) {
      helloGlowLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(helloGlowAnim, {
              toValue: 1,
              duration: 650,
              useNativeDriver: true,
            }),
            Animated.timing(helloScaleAnim, {
              toValue: 1.04,
              duration: 650,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(helloGlowAnim, {
              toValue: 0.75,
              duration: 650,
              useNativeDriver: true,
            }),
            Animated.timing(helloScaleAnim, {
              toValue: 0.98,
              duration: 650,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      helloGlowLoop.start();
    }

    return () => {
      hoverLoop.stop();
      tiltLoop.stop();
      shadowLoop.stop();
      s1Loop.stop();
      s2Loop.stop();
      s3Loop.stop();
      if (waveLoop) waveLoop.stop();
      if (helloGlowLoop) helloGlowLoop.stop();
    };
  }, [enableHandGesture, showHelloFace]);

  // Organic Physics Transforms
  const translateY = hoverAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-13, 13],
  });

  const rotate = tiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3.8deg', '3.8deg'],
  });

  const armRotate = waveAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  const scaleX = hoverAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.975, 1, 1.028],
  });

  const scaleY = hoverAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1.025, 1, 0.975],
  });

  const robotHeight = size * (470 / 368);
  const shadowWidth = size * 0.82;
  const shadowHeight = size * 0.32;
  const pivotX = (282 / 368) * size;
  const pivotY = (216 / 470) * robotHeight;

  return (
    <View style={[styles.container, { width: size + 36, height: robotHeight + 44 }]}>
      {/* 1. Floating Energy Sparkles */}
      {/* Sparkle 1 (Top Right) */}
      <Animated.View
        style={[
          styles.sparkleItem,
          {
            top: '18%',
            right: '12%',
            opacity: sparkle1.interpolate({
              inputRange: [0, 0.4, 0.8, 1],
              outputRange: [0, 0.95, 0.7, 0],
            }),
            transform: [
              {
                translateY: sparkle1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, -26],
                }),
              },
              {
                scale: sparkle1.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1.2, 0.7],
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
            top: '38%',
            left: '10%',
            opacity: sparkle2.interpolate({
              inputRange: [0, 0.4, 0.8, 1],
              outputRange: [0, 0.9, 0.6, 0],
            }),
            transform: [
              {
                translateY: sparkle2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, -24],
                }),
              },
              {
                scale: sparkle2.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.6, 1.1, 0.5],
                }),
              },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Ionicons name="sparkles" size={14} color="#38BDF8" />
      </Animated.View>

      {/* Sparkle 3 (Lower Right) */}
      <Animated.View
        style={[
          styles.sparkleItem,
          {
            top: '55%',
            right: '8%',
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
        <Ionicons name="sparkles" size={16} color="#C084FC" />
      </Animated.View>

      {/* 3. The 3D Floating Companion Robot Character */}
      <Animated.View
        style={[
          styles.robotWrapper,
          {
            width: size,
            height: robotHeight,
            transform: [{ translateY }, { rotate }, { scaleX }, { scaleY }],
          },
        ]}
      >
        {enableHandGesture ? (
          <>
            <Image
              source={
                showHelloFace
                  ? require('../../assets/techna_robot_no_arm_blank_visor.png')
                  : require('../../assets/techna_robot_no_arm.png')
              }
              style={{ width: size, height: robotHeight }}
              resizeMode="contain"
            />
            {/* Pivoting waving right arm & hand */}
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
                source={require('../../assets/techna_robot_arm.png')}
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
          </>
        ) : (
          <Image
            source={
              showHelloFace
                ? require('../../assets/techna_robot_blank_visor.png')
                : require('../../assets/techna_robot.png')
            }
            style={{ width: size, height: robotHeight }}
            resizeMode="contain"
          />
        )}

        {/* Cyber Visor Screen: displays glowing retro game pixel HELLO seamlessly on visor glass */}
        {showHelloFace && (
          <View
            style={[
              styles.visorContainer,
              {
                left: (103 / 368) * size,
                top: (53 / 470) * robotHeight,
                width: (142 / 368) * size,
                height: (101 / 470) * robotHeight,
              },
            ]}
            pointerEvents="none"
          >
            {/* Glowing animated retro game pixel HELLO display */}
            <Animated.View
              style={[
                styles.visorContent,
                {
                  opacity: helloGlowAnim,
                  transform: [{ scale: helloScaleAnim }],
                },
              ]}
            >
              <PixelHelloDisplay glowColor={pixelGlowColor} />
            </Animated.View>
          </View>
        )}
      </Animated.View>

      {/* 4. Radiant Neon Purple Levitation Thruster Shadow */}
      <Animated.View
        style={[
          styles.groundShadow,
          {
            width: shadowWidth,
            height: shadowHeight,
            bottom: 4,
            transform: [{ scale: shadowScale }],
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={shadowWidth} height={shadowHeight} viewBox="0 0 100 40">
          <Defs>
            <RadialGradient id="robotUnderglow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#C084FC" stopOpacity="0.95" />
              <Stop offset="32%" stopColor="#9333EA" stopOpacity="0.65" />
              <Stop offset="68%" stopColor="#6B21A8" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50" cy="20" rx="48" ry="18" fill="url(#robotUnderglow)" />
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
  },
  robotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  visorContainer: {
    position: 'absolute',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  visorContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groundShadow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sparkleItem: {
    position: 'absolute',
    zIndex: 3,
  },
});
