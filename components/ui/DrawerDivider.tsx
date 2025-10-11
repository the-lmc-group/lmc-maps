import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemedStyles } from './ThemeContext';
import { Theme } from './theme';

interface DrawerDividerProps {
  style?: ViewStyle;
  color?: string;
  thickness?: number;
  marginVertical?: number;
}

export function DrawerDivider({ 
  style, 
  color,
  thickness = 1,
  marginVertical,
}: DrawerDividerProps) {
  const styles = useThemedStyles(createStyles);
  const actualColor = color ?? styles.divider.backgroundColor;
  const actualMarginVertical = marginVertical ?? styles.divider.marginVertical;
  
  return (
    <View 
      style={[
        styles.divider, 
        { 
          backgroundColor: actualColor, 
          height: thickness,
          marginVertical: actualMarginVertical,
        }, 
        style
      ]} 
    />
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  divider: {
    width: '100%',
    backgroundColor: theme.colors.border.light,
    marginVertical: theme.spacing.lg,
  },
});
