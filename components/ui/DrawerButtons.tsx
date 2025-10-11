import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemedStyles } from './ThemeContext';
import { Theme } from './theme';

interface DrawerButtonsProps {
  children: ReactNode;
  style?: ViewStyle;
  align?: 'left' | 'center' | 'right' | 'space-between';
  direction?: 'row' | 'column';
  gap?: number;
}

export function DrawerButtons({ 
  children, 
  style, 
  align = 'right',
  direction = 'row',
  gap,
}: DrawerButtonsProps) {
  const styles = useThemedStyles(createStyles);
  const actualGap = gap ?? styles.container.gap;
  
  const justifyContent = align === 'left' ? 'flex-start' 
    : align === 'center' ? 'center'
    : align === 'right' ? 'flex-end'
    : 'space-between';

  return (
    <View style={[
      styles.container, 
      { 
        flexDirection: direction, 
        justifyContent,
        gap: actualGap,
      }, 
      style
    ]}>
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
});
