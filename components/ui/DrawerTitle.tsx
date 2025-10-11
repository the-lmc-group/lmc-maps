import React, { ReactNode } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useThemedStyles } from './ThemeContext';
import { Theme } from './theme';

interface DrawerTitleProps {
  children: ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
}

export function DrawerTitle({ children, style, numberOfLines = 1 }: DrawerTitleProps) {
  const styles = useThemedStyles(createStyles);
  
  return (
    <Text style={[styles.title, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
});
