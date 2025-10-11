import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemedStyles } from './ThemeContext';
import { Theme } from './theme';

interface DrawerHeaderProps {
  children?: ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

export function DrawerHeader({ children, style, backgroundColor }: DrawerHeaderProps) {
  const styles = useThemedStyles(createStyles);
  
  return (
    <View style={[styles.header, backgroundColor && { backgroundColor }, style]}>
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
});
