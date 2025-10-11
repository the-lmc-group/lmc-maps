import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Clipboard, Vibration } from "react-native";
import Drawer from "./ui/Drawer";
import { OverpassService, OverpassPOI } from "../services/OverpassService";
import { MaterialIcons as Icon } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  coordinate: { latitude: number; longitude: number } | null;
  radius?: number;
  amenityType?: string;
  onClose: () => void;
  onStartRoute?: (coord: { latitude: number; longitude: number }) => void;
  onShowLocationPoint?: (show: boolean) => void;
}

export default function AProximiteDrawer({
  visible,
  coordinate,
  radius = 500,
  amenityType = "*",
  onClose,
  onStartRoute,
  onShowLocationPoint,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [pois, setPois] = useState<OverpassPOI[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageSize] = useState(12);
  const [visibleCount, setVisibleCount] = useState(12);
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (visible) {
      timer = setTimeout(() => setShouldFetch(true), 140);
    } else {
      setShouldFetch(false);
      setPois(null);
      setError(null);
      setLoading(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible]);

  useEffect(() => {
    let mounted = true;
    if (!shouldFetch || !coordinate) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await OverpassService.searchPOI(coordinate.latitude, coordinate.longitude, radius, amenityType);
        if (!mounted) return;
        setPois(res);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Erreur lors de la recherche Overpass");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [shouldFetch, coordinate, radius, amenityType]);

  const handleSelect = (poi: OverpassPOI) => {
    if (onShowLocationPoint) onShowLocationPoint(true);
    };

  const handleStartRoute = (poi: OverpassPOI) => {
    if (!onStartRoute) return;
    onStartRoute({ latitude: poi.lat, longitude: poi.lon });
    Vibration.vibrate(50);
  };

  const handleCopyCoords = (poi: OverpassPOI) => {
    try {
      Clipboard.setString(`${poi.lat.toFixed(6)}, ${poi.lon.toFixed(6)}`);
      Vibration.vibrate(50);
    } catch (e) {}
  };

  return (
    <Drawer id="aproximite-drawer" visible={visible} title="À proximité" subtitle="Points d'intérêt" onClose={onClose} height={400}>
      <View style={styles.container}>
        {loading && <ActivityIndicator size="large" color="#007AFF" />}
        {error && (
          <View style={{ padding: 8 }}>
            <Text style={{ color: "#c00" }}>{error}</Text>
          </View>
        )}
        {!loading && pois && (
          <>
            {pois.slice(0, visibleCount).map((item) => (
              <View key={String(item.id)} style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{OverpassService.formatPOIName(item)}</Text>
                  <Text style={styles.itemSubtitle}>{OverpassService.formatPOIAddress(item)}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => handleStartRoute(item)} style={styles.iconBtn}>
                    <Icon name="directions" size={20} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleCopyCoords(item)} style={styles.iconBtn}>
                    <Icon name="content-copy" size={18} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {visibleCount < pois.length && (
              <View style={{ padding: 12, alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => setVisibleCount((v) => Math.min(pois.length, v + pageSize))}
                  style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#eee", borderRadius: 8 }}
                >
                  <Text>Charger plus</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  item: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  itemTitle: { fontWeight: "600", marginBottom: 4 },
  itemSubtitle: { color: "#666", fontSize: 12 },
  itemActions: { flexDirection: "row", marginLeft: 8 },
  iconBtn: { padding: 8 },
});
