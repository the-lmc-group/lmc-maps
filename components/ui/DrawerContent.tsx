import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemedStyles } from './ThemeContext';
import { Theme } from './theme';

interface DrawerContentProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function DrawerContent({ children, style, padding }: DrawerContentProps) {
  const styles = useThemedStyles(createStyles);
  const actualPadding = padding !== undefined ? padding : styles.content.padding;
  
  return (
    <View style={[styles.content, { padding: actualPadding }, style]}>
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  content: {
    flex: 1,
    padding: theme.spacing.xl,
  },
});
