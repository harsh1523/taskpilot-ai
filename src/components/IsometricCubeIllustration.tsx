import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

interface IsometricCubeIllustrationProps {
  size?: number;
}

export const IsometricCubeIllustration: React.FC<IsometricCubeIllustrationProps> = ({
  size = 280,
}) => {
  // Animation Values
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const shadowScale = useRef(new Animated.Value(1)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

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

    return () => {
      hoverLoop.stop();
      tiltLoop.stop();
      shadowLoop.stop();
      s1Loop.stop();
      s2Loop.stop();
      s3Loop.stop();
    };
  }, []);

  // Organic Physics Transforms
  const translateY = hoverAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-13, 13],
  });

  const rotate = tiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3.8deg', '3.8deg'],
  });

  const scaleX = hoverAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.975, 1, 1.028],
  });

  const scaleY = hoverAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1.025, 1, 0.975],
  });

  const robotHeight = size * 1.28;
  const shadowWidth = size * 0.82;
  const shadowHeight = size * 0.32;

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
            transform: [{ translateY }, { rotate }, { scaleX }, { scaleY }],
          },
        ]}
      >
        <Image
          source={require('../../assets/techna_robot.png')}
          style={{ width: size, height: robotHeight }}
          resizeMode="contain"
        />
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
    zIndex: 2,
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
