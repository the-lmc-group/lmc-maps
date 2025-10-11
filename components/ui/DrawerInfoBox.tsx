import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useThemedStyles } from './ThemeContext';
import { Theme } from './theme';

interface DrawerInfoBoxProps {
  children: ReactNode;
  icon?: keyof typeof Icon.glyphMap;
  variant?: 'info' | 'success' | 'warning' | 'error';
  iconColor?: string;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantConfig = {
  info: (theme: Theme) => ({
    backgroundColor: theme.colors.info + '20',
    iconColor: theme.colors.info,
    textColor: theme.colors.info,
  }),
  success: (theme: Theme) => ({
    backgroundColor: theme.colors.success + '20',
    iconColor: theme.colors.success,
    textColor: theme.colors.success,
  }),
  warning: (theme: Theme) => ({
    backgroundColor: theme.colors.warning + '20',
    iconColor: theme.colors.warning,
    textColor: theme.colors.warning,
  }),
  error: (theme: Theme) => ({
    backgroundColor: theme.colors.error + '20',
    iconColor: theme.colors.error,
    textColor: theme.colors.error,
  }),
};

export function DrawerInfoBox({ 
  children, 
  icon = 'info-outline',
  variant = 'info',
  iconColor,
  backgroundColor,
  textColor,
  style,
  textStyle,
}: DrawerInfoBoxProps) {
  const styles = useThemedStyles(createStyles);
  
  const variantColors = variantConfig[variant](styles._theme);
  const actualBackgroundColor = backgroundColor ?? variantColors.backgroundColor;
  const actualIconColor = iconColor ?? variantColors.iconColor;
  const actualTextColor = textColor ?? variantColors.textColor;
  
  return (
    <View style={[styles.container, { backgroundColor: actualBackgroundColor }, style]}>
      <Icon name={icon} size={24} color={actualIconColor} />
      <View style={styles.textContainer}>
        {typeof children === 'string' ? (
          <Text style={[styles.text, { color: actualTextColor }, textStyle]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => ({
  _theme: theme,
  ...StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      gap: theme.spacing.md,
      alignItems: 'flex-start',
    },
    textContainer: {
      flex: 1,
    },
    text: {
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.relaxed,
    },
  }),
});
