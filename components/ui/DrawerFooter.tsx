import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemedStyles } from './ThemeContext';
import { Theme } from './theme';

interface DrawerFooterProps {
  children: ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  showBorder?: boolean;
}

export function DrawerFooter({ 
  children, 
  style, 
  backgroundColor,
  showBorder = true,
}: DrawerFooterProps) {
  const styles = useThemedStyles(createStyles);
  const actualBackgroundColor = backgroundColor !== undefined ? backgroundColor : styles.footer.backgroundColor;
  
  return (
    <View style={[
      styles.footer, 
      { backgroundColor: actualBackgroundColor },
      showBorder && styles.border,
      style
    ]}>
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  border: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
});
