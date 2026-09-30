import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { playSpinnerTickSound } from '../../services/soundEffects';

interface CircleIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  soundPitch?: number;
  activeOpacity?: number;
  accessibilityLabel?: string;
}

export const CircleIconButton: React.FC<CircleIconButtonProps> = ({
  icon,
  size = 44,
  iconSize = 22,
  color = colors.textPrimary,
  backgroundColor = colors.cardAlt,
  onPress,
  style,
  soundPitch = 850,
  activeOpacity = 0.75,
  accessibilityLabel,
}) => {
  const handlePress = () => {
    if (soundPitch > 0) {
      playSpinnerTickSound(soundPitch);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={activeOpacity}
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={iconSize} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
});
