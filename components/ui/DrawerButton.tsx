import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useThemedStyles } from './ThemeContext';
import { Theme } from './theme';

interface DrawerButtonProps {
  children: ReactNode;
  onPress: () => void;
  icon?: keyof typeof Icon.glyphMap;
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function DrawerButton({ 
  children,
  onPress,
  icon,
  iconPosition = 'left',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  style,
  textStyle,
}: DrawerButtonProps) {
  const styles = useThemedStyles(createStyles);
  
  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  const iconSize = size === 'small' ? 18 : size === 'large' ? 24 : 20;
  const getIconColor = () => {
    if (disabled) return styles.textDisabled.color;
    return variant === 'primary' ? 'white' : styles.text_outline.color;
  };

  return (
    <TouchableOpacity 
      style={buttonStyles} 
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && iconPosition === 'left' && (
        <Icon name={icon} size={iconSize} color={getIconColor()} style={styles.iconLeft} />
      )}
      <Text style={textStyles}>{children}</Text>
      {icon && iconPosition === 'right' && (
        <Icon name={icon} size={iconSize} color={getIconColor()} style={styles.iconRight} />
      )}
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
  },
  button_primary: {
    backgroundColor: theme.colors.primary,
  },
  button_secondary: {
    backgroundColor: theme.colors.surface,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_small: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  button_medium: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  button_large: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  text_primary: {
    color: 'white',
  },
  text_secondary: {
    color: theme.colors.text.primary,
  },
  text_outline: {
    color: theme.colors.primary,
  },
  text_ghost: {
    color: theme.colors.primary,
  },
  text_small: {
    fontSize: theme.typography.fontSize.sm,
  },
  text_medium: {
    fontSize: theme.typography.fontSize.md,
  },
  text_large: {
    fontSize: theme.typography.fontSize.lg,
  },
  textDisabled: {
    color: theme.colors.text.disabled,
  },
  iconLeft: {
    marginRight: theme.spacing.sm,
  },
  iconRight: {
    marginLeft: theme.spacing.sm,
  },
});
