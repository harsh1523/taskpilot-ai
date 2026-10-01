import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';
import { IsometricCubeIllustration } from './IsometricCubeIllustration';
import { colors, spacing, radius, fontSizes, fontWeights, commonStyles, useTheme } from '../theme';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onStart: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStart }) => {
  const { theme } = useTheme();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top ambient aurora glow matching dynamic theme */}
      <LinearGradient
        colors={[
          theme.primaryGlow,
          theme.accentGlow,
          'transparent',
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.65 }}
        style={styles.ambientGlow}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Main Content */}
        <View style={styles.content}>
          {/* 3D Floating Companion Robot */}
          <Animated.View
            style={[
              styles.illustrationWrapper,
              { transform: [{ translateY: floatAnim }] },
            ]}
          >
            <IsometricCubeIllustration size={Math.min(width * 0.84, 330)} />
          </Animated.View>

          {/* Heading and Subtitle */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              Create <Text style={styles.boldTitle}>Tasks And</Text>
              {'\n'}
              Stay <Text style={styles.boldTitle}>Organized</Text>
            </Text>

            <Text style={styles.subtitle}>
              TaskPilot AI helps you create, organize, and manage your tasks effortlessly
            </Text>
          </View>

          {/* Pagination dots indicator: · | · */}
          <View style={styles.paginationRow}>
            <View style={styles.dot} />
            <View style={[styles.activeBar, { backgroundColor: theme.primary }]} />
            <View style={styles.dot} />
          </View>

          {/* Action CTA Button */}
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
            onPress={onStart}
            activeOpacity={0.85}
          >
            <Text style={styles.startButtonText}>Start Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.arrowIcon} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.flex1,
    backgroundColor: '#07070A',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
  },
  safeArea: {
    ...commonStyles.flex1,
    justifyContent: 'space-between',
  },
  content: {
    ...commonStyles.flex1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: height * 0.04,
    paddingBottom: height * 0.04,
  },
  illustrationWrapper: {
    ...commonStyles.center,
    marginTop: spacing.base,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: fontSizes.headline,
    fontWeight: '300',
    color: '#E6E6EA',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  boldTitle: {
    fontWeight: fontWeights.heavy,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSizes.base,
    color: '#8A8A93',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.xl - 2,
    maxWidth: 300,
  },
  paginationRow: {
    ...commonStyles.rowCenter,
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: radius.xxs,
    backgroundColor: '#6C6C76',
  },
  activeBar: {
    width: 3,
    height: 14,
    borderRadius: radius.xxs,
    backgroundColor: colors.primary,
  },
  startButton: {
    ...commonStyles.rowCenter,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xl,
    paddingHorizontal: 36,
    borderRadius: radius.round + 8,
    gap: spacing.base,
    width: '68%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.subtitle,
    fontWeight: fontWeights.bold,
  },
  arrowIcon: {
    marginLeft: 2,
  },
});
