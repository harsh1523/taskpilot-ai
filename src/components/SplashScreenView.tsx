import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IsometricCubeIllustration } from './IsometricCubeIllustration';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface SplashScreenViewProps {
  onFinish: () => void;
}

export const SplashScreenView: React.FC<SplashScreenViewProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Sequence: Fade in + Scale in -> Fill progress line -> Fade out exit
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Progress line fill
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: false,
      }),
      // Exit fade out
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: exitAnim }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top ambient warm peach glow matching the app aesthetic */}
      <LinearGradient
        colors={[
          'rgba(248, 168, 120, 0.45)',
          'rgba(217, 126, 78, 0.25)',
          'rgba(140, 68, 36, 0.12)',
          'transparent',
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
        style={styles.ambientGlow}
        pointerEvents="none"
      />

      {/* Center Branded Graphic */}
      <Animated.View
        style={[
          styles.centerContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Signature 3D Isometric Geometric Wireframe Cube */}
        <View style={styles.illustrationWrapper}>
          <IsometricCubeIllustration size={Math.min(width * 0.58, 240)} />
        </View>

        {/* Brand Title */}
        <View style={styles.textContainer}>
          <Text style={styles.brandTitle}>
            TASKPILOT <Text style={styles.brandAccent}>AI</Text>
          </Text>
          <Text style={styles.tagline}>Intelligent Task & Voice Assistant</Text>
        </View>

        {/* Sleek Minimal Progress Line */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </Animated.View>

      {/* Subtle Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>FOCUS • ORGANIZE • ACHIEVE</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D11',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: height * 0.08,
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  brandAccent: {
    fontWeight: '800',
    color: colors.primary,
  },
  tagline: {
    fontSize: 13,
    color: '#8A8A96',
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  progressTrack: {
    width: 140,
    height: 3,
    backgroundColor: '#222228',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#5C5C66',
    letterSpacing: 3,
    fontWeight: '700',
  },
});
