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
  const glowAnim = useRef(new Animated.Value(0.45)).current;
  const swayLeft = useRef(new Animated.Value(0)).current;
  const swayRight = useRef(new Animated.Value(0)).current;
  const swayCenter = useRef(new Animated.Value(0)).current;
  const corePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Organic Wave Sway (Left Cyan Ribbon)
    const leftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(swayLeft, {
          toValue: 1,
          duration: isListening ? 620 : 1500,
          useNativeDriver: true,
        }),
        Animated.timing(swayLeft, {
          toValue: -1,
          duration: isListening ? 620 : 1500,
          useNativeDriver: true,
        }),
      ])
    );
    leftLoop.start();

    // 2. Counter-phase Wave Sway (Right Magenta Ribbon)
    const rightLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(swayRight, {
          toValue: -1,
          duration: isListening ? 720 : 1700,
          useNativeDriver: true,
        }),
        Animated.timing(swayRight, {
          toValue: 1,
          duration: isListening ? 720 : 1700,
          useNativeDriver: true,
        }),
      ])
    );
    rightLoop.start();

    // 3. Center Plumes Rising Flame Breathing
    const centerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(swayCenter, {
          toValue: 1,
          duration: isListening ? 480 : 1100,
          useNativeDriver: true,
        }),
        Animated.timing(swayCenter, {
          toValue: 0,
          duration: isListening ? 480 : 1100,
          useNativeDriver: true,
        }),
      ])
    );
    centerLoop.start();

    // 4. Overall Orb Scale Breathing
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: isListening ? 1.06 : 1.025,
          duration: isListening ? 550 : 1300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: isListening ? 0.97 : 0.985,
          duration: isListening ? 550 : 1300,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 5. Ambient Drop Glow Intensity Breathing
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: isListening ? 0.92 : 0.58,
          duration: isListening ? 550 : 1300,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: isListening ? 0.52 : 0.38,
          duration: isListening ? 550 : 1300,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    // 6. Radiant Core Micro-pulsing
    const coreLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(corePulse, {
          toValue: isListening ? 1.2 : 1.08,
          duration: isListening ? 420 : 1000,
          useNativeDriver: true,
        }),
        Animated.timing(corePulse, {
          toValue: isListening ? 0.88 : 0.96,
          duration: isListening ? 420 : 1000,
          useNativeDriver: true,
        }),
      ])
    );
    coreLoop.start();

    return () => {
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

  // Interpolated Wave Transforms
  const leftRotate = swayLeft.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '8deg'],
  });
  const leftTranslateY = swayLeft.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [2, 0, -2],
  });
  const leftScaleX = swayLeft.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.94, 1, 1.06],
  });

  const rightRotate = swayRight.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['10deg', '0deg', '-8deg'],
  });
  const rightTranslateY = swayRight.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-2, 0, 2],
  });
  const rightScaleX = swayRight.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [1.06, 1, 0.94],
  });

  const centerScale = swayCenter.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.08],
  });
  const centerTranslateY = swayCenter.interpolate({
    inputRange: [0, 1],
    outputRange: [1, -2],
  });

  const auraSize = size + 44;

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
        pointerEvents="none"
      >
        <Svg width={auraSize} height={auraSize} viewBox="0 0 150 150">
          <Defs>
            <RadialGradient id="siriAtmosphere" cx="50%" cy="46%" r="50%">
              <Stop offset="0%" stopColor="#FF1E64" stopOpacity="0.45" />
              <Stop offset="32%" stopColor="#9333EA" stopOpacity="0.32" />
              <Stop offset="68%" stopColor="#00E5FF" stopOpacity="0.22" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="75" cy="75" r="75" fill="url(#siriAtmosphere)" />
        </Svg>
      </Animated.View>

      {/* 2. Tactile Apple Siri Sphere Button */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
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
          {/* Layer 1: Base Spherical Glass Marble Lighting */}
          <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
            <Defs>
              {/* Deep base spherical dark velvet gradient */}
              <RadialGradient id="siriBase" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#150522" />
                <Stop offset="55%" stopColor="#0D0216" />
                <Stop offset="82%" stopColor="#06010B" />
                <Stop offset="100%" stopColor="#020004" />
              </RadialGradient>

              {/* Top-Right Glowing Crimson / Ruby Rim Light (Matching Siri Screenshot) */}
              <RadialGradient id="rubyRim" cx="78%" cy="22%" r="66%">
                <Stop offset="0%" stopColor="#FF185D" stopOpacity="0.95" />
                <Stop offset="26%" stopColor="#E11D48" stopOpacity="0.85" />
                <Stop offset="52%" stopColor="#9F1239" stopOpacity="0.45" />
                <Stop offset="78%" stopColor="#4C0519" stopOpacity="0.15" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </RadialGradient>

              {/* Top-Left Glowing Cyan / Aqua Rim Light (Matching Siri Screenshot) */}
              <RadialGradient id="cyanRim" cx="22%" cy="25%" r="64%">
                <Stop offset="0%" stopColor="#00F5FF" stopOpacity="0.92" />
                <Stop offset="28%" stopColor="#06B6D4" stopOpacity="0.75" />
                <Stop offset="56%" stopColor="#0284C7" stopOpacity="0.35" />
                <Stop offset="80%" stopColor="#0C4A6E" stopOpacity="0.1" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </RadialGradient>

              {/* Bottom Soft Plum Floor */}
              <RadialGradient id="bottomPlum" cx="50%" cy="86%" r="48%">
                <Stop offset="0%" stopColor="#7E22CE" stopOpacity="0.35" />
                <Stop offset="65%" stopColor="#3B0764" stopOpacity="0.15" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </RadialGradient>

              {/* Inner 3D Spherical Edge Shadow (Gives glass marble depth, no hard border) */}
              <RadialGradient id="sphereVignette" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="transparent" stopOpacity="0" />
                <Stop offset="72%" stopColor="transparent" stopOpacity="0" />
                <Stop offset="90%" stopColor="#000000" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
              </RadialGradient>

              {/* Diffuse Inner Cyan Aura behind waves */}
              <RadialGradient id="diffuseCyan" cx="36%" cy="48%" r="40%">
                <Stop offset="0%" stopColor="#00F5FF" stopOpacity="0.32" />
                <Stop offset="60%" stopColor="#0284C7" stopOpacity="0.12" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </RadialGradient>

              {/* Diffuse Inner Magenta Aura behind waves */}
              <RadialGradient id="diffuseMagenta" cx="64%" cy="48%" r="40%">
                <Stop offset="0%" stopColor="#FF185D" stopOpacity="0.36" />
                <Stop offset="60%" stopColor="#BE123C" stopOpacity="0.14" />
                <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Base Velvet Dark Sphere */}
            <Circle cx="50" cy="50" r="50" fill="url(#siriBase)" />

            {/* Top-Right Ruby Crescent Flare */}
            <Circle cx="50" cy="50" r="50" fill="url(#rubyRim)" />

            {/* Top-Left Cyan Crescent Flare */}
            <Circle cx="50" cy="50" r="50" fill="url(#cyanRim)" />

            {/* Bottom Plum Glow */}
            <Circle cx="50" cy="50" r="50" fill="url(#bottomPlum)" />

            {/* Inner Diffuse Color Spills */}
            <Circle cx="50" cy="50" r="50" fill="url(#diffuseCyan)" />
            <Circle cx="50" cy="50" r="50" fill="url(#diffuseMagenta)" />

            {/* 3D Marble Vignette */}
            <Circle cx="50" cy="50" r="50" fill="url(#sphereVignette)" />
          </Svg>

          {/* Layer 2: Iconic Apple Siri Flowing Wave Ribbons */}

          {/* Ribbon Wave A: Left Cyan Fluid Swirl */}
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
                <SvgLinear id="cyanWaveGrad" x1="0%" y1="100%" x2="50%" y2="0%">
                  <Stop offset="0%" stopColor="#00F5FF" stopOpacity="0.15" />
                  <Stop offset="42%" stopColor="#38BDF8" stopOpacity="0.82" />
                  <Stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.95" />
                </SvgLinear>
                <SvgLinear id="cyanInnerGrad" x1="0%" y1="100%" x2="60%" y2="0%">
                  <Stop offset="0%" stopColor="#0284C7" stopOpacity="0.2" />
                  <Stop offset="50%" stopColor="#7DD3FC" stopOpacity="0.88" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.96" />
                </SvgLinear>
              </Defs>
              {/* Outer fluid wave ribbon arching up and left */}
              <Path
                d="M 50,62 C 37,60 23,50 25,37 C 27,25 38,29 44,39 C 47,45 49,54 50,62 Z"
                fill="url(#cyanWaveGrad)"
              />
              {/* Overlapping inner luminous wisp */}
              <Path
                d="M 50,58 C 41,56 31,48 33,38 C 35,30 42,33 46,42 C 48,47 49,53 50,58 Z"
                fill="url(#cyanInnerGrad)"
              />
            </Svg>
          </Animated.View>

          {/* Ribbon Wave B: Right Magenta Fluid Swirl */}
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
                <SvgLinear id="magentaWaveGrad" x1="100%" y1="100%" x2="50%" y2="0%">
                  <Stop offset="0%" stopColor="#E11D48" stopOpacity="0.15" />
                  <Stop offset="42%" stopColor="#FF2A85" stopOpacity="0.86" />
                  <Stop offset="100%" stopColor="#FCE7F3" stopOpacity="0.95" />
                </SvgLinear>
                <SvgLinear id="magentaInnerGrad" x1="100%" y1="100%" x2="40%" y2="0%">
                  <Stop offset="0%" stopColor="#BE123C" stopOpacity="0.2" />
                  <Stop offset="50%" stopColor="#F472B6" stopOpacity="0.88" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.96" />
                </SvgLinear>
              </Defs>
              {/* Outer fluid wave ribbon arching up and right */}
              <Path
                d="M 50,62 C 63,60 77,50 75,37 C 73,25 62,29 56,39 C 53,45 51,54 50,62 Z"
                fill="url(#magentaWaveGrad)"
              />
              {/* Overlapping inner luminous wisp */}
              <Path
                d="M 50,58 C 59,56 69,48 67,38 C 65,30 58,33 54,42 C 52,47 51,53 50,58 Z"
                fill="url(#magentaInnerGrad)"
              />
            </Svg>
          </Animated.View>

          {/* Ribbon Wave C: Center Rising Aurora Flame & Lower Ribbon */}
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
                <SvgLinear id="flameWhiteGrad" x1="50%" y1="100%" x2="50%" y2="0%">
                  <Stop offset="0%" stopColor="#A855F7" stopOpacity="0.25" />
                  <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.96" />
                  <Stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.9" />
                </SvgLinear>
                <SvgLinear id="lowerRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
                  <Stop offset="50%" stopColor="#FF2A85" stopOpacity="0.88" />
                  <Stop offset="100%" stopColor="#FB7185" stopOpacity="0.55" />
                </SvgLinear>
              </Defs>
              {/* Center left wispy plume */}
              <Path
                d="M 49,58 C 43,48 41,32 46,20 C 49,14 52,22 51,34 C 50,44 50,52 49,58 Z"
                fill="url(#flameWhiteGrad)"
              />
              {/* Center right wispy plume */}
              <Path
                d="M 51,58 C 57,48 59,32 54,20 C 51,14 48,22 49,34 C 50,44 50,52 51,58 Z"
                fill="url(#flameWhiteGrad)"
                opacity={0.88}
              />
              {/* Center tall crown wisp */}
              <Path
                d="M 47,48 C 46,36 47,24 50,16 C 53,24 54,36 53,48 Z"
                fill="url(#flameWhiteGrad)"
                opacity={0.75}
              />
              {/* Lower liquid ribbon sweeping horizontally across the base */}
              <Path
                d="M 30,55 C 38,47 46,59 54,51 C 62,43 70,55 70,55 C 64,63 54,59 46,55 C 38,51 34,59 30,55 Z"
                fill="url(#lowerRibbonGrad)"
              />
            </Svg>
          </Animated.View>

          {/* Layer 3: Radiant Apple Siri White Star Core (The glowing heart) */}
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
                {/* Soft wide radiant bloom */}
                <RadialGradient id="siriBloomWide" cx="50%" cy="48%" r="28%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                  <Stop offset="32%" stopColor="#E0F2FE" stopOpacity="0.75" />
                  <Stop offset="62%" stopColor="#F472B6" stopOpacity="0.4" />
                  <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </RadialGradient>
                {/* Blinding white intense star center */}
                <RadialGradient id="siriStarCenter" cx="50%" cy="48%" r="14%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <Stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.92" />
                  <Stop offset="85%" stopColor="#F0F9FF" stopOpacity="0.5" />
                  <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx="50" cy="48" r="26" fill="url(#siriBloomWide)" />
              <Circle cx="50" cy="48" r="14" fill="url(#siriStarCenter)" />
            </Svg>
          </Animated.View>
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
    shadowColor: '#FF1E64',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 14,
  },
  sphereBody: {
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06010B',
  },
});
