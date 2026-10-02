import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { playSpinnerTickSound } from '../../services/soundEffects';

export type TaskPilotBrandVariant = 'icon' | 'logo' | 'badge';

interface TaskPilotBrandProps {
  variant?: TaskPilotBrandVariant;
  size?: number;
  showGlow?: boolean;
  animated?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const TaskPilotBrand: React.FC<TaskPilotBrandProps> = ({
  variant = 'icon',
  size = 56,
  showGlow = true,
  animated = true,
  onPress,
  style,
}) => {
  const { theme } = useTheme();

  // Animation values
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) return;

    // Organic levitation float
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 5,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    // Ambient glow breathing pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.14,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.94,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Periodic diagonal light shimmer
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1.5,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(3500),
        Animated.timing(shimmerAnim, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
      shimmerLoop.stop();
    };
  }, [animated]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.92,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    playSpinnerTickSound(1100);
    if (onPress) onPress();
  };

  const glowColor = theme.primaryLight || '#38BDF8';
  const glowAura = theme.primaryGlow || 'rgba(56, 189, 248, 0.45)';

  // 1. COMPACT BADGE VARIANT (For Header & Status Bars)
  if (variant === 'badge') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[styles.badgeContainer, style]}
      >
        <Animated.View
          style={[
            styles.badgeContent,
            {
              transform: [{ scale: pressScale }],
              borderColor: `${glowColor}35`,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
          ]}
        >
          {/* Glowing mini icon */}
          <View style={[styles.badgeIconWrapper, { width: size, height: size }]}>
            <Image
              source={require('../../../assets/taskpilot_icon.png')}
              style={{ width: size, height: size, borderRadius: size * 0.24 }}
              resizeMode="contain"
            />
          </View>
          <View style={styles.badgeTextCol}>
            <Text style={styles.badgeTitle}>TaskPilot</Text>
            <Text style={[styles.badgeSubtitle, { color: glowColor }]}>AI</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // 2. LOGO / MASCOT VARIANT (3D Companion Pilot Robot Soaring)
  if (variant === 'logo') {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={!onPress}
        style={[styles.wrapper, style]}
      >
        <Animated.View
          style={[
            styles.centerWrapper,
            {
              transform: [
                { translateY: animated ? floatAnim : 0 },
                { scale: pressScale },
              ],
            },
          ]}
        >
          {/* Ambient Cyber Backglow Aura */}
          {showGlow && (
            <Animated.View
              style={[
                styles.glowAura,
                {
                  width: size * 1.08,
                  height: size * 1.08,
                  borderRadius: size * 0.35,
                  backgroundColor: glowAura,
                  transform: [{ scale: pulseAnim }],
                  shadowColor: glowColor,
                  shadowOpacity: 0.85,
                  shadowRadius: 28,
                },
              ]}
            />
          )}

          {/* 3D Mascot Pilot Robot Card Image */}
          <Image
            source={require('../../../assets/taskpilot_logo.png')}
            style={{ width: size, height: size, borderRadius: size * 0.22 }}
            resizeMode="contain"
          />

          {/* Specular Top Sheen Overlay */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.4 }}
            style={[
              styles.specularSheen,
              {
                width: size,
                height: size * 0.45,
                borderRadius: size * 0.22,
              },
            ]}
            pointerEvents="none"
          />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // 3. ICON VARIANT (The Checkmark-P App Icon Squircle)
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={!onPress}
      style={[styles.wrapper, style]}
    >
      <Animated.View
        style={[
          styles.centerWrapper,
          {
            transform: [
              { translateY: animated ? floatAnim : 0 },
              { scale: pressScale },
            ],
          },
        ]}
      >
        {/* Pulsing Neon Backglow */}
        {showGlow && (
          <Animated.View
            style={[
              styles.glowAura,
              {
                width: size * 1.06,
                height: size * 1.06,
                borderRadius: size * 0.32,
                backgroundColor: glowAura,
                transform: [{ scale: pulseAnim }],
                shadowColor: glowColor,
                shadowOpacity: 0.9,
                shadowRadius: 26,
              },
            ]}
          />
        )}

        {/* Squircle App Icon Badge */}
        <Image
          source={require('../../../assets/taskpilot_icon.png')}
          style={{ width: size, height: size, borderRadius: size * 0.22 }}
          resizeMode="contain"
        />

        {/* Specular Top Reflection Sheen */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.32)', 'rgba(255, 255, 255, 0.06)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.4 }}
          style={[
            styles.specularSheen,
            {
              width: size,
              height: size * 0.45,
              borderRadius: size * 0.22,
            },
          ]}
          pointerEvents="none"
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowAura: {
    position: 'absolute',
    zIndex: 1,
  },
  specularSheen: {
    position: 'absolute',
    top: 0,
    zIndex: 3,
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1,
  },
  badgeIconWrapper: {
    marginRight: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  badgeSubtitle: {
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 3,
    letterSpacing: 0.2,
  },
});
