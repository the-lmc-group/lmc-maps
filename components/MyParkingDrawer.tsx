import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface MyParkingDrawerProps {
  visible: boolean;
  parking: { coordinate: { latitude: number; longitude: number }; name: string } | null;
  onClose: () => void;
  onRemove: () => void;
  onNavigate: () => void;
}

const { height: screenHeight } = Dimensions.get('window');
const DRAWER_HEIGHT = Math.min(300, screenHeight * 0.4);

export default function MyParkingDrawer({ visible, parking, onClose, onRemove, onNavigate }: MyParkingDrawerProps) {
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: screenHeight - DRAWER_HEIGHT, useNativeDriver: true, bounciness: 0 }).start();
    } else {
      Animated.spring(translateY, { toValue: screenHeight, useNativeDriver: true, bounciness: 0 }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }] }>
      <View style={styles.handle} />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ma place de stationnement</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <MaterialIcons name="close" size={22} color="#111" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.subtitle}>{parking?.name || 'Parking sauvegardé'}</Text>
        <Text style={styles.coords}>{parking ? `${parking.coordinate.latitude.toFixed(5)}, ${parking.coordinate.longitude.toFixed(5)}` : ''}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.removeBtn]} onPress={onRemove}>
            <MaterialIcons name="delete" size={18} color="#fff" />
            <Text style={styles.actionText}>Retirer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.navigateBtn]} onPress={onNavigate}>
            <MaterialIcons name="directions" size={18} color="#fff" />
            <Text style={styles.actionText}>Aller au point</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', left: 0, right: 0, height: DRAWER_HEIGHT, backgroundColor: '#fff',
    borderTopLeftRadius: 18, borderTopRightRadius: 18, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.25, shadowRadius: 6, zIndex: 1200,
  },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#CCC', alignSelf: 'center', marginTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 18, fontWeight: '600', color: '#111' },
  closeBtn: { padding: 8 },
  content: { padding: 16 },
  subtitle: { fontSize: 16, fontWeight: '500', color: '#111', marginBottom: 6 },
  coords: { fontSize: 14, color: '#555', marginBottom: 16 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  removeBtn: { backgroundColor: '#FF3B30' },
  navigateBtn: { backgroundColor: '#007AFF' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
