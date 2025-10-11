import React, { ReactNode } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useThemedStyles } from './ThemeContext';
import { Theme } from './theme';

interface DrawerSubtitleProps {
  children: ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
}

export function DrawerSubtitle({ children, style, numberOfLines = 2 }: DrawerSubtitleProps) {
  const styles = useThemedStyles(createStyles);
  
  return (
    <Text style={[styles.subtitle, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});
