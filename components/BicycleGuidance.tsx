import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Animated, Vibration } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { formatDistance } from '../utils/formatUtils';
import NavigationService from '../services/NavigationService';
import { useRouteService } from '../services/RouteService';

interface Props {
  visible: boolean;
  onStop: () => void;
  currentLocation?: { latitude: number; longitude: number } | null;
  navigationData?: any | null;
  destination?: { latitude: number; longitude: number } | null;
  onRouteCalculated?: (routeCoords: Array<{ latitude: number; longitude: number }>) => void;
}

export default function BicycleGuidance({ visible, onStop, currentLocation, navigationData, destination, onRouteCalculated }: Props) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [lastKnownLocation, setLastKnownLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const routeService = useRouteService();
  
  useEffect(() => {
    if (visible && currentLocation && destination && onRouteCalculated && !routeCalculated) {
      const calculateRoute = async () => {
        setIsCalculatingRoute(true);
        try {
          const success = await routeService.getRoute(currentLocation, destination, 'bicycling');
          
          if (success && routeService.routeCoords.length > 0) {
            onRouteCalculated(routeService.routeCoords);
            setRouteCalculated(true);
            setLastKnownLocation(currentLocation);
            } else {
            console.warn('BicycleGuidance: No route found or route is empty');
          }
        } catch (error) {
          console.error('BicycleGuidance: Error calculating route:', error);
        } finally {
          setIsCalculatingRoute(false);
        }
      };
      calculateRoute();
    }
  }, [visible, destination, onRouteCalculated, routeCalculated]);
  
  useEffect(() => {
    if (visible && routeCalculated && currentLocation && lastKnownLocation && routeService.routeCoords.length > 0) {
      const distanceFromLastCheck = Math.sqrt(
        Math.pow(currentLocation.latitude - lastKnownLocation.latitude, 2) + 
        Math.pow(currentLocation.longitude - lastKnownLocation.longitude, 2)
      ) * 111000;

      if (distanceFromLastCheck > 10) {
        const isOffRoute = routeService.detectOffRoute(currentLocation, 100);

        if (isOffRoute) {
          setRouteCalculated(false);
        } else {
          setLastKnownLocation(currentLocation);
        }
      }
    }
  }, [currentLocation?.latitude, currentLocation?.longitude, visible, routeCalculated, lastKnownLocation]);
  
  if (!visible) return null;

  const remainingDistance = navigationData?.remainingDistance ?? 0;
  const remainingDuration = navigationData?.remainingDuration ?? 0;
  const currentSpeed = navigationData?.speed ?? 0;

  const openMenu = () => setIsMenuVisible(true);
  const closeMenu = (callback?: () => void) => {
    setIsMenuVisible(false);
    if (callback) setTimeout(callback, 100);
  };

  const handleStopNavigation = () => {
    Vibration.vibrate(100);
    NavigationService.stopNavigation();
    setRouteCalculated(false);
    setIsCalculatingRoute(false);
    setLastKnownLocation(null);
    onStop();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNext}>
        <Text style={styles.nextText}>
          {isCalculatingRoute 
            ? 'Calcul de l\'itinéraire vélo...' 
            : navigationData?.currentStreet || navigationData?.nextInstruction || 'Suivre la piste cyclable'
          }
        </Text>
      </View>

      <View style={styles.dashboard}>
        <View style={styles.leftStats}>
          <Text style={styles.statLabel}>Vitesse</Text>
          <Text style={styles.statValue}>{Math.round(currentSpeed)} km/h</Text>
        </View>

        <View style={styles.centerRing}>
          <Text style={styles.centerDistance}>{formatDistance(remainingDistance)}</Text>
        </View>

        <View style={styles.rightStats}>
          <Text style={styles.statLabel}>Pente</Text>
          <Text style={styles.statValue}>{navigationData?.slope ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.widgetsBottom}>
        <View style={styles.widget}><Text>Vent: {navigationData?.wind || '—'}</Text></View>
        <View style={styles.widget}><Text>Atelier/Pompe</Text></View>
      </View>

      <View style={styles.topRight}>
        <TouchableOpacity style={styles.menuButton} onPress={openMenu}>
          <Icon name="more-vert" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Modal visible={isMenuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.menuOverlay} onPress={() => closeMenu()}>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => closeMenu(() => handleStopNavigation())}
            >
              <Icon name="stop" size={20} color="#FF3B30" />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                Arrêter la navigation
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top:0,left:0,right:0,bottom:0, zIndex:1000 },
  topNext: { position:'absolute', top:40,left:16,right:16, alignItems:'center' },
  nextText: { fontSize:20, fontWeight:'700' },
  dashboard: { position:'absolute', bottom:140, left:16, right:16, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  leftStats: { alignItems:'center' },
  rightStats: { alignItems:'center' },
  statLabel: { fontSize:12, color:'#666' },
  statValue: { fontSize:20, fontWeight:'700' },
  centerRing: { width:120, height:120, borderRadius:60, borderWidth:6, borderColor:'#007AFF', justifyContent:'center', alignItems:'center' },
  centerDistance: { fontSize:18, fontWeight:'800' },
  widgetsBottom: { position:'absolute', bottom:80, left:12, right:12, flexDirection:'row', justifyContent:'space-between' },
  widget: { backgroundColor:'rgba(255,255,255,0.95)', padding:8, borderRadius:8, minWidth:120, alignItems:'center' },
  topRight: { position: 'absolute', top: 40, right: 16 },
  menuButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  menuContainer: { backgroundColor: 'white', borderRadius: 12, minWidth: 200, paddingVertical: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  menuItemDanger: { backgroundColor: '#FFF2F2' },
  menuItemText: { marginLeft: 12, fontSize: 16, color: '#333' },
  menuItemTextDanger: { color: '#FF3B30' },
});
