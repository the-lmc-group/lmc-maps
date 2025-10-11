import React, { useRef, useEffect, useState } from "react";
import { useMapControls } from "../hooks/useMapControls";
import { useLabs } from "../contexts/LabsContext";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { formatDuration, formatDistance } from "../utils/formatUtils";
import PrimTransportService from "../services/IleDeFranceMobilite";
import Drawer from "./ui/Drawer";

export default function RouteDrawer({
  visible,
  destination,
  onClose,
  onStartNavigation,
  onTransportModeChange,
  userLocation,
  routeInfo = null,
  isCalculatingRoute = false,
  isOsrmAvailable = true,
  provider,
  lastRequestTimings,
  isFromCache = false,
  onRefresh,
  onDrawerHeightChange,
}: any) {
  const { fitToRoute, setDrawerCameraControl, releaseDrawerCameraControl } = useMapControls();
  const { showDebugInfo } = useLabs();
  const [selectedTransport, setSelectedTransport] = useState("driving");
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [alternatives, setAlternatives] = useState(1);
  const [durations, setDurations] = useState<{ [mode: string]: string }>({});
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const bottomSheetRef = useRef<any>(null);
  const hasExpandedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleRefresh = async () => {
    if (onRefresh && !isCalculatingRoute) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) hasExpandedRef.current = false;
  }, [visible]);

  useEffect(() => {
    if (visible && destination && userLocation && !isCalculatingRoute && !routeInfo) {
      if (onTransportModeChange) {
        onTransportModeChange(selectedTransport, destination, { alternatives, avoidTolls, avoidHighways });
      }
    }
  }, [visible, destination, userLocation, isCalculatingRoute, routeInfo, selectedTransport, onTransportModeChange, alternatives, avoidTolls, avoidHighways]);

  function calculateDistance(): string {
    if (routeInfo && routeInfo.distance > 0) return formatDistance(routeInfo.distance);
    if (!destination || !userLocation) return "-- km";
    const R = 6371;
    const dLat = ((destination.latitude - userLocation.latitude) * Math.PI) / 180;
    const dLon = ((destination.longitude - userLocation.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((userLocation.latitude * Math.PI) / 180) *
        Math.cos((destination.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return formatDistance(R * c * 1000);
  }

  async function fetchDuration(mode: string) {
    if (routeInfo && routeInfo.duration > 0 && mode === selectedTransport)
      return formatDuration(routeInfo.duration);
    if (!destination || !userLocation) return "-- min";
    try {
      if (mode === "transit") {
        const p = await PrimTransportService.planRoute(
          { lat: userLocation.latitude, lon: userLocation.longitude },
          { lat: destination.latitude, lon: destination.longitude },
          { optimize: "fastest" }
        );
        if (p && typeof p.duration === "number")
          return formatDuration(Math.round(p.duration / 60));
      }
      let profile = "driving";
      if (mode === "walking") profile = "foot";
      else if (mode === "bicycling") profile = "bike";
      const url = `https://router.project-osrm.org/route/v1/${profile}/${userLocation.longitude},${userLocation.latitude};${destination.longitude},${destination.latitude}?overview=false&alternatives=true&steps=true`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.routes?.[0]?.duration)
        return formatDuration(data.routes[0].duration / 60);
    } catch {}
    return "-- min";
  }

  useEffect(() => {
    if (!destination || !userLocation) return;
    const modes = ["driving", "walking", "bicycling", "transit"];
    modes.forEach(async (mode) => {
      const d = await fetchDuration(mode);
      setDurations((prev) => ({ ...prev, [mode]: d }));
    });
  }, [destination, userLocation, routeInfo]);

  const transportModes = [
    { id: "driving", name: "Voiture", icon: "directions-car", color: "#007AFF" },
    { id: "walking", name: "À pied", icon: "directions-walk", color: "#34C759" },
    { id: "bicycling", name: "Vélo", icon: "directions-bike", color: "#FF9500" },
    { id: "transit", name: "Transports", icon: "tram", color: "#AF52DE" },
  ];

  const handleTransportModeChange = (modeId: string) => {
    Vibration.vibrate(50);
    setSelectedTransport(modeId);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    if (onTransportModeChange && destination)
      onTransportModeChange(modeId, destination, { alternatives, avoidTolls, avoidHighways });
  };

  const handleStartNavigation = () => {
    Vibration.vibrate(100);
    onStartNavigation(selectedTransport);
  };

  if (!visible || !destination) return null;

  if (!destination) return null;

  return (
    <Drawer
      id="route-drawer"
      visible={visible}
      title={isCalculatingRoute ? "Calcul de l'itinéraire" : destination.title}
      subtitle={destination.subtitle}
      icon={
        isCalculatingRoute ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : isFromCache ? (
          <Icon name="cloud-off" size={24} color="#666" />
        ) : (
          <Icon name="place" size={24} color="#EA4335" />
        )
      }
      onClose={() => {
        Vibration.vibrate(50);
        onClose();
      }}
      initialSnapIndex="auto"
      canRefresh={true}
      onRefresh={handleRefresh}
      onHeightChange={onDrawerHeightChange}
      onBottomSheetReady={(ref) => (bottomSheetRef.current = ref.current)}
    >
      {isOsrmAvailable ? (
        <>
          <Text style={styles.sectionTitle}>Modes de transport</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll}>
            {transportModes.map((mode) => {
              const selected = selectedTransport === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeCard,
                    { backgroundColor: selected ? mode.color : "#F2F3F5" },
                  ]}
                  onPress={() => handleTransportModeChange(mode.id)}
                  activeOpacity={0.9}
                >
                  <Icon name={mode.icon as any} size={28} color={selected ? "#fff" : mode.color} />
                  <Text
                    style={[styles.modeName, { color: selected ? "#fff" : "#333" }]}
                    numberOfLines={1}
                  >
                    {mode.name}
                  </Text>
                  <Text
                    style={[styles.modeDuration, { color: selected ? "#fff" : "#666" }]}
                  >
                    {durations[mode.id] || "-- min"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={() => setOptionsExpanded((v) => !v)}
            style={styles.optionsHeader}
          >
            <Text style={styles.sectionTitle}>Options du trajet</Text>
            <Icon
              name={optionsExpanded ? "expand-less" : "expand-more"}
              size={24}
              color="#333"
            />
          </TouchableOpacity>

          {optionsExpanded && (
            <View style={styles.optionsBody}>
              <TouchableOpacity
                style={[styles.optionButton, avoidTolls && styles.optionActive]}
                onPress={() => setAvoidTolls((v) => !v)}
              >
                <Text style={[styles.optionText, avoidTolls && styles.optionTextActive]}>
                  Éviter les péages
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, avoidHighways && styles.optionActive]}
                onPress={() => setAvoidHighways((v) => !v)}
              >
                <Text style={[styles.optionText, avoidHighways && styles.optionTextActive]}>
                  Éviter les autoroutes
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.stickyFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: transportModes.find((m) => m.id === selectedTransport)?.color || "#007AFF" }]}
              onPress={handleStartNavigation}
            >
              <Icon name="navigation" size={20} color="#fff" />
              <Text style={styles.startButtonText}>Démarrer</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.osrmBanner}>
          <Text style={styles.osrmBannerText}>
            Serveur OSRM indisponible — les calculs d'itinéraires sont désactivés
          </Text>
        </View>
      )}
    </Drawer>
  );
}

const styles = StyleSheet.create({
  routeDetails: {
    backgroundColor: "#E8F4FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#B3DCFF",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  modeScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  modeCard: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    padding: 12,
    marginRight: 10,
    width: 110,
    elevation: 2,
  },
  modeName: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  modeDuration: {
    fontSize: 13,
    fontWeight: "600",
  },
  optionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionsBody: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F0F0F5",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D0D0D8",
  },
  optionActive: {
    backgroundColor: "#007AFF",
    borderColor: "#0051D5",
  },
  optionText: {
    color: "#1a1a1a",
    fontWeight: "700",
  },
  optionTextActive: {
    color: "#fff",
  },
  stickyFooter: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#FF3B30",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#FFF",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF3B30",
  },
  startButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    elevation: 3,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  osrmBanner: {
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: "#FFD700",
    marginTop: 12,
  },
  osrmBannerText: {
    color: "#856404",
    fontSize: 13,
    fontWeight: "700",
  },
});
