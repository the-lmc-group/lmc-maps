import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemedStyles } from './ThemeContext';
import { Theme } from './theme';

interface DrawerSectionProps {
  title?: string;
  children: ReactNode;
  style?: ViewStyle;
  marginBottom?: number;
}

export function DrawerSection({ title, children, style, marginBottom }: DrawerSectionProps) {
  const styles = useThemedStyles(createStyles);
  const actualMarginBottom = marginBottom !== undefined ? marginBottom : styles.section.marginBottom;
  
  return (
    <View style={[styles.section, { marginBottom: actualMarginBottom }, style]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  section: {
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
});
