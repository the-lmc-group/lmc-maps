import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

let Battery: any = null;
try {
  Battery = require('expo-battery');
} catch (error) {
  console.warn('expo-battery module not available:', error);
}

import Svg, { Path, G, Rect, Circle, Line } from "react-native-svg";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { formatDistance, formatDurationFromSeconds } from "../utils/formatUtils";
import { usePedestrianRouteService, PedestrianNavigationData } from "../services/PedestrianRouteService";

interface Props {
  visible: boolean;
  onStop: () => void;
  currentLocation?: { latitude: number; longitude: number } | null;
  destination?: { latitude: number; longitude: number } | null;
  nearestRoadPoint?: { latitude: number; longitude: number } | null;
  onRouteCalculated?: (routeCoords: Array<{ latitude: number; longitude: number }>) => void;
  onFindAmenity?: (amenityType: string) => void;
}

export default function PedestrianGuidance({
  visible,
  onStop,
  currentLocation,
  destination,
  nearestRoadPoint,
  onRouteCalculated,
  onFindAmenity,
}: Props) {
  const [navigationData, setNavigationData] = useState<PedestrianNavigationData | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [lastCalculatedDestination, setLastCalculatedDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [lastCalculatedStartPoint, setLastCalculatedStartPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const pedestrianRouteService = usePedestrianRouteService();

  useEffect(() => {
    let batterySubscription: any;
    let chargingSubscription: any;

    const setupBattery = async () => {
      if (!Battery) {
        console.warn('Battery module not available, skipping battery setup');
        return;
      }
      
      try {
        const initialLevel = await Battery.getBatteryLevelAsync();
        setBatteryLevel(Math.round(initialLevel * 100));

        const initialCharging = await Battery.getBatteryStateAsync();
        setIsCharging(initialCharging === Battery.BatteryState.CHARGING);

        batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          setBatteryLevel(Math.round(batteryLevel * 100));
        });

        chargingSubscription = Battery.addBatteryStateListener(({ batteryState }) => {
          setIsCharging(batteryState === Battery.BatteryState.CHARGING);
        });
      } catch (error) {
        console.error('Erreur lors de l\'accès aux informations de batterie:', error);
      }
    };

    if (visible) {
      setupBattery();
    }

    return () => {
      if (batterySubscription) {
        batterySubscription.remove();
      }
      if (chargingSubscription) {
        chargingSubscription.remove();
      }
    };
  }, [visible]);

  const getDistance = (point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }) => {
    const R = 6371e3;
    const φ1 = point1.latitude * Math.PI/180;
    const φ2 = point2.latitude * Math.PI/180;
    const Δφ = (point2.latitude-point1.latitude) * Math.PI/180;
    const Δλ = (point2.longitude-point1.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  useEffect(() => {
    if (visible && destination) {
      const startPoint = nearestRoadPoint || currentLocation;
      
      if (!startPoint) {
        return;
      }

      if (lastCalculatedDestination && 
          getDistance(lastCalculatedDestination, destination) < 10) {
        return;
      }

      if (lastCalculatedStartPoint && 
          getDistance(lastCalculatedStartPoint, startPoint) < 50) {
        return;
      }

      if (isCalculatingRoute) {
        return;
      }
      
      setIsCalculatingRoute(true);
      
      const calculateRoute = async () => {
        try {
          const route = await pedestrianRouteService.getPedestrianRoute(startPoint, destination);
          if (route) {
            setNavigationData(route);
            onRouteCalculated?.(route.routeCoords);
            setLastCalculatedDestination({ ...destination });
            setLastCalculatedStartPoint({ ...startPoint });
          } else {
            console.error('PedestrianGuidance: Failed to calculate route');
          }
        } catch (error) {
          console.error('PedestrianGuidance: Error calculating route:', error);
        } finally {
          setIsCalculatingRoute(false);
        }
      };
      calculateRoute();
    }
  }, [visible, destination, nearestRoadPoint, currentLocation]);

  useEffect(() => {
    if (!visible) {
      setNavigationData(null);
      setLastCalculatedDestination(null);
      setLastCalculatedStartPoint(null);
      setIsCalculatingRoute(false);
    }
  }, [visible]);

  if (!visible) return null;

  const remainingDistance = navigationData?.remainingDistance ?? 0;
  const remainingDuration = navigationData?.remainingDuration ?? 0;

  const getBatteryColor = () => {
    if (batteryLevel === null) return "#333";
    const percentage = batteryLevel * 100;
    if (percentage > 50) return "#22C55E";
    if (percentage > 20) return "#F59E0B";
    return "#EF4444";
  };

  const formatBatteryDisplay = () => {
    if (batteryLevel === null) return "—";
    
    const percentage = Math.round(batteryLevel * 100);
    if (isCharging) {
      return `${percentage}%⚡`;
    }
    return `${percentage}%`;
  };

  if (pedestrianRouteService.isCalculating || isCalculatingRoute) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.nextStep, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.instructionText}>Calcul de l'itinéraire...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.nextStep}>
        <Icon name="directions-walk" size={42} color="#fff" />
        <View style={styles.headerStats}>
          <Text style={styles.headerDistance}>{formatDistance(remainingDistance)}</Text>
          <Text style={styles.headerDuration}>
            {remainingDuration ? `${formatDurationFromSeconds(remainingDuration)} restantes` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.widgetsFloating} pointerEvents="box-none">
        <View style={styles.widgetBubble}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Rect
                x="2"
                y="7"
                width="16"
                height="10"
                rx="2"
                stroke={getBatteryColor()}
                strokeWidth={1.5}
                fill="none"
              />
              <Rect x="20" y="10" width="2" height="4" rx="1" fill={getBatteryColor()} />
              {batteryLevel !== null && (
                <Rect 
                  x="4" 
                  y="9" 
                  width={Math.max(1, (batteryLevel * 12))} 
                  height="6" 
                  rx="1" 
                  fill={getBatteryColor()} 
                />
              )}
              {isCharging && (
                <Path
                  d="M10 5l-2 6h3l-2 6"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  fill="none"
                />
              )}
            </Svg>
            <Text style={styles.widgetText}>
              {formatBatteryDisplay()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsFloating}>
        <TouchableOpacity
          style={styles.actionBubble}
          onPress={() => onFindAmenity?.("cafe")}
        >
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 7h14v5a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7z"
              stroke="#333"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M7 3v4"
              stroke="#333"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M11 3v4"
              stroke="#333"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M17 9h1a2 2 0 1 0 0-4h-1"
              stroke="#333"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBubble}
          onPress={() => onFindAmenity?.("toilettes")}
        >
          <Svg
            width={36}
            height={36}
            viewBox="0 0 24 24"
            fill="none"
            stroke={"#333"}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Circle cx="7" cy="4" r="2" />
            <Path d="M5 22v-7H9v7" />
            <Path d="M5 15V9a2 2 0 0 1 4 0v6" />
            <Circle cx="17" cy="4" r="2" />
            <Path d="M15 22v-9h4v9" />
            <Path d="M15 13V9a2 2 0 0 1 4 0v4" />
            <Line x1="12" y1="2" x2="12" y2="22" />
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBubble, styles.stopBubble]}
          onPress={onStop}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 6L6 18M6 6l12 12"
              stroke="#fff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: "box-none",
  },
  mapEmphasis: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    opacity: 0.1,
    pointerEvents: "none" as any,
  },
  nextStep: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    paddingVertical: 16,
    paddingHorizontal: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "88%",
  },
  instructionText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 14,
  },
  headerStats: {
    marginLeft: 14,
    alignItems: "flex-start",
  },
  headerDistance: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },
  headerDuration: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  instructionContainer: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 18,
    maxWidth: "85%",
  },
  instructionTextSmaller: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  statsCenter: {
    position: "absolute",
    bottom: "48%",
    alignSelf: "center",
    alignItems: "center",
  },
  bigStat: {
    fontSize: 54,
    fontWeight: "800",
    color: "#fff",
  },
  smallStat: {
    fontSize: 18,
    color: "#fff",
    marginTop: 8,
  },
  widgetsFloating: {
    position: "absolute",
    top: 200,
    right: 20,
    gap: 14,
  },
  widgetBubble: {
    backgroundColor: "rgba(255,255,255,0.97)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    elevation: 4,
  },
  widgetText: {
    gap: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  actionsFloating: {
    position: "absolute",
    bottom: 84,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingBottom: 8,
  },
  actionBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  actionText: { fontSize: 22 },
  stopBubble: { backgroundColor: "#FF3B30" },
});
