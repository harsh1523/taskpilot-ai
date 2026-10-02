import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Easing,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRobotAlert, hideRobotAlert, RobotAlertOptions } from '../services/robotAlert';
import { colors, radius, fontSizes, fontWeights, useTheme } from '../theme';
import { speakWithTechna, playSpinnerTickSound } from '../services/soundEffects';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RobotAlertModalProps {
  // Optional override props for local/inline usage
  visible?: boolean;
  alertOptions?: RobotAlertOptions | null;
  onClose?: () => void;
}

export const RobotAlertModal: React.FC<RobotAlertModalProps> = ({
  visible: propVisible,
  alertOptions: propAlert,
  onClose: propOnClose,
}) => {
  const { theme } = useTheme();
  const globalAlertState = useRobotAlert();

  // Determine active alert
  const activeAlert = propAlert !== undefined ? propAlert : globalAlertState.alert;
  const isVisible = propVisible !== undefined ? propVisible : !!activeAlert;

  // Animation values
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const robotSlideAnim = useRef(new Animated.Value(0)).current;
  const robotTiltAnim = useRef(new Animated.Value(0)).current;
  const robotFloatAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.75)).current;
  const cardOpacityAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Local state to keep content during exit animation
  const [renderedAlert, setRenderedAlert] = useState<RobotAlertOptions | null>(activeAlert);

  useEffect(() => {
    if (isVisible && activeAlert) {
      setRenderedAlert(activeAlert);

      // 1. Play haptic & voice
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      playSpinnerTickSound(950);

      if (activeAlert.speak !== false && activeAlert.message) {
        speakWithTechna(activeAlert.message, true);
      }

      // Reset values
      backdropAnim.setValue(0);
      robotSlideAnim.setValue(0);
      robotTiltAnim.setValue(0);
      cardScaleAnim.setValue(0.75);
      cardOpacityAnim.setValue(0);

      // Start entrance
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(robotSlideAnim, {
          toValue: 1,
          friction: 6,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.spring(robotTiltAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(cardScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 48,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      // Zero-G float loop
      const floatLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(robotFloatAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(robotFloatAnim, {
            toValue: -1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      floatLoop.start();

      // Friendly wave gesture loop
      const waveLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 260,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: -1,
            duration: 260,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      waveLoop.start();

      return () => {
        floatLoop.stop();
        waveLoop.stop();
      };
    }
  }, [isVisible, activeAlert]);

  const handleDismiss = (callback?: () => void) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(robotSlideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(cardScaleAnim, {
        toValue: 0.85,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (propOnClose) {
        propOnClose();
      } else {
        hideRobotAlert();
      }
      if (callback) {
        callback();
      }
      if (renderedAlert?.onDismiss) {
        renderedAlert.onDismiss();
      }
      setRenderedAlert(null);
    });
  };

  if (!isVisible && !renderedAlert) {
    return null;
  }

  const alertData = activeAlert || renderedAlert;
  if (!alertData) return null;

  const position = alertData.position || 'middle';
  const alertType = alertData.type || (alertData.title.toLowerCase().includes('require') ? 'required' : 'info');

  // Interpolations based on position
  const floatY = robotFloatAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-5, 5],
  });

  const armRotate = waveAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-12deg', '12deg'],
  });

  // Robot entrance transform per position
  const robotSlideY = robotSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [position === 'middle' ? -100 : 0, 0],
  });
  const translateYCombined = Animated.add(robotSlideY, floatY);

  const robotTranslateX = robotSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [position === 'left' ? -150 : position === 'right' ? 150 : 0, 0],
  });

  const robotRotation = robotTiltAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [position === 'left' ? '-16deg' : position === 'right' ? '16deg' : '0deg', '0deg'],
  });

  // Badge styling
  let badgeColor = theme.primary;
  let badgeBorder = theme.primaryGlow;
  let badgeText = 'TECHNA AI';
  let badgeIcon: any = 'hardware-chip-outline';

  if (alertType === 'required' || alertData.title.toLowerCase().includes('require')) {
    badgeColor = '#F59E0B';
    badgeBorder = 'rgba(245, 158, 11, 0.4)';
    badgeText = 'REQUIRED';
    badgeIcon = 'alert-circle';
  } else if (alertType === 'warning') {
    badgeColor = '#F59E0B';
    badgeBorder = 'rgba(245, 158, 11, 0.4)';
    badgeText = 'WARNING';
    badgeIcon = 'warning-outline';
  } else if (alertType === 'error') {
    badgeColor = '#EF4444';
    badgeBorder = 'rgba(239, 68, 68, 0.4)';
    badgeText = 'ALERT';
    badgeIcon = 'alert';
  } else if (alertType === 'success') {
    badgeColor = '#10B981';
    badgeBorder = 'rgba(16, 185, 129, 0.4)';
    badgeText = 'SUCCESS';
    badgeIcon = 'checkmark-circle-outline';
  }

  // Buttons
  const buttons = alertData.buttons && alertData.buttons.length > 0
    ? alertData.buttons
    : [{ text: 'Got it', style: 'default' as const }];

  // Robot size for alert
  const robotSize = position === 'middle' ? 140 : 130;
  const robotHeight = robotSize * (470 / 368);
  const pivotX = (282 / 368) * robotSize;
  const pivotY = (216 / 470) * robotHeight;

  return (
    <Animated.View style={[styles.overlayContainer, { opacity: backdropAnim }]}>
      {/* Dark frosted backdrop */}
      <TouchableOpacity
        style={styles.backdropTouch}
        activeOpacity={1}
        onPress={() => handleDismiss()}
      />

      <View
        style={[
          styles.contentWrapper,
          position === 'left' && styles.wrapperLeft,
          position === 'right' && styles.wrapperRight,
          position === 'middle' && styles.wrapperMiddle,
        ]}
        pointerEvents="box-none"
      >
        {/* Animated Pop-Up Companion Robot */}
        <Animated.View
          style={[
            styles.robotContainer,
            {
              width: robotSize,
              height: robotHeight,
              transform: [
                { translateX: robotTranslateX },
                { translateY: translateYCombined },
                { rotate: robotRotation },
                ...(position === 'right' ? [{ scaleX: -1 }] : []),
              ],
            },
            position === 'left' && styles.robotLeft,
            position === 'right' && styles.robotRight,
            position === 'middle' && styles.robotMiddle,
          ]}
          pointerEvents="none"
        >
          {/* Robot Body */}
          <Image
            source={require('../../assets/techna_robot_no_arm.png')}
            style={{ width: robotSize, height: robotHeight }}
            resizeMode="contain"
          />

          {/* Pivoting Waving Arm */}
          <Animated.View
            style={{
              position: 'absolute',
              left: pivotX,
              top: pivotY,
              width: 0,
              height: 0,
              zIndex: 3,
              transform: [{ rotate: armRotate }],
            }}
          >
            <Image
              source={require('../../assets/techna_robot_arm.png')}
              style={{
                position: 'absolute',
                left: -pivotX,
                top: -pivotY,
                width: robotSize,
                height: robotHeight,
              }}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Subtle underglow thruster shadow */}
          <View style={styles.robotUnderglow} />
        </Animated.View>

        {/* Futuristic Glassmorphic Speech / Alert Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: cardOpacityAnim,
              transform: [{ scale: cardScaleAnim }],
              borderColor: 'rgba(255, 255, 255, 0.16)',
              shadowColor: badgeColor,
            },
            position === 'left' && styles.cardBesideLeft,
            position === 'right' && styles.cardBesideRight,
            position === 'middle' && styles.cardBelowMiddle,
          ]}
        >
          {/* Top ambient card tint */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.01)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.cardGlassGradient}
            pointerEvents="none"
          />

          {/* Speech Bubble Arrow Tail */}
          {position === 'left' && <View style={styles.speechTailLeft} />}
          {position === 'right' && <View style={styles.speechTailRight} />}
          {position === 'middle' && <View style={styles.speechTailTop} />}

          {/* Type Badge Chip */}
          <View style={[styles.badgeChip, { backgroundColor: `${badgeColor}18`, borderColor: badgeBorder }]}>
            <Ionicons name={badgeIcon} size={14} color={badgeColor} style={{ marginRight: 5 }} />
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
          </View>

          {/* Alert Title */}
          <Text style={styles.alertTitle}>{alertData.title}</Text>

          {/* Alert Message */}
          <Text style={styles.alertMessage}>{alertData.message}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonsRow}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              if (isCancel) {
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.cancelBtn}
                    activeOpacity={0.75}
                    onPress={() => handleDismiss(btn.onPress)}
                  >
                    <Text style={styles.cancelBtnText}>{btn.text}</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.primaryBtn}
                  activeOpacity={0.82}
                  onPress={() => handleDismiss(btn.onPress)}
                >
                  <LinearGradient
                    colors={
                      isDestructive
                        ? ['#EF4444', '#DC2626']
                        : [theme.primary, theme.accent]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtnGradient}
                  >
                    <Text style={styles.primaryBtnText}>{btn.text}</Text>
                    <Ionicons name="arrow-forward" size={15} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 5, 12, 0.76)',
  },
  contentWrapper: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  wrapperMiddle: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  wrapperLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  wrapperRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  robotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10,
  },
  robotMiddle: {
    marginBottom: -26,
  },
  robotLeft: {
    marginLeft: -10,
    marginRight: -16,
  },
  robotRight: {
    marginRight: -10,
    marginLeft: -16,
  },
  robotUnderglow: {
    position: 'absolute',
    bottom: -6,
    width: 60,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(192, 132, 252, 0.45)',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  cardContainer: {
    backgroundColor: 'rgba(19, 18, 30, 0.94)',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'visible',
    position: 'relative',
  },
  cardBelowMiddle: {
    width: Math.min(SCREEN_WIDTH * 0.86, 340),
    alignItems: 'center',
    paddingTop: 32,
  },
  cardBesideLeft: {
    flex: 1,
    maxWidth: SCREEN_WIDTH - 120,
    marginLeft: 6,
  },
  cardBesideRight: {
    flex: 1,
    maxWidth: SCREEN_WIDTH - 120,
    marginRight: 6,
  },
  cardGlassGradient: {
    ...StyleSheet.absoluteFill,
    borderRadius: 24,
  },
  speechTailTop: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(19, 18, 30, 0.94)',
  },
  speechTailLeft: {
    position: 'absolute',
    left: -10,
    top: 50,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'rgba(19, 18, 30, 0.94)',
  },
  speechTailRight: {
    position: 'absolute',
    right: -10,
    top: 50,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'rgba(19, 18, 30, 0.94)',
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: fontWeights.heavy,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  alertMessage: {
    fontSize: 15,
    fontWeight: fontWeights.regular,
    color: '#9CA3AF',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  primaryBtn: {
    flex: 1,
    borderRadius: radius.round,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: fontWeights.heavy,
    letterSpacing: 0.3,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: fontWeights.semibold,
  },
});
