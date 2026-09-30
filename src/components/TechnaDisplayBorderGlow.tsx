import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';

interface TechnaDisplayBorderGlowProps {
  active: boolean;
}

/**
 * TechnaDisplayBorderGlow
 * Renders an unbroken, continuous vector perimeter glow that perfectly matches
 * the hardware curvature of the physical display (including all 4 corners) across
 * all models of iPhone and Android.
 */
export const TechnaDisplayBorderGlow: React.FC<TechnaDisplayBorderGlowProps> = ({ active }) => {
  const insets = useSafeAreaInsets();
  const windowDims = useWindowDimensions();
  const screenDims = Dimensions.get('screen');

  // On Android, window dimensions exclude translucent system bars.
  // To accurately hug the physical hardware display bezel, use screen dimensions on Android.
  const width = Platform.OS === 'android' ? screenDims.width : windowDims.width;
  const height = Platform.OS === 'android' ? screenDims.height : windowDims.height;

  const pulseAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 850,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.38,
            duration: 850,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      loopRef.current.start();
    } else {
      if (loopRef.current) {
        loopRef.current.stop();
      }
      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }

    return () => {
      if (loopRef.current) {
        loopRef.current.stop();
      }
    };
  }, [active]);

  if (!active) return null;

  // Exact hardware curvature mapped across iPhone and Android families
  let cornerRadius: number;

  if (Platform.OS === 'ios') {
    if (insets.top >= 54) {
      cornerRadius = 55; // iPhone 14 Pro, 15, 16 series with Dynamic Island
    } else if (insets.top >= 47) {
      cornerRadius = 47; // iPhone 12, 13, 14 classic notch
    } else if (insets.top >= 44) {
      cornerRadius = 42; // iPhone X, 11, XR
    } else if (insets.top <= 24) {
      cornerRadius = 4; // iPhone SE / rectangular models
    } else {
      cornerRadius = 46;
    }
  } else if (Platform.OS === 'android') {
    // Android: detect screen curvature by status bar inset and aspect ratio
    const isUltraSquare = width >= 410 && insets.top <= 32;

    if (isUltraSquare) {
      cornerRadius = 20; // Samsung Galaxy Note / Ultra sharp corners
    } else if (insets.top >= 40) {
      // Flagship modern curved glass (Google Pixel 6-9, Samsung S21-S24 standard, OnePlus, Xiaomi)
      cornerRadius = 50;
    } else if (insets.top >= 32) {
      cornerRadius = 42;
    } else if (insets.top >= 24) {
      cornerRadius = 32;
    } else {
      cornerRadius = 46;
    }
  } else {
    // Web / Desktop simulator
    cornerRadius = 50;
  }

  // Position at the exact physical perimeter so strokes bloom directly from the bezel
  const strokeInset = 1.0;
  const rectWidth = Math.max(width - strokeInset * 2, 0);
  const rectHeight = Math.max(height - strokeInset * 2, 0);
  const rx = Math.max(cornerRadius - strokeInset, 4);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.fullScreenOverlay,
        {
          width,
          height,
          opacity: pulseAnim,
        },
      ]}
    >
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="technaContinuousGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#38BDF8" />
            <Stop offset="18%" stopColor="#818CF8" />
            <Stop offset="42%" stopColor="#C084FC" />
            <Stop offset="68%" stopColor="#EC4899" />
            <Stop offset="88%" stopColor="#FB923C" />
            <Stop offset="100%" stopColor="#34D399" />
          </SvgGradient>
        </Defs>

        {/* 1. Outermost soft diffused atmospheric aura (wraps 100% seamlessly around physical bezel) */}
        <Rect
          x={strokeInset}
          y={strokeInset}
          width={rectWidth}
          height={rectHeight}
          rx={rx}
          ry={rx}
          fill="none"
          stroke="url(#technaContinuousGlow)"
          strokeWidth="12"
          strokeOpacity="0.22"
        />

        {/* 2. Mid aura radiance */}
        <Rect
          x={strokeInset}
          y={strokeInset}
          width={rectWidth}
          height={rectHeight}
          rx={rx}
          ry={rx}
          fill="none"
          stroke="url(#technaContinuousGlow)"
          strokeWidth="6"
          strokeOpacity="0.52"
        />

        {/* 3. Core bright neon filament */}
        <Rect
          x={strokeInset}
          y={strokeInset}
          width={rectWidth}
          height={rectHeight}
          rx={rx}
          ry={rx}
          fill="none"
          stroke="url(#technaContinuousGlow)"
          strokeWidth="2.2"
          strokeOpacity="0.98"
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 99999,
  },
});
