import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Polygon, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IsometricCubeIllustrationProps {
  size?: number;
}

export const IsometricCubeIllustration: React.FC<IsometricCubeIllustrationProps> = ({
  size = 280,
}) => {
  // Base coordinates designed on a 300x320 grid
  // Center is at (150, 150)
  // 30 degree isometric projection factors
  const strokeColor = '#FFFFFF';
  const strokeWidth = 1.8;

  return (
    <View style={[styles.container, { width: size, height: size * 1.07 }]}>
      <Svg width={size} height={size * 1.07} viewBox="0 0 300 320" fill="none">
        <Defs>
          <LinearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#E2E2E8" stopOpacity="0.7" />
          </LinearGradient>
        </Defs>

        <G stroke="url(#glowGrad)" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
          {/* ================= OUTSIDE 3D BLOCK ================= */}
          {/* Outer Top Hexagon Rim */}
          {/* Points: Top(150, 32), TopRight(254, 92), BottomRight(254, 180), Bottom(150, 240), BottomLeft(46, 180), TopLeft(46, 92) */}
          <Polygon
            points="150,32 254,92 254,180 150,240 46,180 46,92"
            fill="none"
          />

          {/* Outer 3D drop depth:
              From Left(46, 180) down to (46, 214)
              From Bottom(150, 240) down to (150, 274)
              From Right(254, 180) down to (254, 214)
              And the bottom front edges connecting them */}
          <Path d="M46,180 L46,214 L150,274 L254,214 L254,180" />
          <Path d="M150,240 L150,274" />

          {/* Top-front isometric bevel lines */}
          <Path d="M46,92 L86,115" />
          <Path d="M254,92 L214,115" />
          <Path d="M150,32 L150,78" />

          {/* ================= STEP 1 (Outer Recessed Hexagon) ================= */}
          {/* Ring 1 inner perimeter */}
          <Polygon
            points="150,78 214,115 214,175 150,212 86,175 86,115"
            fill="none"
          />
          {/* Step 1 internal depth lines dropping down */}
          <Path d="M86,175 L106,186" />
          <Path d="M150,212 L150,224" />
          <Path d="M214,175 L194,186" />

          {/* ================= STEP 2 (Middle Recessed Hexagon) ================= */}
          <Polygon
            points="150,96 194,121 194,168 150,194 106,168 106,121"
            fill="none"
          />
          {/* Step 2 internal depth lines */}
          <Path d="M106,168 L122,176" />
          <Path d="M150,194 L150,202" />
          <Path d="M194,168 L178,176" />

          {/* ================= STEP 3 (Inner Cavity Hexagon) ================= */}
          <Polygon
            points="150,114 178,130 178,162 150,178 122,162 122,130"
            fill="none"
          />

          {/* ================= CENTER FLOATING ISOMETRIC CUBE ================= */}
          {/* Cube Top Face (Isometric rhombus) */}
          <Polygon
            points="150,126 168,136 150,146 132,136"
            fill="none"
            strokeWidth={strokeWidth + 0.3}
          />
          {/* Cube Left Face */}
          <Polygon
            points="132,136 150,146 150,166 132,156"
            fill="none"
            strokeWidth={strokeWidth + 0.3}
          />
          {/* Cube Right Face */}
          <Polygon
            points="150,146 168,136 168,156 150,166"
            fill="none"
            strokeWidth={strokeWidth + 0.3}
          />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
