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
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onStart: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStart }) => {
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

      {/* Top warm ambient lighting glow matching screenshot 1 */}
      <LinearGradient
        colors={[
          'rgba(248, 168, 120, 0.38)',
          'rgba(217, 126, 78, 0.22)',
          'rgba(140, 68, 36, 0.10)',
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
          {/* 3D Geometric Isometric Wireframe with Floating Levitation */}
          <Animated.View
            style={[
              styles.illustrationWrapper,
              { transform: [{ translateY: floatAnim }] },
            ]}
          >
            <IsometricCubeIllustration size={Math.min(width * 0.72, 300)} />
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
            <View style={styles.activeBar} />
            <View style={styles.dot} />
          </View>

          {/* Action CTA Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={onStart}
            activeOpacity={0.85}
          >
            <Text style={styles.startButtonText}>Start Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#000000" style={styles.arrowIcon} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D11',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: height * 0.04,
    paddingBottom: height * 0.04,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#E6E6EA',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  boldTitle: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#8A8A93',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 14,
    maxWidth: 300,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6C6C76',
  },
  activeBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 32,
    gap: 10,
    width: '68%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  arrowIcon: {
    marginLeft: 2,
  },
});
