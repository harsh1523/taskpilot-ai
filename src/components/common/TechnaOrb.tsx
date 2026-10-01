import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient as SvgLinear,
  Stop,
  Circle,
  Path,
  G,
  Rect,
} from 'react-native-svg';
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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const swayLeft = useRef(new Animated.Value(0)).current;
  const swayRight = useRef(new Animated.Value(0)).current;
  const swayCenter = useRef(new Animated.Value(0)).current;
  const corePulse = useRef(new Animated.Value(1)).current;
  const sphereRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Subtle Sphere Aura Rotation
    const rotateLoop = Animated.loop(
      Animated.timing(sphereRotate, {
        toValue: 1,
        duration: isListening ? 6000 : 14000,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();

    // 2. Continuous Organic Wave Sway (Left Cyan Petal)
    const leftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(swayLeft, {
          toValue: 1,
          duration: isListening ? 650 : 1600,
          useNativeDriver: true,
        }),
        Animated.timing(swayLeft, {
          toValue: -1,
          duration: isListening ? 650 : 1600,
          useNativeDriver: true,
        }),
      ])
    );
    leftLoop.start();

    // 3. Counter-phase Wave Sway (Right Magenta Petal)
    const rightLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(swayRight, {
          toValue: -1,
          duration: isListening ? 750 : 1800,
          useNativeDriver: true,
        }),
        Animated.timing(swayRight, {
          toValue: 1,
          duration: isListening ? 750 : 1800,
          useNativeDriver: true,
        }),
      ])
    );
    rightLoop.start();

    // 4. Center Flame Breathing
    const centerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(swayCenter, {
          toValue: 1,
          duration: isListening ? 500 : 1200,
          useNativeDriver: true,
        }),
        Animated.timing(swayCenter, {
          toValue: 0,
          duration: isListening ? 500 : 1200,
          useNativeDriver: true,
        }),
      ])
    );
    centerLoop.start();

    // 5. Overall Breathing & Core Radiant Bloom
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: isListening ? 1.08 : 1.03,
          duration: isListening ? 600 : 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: isListening ? 0.96 : 0.98,
          duration: isListening ? 600 : 1400,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: isListening ? 0.95 : 0.6,
          duration: isListening ? 600 : 1400,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: isListening ? 0.5 : 0.35,
          duration: isListening ? 600 : 1400,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    const coreLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(corePulse, {
          toValue: isListening ? 1.25 : 1.1,
          duration: isListening ? 450 : 1100,
          useNativeDriver: true,
        }),
        Animated.timing(corePulse, {
          toValue: isListening ? 0.85 : 0.95,
          duration: isListening ? 450 : 1100,
          useNativeDriver: true,
        }),
      ])
    );
    coreLoop.start();

    return () => {
      rotateLoop.stop();
      leftLoop.stop();
      rightLoop.stop();
      centerLoop.stop();
      pulseLoop.stop();
      glowLoop.stop();
      coreLoop.stop();
    };
  }, [isListening]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    playSpinnerTickSound(isListening ? 700 : 1000);
    onPress();
  };

  // Interpolated Transforms
  const leftRotate = swayLeft.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '10deg'],
  });
  const leftTranslateY = swayLeft.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [2.5, 0, -2.5],
  });
  const leftScaleX = swayLeft.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.92, 1, 1.08],
  });

  const rightRotate = swayRight.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['12deg', '0deg', '-10deg'],
  });
  const rightTranslateY = swayRight.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-2.5, 0, 2.5],
  });
  const rightScaleX = swayRight.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1.08, 1, 0.92],
  });

  const centerScale = swayCenter.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.1],
  });
  const centerTranslateY = swayCenter.interpolate({
    inputRange: [0, 1],
    outputRange: [1, -2],
  });

  const auraSize = size + 40;

  return (
    <View style={styles.container}>
      {/* 1. Ambient Apple Siri Drop Glow Field */}
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            width: auraSize,
            height: auraSize,
            borderRadius: auraSize / 2,
            transform: [{ scale: pulseAnim }],
            opacity: glowAnim,
          },
        ]}
      >
        <Svg width={auraSize} height={auraSize} viewBox="0 0 140 140">
          <Defs>
            <RadialGradient id="siriAtmosphere" cx="50%" cy="45%" r="50%">
              <Stop offset="0%" stopColor="#FF2A85" stopOpacity="0.45" />
              <Stop offset="35%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <Stop offset="70%" stopColor="#00D2FF" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="70" cy="70" r="70" fill="url(#siriAtmosphere)" />
        </Svg>
      </Animated.View>

      {/* 2. Tactile Apple Siri Sphere Button */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.88}
        accessibilityLabel={isListening ? 'Stop listening' : 'Start Techna voice assistant'}
        style={[styles.sphereShadow, { width: size, height: size }]}
      >
        <Animated.View
          style={[
            styles.sphereBody,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {/* Base Sphere SVG: Dark Obsidian base with Ruby-Crimson and Cyan Crescents */}
          <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
            <Defs>
              {/* Deep base spherical dark gradient */}
              <RadialGradient id="siriBase" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#1E0E28" />
                <Stop offset="65%" stopColor="#12061A" />
                <Stop offset="100%" stopColor="#06020A" />
              </RadialGradient>

              {/* Top-Right Glowing Crimson / Ruby Flare */}
              <RadialGradient id="rubyGlow" cx="78%" cy="22%" r="62%">
                <Stop offset="0%" stopColor="#FF2D55" stopOpacity="1" />
                <Stop offset="30%" stopColor="#E11D48" stopOpacity="0.85" />
                <Stop offset="60%" stopColor="#BE123C" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </RadialGradient>

              {/* Top-Left Glowing Cyan / Aqua Flare */}
              <RadialGradient id="cyanGlow" cx="22%" cy="25%" r="58%">
                <Stop offset="0%" stopColor="#00F2FE" stopOpacity="0.95" />
                <Stop offset="35%" stopColor="#06B6D4" stopOpacity="0.75" />
                <Stop offset="65%" stopColor="#0284C7" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </RadialGradient>

              {/* Bottom Soft Violet Sheen */}
              <RadialGradient id="bottomPlum" cx="50%" cy="85%" r="45%">
                <Stop offset="0%" stopColor="#9333EA" stopOpacity="0.45" />
                <Stop offset="60%" stopColor="#4C1D95" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Base Dark Velvet Sphere */}
            <Circle cx="50" cy="50" r="50" fill="url(#siriBase)" />

            {/* Top-Right Ruby Crescent */}
            <Circle cx="50" cy="50" r="50" fill="url(#rubyGlow)" />

            {/* Top-Left Cyan Crescent */}
            <Circle cx="50" cy="50" r="50" fill="url(#cyanGlow)" />

            {/* Bottom Plum Depth */}
            <Circle cx="50" cy="50" r="50" fill="url(#bottomPlum)" />
          </Svg>

          {/* 3. Luminous Fluid Siri Waves (The iconic Siri ribbon brain) */}

          {/* Ribbon Layer A: Left Cyan Glowing Wave Petal */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [
                  { rotate: leftRotate },
                  { translateY: leftTranslateY },
                  { scaleX: leftScaleX },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <Svg width={size} height={size} viewBox="0 0 100 100">
              <Defs>
                <SvgLinear id="cyanWaveGrad" x1="0%" y1="100%" x2="40%" y2="0%">
                  <Stop offset="0%" stopColor="#00F2FE" stopOpacity="0.2" />
                  <Stop offset="45%" stopColor="#38BDF8" stopOpacity="0.85" />
                  <Stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.95" />
                </SvgLinear>
              </Defs>
              {/* Organic fluid cyan wing curving up and left */}
              <Path
                d="M 50,56 C 36,54 22,46 25,32 C 28,19 42,26 46,38 C 48,44 49,50 50,56 Z"
                fill="url(#cyanWaveGrad)"
              />
            </Svg>
          </Animated.View>

          {/* Ribbon Layer B: Right Magenta Glowing Wave Petal */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [
                  { rotate: rightRotate },
                  { translateY: rightTranslateY },
                  { scaleX: rightScaleX },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <Svg width={size} height={size} viewBox="0 0 100 100">
              <Defs>
                <SvgLinear id="magentaWaveGrad" x1="0%" y1="100%" x2="80%" y2="0%">
                  <Stop offset="0%" stopColor="#E11D48" stopOpacity="0.2" />
                  <Stop offset="40%" stopColor="#FF2A85" stopOpacity="0.88" />
                  <Stop offset="100%" stopColor="#FCE7F3" stopOpacity="0.95" />
                </SvgLinear>
              </Defs>
              {/* Organic fluid magenta wing curving up and right */}
              <Path
                d="M 50,56 C 64,54 78,46 75,32 C 72,19 58,26 54,38 C 52,44 51,50 50,56 Z"
                fill="url(#magentaWaveGrad)"
              />
            </Svg>
          </Animated.View>

          {/* Ribbon Layer C: Fluid Center Petal Swirl */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [
                  { scale: centerScale },
                  { translateY: centerTranslateY },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <Svg width={size} height={size} viewBox="0 0 100 100">
              <Defs>
                <SvgLinear id="centerPlumeGrad" x1="50%" y1="100%" x2="50%" y2="0%">
                  <Stop offset="0%" stopColor="#A855F7" stopOpacity="0.3" />
                  <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.95" />
                  <Stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.9" />
                </SvgLinear>
                <SvgLinear id="lowerSwirlGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                  <Stop offset="50%" stopColor="#FF2A85" stopOpacity="0.85" />
                  <Stop offset="100%" stopColor="#FB7185" stopOpacity="0.5" />
                </SvgLinear>
              </Defs>
              {/* Center upright plume */}
              <Path
                d="M 50,55 C 44,48 42,34 46,24 C 50,14 54,26 54,38 C 53,44 52,50 50,55 Z"
                fill="url(#centerPlumeGrad)"
              />
              {/* Center-right plume */}
              <Path
                d="M 50,55 C 55,48 58,34 55,24 C 52,14 48,26 48,38 C 49,44 49,50 50,55 Z"
                fill="url(#centerPlumeGrad)"
                opacity={0.8}
              />
              {/* Lower liquid ribbon sweeping horizontally */}
              <Path
                d="M 28,54 C 38,48 48,60 58,52 C 68,44 75,54 75,54 C 75,54 66,64 54,58 C 42,52 34,62 28,54 Z"
                fill="url(#lowerSwirlGrad)"
              />
            </Svg>
          </Animated.View>

          {/* 4. Brilliant Radiant Core Light (The glowing white Siri heart) */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [{ scale: corePulse }],
              },
            ]}
            pointerEvents="none"
          >
            <Svg width={size} height={size} viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id="siriCoreBloom" cx="50%" cy="48%" r="24%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <Stop offset="40%" stopColor="#E0F2FE" stopOpacity="0.9" />
                  <Stop offset="70%" stopColor="#F472B6" stopOpacity="0.45" />
                  <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx="50" cy="48" r="22" fill="url(#siriCoreBloom)" />
            </Svg>
          </Animated.View>

          {/* 5. Glass Specular Highlight (Spherical curvature reflection) */}
          <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <SvgLinear id="glassHighlight" x1="50%" y1="0%" x2="50%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                <Stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.1" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </SvgLinear>
            </Defs>
            {/* Top curved specular crescent */}
            <Path
              d="M 24,18 C 38,10 62,10 76,18 C 68,22 32,22 24,18 Z"
              fill="url(#glassHighlight)"
            />
          </Svg>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  ambientGlow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphereShadow: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 12,
  },
  sphereBody: {
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
});
