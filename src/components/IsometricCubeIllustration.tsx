import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';

interface IsometricCubeIllustrationProps {
  size?: number;
}

export const IsometricCubeIllustration: React.FC<IsometricCubeIllustrationProps> = ({
  size = 240,
}) => {
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const shadowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Smooth Floating Hover
    const hoverLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: -1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    hoverLoop.start();

    // 2. Playful Subtle Tilt
    const tiltLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: -1,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    tiltLoop.start();

    // 3. Ground Glow Breathing
    const shadowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shadowScale, {
          toValue: 1.15,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(shadowScale, {
          toValue: 0.88,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    shadowLoop.start();

    return () => {
      hoverLoop.stop();
      tiltLoop.stop();
      shadowLoop.stop();
    };
  }, []);

  const translateY = hoverAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-10, 10],
  });

  const rotate = tiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2.5deg', '2.5deg'],
  });

  const robotHeight = size * 1.26;
  const shadowWidth = size * 0.78;
  const shadowHeight = size * 0.28;

  return (
    <View style={[styles.container, { width: size + 20, height: robotHeight + 36 }]}>
      {/* 3D Floating Companion Robot */}
      <Animated.View
        style={[
          styles.robotWrapper,
          {
            transform: [{ translateY }, { rotate }],
          },
        ]}
      >
        <Image
          source={require('../../assets/techna_robot.png')}
          style={{ width: size, height: robotHeight }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Radiant Purple Levitation Underglow */}
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
              <Stop offset="0%" stopColor="#C084FC" stopOpacity="0.88" />
              <Stop offset="35%" stopColor="#9333EA" stopOpacity="0.58" />
              <Stop offset="70%" stopColor="#6B21A8" stopOpacity="0.22" />
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
});
